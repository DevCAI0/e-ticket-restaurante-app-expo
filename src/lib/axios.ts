import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import { encryptData, decryptData } from "./crypto";
import { showErrorToast } from "./toast";
import { User } from "../types/user";
import { storage } from "./storage";

const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === "android") {
      return "http://192.168.0.133:8000/api";
    }
    return "http://localhost:8000/api";
  }
  return "http://191.35.131.10:8000";
};

const API_URL = getBaseUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export const apiImage = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "image/*",
  },
  responseType: "blob",
  timeout: 30000,
});

let isLoggingOut = false;
let onAuthError: (() => void) | null = null;

export const setAuthErrorCallback = (callback: () => void) => {
  onAuthError = callback;
};

export const storeEncryptedToken = async (token: string) => {
  try {
    const encryptedToken = encryptData(token);
    await storage.setItem("encryptedToken", encryptedToken);
  } catch (error) {
    throw error;
  }
};

export const getStoredToken = async (): Promise<string | null> => {
  try {
    const encryptedToken = await storage.getItem("encryptedToken");
    if (!encryptedToken) return null;
    const token = decryptData(encryptedToken);
    return token;
  } catch (error) {
    return null;
  }
};

export const clearEncryptedToken = async () => {
  try {
    await storage.removeItem("encryptedToken");
    await storage.removeItem("encryptedUser");
  } catch (error) {
    throw error;
  }
};

export const storeUserData = async (userData: User) => {
  try {
    const encryptedUser = encryptData(userData);
    await storage.setItem("encryptedUser", encryptedUser);
  } catch (error) {
    showErrorToast("Erro ao salvar dados do usuário");
    throw error;
  }
};

export const getUserData = async (): Promise<User | null> => {
  try {
    const encryptedUser = await storage.getItem("encryptedUser");
    if (!encryptedUser) {
      return null;
    }
    const userData = decryptData(encryptedUser);
    return userData;
  } catch (error) {
    showErrorToast("Erro ao obter dados do usuário");
    return null;
  }
};

const getEmpresaId = async (): Promise<string | null> => {
  try {
    const userData = await getUserData();
    return userData?.id_empresa?.toString() ?? null;
  } catch (error) {
    return null;
  }
};

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      if (!config.headers.Authorization) {
        const encryptedToken = await storage.getItem("encryptedToken");
        if (encryptedToken && config.headers) {
          const token = decryptData(encryptedToken);
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      const empresaId = await getEmpresaId();
      if (empresaId && config.headers) {
        config.headers["X-Current-Company"] = empresaId;
      }

      return config;
    } catch (error) {
      return config;
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isLoggingOut
    ) {
      originalRequest._retry = true;
      isLoggingOut = true;

      try {
        await clearEncryptedToken();
        delete api.defaults.headers.common["Authorization"];

        showErrorToast("Sessão expirada. Por favor, faça login novamente.");

        if (onAuthError) {
          onAuthError();
        }

        setTimeout(() => {
          isLoggingOut = false;
        }, 1000);
      } catch (clearError) {
        isLoggingOut = false;
      }
    }

    if (error.response?.status === 403) {
      showErrorToast("Você não tem permissão para realizar esta ação.");
    }

    if (error.response?.status === 404) {
      showErrorToast("Recurso não encontrado.");
    }

    if (error.response?.status === 422) {
      const validationErrors = error.response.data as any;
      if (validationErrors?.errors) {
        const firstError = Object.values(validationErrors.errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          showErrorToast(firstError[0] as string);
        }
      } else if (validationErrors?.message) {
        showErrorToast(validationErrors.message);
      } else {
        showErrorToast("Erro de validação. Verifique os dados enviados.");
      }
    }

    if (error.response?.status === 500) {
      showErrorToast("Erro no servidor. Tente novamente mais tarde.");
    }

    if (error.code === "ECONNABORTED") {
      showErrorToast("Tempo esgotado. Verifique sua conexão.");
    }

    if (error.code === "ECONNREFUSED" || error.message === "Network Error") {
      showErrorToast("Erro de conexão. Verifique sua internet.");
    }

    return Promise.reject(error);
  }
);

apiImage.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const encryptedToken = await storage.getItem("encryptedToken");
      if (encryptedToken && config.headers) {
        const token = decryptData(encryptedToken);
        config.headers.Authorization = `Bearer ${token}`;
      }

      const empresaId = await getEmpresaId();
      if (empresaId && config.headers) {
        config.headers["X-Current-Company"] = empresaId;
      }

      return config;
    } catch (error) {
      return config;
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiImage.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await clearEncryptedToken();
      showErrorToast("Sessão expirada. Por favor, faça login novamente.");
    }
    return Promise.reject(error);
  }
);

export const apiRequest = async <T = any>(
  method: "get" | "post" | "put" | "delete" | "patch",
  url: string,
  data?: any,
  config?: any
): Promise<T> => {
  try {
    const response = await api[method](
      url,
      method === "get" ? config : data,
      config
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Erro desconhecido";

      throw new Error(errorMessage);
    }
    throw error;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await getStoredToken();
    const user = await getUserData();
    return !!(token && user);
  } catch (error) {
    return false;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await clearEncryptedToken();
  } catch (error) {
    throw error;
  }
};

export const API_BASE_URL = API_URL;

export default api;

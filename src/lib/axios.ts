// src/lib/axios.ts

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import { encryptData, decryptData } from "./crypto";
import { showErrorToast } from "./toast";
import { User } from "../types/user";
import { storage } from "./storage";

const getBaseUrl = () => {
  return "https://holli-fibratus-venally.ngrok-free.dev/api";
};

const API_URL = getBaseUrl();

console.log("🌐 API Base URL configurada:", API_URL);
console.log("📱 Platform:", Platform.OS);
console.log("🔧 __DEV__:", __DEV__);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  timeout: 30000,
});

export const apiImage = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "image/*",
    "ngrok-skip-browser-warning": "true",
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
    console.log("✅ Token criptografado armazenado");
  } catch (error) {
    console.error("❌ Erro ao armazenar token:", error);
    throw error;
  }
};

export const getStoredToken = async (): Promise<string | null> => {
  try {
    const encryptedToken = await storage.getItem("encryptedToken");
    if (!encryptedToken) {
      console.log("⚠️ Nenhum token encontrado");
      return null;
    }
    const token = decryptData(encryptedToken);
    console.log("✅ Token descriptografado recuperado");
    return token;
  } catch (error) {
    console.error("❌ Erro ao recuperar token:", error);
    return null;
  }
};

export const clearEncryptedToken = async () => {
  try {
    await storage.removeItem("encryptedToken");
    await storage.removeItem("encryptedUser");
    console.log("✅ Token e dados do usuário removidos");
  } catch (error) {
    console.error("❌ Erro ao limpar token:", error);
    throw error;
  }
};

export const storeUserData = async (userData: User) => {
  try {
    const encryptedUser = encryptData(userData);
    await storage.setItem("encryptedUser", encryptedUser);
    console.log("✅ Dados do usuário criptografados e armazenados");
  } catch (error) {
    console.error("❌ Erro ao salvar dados do usuário:", error);
    showErrorToast("Erro ao salvar dados do usuário");
    throw error;
  }
};

export const getUserData = async (): Promise<User | null> => {
  try {
    const encryptedUser = await storage.getItem("encryptedUser");
    if (!encryptedUser) {
      console.log("⚠️ Nenhum dado de usuário encontrado");
      return null;
    }
    const userData = decryptData(encryptedUser);
    console.log("✅ Dados do usuário recuperados:", userData.nome);
    return userData;
  } catch (error) {
    console.error("❌ Erro ao obter dados do usuário:", error);
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
      console.log(
        `📤 Requisição: ${config.method?.toUpperCase()} ${config.url}`
      );

      if (!config.headers.Authorization) {
        const encryptedToken = await storage.getItem("encryptedToken");
        if (encryptedToken && config.headers) {
          const token = decryptData(encryptedToken);
          config.headers.Authorization = `Bearer ${token}`;
          console.log("🔑 Token adicionado ao header");
        }
      }

      const empresaId = await getEmpresaId();
      if (empresaId && config.headers) {
        config.headers["X-Current-Company"] = empresaId;
        console.log("🏢 ID da empresa adicionado:", empresaId);
      }

      return config;
    } catch (error) {
      console.error("❌ Erro no interceptor de requisição:", error);
      return config;
    }
  },
  (error: AxiosError) => {
    console.error("❌ Erro antes de enviar requisição:", error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(
      `📥 Resposta: ${response.config.method?.toUpperCase()} ${response.config.url} - Status ${response.status}`
    );
    return response;
  },
  async (error: AxiosError) => {
    console.error("❌ Erro na resposta:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isLoggingOut
    ) {
      console.log("🚪 Erro 401 - Iniciando logout");
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
        console.error("❌ Erro ao limpar token no logout:", clearError);
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
      console.error("⏱️ Timeout na requisição");
      showErrorToast("Tempo esgotado. Verifique sua conexão.");
    }

    if (error.code === "ECONNREFUSED" || error.message === "Network Error") {
      console.error("🌐 Erro de conexão de rede");
      showErrorToast("Erro de conexão. Verifique sua internet.");
    }

    return Promise.reject(error);
  }
);

apiImage.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      console.log(
        `📤 Requisição de imagem: ${config.method?.toUpperCase()} ${config.url}`
      );

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
      console.error("❌ Erro no interceptor de requisição de imagem:", error);
      return config;
    }
  },
  (error: AxiosError) => {
    console.error(
      "❌ Erro antes de enviar requisição de imagem:",
      error.message
    );
    return Promise.reject(error);
  }
);

apiImage.interceptors.response.use(
  (response) => {
    console.log(`📥 Resposta de imagem: Status ${response.status}`);
    return response;
  },
  async (error: AxiosError) => {
    console.error("❌ Erro na resposta de imagem:", error.message);

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
    console.log(`🚀 API Request: ${method.toUpperCase()} ${url}`);

    const response = await api[method](
      url,
      method === "get" ? config : data,
      config
    );

    console.log(`✅ API Request Success: ${method.toUpperCase()} ${url}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ API Request Failed: ${method.toUpperCase()} ${url}`,
      error
    );

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
    const authenticated = !!(token && user);
    console.log("🔐 Verificação de autenticação:", authenticated);
    return authenticated;
  } catch (error) {
    console.error("❌ Erro ao verificar autenticação:", error);
    return false;
  }
};

export const logout = async (): Promise<void> => {
  try {
    console.log("🚪 Executando logout...");
    await clearEncryptedToken();
    console.log("✅ Logout concluído");
  } catch (error) {
    console.error("❌ Erro ao fazer logout:", error);
    throw error;
  }
};

export const API_BASE_URL = API_URL;

export default api;

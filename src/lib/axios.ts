// src/lib/axios.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import { encryptData, decryptData } from "./crypto";
import { showErrorToast } from "./toast";
import { User } from "../types/user";
import { storage } from "./storage";

// Configuração da URL baseada no ambiente
const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === "android") {
      return "http://192.168.0.133:8000/api"; // Seu IP local
    }
    return "http://localhost:8000/api";
  }
  return "http://191.35.131.10:8000"; // Produção
};

const API_URL = getBaseUrl();

// Instância principal da API
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 segundos
});

// Instância para requisições de imagem
export const apiImage = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "image/*",
  },
  responseType: "blob",
  timeout: 30000,
});

// Flag para evitar múltiplas tentativas de logout
let isLoggingOut = false;

// ============= FUNÇÕES DE ARMAZENAMENTO =============

export const storeEncryptedToken = async (token: string) => {
  try {
    const encryptedToken = encryptData(token);
    await storage.setItem("encryptedToken", encryptedToken);
    console.log("✅ Token armazenado com sucesso");
  } catch (error) {
    console.error("❌ Erro ao armazenar token:", error);
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
    console.error("❌ Erro ao obter token:", error);
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
    console.log("✅ Dados do usuário armazenados");
  } catch (error) {
    showErrorToast("Erro ao salvar dados do usuário");
    console.error("❌ Erro ao armazenar dados do usuário:", error);
    throw error;
  }
};

export const getUserData = async (): Promise<User | null> => {
  try {
    const encryptedUser = await storage.getItem("encryptedUser");
    if (!encryptedUser) return null;

    const userData = decryptData(encryptedUser);
    return userData;
  } catch (error) {
    showErrorToast("Erro ao obter dados do usuário");
    console.error("❌ Erro ao obter dados do usuário:", error);
    return null;
  }
};

const getEmpresaId = async (): Promise<string | null> => {
  try {
    const userData = await getUserData();
    return userData?.id_empresa?.toString() ?? null;
  } catch (error) {
    console.error("❌ Erro ao obter empresa do usuário:", error);
    return null;
  }
};

// ============= INTERCEPTORS DA API PRINCIPAL =============

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Adicionar token de autenticação
      const encryptedToken = await storage.getItem("encryptedToken");
      if (encryptedToken && config.headers) {
        const token = decryptData(encryptedToken);
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Adicionar empresa ID no header
      const empresaId = await getEmpresaId();
      if (empresaId && config.headers) {
        config.headers["X-Current-Company"] = empresaId;
      }

      console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);

      return config;
    } catch (error) {
      console.error("❌ Erro no interceptor de requisição:", error);
      return config;
    }
  },
  (error: AxiosError) => {
    console.error("❌ Erro antes de enviar requisição:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(
      `✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`
    );
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Log do erro
    if (error.response) {
      console.error(
        `❌ ${error.response.status} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`,
        error.response.data
      );
    } else if (error.request) {
      console.error("❌ Sem resposta do servidor:", error.message);
    } else {
      console.error("❌ Erro na configuração da requisição:", error.message);
    }

    // Tratar erro 401 (Não autorizado)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isLoggingOut) {
        isLoggingOut = true;

        try {
          // Limpar dados de autenticação
          await clearEncryptedToken();

          console.log("🔓 Sessão expirada. Dados de autenticação limpos.");

          showErrorToast("Sessão expirada. Por favor, faça login novamente.");

          // Resetar flag após um tempo
          setTimeout(() => {
            isLoggingOut = false;
          }, 1000);
        } catch (clearError) {
          console.error("❌ Erro ao limpar dados:", clearError);
          isLoggingOut = false;
        }
      }
    }

    // Tratar erro 403 (Forbidden)
    if (error.response?.status === 403) {
      console.error("🚫 Acesso negado. Você não tem permissão para esta ação.");
      showErrorToast("Você não tem permissão para realizar esta ação.");
    }

    // Tratar erro 404 (Not Found)
    if (error.response?.status === 404) {
      console.error("🔍 Recurso não encontrado.");
      showErrorToast("Recurso não encontrado.");
    }

    // Tratar erro 422 (Validation Error)
    if (error.response?.status === 422) {
      console.error("⚠️ Erro de validação:", error.response.data);

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

    // Tratar erro 500 (Server Error)
    if (error.response?.status === 500) {
      console.error("💥 Erro interno do servidor.");
      showErrorToast("Erro no servidor. Tente novamente mais tarde.");
    }

    // Tratar erro de timeout
    if (error.code === "ECONNABORTED") {
      console.error("⏱️ Timeout: A requisição demorou muito para responder.");
      showErrorToast("Tempo esgotado. Verifique sua conexão.");
    }

    // Tratar erro de conexão
    if (error.code === "ECONNREFUSED" || error.message === "Network Error") {
      console.error(
        "📡 Erro de conexão: Verifique sua internet ou se o servidor está online."
      );
      showErrorToast("Erro de conexão. Verifique sua internet.");
    }

    return Promise.reject(error);
  }
);

// ============= INTERCEPTORS DA API DE IMAGEM =============

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

      console.log(`🖼️ Requisição de imagem: ${config.url}`);

      return config;
    } catch (error) {
      console.error("❌ Erro no interceptor de imagem:", error);
      return config;
    }
  },
  (error: AxiosError) => {
    console.error("❌ Erro na requisição de imagem:", error);
    return Promise.reject(error);
  }
);

apiImage.interceptors.response.use(
  (response) => {
    console.log(`✅ Imagem recebida: ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await clearEncryptedToken();
      showErrorToast("Sessão expirada. Por favor, faça login novamente.");
    }
    return Promise.reject(error);
  }
);

// ============= FUNÇÕES HELPER =============

/**
 * Função helper para fazer requisições com tratamento de erro simplificado
 */
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

/**
 * Verifica se o usuário está autenticado
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await getStoredToken();
    const user = await getUserData();
    return !!(token && user);
  } catch (error) {
    console.error("❌ Erro ao verificar autenticação:", error);
    return false;
  }
};

/**
 * Faz logout completo
 */
export const logout = async (): Promise<void> => {
  try {
    await clearEncryptedToken();
    console.log("✅ Logout realizado com sucesso");
  } catch (error) {
    console.error("❌ Erro ao fazer logout:", error);
    throw error;
  }
};

// Exportar a URL base para uso em outros lugares
export const API_BASE_URL = API_URL;

// Exportar axios padrão
export default api;

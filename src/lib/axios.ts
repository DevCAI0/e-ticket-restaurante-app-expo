// src/lib/axios.ts
import axios from "axios";
import { encryptData, decryptData } from "./crypto";
import { showErrorToast } from "./toast";
import { User } from "../types/user";
import { storage } from "./storage";

// IMPORTANTE: Configure a URL da sua API aqui
const API_URL = "http://192.168.0.133:8000/api";
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export const apiImage = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "image/*",
  },
  responseType: "blob",
});

export const storeEncryptedToken = async (token: string) => {
  try {
    const encryptedToken = encryptData(token);
    await storage.setItem("encryptedToken", encryptedToken);
  } catch (error) {
    console.error("Error storing token:", error);
  }
};

export const clearEncryptedToken = async () => {
  try {
    await storage.removeItem("encryptedToken");
    await storage.removeItem("encryptedUser");
  } catch (error) {
    console.error("Error clearing token:", error);
  }
};

export const storeUserData = async (userData: User) => {
  try {
    const encryptedUser = encryptData(userData);
    await storage.setItem("encryptedUser", encryptedUser);
  } catch (error) {
    showErrorToast("Erro ao salvar dados do usuário");
    console.error("Error storing user data:", error);
  }
};

export const getUserData = async (): Promise<User | null> => {
  try {
    const encryptedUser = await storage.getItem("encryptedUser");
    return encryptedUser ? decryptData(encryptedUser) : null;
  } catch (error) {
    showErrorToast("Erro ao obter dados do usuário");
    console.error("Error getting user data:", error);
    return null;
  }
};

const getEmpresaId = async (): Promise<string | null> => {
  try {
    const userData = await getUserData();
    return userData?.id_empresa?.toString() ?? null;
  } catch (error) {
    showErrorToast("Erro ao obter empresa do usuário");
    return null;
  }
};

// Setup interceptors
api.interceptors.request.use(
  async (config) => {
    const encryptedToken = await storage.getItem("encryptedToken");
    if (encryptedToken) {
      const token = decryptData(encryptedToken);
      config.headers.Authorization = `Bearer ${token}`;
    }

    const empresaId = await getEmpresaId();
    if (empresaId) {
      config.headers["X-Current-Company"] = empresaId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearEncryptedToken();
      // Emitir evento de desautenticação
    }
    return Promise.reject(error);
  }
);

apiImage.interceptors.request.use(
  async (config) => {
    const encryptedToken = await storage.getItem("encryptedToken");
    if (encryptedToken) {
      const token = decryptData(encryptedToken);
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

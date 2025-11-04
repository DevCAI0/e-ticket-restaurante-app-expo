// src/lib/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  TOKEN: "@ticket:token",
  USER: "@ticket:user",
  REFRESH_TOKEN: "@ticket:refresh_token",
} as const;

export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error("Error saving to storage:", error);
      throw error;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error("Error reading from storage:", error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing from storage:", error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
      throw error;
    }
  },
};

// Export individual functions
export const getItem = storage.getItem;
export const setItem = storage.setItem;
export const removeItem = storage.removeItem;

// Token management
export const saveToken = async (token: string): Promise<void> => {
  await storage.setItem(STORAGE_KEYS.TOKEN, token);
};

export const getToken = async (): Promise<string | null> => {
  return await storage.getItem(STORAGE_KEYS.TOKEN);
};

export const removeToken = async (): Promise<void> => {
  await storage.removeItem(STORAGE_KEYS.TOKEN);
};

// User management
export const saveUser = async (user: any): Promise<void> => {
  await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getUser = async (): Promise<any | null> => {
  const userData = await storage.getItem(STORAGE_KEYS.USER);
  return userData ? JSON.parse(userData) : null;
};

export const removeUser = async (): Promise<void> => {
  await storage.removeItem(STORAGE_KEYS.USER);
};

// Refresh token management
export const saveRefreshToken = async (refreshToken: string): Promise<void> => {
  await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

export const removeRefreshToken = async (): Promise<void> => {
  await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
};

// Clear all auth data
export const clearAuthData = async (): Promise<void> => {
  await Promise.all([removeToken(), removeUser(), removeRefreshToken()]);
};

// Export storage keys for external use if needed
export { STORAGE_KEYS };

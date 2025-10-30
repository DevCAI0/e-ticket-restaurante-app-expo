// src/lib/crypto.ts
import CryptoJS from "crypto-js";
import { Alert } from "react-native";

const SECRET_KEY = "ezuRy5Wrs3d9CWWaF6WIC42qhmddRBj9";

export const encryptData = (data: any): string => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  } catch (error) {
    console.error("Erro ao criptografar dados:", error);
    return "";
  }
};

export const decryptData = (cipherText: string): any => {
  if (!cipherText || cipherText.trim() === "") {
    return null;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedData || decryptedData.trim() === "") {
      throw new Error("Dados descriptografados estão vazios");
    }

    return JSON.parse(decryptedData);
  } catch (error) {
    console.error("Erro ao descriptografar dados:", error);

    try {
      return JSON.parse(cipherText);
    } catch {
      return null;
    }
  }
};

export function isEncrypted(data: string): boolean {
  if (!data || data.trim() === "") {
    return false;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

    if (decryptedData && decryptedData.trim() !== "") {
      JSON.parse(decryptedData);
      return true;
    }

    return false;
  } catch {
    try {
      JSON.parse(data);
      return false;
    } catch {
      return false;
    }
  }
}

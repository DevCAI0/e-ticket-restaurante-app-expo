// src/api/auth/auth.ts
import {
  api,
  storeEncryptedToken,
  storeUserData,
  clearEncryptedToken,
} from "../../lib/axios";
import { AxiosError } from "axios";
import { User, AuthCredentials } from "../../types/user";
import { AuthError, AuthResponse, AuthResult } from "../../types/auth";
import { showSuccessToast, showErrorToast } from "../../lib/toast";

export async function login(credentials: AuthCredentials): Promise<AuthResult> {
  try {
    const { data: response } = await api.post<AuthResponse>(
      "/auth/login/ticket",
      {
        login: credentials.identifier,
        senha: credentials.senha,
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Login falhou");
    }

    const userData: User = {
      ...response.data!.usuario,
      permissions: response.data!.usuario?.permissions || {},
    };

    const authToken = response.data!.token;

    await storeEncryptedToken(authToken);
    await storeUserData(userData);

    showSuccessToast("Login realizado com sucesso!");

    return {
      success: true,
      user: userData,
      token: authToken,
    };
  } catch (error) {
    const axiosError = error as AxiosError<AuthError>;
    const errorMessage =
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      (error instanceof Error ? error.message : "Login ou senha inválidos");

    showErrorToast(errorMessage);

    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function logout(token?: string | null): Promise<boolean> {
  try {
    if (token) {
      await api.post("/auth/logout");
    }

    await clearEncryptedToken();
    showSuccessToast("Logout realizado com sucesso!");

    return true;
  } catch (_error) {
    await clearEncryptedToken();
    showSuccessToast("Logout realizado com sucesso!");
    return true;
  }
}

export async function obterUsuarioAtual(): Promise<User | null> {
  try {
    const { data } = await api.get("/usuario/atual");

    if (data && data.success && data.usuario) {
      const userData: User = {
        ...data.usuario,
        permissions: data.usuario?.permissions || {},
      };

      await storeUserData(userData);
      return userData;
    }

    return null;
  } catch (error) {
    showErrorToast("Erro ao obter dados do usuário");
    throw error;
  }
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  return !!user.permissions[permission];
}

export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  if (user.id_perfil === 1) return true;
  if (user.perfil_descricao?.toLowerCase().includes("admin")) return true;
  return (
    hasPermission(user, "admin_all") ||
    hasPermission(user, "v_funcionario") ||
    hasPermission(user, "c_funcionario")
  );
}

export function getUserLocation(user: User | null): string {
  if (!user) return "";
  if (user.nome_estabelecimento) return user.nome_estabelecimento;
  if (user.nome_restaurante) return user.nome_restaurante;
  return "Não definido";
}

// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import {
  api,
  clearEncryptedToken,
  storeEncryptedToken,
  storeUserData,
  getUserData,
} from "../lib/axios";
import { showErrorToast, showSuccessToast } from "../lib/toast";
import { decryptData } from "../lib/crypto";
import { User, AuthCredentials } from "../types/user";
import { AuthResult } from "../types/auth";
import {
  login,
  logout as apiLogout,
  obterUsuarioAtual,
} from "../api/auth/auth";
import { storage } from "../lib/storage";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (credentials: AuthCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
}

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = useCallback(() => {
    return Boolean(token && user);
  }, [token, user]);

  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      await apiLogout(token);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      await clearEncryptedToken();
      delete api.defaults.headers.common["Authorization"];
      showSuccessToast("Logout realizado com sucesso");
    }
  }, [token]);

  const loadStoredUserData = useCallback(async () => {
    setLoading(true);

    try {
      const encryptedToken = await storage.getItem("encryptedToken");

      if (!encryptedToken) {
        console.log("📱 [AUTH] Nenhum token armazenado encontrado");
        setLoading(false);
        return false;
      }

      const decryptedToken = decryptData(encryptedToken);
      const userData = await getUserData();

      if (!decryptedToken || !userData) {
        console.log(
          "📱 [AUTH] Falha ao descriptografar token ou dados do usuário"
        );
        setLoading(false);
        return false;
      }

      console.log("📱 [AUTH] Dados do usuário carregados do storage:", {
        id: userData.id,
        nome: userData.nome,
        login: userData.login,
        id_perfil: userData.id_perfil,
        perfil_descricao: userData.perfil_descricao,
        id_estabelecimento: userData.id_estabelecimento,
        nome_estabelecimento: userData.nome_estabelecimento,
        id_restaurante: userData.id_restaurante,
        nome_restaurante: userData.nome_restaurante,
        id_empresa: userData.id_empresa,
      });

      api.defaults.headers.common["Authorization"] = `Bearer ${decryptedToken}`;

      setUser(userData);
      setToken(decryptedToken);

      try {
        const usuarioAtual = await obterUsuarioAtual();
        if (usuarioAtual) {
          console.log("📱 [AUTH] Dados atualizados da API:", {
            id: usuarioAtual.id,
            nome: usuarioAtual.nome,
            id_perfil: usuarioAtual.id_perfil,
            perfil_descricao: usuarioAtual.perfil_descricao,
            id_estabelecimento: usuarioAtual.id_estabelecimento,
            nome_estabelecimento: usuarioAtual.nome_estabelecimento,
            id_restaurante: usuarioAtual.id_restaurante,
            nome_restaurante: usuarioAtual.nome_restaurante,
          });

          const updatedUser: User = {
            ...userData,
            ...usuarioAtual,
          };
          setUser(updatedUser);
          await storeUserData(updatedUser);
        }
      } catch (error) {
        console.error("📱 [AUTH] Erro ao buscar usuário atual:", error);
      }

      setLoading(false);
      return true;
    } catch (error) {
      console.error("📱 [AUTH] Erro ao carregar dados armazenados:", error);
      setLoading(false);
      return false;
    }
  }, []);

  useEffect(() => {
    loadStoredUserData();
  }, [loadStoredUserData]);

  const signIn = async (credentials: AuthCredentials): Promise<AuthResult> => {
    setLoading(true);

    try {
      console.log("📱 [AUTH] Tentando fazer login com:", {
        identifier: credentials.identifier,
      });

      const result = await login(credentials);

      if (result.success && result.user && result.token) {
        console.log("📱 [AUTH] ✅ Login bem-sucedido!");
        console.log("📱 [AUTH] Dados do usuário logado:", {
          id: result.user.id,
          nome: result.user.nome,
          login: result.user.login,
          email: result.user.email,
          id_perfil: result.user.id_perfil,
          perfil_descricao: result.user.perfil_descricao,
          id_estabelecimento: result.user.id_estabelecimento,
          nome_estabelecimento: result.user.nome_estabelecimento,
          id_restaurante: result.user.id_restaurante,
          nome_restaurante: result.user.nome_restaurante,
          id_empresa: result.user.id_empresa,
          status: result.user.status,
          alterou_senha: result.user.alterou_senha,
        });

        console.log(
          "📱 [AUTH] Permissões do usuário:",
          result.user.permissions
        );

        // Verificar tipo de perfil
        if (result.user.id_perfil === 1) {
          console.log("👤 [PERFIL] Usuário é ESTABELECIMENTO");
        } else if (result.user.id_perfil === 2) {
          console.log("👤 [PERFIL] Usuário é RESTAURANTE OPERADOR");
        } else if (result.user.id_perfil === 3) {
          console.log("👤 [PERFIL] Usuário é GERENTE DO RESTAURANTE");
        } else {
          console.log(
            "👤 [PERFIL] Perfil desconhecido:",
            result.user.id_perfil
          );
        }

        await storeEncryptedToken(result.token);
        await storeUserData(result.user);

        setUser(result.user);
        setToken(result.token);

        api.defaults.headers.common["Authorization"] = `Bearer ${result.token}`;

        showSuccessToast(`Bem-vindo, ${result.user.nome}!`);
      } else {
        console.log("📱 [AUTH] ❌ Falha no login:", result.message);
        showErrorToast(result.message || "Erro durante o login");
      }

      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      console.error("📱 [AUTH] ❌ Erro durante o login:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro durante o login";
      showErrorToast(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        logout: handleLogout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
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
import { tokenRenewalService } from "../services/tokenRenewalService";

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
  const isInitialized = useRef(false);

  const isAuthenticated = useCallback(() => {
    return Boolean(token && user);
  }, [token, user]);

  const handleTokenExpired = useCallback(async () => {
    setUser(null);
    setToken(null);
    await clearEncryptedToken();
    delete api.defaults.headers.common["Authorization"];
    tokenRenewalService.stop();
  }, []);

  const startTokenRenewal = useCallback(
    (tokenExpiresAt: string) => {
      tokenRenewalService.start(tokenExpiresAt, handleTokenExpired);
    },
    [handleTokenExpired]
  );

  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      tokenRenewalService.stop();
      await apiLogout(token);
    } catch (error) {
      //
    } finally {
      setUser(null);
      setToken(null);
      await clearEncryptedToken();
      delete api.defaults.headers.common["Authorization"];
      showSuccessToast("Logout realizado com sucesso");
    }
  }, [token]);

  const loadStoredUserData = useCallback(async () => {
    if (isInitialized.current) {
      return;
    }

    setLoading(true);

    try {
      const encryptedToken = await storage.getItem("encryptedToken");

      if (!encryptedToken) {
        setLoading(false);
        return false;
      }

      const decryptedToken = decryptData(encryptedToken);
      const userData = await getUserData();

      if (!decryptedToken || !userData) {
        setLoading(false);
        return false;
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${decryptedToken}`;

      setUser(userData);
      setToken(decryptedToken);

      try {
        const usuarioAtual = await obterUsuarioAtual();
        if (usuarioAtual) {
          const updatedUser: User = {
            ...userData,
            ...usuarioAtual,
          };
          setUser(updatedUser);
          await storeUserData(updatedUser);

          if (updatedUser.token_expira_em) {
            startTokenRenewal(updatedUser.token_expira_em);
          }
        }
      } catch (error) {
        await handleLogout();
        setLoading(false);
        return false;
      }

      isInitialized.current = true;
      setLoading(false);
      return true;
    } catch (error) {
      setLoading(false);
      return false;
    }
  }, [handleLogout, startTokenRenewal]);

  useEffect(() => {
    loadStoredUserData();

    return () => {
      tokenRenewalService.stop();
    };
  }, [loadStoredUserData]);

  const signIn = async (credentials: AuthCredentials): Promise<AuthResult> => {
    setLoading(true);

    try {
      const result = await login(credentials);

      if (result.success && result.user && result.token) {
        await storeEncryptedToken(result.token);
        await storeUserData(result.user);

        setUser(result.user);
        setToken(result.token);

        api.defaults.headers.common["Authorization"] = `Bearer ${result.token}`;

        if (result.user.token_expira_em) {
          startTokenRenewal(result.user.token_expira_em);
        }

        showSuccessToast(`Bem-vindo, ${result.user.nome}!`);
      } else {
        showErrorToast(result.message || "Erro durante o login");
      }

      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
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

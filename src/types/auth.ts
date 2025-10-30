// src/types/auth.ts
import { SignInCredentials, User } from "./user";

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    usuario: User;
    token: string;
    tipo: string;
  };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    usuario: User;
    token: string;
    tipo: string;
  };
}

export interface AuthError {
  error?: string;
  message?: string;
  status?: number;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
}

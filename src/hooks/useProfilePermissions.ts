// src/hooks/useProfilePermissions.ts - Hook para permissões de perfil
import { useAuth } from "./useAuth";
import { createProfilePermissions } from "../utils/profileUtils";

export function useProfilePermissions() {
  const { user } = useAuth();
  return createProfilePermissions(user);
}

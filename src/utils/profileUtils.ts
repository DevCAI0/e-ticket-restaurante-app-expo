// src/utils/profileUtils.ts
import { User } from "../types/user";

export interface ProfilePermissions {
  hasProfile: (profileId: number) => boolean;
  hasAnyProfile: (profileIds: number[]) => boolean;
  isEstablishment: () => boolean;
  isRestaurant: () => boolean;
  isRestaurantManager: () => boolean;
  canAccessTickets: () => boolean;
  canAccessNotes: () => boolean;
  canAccessOrders: () => boolean;
  hasPermission: (permission: string) => boolean;
  user: User | null;
}

export function createProfilePermissions(
  user: User | null
): ProfilePermissions {
  const hasProfile = (profileId: number): boolean => {
    const result = user?.id_perfil === profileId;
    console.log(
      `🔐 [PROFILE] hasProfile(${profileId}):`,
      result,
      "| user.id_perfil:",
      user?.id_perfil
    );
    return result;
  };

  const hasAnyProfile = (profileIds: number[]): boolean => {
    const result = profileIds.includes(user?.id_perfil || 0);
    console.log(`🔐 [PROFILE] hasAnyProfile([${profileIds}]):`, result);
    return result;
  };

  const isEstablishment = (): boolean => {
    const result = user?.id_perfil === 1;
    console.log(
      "🔐 [PROFILE] isEstablishment():",
      result,
      "| user.id_perfil:",
      user?.id_perfil
    );
    return result;
  };

  const isRestaurant = (): boolean => {
    const result = user?.id_restaurante !== null;
    console.log(
      "🔐 [PROFILE] isRestaurant():",
      result,
      "| user.id_restaurante:",
      user?.id_restaurante
    );
    return result;
  };

  const isRestaurantManager = (): boolean => {
    const result = user?.id_perfil === 3;
    console.log("🔐 [PROFILE] isRestaurantManager():", result);
    return result;
  };

  const canAccessTickets = (): boolean => {
    const result = !isEstablishment();
    console.log("🔐 [PROFILE] canAccessTickets():", result);
    return result;
  };

  const canAccessNotes = (): boolean => {
    const result = user?.id_perfil === 3;
    console.log("🔐 [PROFILE] canAccessNotes():", result);
    return result;
  };

  const canAccessOrders = (): boolean => {
    console.log("🔐 [PROFILE] canAccessOrders(): true (todos podem)");
    return true;
  };

  const hasPermission = (permission: string): boolean => {
    const result = user?.permissions?.[permission] === "1";
    console.log(`🔐 [PROFILE] hasPermission(${permission}):`, result);
    return result;
  };

  return {
    hasProfile,
    hasAnyProfile,
    isEstablishment,
    isRestaurant,
    isRestaurantManager,
    canAccessTickets,
    canAccessNotes,
    canAccessOrders,
    hasPermission,
    user,
  };
}

// Helpers individuais para uso direto (sem hook)
export function isEstablishment(user: User | null): boolean {
  return user?.id_perfil === 1;
}

export function isRestaurant(user: User | null): boolean {
  return user?.id_restaurante !== null;
}

export function isRestaurantManager(user: User | null): boolean {
  return user?.id_perfil === 3;
}

export function canAccessNotes(user: User | null): boolean {
  return user?.id_perfil === 3;
}

export function hasPermission(user: User | null, permission: string): boolean {
  return user?.permissions?.[permission] === "1";
}

export function getEstablishmentName(user: User | null): string {
  return user?.nome_estabelecimento || "Estabelecimento";
}

export function getRestaurantName(user: User | null): string {
  return user?.nome_restaurante || "Restaurante";
}

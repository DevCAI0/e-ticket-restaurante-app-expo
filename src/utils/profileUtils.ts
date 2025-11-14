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
    return user?.id_perfil === profileId;
  };

  const hasAnyProfile = (profileIds: number[]): boolean => {
    return profileIds.includes(user?.id_perfil || 0);
  };

  const isEstablishment = (): boolean => {
    return user?.id_perfil === 1;
  };

  const isRestaurant = (): boolean => {
    return user?.id_restaurante !== null;
  };

  const isRestaurantManager = (): boolean => {
    return user?.id_perfil === 3;
  };

  const canAccessTickets = (): boolean => {
    return !isEstablishment();
  };

  const canAccessNotes = (): boolean => {
    return user?.id_perfil === 3;
  };

  const canAccessOrders = (): boolean => {
    return true;
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.[permission] === "1";
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

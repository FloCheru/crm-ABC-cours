import type { UserRole } from '../types/auth.types';
import { authService } from './authService';

// Permissions simples par rôle
const PERMISSIONS = {
  admin: {
    // Pages accessibles
    pages: ['dashboard', 'professeurs', 'eleves', 'settings', 'statistiques', 'coupons', 'prospects', 'clients', 'ndrs'],
    // Actions possibles
    can: {
      createProfesseur: true,
      editProfesseur: true,
      deleteProfesseur: true,
      viewAllStats: true,
      manageSettings: true,
      createEleve: true,
      editEleve: true,
      deleteEleve: true,
      manageCoupons: true,
      manageProspects: true,
      manageClients: true,
      manageNdrs: true,
    }
  },
  professor: {
    pages: ['mon-profil', 'mes-eleves', 'planning'],
    can: {
      editOwnProfile: true,
      viewOwnEleves: true,
      manageOwnPlanning: true,
    }
  }
} as const;

/**
 * Récupère l'utilisateur actuellement connecté depuis authService
 */
export const getCurrentUser = () => {
  return authService.getUser();
};

/**
 * Récupère le rôle de l'utilisateur actuel
 */
export const getUserRole = (): UserRole | null => {
  const user = getCurrentUser();
  return (user?.role as UserRole) || null;
};

/**
 * Vérifie si l'utilisateur a une permission spécifique
 */
export const can = (action: string): boolean => {
  const user = getCurrentUser();
  if (!user || !user.role) return false;

  const role = user.role as UserRole;
  const permissions = PERMISSIONS[role];
  if (!permissions) return false;

  return permissions.can[action as keyof typeof permissions.can] === true;
};

/**
 * Vérifie si l'utilisateur a accès à une page
 */
export const canAccessPage = (page: string): boolean => {
  const user = getCurrentUser();
  if (!user || !user.role) return false;

  const role = user.role as UserRole;
  const permissions = PERMISSIONS[role];
  if (!permissions) return false;

  return (permissions.pages as readonly string[]).includes(page);
};

/**
 * Hook React simple pour accéder aux informations d'authentification
 * Compatible avec le système existant
 */
export const useAuthPermissions = () => {
  const user = getCurrentUser();
  const role = getUserRole();

  return {
    user,
    role,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isProfessor: role === 'professor',
    can,
    canAccessPage,
  };
};

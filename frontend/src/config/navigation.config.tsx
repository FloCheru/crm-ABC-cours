import {
  Users,
  BookOpen,
  Calendar,
  Settings,
  User,
  CheckSquare,
  Ticket,
  MessageSquare,
  FileText,
  DollarSign,
  UserCheck,
  Briefcase,
  UserPlus
} from 'lucide-react';
import type { UserRole } from '../types/auth.types';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number }>;
  roles: UserRole[];
  submenu?: {
    label: string;
    path: string;
  }[];
}

/**
 * Configuration de la navigation par rôle
 */
export const navigationItems: NavItem[] = [
  // Admin uniquement
  {
    label: 'Admin',
    path: '/admin/coupons',
    icon: Settings,
    roles: ['admin'],
    submenu: [
      { label: 'Séries de coupons', path: '/admin/coupons' },
      { label: 'Coupons', path: '/admin/coupons/list' },
      { label: 'Aperçu Template', path: '/admin/template-preview' },
    ],
  },
  {
    label: 'Professeurs',
    path: '/professeurs',
    icon: Users,
    roles: ['admin'],
  },
  {
    label: 'Prospects',
    path: '/prospects',
    icon: UserCheck,
    roles: ['admin'],
  },
  {
    label: 'Clients',
    path: '/clients',
    icon: Briefcase,
    roles: ['admin'],
  },
  {
    label: 'NDR',
    path: '/ndrs',
    icon: FileText,
    roles: ['admin'],
  },
  {
    label: 'Candidats',
    path: '/under-development',
    icon: UserPlus,
    roles: ['admin'],
  },
  {
    label: 'ATP',
    path: '/under-development',
    icon: Calendar,
    roles: ['admin'],
  },
  {
    label: 'Messagerie',
    path: '/under-development',
    icon: MessageSquare,
    roles: ['admin'],
  },

  // Professeur uniquement
  {
    label: 'Mon profil',
    path: '/professor/profil',
    icon: User,
    roles: ['professor'],
    submenu: [
      { label: 'Identité & Coordonnées', path: '/professor/profil' },
      { label: 'Mes documents', path: '/professor/documents' },
    ],
  },
  {
    label: 'Mes choix',
    path: '/professor/choix',
    icon: CheckSquare,
    roles: ['professor'],
  },
  {
    label: 'Mes coupons',
    path: '/professor/coupons',
    icon: Ticket,
    roles: ['professor'],
  },
  {
    label: 'Mes messages',
    path: '/professor/messages',
    icon: MessageSquare,
    roles: ['professor'],
  },
  {
    label: 'Ma déclaration',
    path: '/professor/declaration',
    icon: FileText,
    roles: ['professor'],
  },
  {
    label: 'Mes rendez-vous',
    path: '/professor/rendez-vous',
    icon: Calendar,
    roles: ['professor'],
  },
  {
    label: 'Mes élèves',
    path: '/professor/eleves',
    icon: BookOpen,
    roles: ['professor'],
  },
  {
    label: 'Fiche de paie',
    path: '/professor/paie',
    icon: DollarSign,
    roles: ['professor'],
  },
];

/**
 * Filtre les éléments de navigation selon le rôle de l'utilisateur
 */
export const getNavigationForRole = (role: UserRole): NavItem[] => {
  return navigationItems.filter(item => item.roles.includes(role));
};

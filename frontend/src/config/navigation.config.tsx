import {
  Users,
  BookOpen,
  Calendar,
  Settings,
  User,
  Ticket,
  MessageSquare,
  FileText,
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
    path: '/admin/professeurs',
    icon: Users,
    roles: ['admin'],
  },
  {
    label: 'Prospects',
    path: '/admin/prospects',
    icon: UserCheck,
    roles: ['admin'],
  },
  {
    label: 'Clients',
    path: '/admin/clients',
    icon: Briefcase,
    roles: ['admin'],
  },
  {
    label: 'NDR',
    path: '/admin/ndrs',
    icon: FileText,
    roles: ['admin'],
  },
  {
    label: 'Candidats',
    path: '/admin/under-development',
    icon: UserPlus,
    roles: ['admin'],
  },
  {
    label: 'ATP',
    path: '/admin/under-development',
    icon: Calendar,
    roles: ['admin'],
  },
  {
    label: 'Messagerie',
    path: '/admin/under-development',
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
      { label: 'Mes Informations', path: '/professor/profil?tab=informations' },
      { label: 'Mes Documents', path: '/professor/profil?tab=documents' },
      { label: 'Mes Choix', path: '/professor/profil?tab=choix' },
      { label: 'Mes Déplacements', path: '/professor/profil?tab=deplacement' },
      { label: 'Mon Statut', path: '/professor/profil?tab=status' },
    ],
  },
  {
    label: 'Mes coupons',
    path: '/professor/coupons',
    icon: Ticket,
    roles: ['professor'],
    submenu: [
      { label: 'Mon RIB', path: '/professor/coupons?tab=rib' },
      { label: 'Saisie de coupons', path: '/professor/coupons?tab=saisie' },
    ],
  },
  {
    label: 'Mes Attestations',
    path: '/professor/attestations',
    icon: FileText,
    roles: ['professor'],
    submenu: [
      { label: 'Ma fiche de paie', path: '/professor/attestations?tab=fiche-paie' },
      { label: 'Mes fiches de paie groupées', path: '/professor/attestations?tab=fiches-paie-groupees' },
      { label: 'Mon certificat', path: '/professor/attestations?tab=certificat' },
      { label: 'Mon attestation France Travail', path: '/professor/attestations?tab=france-travail' },
      { label: 'Montant à facturer', path: '/professor/attestations?tab=montant-facturer' },
    ],
  },
  {
    label: 'Mes élèves',
    path: '/professor/eleves',
    icon: BookOpen,
    roles: ['professor'],
    submenu: [
      { label: 'Mes élèves', path: '/professor/eleves?tab=liste' },
      { label: 'Mon bilan', path: '/professor/eleves?tab=bilan' },
      { label: 'Mes RDV', path: '/professor/eleves?tab=rdv' },
    ],
  },
];

/**
 * Filtre les éléments de navigation selon le rôle de l'utilisateur
 */
export const getNavigationForRole = (role: UserRole): NavItem[] => {
  return navigationItems.filter(item => item.roles.includes(role));
};

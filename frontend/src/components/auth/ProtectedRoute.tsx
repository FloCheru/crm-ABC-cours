import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../services/auth.service';
import type { UserRole } from '../../types/auth.types';

interface RoleBasedProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

/**
 * Composant pour protéger les routes selon les rôles utilisateur
 * Redirige vers /login si non authentifié
 * Redirige vers /unauthorized si le rôle n'est pas autorisé
 */
export const RoleBasedProtectedRoute = ({ allowedRoles, children }: RoleBasedProtectedRouteProps) => {
  const user = getCurrentUser();
  const location = useLocation();

  // Non authentifié -> redirection vers login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier l'accès : utilisateur a le bon rôle
  const hasAccess = allowedRoles.includes(user.role as UserRole);

  // Rôle non autorisé -> redirection vers page unauthorized
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Accès autorisé
  return <>{children}</>;
};

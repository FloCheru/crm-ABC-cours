import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../services/auth.service';
import type { UserRole } from '../../types/auth.types';
import { isSimulatingProfessor } from '../../utils/professorSimulation';

interface RoleBasedProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

/**
 * Composant pour protéger les routes selon les rôles utilisateur
 * Redirige vers /login si non authentifié
 * Redirige vers /unauthorized si le rôle n'est pas autorisé
 *
 * Note: Les admins en mode simulation peuvent accéder aux routes professeur
 */
export const RoleBasedProtectedRoute = ({ allowedRoles, children }: RoleBasedProtectedRouteProps) => {
  const user = getCurrentUser();
  const location = useLocation();

  // Non authentifié -> redirection vers login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier l'accès :
  // - Utilisateur a le bon rôle
  // - OU admin en mode simulation qui essaie d'accéder à une route professeur
  const hasAccess = allowedRoles.includes(user.role as UserRole) ||
                    (user.role === 'admin' && isSimulatingProfessor() && allowedRoles.includes('professor'));

  // Rôle non autorisé -> redirection vers page unauthorized
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Accès autorisé
  return <>{children}</>;
};

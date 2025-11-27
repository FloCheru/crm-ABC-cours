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

  console.log("[PROTECTED ROUTE] 🔍 Vérification d'accès pour:", location.pathname);
  console.log("[PROTECTED ROUTE] 👤 Utilisateur:", user);
  console.log("[PROTECTED ROUTE] 🎭 Rôles autorisés:", allowedRoles);

  // Non authentifié -> redirection vers login
  if (!user) {
    console.log("[PROTECTED ROUTE] ❌ Pas d'utilisateur, redirection vers /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier l'accès : utilisateur a le bon rôle
  const hasAccess = allowedRoles.includes(user.role as UserRole);
  console.log("[PROTECTED ROUTE] 🔑 Rôle de l'utilisateur:", user.role);
  console.log("[PROTECTED ROUTE] ✅ Accès autorisé?", hasAccess);

  // Rôle non autorisé -> redirection vers page unauthorized
  if (!hasAccess) {
    console.log("[PROTECTED ROUTE] 🚫 Accès refusé, redirection vers /unauthorized");
    return <Navigate to="/unauthorized" replace />;
  }

  // Accès autorisé
  console.log("[PROTECTED ROUTE] ✅ Accès accordé");
  return <>{children}</>;
};

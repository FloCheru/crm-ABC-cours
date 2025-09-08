import { useAuthStore } from '../stores';

/**
 * Hook personnalisé pour l'authentification avec sélecteurs optimisés
 */
export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  
  // Mémorisation des actions pour éviter les re-renders
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  
  return {
    // État
    user,
    isAuthenticated,
    token,
    
    // Actions
    login,
    logout,
    setUser,
    setToken,
  };
};
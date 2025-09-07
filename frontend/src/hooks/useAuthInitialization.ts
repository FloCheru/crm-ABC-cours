import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { apiClient } from '../utils/apiClient';
import { rateLimitedApiClient } from '../utils/rateLimitedApiClient';

/**
 * Fonction pour vérifier si un token JWT est expiré
 */
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    // Si on ne peut pas décoder le token, on le considère comme expiré
    return true;
  }
};

/**
 * Hook pour initialiser la gestion automatique de la déconnexion
 * lors de l'expiration du token
 */
export const useAuthInitialization = () => {
  const logoutAndRedirect = useAuthStore((state) => state.logoutAndRedirect);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Enregistrer le callback de déconnexion dans les deux clients API
    apiClient.setLogoutCallback(logoutAndRedirect);
    rateLimitedApiClient.setLogoutCallback(logoutAndRedirect);

    // Vérification périodique du token (toutes les 30 secondes)
    const tokenCheckInterval = setInterval(() => {
      if (isAuthenticated) {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('🔓 Token manquant - redirection automatique vers login');
          logoutAndRedirect();
        } else if (isTokenExpired(token)) {
          console.log('🔓 Token expiré - redirection automatique vers login');
          logoutAndRedirect();
        }
      }
    }, 10000); // Vérifier toutes les 10 secondes

    // Vérification immédiate au montage
    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        console.log('🔓 Token invalide au montage - redirection immédiate');
        logoutAndRedirect();
      }
    }

    // Vérifier le token quand l'utilisateur revient sur l'onglet
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('🔓 Token manquant lors du retour sur l\'onglet - redirection');
          logoutAndRedirect();
        } else if (isTokenExpired(token)) {
          console.log('🔓 Token expiré lors du retour sur l\'onglet - redirection');
          logoutAndRedirect();
        }
      }
    };

    // Vérifier le token sur focus de la fenêtre et clics
    const handleFocusCheck = () => {
      if (isAuthenticated) {
        const token = localStorage.getItem('token');
        if (!token || isTokenExpired(token)) {
          console.log('🔓 Token expiré lors du focus - redirection');
          logoutAndRedirect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocusCheck);
    document.addEventListener('click', handleFocusCheck);

    // Cleanup: retirer les callbacks et l'interval lors du démontage
    return () => {
      apiClient.setLogoutCallback(() => {});
      rateLimitedApiClient.setLogoutCallback(() => {});
      clearInterval(tokenCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocusCheck);
      document.removeEventListener('click', handleFocusCheck);
    };
  }, [logoutAndRedirect, isAuthenticated]);
};
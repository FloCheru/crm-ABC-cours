import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from './useAuth';

/**
 * Hook qui étend automatiquement la session utilisateur à chaque navigation
 * Utilise uniquement les changements de route pour détecter l'activité (optimal performance)
 */
export const useActivityReset = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    // Ne faire l'extension que si l'utilisateur est authentifié
    if (!isAuthenticated) {
      return;
    }

    console.log(`🔄 Navigation détectée: ${location.pathname} - Extension de session`);
    
    // Étendre la session à chaque changement de route
    authService.extendSession();
  }, [location.pathname, isAuthenticated]); // Reset seulement lors du changement de route
};
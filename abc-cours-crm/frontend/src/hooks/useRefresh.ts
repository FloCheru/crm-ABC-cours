import { useAppStore } from '../stores';

/**
 * Hook de migration depuis RefreshContext vers Zustand
 * Maintient la même API pour faciliter la transition
 */
export const useRefresh = () => {
  const refreshTrigger = useAppStore((state) => state.refreshTrigger);
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);
  
  return {
    refreshTrigger,
    triggerRefresh,
  };
};
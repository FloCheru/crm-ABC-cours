import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  // Refresh functionality (replace RefreshContext)
  refreshTrigger: number;
  triggerRefresh: () => void;
  
  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Refresh state
      refreshTrigger: 0,
      triggerRefresh: () => {
        console.log('🔄 Zustand: Déclenchement du rafraîchissement');
        set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
      },
      
      // Loading state
      isLoading: false,
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      // Error state
      error: null,
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'app-store',
    }
  )
);
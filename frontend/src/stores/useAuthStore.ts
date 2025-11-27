import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService, type AuthResponse } from '../services/authService';

interface AuthState {
  // User state
  user: AuthResponse['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  requirePasswordChange: boolean;

  // Actions
  login: (email: string, password: string) => Promise<{ requirePasswordChange: boolean }>;
  logout: () => void;
  logoutAndRedirect: () => void;
  setUser: (user: AuthResponse['user'] | null) => void;
  setToken: (token: string | null) => void;
  setRequirePasswordChange: (value: boolean) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        token: null,
        isAuthenticated: false,
        requirePasswordChange: false,

        // Actions
        login: async (email: string, password: string) => {
          try {
            const response = await authService.login({ email, password });
            const requirePasswordChange = response.user.isPasswordSet === false;
            set({
              user: response.user,
              token: response.accessToken,
              isAuthenticated: true,
              requirePasswordChange,
            });
            return { requirePasswordChange };
          } catch (error) {
            console.error('Login error:', error);
            throw error;
          }
        },
        
        logout: () => {
          authService.logout();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            requirePasswordChange: false,
          });
        },

        logoutAndRedirect: () => {
          authService.logout();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            requirePasswordChange: false,
          });

          // Rediriger vers la page de connexion
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        },

        setUser: (user) => set({ user, isAuthenticated: !!user }),

        setToken: (token) => set({ token, isAuthenticated: !!token }),

        setRequirePasswordChange: (value) => set({ requirePasswordChange: value }),
        
        initializeAuth: () => {
          const token = authService.getToken();
          const user = authService.getUser();
          set({
            token,
            user,
            isAuthenticated: !!token && !!user,
          });
        },
      }),
      {
        name: 'auth-store',
        // Ne persister que le minimum nécessaire
        partialize: (state) => ({
          token: state.token,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);
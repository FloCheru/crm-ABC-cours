// Types compatibles avec le système existant
export type UserRole = 'admin' | 'professor';

// Interface pour l'utilisateur (compatible avec authService)
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

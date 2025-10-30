/**
 * Utilitaires pour gérer la simulation de vue professeur par l'admin
 * Solution simple sans Context React - utilise localStorage directement
 */

const STORAGE_KEY = 'abc_professor_simulation';

export interface SimulatedProfessor {
  id: string;
  firstName: string;
  lastName: string;
}

/**
 * Active le mode simulation professeur
 */
export const enterProfessorView = (professor: SimulatedProfessor): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(professor));
};

/**
 * Désactive le mode simulation professeur
 */
export const exitProfessorView = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Vérifie si le mode simulation est actif
 */
export const isSimulatingProfessor = (): boolean => {
  return !!localStorage.getItem(STORAGE_KEY);
};

/**
 * Récupère les informations du professeur simulé
 */
export const getSimulatedProfessor = (): SimulatedProfessor | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

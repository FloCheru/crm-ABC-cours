import { getSimulatedProfessor } from "../utils/professorSimulation";

/**
 * Hook qui retourne l'ID du professeur selon le contexte :
 * - En mode simulation (admin voit comme prof) : ID du professeur simulé
 * - En mode normal (prof connecté) : ID depuis localStorage
 */
export const useProfessorId = (): string | null => {
  const simulatedProfessor = getSimulatedProfessor();

  if (simulatedProfessor) {
    return simulatedProfessor.id;
  }

  return localStorage.getItem("professorId");
};

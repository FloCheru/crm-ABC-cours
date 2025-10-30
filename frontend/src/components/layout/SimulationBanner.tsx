import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getSimulatedProfessor, exitProfessorView } from '../../utils/professorSimulation';
import { ArrowLeft } from 'lucide-react';

export const SimulationBanner: React.FC = () => {
  const navigate = useNavigate();
  const simulatedProfessor = getSimulatedProfessor();

  if (!simulatedProfessor) {
    return null;
  }

  const handleExitSimulation = () => {
    // Restaurer l'ID du professeur dans localStorage pour ProfesseurDetails
    localStorage.setItem('professorId', simulatedProfessor.id);

    // Désactiver le mode simulation
    exitProfessorView();

    // Rediriger vers la page de détails du professeur
    navigate('/admin/professeur-details');
  };

  return (
    <div className="sticky top-0 z-50 bg-primary text-white shadow-navbar px-lg py-md flex justify-between items-center">
      <div className="flex items-center gap-md">
        <span className="text-sm font-semibold">
          🔍 Mode consultation : {simulatedProfessor.firstName} {simulatedProfessor.lastName} (Professeur)
        </span>
      </div>
      <button
        onClick={handleExitSimulation}
        className="px-lg py-sm bg-white text-primary text-sm rounded-md hover:bg-gray-100 flex items-center gap-sm font-semibold transition-colors"
      >
        <ArrowLeft size={16} />
        Retour à la vue admin
      </button>
    </div>
  );
};

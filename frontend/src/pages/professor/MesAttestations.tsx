import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { ProfessorAttestationsContent } from '../../components/professor/ProfessorAttestationsContent';

export const Attestations: React.FC = () => {
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const professorId = user?._id || '';
  const defaultTab = searchParams.get('tab') || 'fiche-paie';

  return (
    <div className="container mx-auto px-4 max-w-6xl py-8">
      <h1 className="text-2xl font-bold mb-6">Mes Attestations</h1>
      <ProfessorAttestationsContent professorId={professorId} defaultTab={defaultTab} />
    </div>
  );
};
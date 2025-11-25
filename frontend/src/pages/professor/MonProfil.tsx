import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { ProfessorProfileContent } from '../../components/professor/ProfessorProfileContent';

export const MonProfil: React.FC = () => {
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const professorId = user?._id || '';
  const defaultTab = searchParams.get('tab') || 'informations';

  return (
    <div className="container mx-auto px-4 max-w-6xl py-8">
      <h1 className="text-2xl font-bold mb-6">Mon Profil</h1>
      <ProfessorProfileContent professorId={professorId} defaultTab={defaultTab} />
    </div>
  );
};
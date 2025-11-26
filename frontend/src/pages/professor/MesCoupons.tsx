import React from 'react';
import { PageHeader } from '../../components';
import { ProfessorCouponsContent } from '../../components/professor/ProfessorCouponsContent';
import { useAuthStore } from '../../stores';

export const MesCoupons: React.FC = () => {
  const { user } = useAuthStore();

  if (!user?._id) {
    return (
      <div className="text-center text-red-500 py-8">
        Erreur : utilisateur non connecté
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Mes Coupons" />
      <ProfessorCouponsContent professorId={user._id} />
    </>
  );
};
import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Layout pour toutes les pages du profil professeur
 * La navbar est gérée globalement dans main.tsx, ce layout ne fournit que la structure commune
 */
export const ProfessorLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-8">
        <Outlet />
      </main>
    </div>
  );
};

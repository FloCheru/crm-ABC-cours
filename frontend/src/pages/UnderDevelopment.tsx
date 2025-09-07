import React from "react";
import { useLocation } from "react-router-dom";
import { Navbar, PageHeader, Container } from "../components";

export const UnderDevelopment: React.FC = () => {
  const location = useLocation();

  // Générer le bouton de retour selon la route
  const getBackButton = () => {
    const pathname = location.pathname;
    if (pathname.includes('/admin/dashboard')) {
      return { label: "Retour au dashboard", href: "/admin/dashboard" };
    }
    if (pathname.includes('/admin')) {
      return { label: "Retour admin", href: "/admin" };
    }
    return { label: "Retour à l'accueil", href: "/admin/coupons" };
  };

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <PageHeader 
        title="🚧 En cours de développement"
        breadcrumb={[
          { label: "Accueil", href: "/admin/coupons" },
          { label: "En cours de développement" }
        ]}
        description="Cette fonctionnalité sera bientôt disponible"
        backButton={getBackButton()}
      />
      <Container layout="flex-col">
        <div className="text-center py-16">
          {/* Titre maintenant géré par PageHeader */}
        </div>
      </Container>
    </div>
  );
};

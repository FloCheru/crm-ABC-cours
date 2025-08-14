import React from "react";
import { useLocation } from "react-router-dom";
import { Navbar, Breadcrumb, Container } from "../components";

export const UnderDevelopment: React.FC = () => {
  const location = useLocation();

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/admin/coupons" },
          { label: "En cours de développement", href: location.pathname },
        ]}
      />
      <Container layout="flex-col">
        <div className="text-center py-16">
          {/* Titre */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚧 En cours de développement
          </h1>
        </div>
      </Container>
    </div>
  );
};

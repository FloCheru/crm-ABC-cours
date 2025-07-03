import React from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "../components/navbar/Navbar";
import { Breadcrumb } from "../components/breadcrum/Breadcrumb";

const Admin: React.FC = () => {
  const location = useLocation();

  console.log(location.pathname);

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Coupons", href: "/admin/coupons" },
        ]}
      />
      <h1>Gestion des coupons</h1>
    </div>
  );
};

export default Admin;

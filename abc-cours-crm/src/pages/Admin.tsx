import React from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "../components/navbar/Navbar";

const Admin: React.FC = () => {
  const location = useLocation();

  console.log(location.pathname);

  return (
    <div style={{ border: "1px solid red" }}>
      <Navbar activePath={location.pathname} />
    </div>
  );
};

export default Admin;

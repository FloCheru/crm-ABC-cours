import React from "react";
import { ButtonGroup } from "../components/button/ButtonGroup";

const Home: React.FC = () => {
  return (
    <div style={{ padding: "100px", border: "1px solid red" }}>
      <ButtonGroup
        variant="triple"
        buttons={[
          { text: "Annuler", variant: "secondary" },
          { text: "Valider", variant: "primary" },
          { text: "Supprimer", variant: "error" },
        ]}
      />
    </div>
  );
};

export default Home;

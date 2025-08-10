import React from "react";
import { StatusBadge } from "./StatusBadge";

export default {
  title: "Components/StatusBadge",
  component: StatusBadge,
  parameters: {
    layout: "centered",
  },
};

export const Active = () => <StatusBadge variant="active">Active</StatusBadge>;
export const Terminee = () => (
  <StatusBadge variant="terminee">Terminée</StatusBadge>
);
export const Bloquee = () => (
  <StatusBadge variant="bloquee">Bloquée</StatusBadge>
);
export const Disponible = () => (
  <StatusBadge variant="disponible">Disponible</StatusBadge>
);
export const Utilise = () => (
  <StatusBadge variant="utilise">Utilisé</StatusBadge>
);

export const AllVariants = () => (
  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
    <StatusBadge variant="active">Active</StatusBadge>
    <StatusBadge variant="terminee">Terminée</StatusBadge>
    <StatusBadge variant="bloquee">Bloquée</StatusBadge>
    <StatusBadge variant="disponible">Disponible</StatusBadge>
    <StatusBadge variant="utilise">Utilisé</StatusBadge>
  </div>
);

import React from "react";
import "./StatusBadge.css";

export type StatusBadgeVariant =
  | "active"
  | "terminee"
  | "bloquee"
  | "disponible"
  | "utilise";

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const getStatusLabel = (variant: StatusBadgeVariant): string => {
  switch (variant) {
    case "active":
      return "Active";
    case "terminee":
      return "Terminée";
    case "bloquee":
      return "Bloquée";
    case "disponible":
      return "Disponible";
    case "utilise":
      return "Utilisé";
    default:
      return "";
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  children,
  className = "",
}) => {
  return (
    <span className={`status-badge status-badge--${variant} ${className}`}>
      {children || getStatusLabel(variant)}
    </span>
  );
};

export default StatusBadge;

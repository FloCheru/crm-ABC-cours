import React from "react";
import "./Navbar.css";

interface NavbarProps {
  /**
   * Chemin actuel pour déterminer l'élément actif
   */
  activePath?: string;

  /**
   * Classes CSS supplémentaires
   */
  className?: string;

  /**
   * Fonction appelée lors du clic sur un élément
   */
  onNavigate?: (path: string) => void;
}

// Items de navigation fixes
const NAV_ITEMS = [
  { label: "Admin", path: "/admin" },
  { label: "Professeurs", path: "/professeurs" },
  { label: "Prospects", path: "/prospects" },
  { label: "Clients", path: "/clients" },
  { label: "Tableau de bord", path: "/dashboard" },
  { label: "Candidats", path: "/candidats" },
  { label: "ATP", path: "/atp" },
  { label: "Messagerie", path: "/messagerie" },
];

/**
 * Composant Navbar avec navigation fixe
 *
 * @example
 * ```tsx
 * <Navbar activePath="/admin" />
 *
 * // Avec React Router
 * <Navbar
 *   activePath={location.pathname}
 *   onNavigate={(path) => navigate(path)}
 * />
 * ```
 */
export const Navbar: React.FC<NavbarProps> = ({
  activePath,
  className = "",
  onNavigate,
}) => {
  const handleClick = (path: string, event: React.MouseEvent) => {
    if (onNavigate) {
      event.preventDefault();
      onNavigate(path);
    }
  };

  const classes = ["navbar", className].filter(Boolean).join(" ");

  return (
    <nav
      className={classes}
      role="navigation"
      aria-label="Navigation principale"
    >
      <ul className="navbar__nav">
        {NAV_ITEMS.map((item, index) => {
          const isActive = activePath === item.path;

          return (
            <li key={index} className="navbar__item">
              <a
                href={item.path}
                className={`navbar__link ${
                  isActive ? "navbar__link--active" : ""
                }`}
                onClick={(event) => handleClick(item.path, event)}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navbar;

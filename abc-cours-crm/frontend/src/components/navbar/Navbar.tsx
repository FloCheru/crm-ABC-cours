import React from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useAuthStore } from "../../stores";

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
  { label: "Admin", path: "/admin/coupons" },
  { label: "Professeurs", path: "/under-development" },
  { label: "Prospects", path: "/under-development" },
  { label: "Clients", path: "/under-development" },
  { label: "Tableau de bord", path: "/admin/dashboard" },
  { label: "Candidats", path: "/under-development" },
  { label: "ATP", path: "/under-development" },
  { label: "Messagerie", path: "/under-development" },
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
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const handleClick = (path: string, event: React.MouseEvent) => {
    console.log(path);
    if (onNavigate) {
      event.preventDefault();
      onNavigate(path);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
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

        {/* Bouton d'authentification */}
        <li className="navbar__item navbar__item--auth">
          {isAuthenticated && user ? (
            <div className="navbar__user">
              <span className="navbar__user-greeting">
                Bonjour, {user.firstName}
              </span>
              <button
                className="navbar__logout-btn"
                onClick={handleLogout}
                type="button"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <button
              className="navbar__login-btn"
              onClick={handleLogin}
              type="button"
            >
              Connexion
            </button>
          )}
        </li>
      </ul>
    </nav>
  );
};

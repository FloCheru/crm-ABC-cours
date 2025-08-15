import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import { authService } from "../../services/authService";
import type { AuthResponse } from "../../services/authService";

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
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Vérifier l'état d'authentification au chargement et lors des changements
  useEffect(() => {
    const checkAuth = () => {
      const currentUser = authService.getUser();
      const authenticated = authService.isAuthenticated();
      setUser(currentUser);
      setIsAuthenticated(authenticated);
    };

    checkAuth();

    // Écouter les changements dans localStorage
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
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

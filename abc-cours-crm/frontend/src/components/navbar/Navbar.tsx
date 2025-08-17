import React from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../../hooks/useAuth";

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
  { 
    label: "Admin", 
    path: "/admin/coupons",
    submenu: [
      { label: "Séries de coupons", path: "/admin/coupons" },
      { label: "Coupons", path: "/admin/coupons/list" },
    ]
  },
  { label: "Professeurs", path: "/under-development" },
  { label: "Prospects", path: "/prospects" },
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
  const { user, isAuthenticated, logout } = useAuth();

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
          const isActive = activePath === item.path || 
            (item.submenu && item.submenu.some(sub => activePath === sub.path));

          return (
            <li key={index} className={`navbar__item ${item.submenu ? 'navbar__item--dropdown' : ''}`}>
              <a
                href={item.path}
                className={`navbar__link ${
                  isActive ? "navbar__link--active" : ""
                }`}
                onClick={(event) => handleClick(item.path, event)}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
                {item.submenu && <span className="navbar__dropdown-arrow">▼</span>}
              </a>
              
              {item.submenu && (
                <ul className="navbar__submenu">
                  {item.submenu.map((subItem, subIndex) => (
                    <li key={subIndex} className="navbar__submenu-item">
                      <a
                        href={subItem.path}
                        className={`navbar__submenu-link ${
                          activePath === subItem.path ? "navbar__submenu-link--active" : ""
                        }`}
                        onClick={(event) => handleClick(subItem.path, event)}
                      >
                        {subItem.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
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

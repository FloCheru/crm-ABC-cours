import { Link, useLocation } from "react-router-dom";
import { useAuthPermissions } from "../../services/auth.service";
import { getNavigationForRole } from "../../config/navigation.config";
import { useAuthStore } from "../../stores/useAuthStore";
import { ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import "./Navbar.css";

export const Navbar = () => {
  const { user, role } = useAuthPermissions();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const logoutAndRedirect = useAuthStore((state) => state.logoutAndRedirect);

  // Ne pas afficher la navbar sur la page de login
  if (!user || !role || location.pathname === "/login") {
    return null;
  }

  const navItems = getNavigationForRole(role);

  const handleMouseEnter = (itemLabel: string) => {
    setOpenDropdown(itemLabel);
  };

  const handleMouseLeave = () => {
    setOpenDropdown(null);
  };

  return (
    <nav className="navbar">
      <div className="navbar-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.submenu &&
              item.submenu.some((sub) => location.pathname === sub.path));
          const hasSubmenu = item.submenu && item.submenu.length > 0;

          return (
            <div
              key={item.path}
              className={`navbar-item-wrapper ${
                hasSubmenu ? "has-submenu" : ""
              }`}
              onMouseEnter={() => hasSubmenu && handleMouseEnter(item.label)}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                to={item.path}
                className={`navbar-item ${isActive ? "active" : ""}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {hasSubmenu && (
                  <ChevronDown size={16} className="dropdown-arrow" />
                )}
              </Link>

              {hasSubmenu && openDropdown === item.label && (
                <div className="navbar-submenu">
                  {item.submenu!.map((subItem) => {
                    const isSubActive = location.pathname === subItem.path;
                    return (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        className={`navbar-submenu-item ${
                          isSubActive ? "active" : ""
                        }`}
                      >
                        {subItem.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="navbar-user">
        <span className="user-badge">
          {role === "admin" ? "ADMIN" : "PROFESSEUR"}
        </span>
        <span className="user-name">
          {user.firstName} {user.lastName}
        </span>
        <button
          className="logout-button"
          onClick={logoutAndRedirect}
          title="Se déconnecter"
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </nav>
  );
};

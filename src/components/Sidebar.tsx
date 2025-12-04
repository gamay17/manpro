import { useState } from "react";
import { House, Settings2, FolderKanban } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import LogoutPopup from "../components/Popup";
import { useAuth } from "../hooks/useAuth";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const [showPopup, setShowPopup] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menus = [
    { name: "Home", icon: House, path: "/home" },
    { name: "Project", icon: FolderKanban, path: "/projects" },
  ];

  const handleLogout = () => {
    logout();
    setShowPopup(false);
    navigate("/login");
  };

  const initial =
    (user?.name && user.name.trim().charAt(0).toUpperCase()) || "U";

  return (
    <>
      <aside
        className={`
          h-screen flex flex-col
          transition-all duration-500 ease-in-out
          ${isOpen ? "w-64" : "w-16"}
          bg-gradient-to-b from-amber-300 via-amber-400 to-orange-400
          backdrop-blur-[2px] bg-white/5
          border-r border-amber-300/60
          shadow-[0_18px_45px_rgba(15,23,42,0.25)]
          rounded-br-xl
        `}
      >
        
        <div
          onClick={() => setShowPopup(!showPopup)}
          className={`cursor-pointer ${isOpen ? "px-4 pt-4" : "px-2 pt-4"}`}
        >
          <div className="flex items-center gap-3">
            
            <div
              className="
                h-11 w-11 rounded-full
                bg-gradient-to-br from-white to-amber-100
                border border-white/70 shadow-sm
                flex items-center justify-center
              "
            >
              <span className="text-lg font-bold text-amber-700">
                {initial}
              </span>
            </div>

            {isOpen && (
              <div className="overflow-hidden">
                <span className="text-lg font-bold text-slate-900 truncate">
                  {user?.name || "User"}
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 h-px bg-white/60" />
        </div>

        {showPopup && (
          <LogoutPopup
            onLogout={handleLogout}
            onClose={() => setShowPopup(false)}
          />
        )}

        
        <div className="flex-grow flex flex-col gap-1 mt-4">
          {menus.map((menu) => {
            const Icon = menu.icon;

            return (
              <NavLink
                key={menu.path}
                to={menu.path}
                className={({ isActive }) =>
                  `
                  group flex items-center rounded-xl mx-2 transition
                  ${isOpen ? "px-3 py-2.5 gap-3" : "justify-center py-2.5"}
                  ${
                    isActive
                      ? "bg-white text-amber-700 shadow-md border border-amber-100"
                      : "bg-white/10 hover:bg-white/25 text-slate-900"
                  }
                `
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={22}
                      className={
                        isActive
                          ? "text-amber-600"
                          : "text-slate-800 group-hover:text-slate-900"
                      }
                    />

                    {isOpen && (
                      <span
                        className={
                          isActive
                            ? "font-semibold text-base truncate text-amber-700"
                            : "font-semibold text-base truncate text-slate-900 group-hover:text-slate-900"
                        }
                      >
                        {menu.name}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        
        <div className="border-t border-white/50 mt-2 pt-2">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `
              group flex items-center rounded-xl mx-2 my-3 transition
              ${isOpen ? "px-3 py-2.5 gap-3" : "justify-center py-2.5"}
              ${
                isActive
                  ? "bg-white text-amber-700 shadow-md border border-amber-100"
                  : "bg-white/10 hover:bg-white/25 text-slate-900"
              }
            `
            }
          >
            {({ isActive }) => (
              <>
                <Settings2
                  size={22}
                  className={
                    isActive
                      ? "text-amber-600"
                      : "text-slate-800 group-hover:text-slate-900"
                  }
                />

                {isOpen && (
                  <span
                    className={
                      isActive
                        ? "font-semibold text-base truncate text-amber-700"
                        : "font-semibold text-base truncate text-slate-900 group-hover:text-slate-900"
                    }
                  >
                    Settings
                  </span>
                )}
              </>
            )}
          </NavLink>
        </div>

        <div className="px-3 pb-4 text-[11px] text-slate-100/90">
          {isOpen && "Management Project • v1.0"}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

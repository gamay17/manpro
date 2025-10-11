import { useState } from "react";
import { Home, CircleUser, Settings, Folders } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LogoutPopup from "../components/Popup";
import { useAuth } from "../hooks/useAuth";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const [showPopup, setShowPopup] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menus = [
    { name: "Home", icon: Home, path: "/home" },
    { name: "Project", icon: Folders, path: "/projects" },
  ];

  const isActiveMenu = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setShowPopup(false);
    navigate("/login");
  };

  return (
    <div
      className={`h-screen flex flex-col text-quinary font-poppins font-bold transition-[width] duration-500 ease-in-out  
    ${isOpen ? "w-64" : "w-14"} 
    bg-gradient-to-b from-[#FFB300] to-[#FF8C00]
  `}
    >
      <div
        onClick={() => setShowPopup(!showPopup)}
        className={`group flex items-center relative cursor-pointer 
    ${
      isOpen ? "gap-3 justify-start px-3 py-3" : "justify-center py-3"
    } hover:text-secondary
  `}
      >
        <div className="flex items-center  ">
          <CircleUser
            size={26}
            strokeWidth={3}
            className="text-quinary group-hover:text-secondary"
          />

          {isOpen && (
            <div className="flex flex-col ml-4 mt-1 overflow-hidden">
              <span className="text-xl font-bold truncate">
                {user?.name || "User"}
              </span>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-2 right-2 border-b-3 border-quinary"></div>
      </div>

      {showPopup && (
        <LogoutPopup
          onLogout={handleLogout}
          onClose={() => setShowPopup(false)}
        />
      )}

      <div className="flex-grow flex flex-col gap-2 mt-4">
        {menus.map((menu, index) => {
          const Icon = menu.icon;
          const active = isActiveMenu(menu.path);

          return (
            <div key={index} className="mx-2">
              <Link
                to={menu.path}
                className={`group flex items-center cursor-pointer p-2 rounded transition-colors
                  ${isOpen ? "gap-3 px-3 justify-start" : "justify-center"}
                  ${active ? "bg-secondary text-primary" : "hover:bg-secondary"}
                `}
              >
                <Icon
                  size={22}
                  strokeWidth={3}
                  className={`${
                    active ? "text-primary" : "group-hover:text-primary"
                  }`}
                />
                <span
                  className={`font-bold font-poppins whitespace-nowrap overflow-hidden
                    ${
                      isOpen
                        ? active
                          ? "opacity-100 translate-x-0 text-primary"
                          : "opacity-100 translate-x-0 text-quinary group-hover:text-primary"
                        : "opacity-0 -translate-x-5 w-0"
                    }
                  `}
                >
                  {menu.name}
                </span>
              </Link>
            </div>
          );
        })}
      </div>

      <div className="border-t border-quinary">
        <div className="mx-2 my-4">
          <Link
            to="/settings"
            className={`group flex items-center cursor-pointer p-2 rounded transition-colors
              ${isOpen ? "gap-3 px-3 justify-start" : "justify-center"}
              ${
                isActiveMenu("/settings")
                  ? "bg-secondary text-primary"
                  : "hover:bg-secondary"
              }
            `}
          >
            <Settings
              size={22}
              strokeWidth={3}
              className={`${
                isActiveMenu("/settings")
                  ? "text-primary"
                  : "group-hover:text-primary"
              }`}
            />
            <span
              className={`font-bold font-poppins whitespace-nowrap overflow-hidden ease-in-out
                ${
                  isOpen
                    ? isActiveMenu("/settings")
                      ? "opacity-100 translate-x-0 text-primary"
                      : "opacity-100 translate-x-0 text-quinary group-hover:text-primary"
                    : "opacity-0 -translate-x-5 w-0"
                }
              `}
            >
              Settings
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

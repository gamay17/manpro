import { useState, useEffect } from "react";
import {
  Home,
  CircleUser,
  Settings,
  Folders,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LogoutPopup from "../components/Popup";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null
  );
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        console.error("Gagal memuat data user");
      }
    }
  }, []);

  const menus = [
    { name: "Home", icon: Home, path: "/home" },
    { name: "Project", icon: Folders, path: "/projects" },
  ];

  const isActiveMenu = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("tokens");
    localStorage.removeItem("user");
    setShowPopup(false);
    navigate("/login");
  };

  return (
    <div
      className={`h-screen flex flex-col bg-primary text-quinary font-poppins font-bold transition-[width] duration-500 ease-in-out  
        ${isOpen ? "w-64" : "w-14"}
      `}
    >
      <div
        onClick={() => setShowPopup(!showPopup)}
        className={`group flex items-center border-b border-quinary p-4 relative cursor-pointer 
    ${isOpen ? "gap-3 justify-start" : "justify-center"} 
    hover:text-secondary
  `}
      >
        <CircleUser
          size={26}
          strokeWidth={3}
          className="text-quinary group-hover:text-secondary"
        />

        {isOpen && (
          <div className="flex flex-col ml-2 overflow-hidden">
            <span className="text-xl font-bold truncate">
              {user?.name || "User"}
            </span>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-secondary text-primary rounded-full p-1 cursor-pointer "
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
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
              className={`font-bold font-poppins whitespace-nowrap overflow-hidden  ease-in-out
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

import { useLocation } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface HeaderProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  const pageTitles: Record<string, string> = {
    "/home": "Home",
    "/projects": "Projects",
    "/settings": "Settings",
  };

  const currentPage = pageTitles[location.pathname] || "Home";

  return (
    <header
      className="
        sticky top-0 z-20 w-full
        flex items-center justify-between
        bg-gradient-to-r from-white/95 to-white/80
        backdrop-blur-md
        px-4 py-2.5 border-b border-slate-200 shadow-sm
      "
    >
      <div className="flex items-center gap-4">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            flex items-center justify-center w-11 h-11
            bg-white border border-slate-200 rounded-full
            shadow-sm hover:bg-amber-50 transition
          "
        >
          {isOpen ? <PanelLeftClose size={22} /> : <PanelLeftOpen size={22} />}
        </button>

        {/* App + Page Title */}
        <div className="flex flex-col">
          <span className="text-sm md:text-base font-semibold text-slate-600">
            ManPro
          </span>
          <h1 className="text-base md:text-lg font-bold text-slate-900">
            {currentPage}
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;

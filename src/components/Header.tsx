import { useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    <header className="w-full flex items-center justify-between bg-secondary text-primary px-2 sm:px-4 md:px-6 py-2 border-b border-quinary/30">
      <div className="flex items-center gap-3 md:gap-4 flex-wrap">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-10 h-10 bg-secondary text-quinary rounded-full hover:bg-primary transition-all duration-200"
        >
          {isOpen ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
        </button>

        {/* Page Title */}
        <h1 className="text-lg md:text-xl font-bold font-poppins whitespace-nowrap">
          ManPro{" "}
          <span className="text-sm font-medium opacity-80">/ {currentPage}</span>
        </h1>
      </div>
    </header>
  );
};

export default Header;

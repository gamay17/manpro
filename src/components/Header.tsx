import { useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();

  // mapping nama path → judul halaman
  const pageTitles: Record<string, string> = {
    "/home": "Home",
    "/projects": "Projects",
    "/settings": "Settings",
  };

  const currentPage = pageTitles[location.pathname] || "Dashboard";

  return (
    <header className="w-full flex items-center justify-between bg-secondary text-primary p-4  border-b border-quinary">

      <h1 className="text-xl font-bold font-poppins">
        ManPro <span className="text-sm font-medium opacity-80">/ {currentPage}</span>
      </h1>
    </header>
  );
};

export default Header;

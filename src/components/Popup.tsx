import { LogOut } from "lucide-react";

interface LogoutPopupProps {
  onLogout: () => void;
}

const LogoutPopup: React.FC<LogoutPopupProps> = ({ onLogout }) => {
  return (
    <div className="absolute top-16 left-4 bg-secondary shadow-lg rounded-md p-3 w-40 text-black z-50">
      <button
        onClick={onLogout}
        className="flex items-center gap-2 w-full p-2 rounded hover:bg-tertiary text-red-500 font-medium"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
};

export default LogoutPopup;

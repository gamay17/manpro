import { useEffect, useRef } from "react";
import { LogOut } from "lucide-react";
import { AlertDialog } from "./AlertDialog"; // pastikan path sesuai
import { useAuth } from "../hooks/useAuth"; // pastikan sesuai dengan lokasi context-mu

interface PopupProps {
  onLogout: () => void;
  onClose: () => void;
}

const Popup = ({ onLogout, onClose }: PopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth(); // ✅ Ambil data user dari AuthContext

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const handleLogoutClick = async () => {
    const confirmed = await AlertDialog.confirm({
      title: "Are you sure you want to log out?",
      text: "You will be signed out from this account.",
      confirmText: "Yes, log out",
      cancelText: "Cancel",
      confirmColor: "#ef4444",
      icon: "warning",
    });

    if (confirmed) {
      onLogout();
    } else {
      onClose();
    }
  };

  return (
    <div
      ref={popupRef}
      className="absolute top-16 left-4 bg-white shadow-lg rounded-md p-3 w-48 text-quinary z-50"
    >
      <div className="text-center border-b border-gray-200 pb-2 mb-2">
        <p className="text-sm font-medium text-quinary truncate">
          {user?.email || "Tidak ada email"}
        </p>
      </div>

      {/* Tombol Logout */}
      <button
        onClick={handleLogoutClick}
        className="flex items-center gap-2 w-full p-2 rounded hover:bg-gray-100 text-red-500 font-medium transition-all"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
};

export default Popup;

import { useEffect, useRef } from "react";
import { LogOut } from "lucide-react";

interface PopupProps {
  onLogout: () => void;
  onClose: () => void;
}

const Popup = ({ onLogout, onClose }: PopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose(); // Tutup popup jika klik di luar
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose(); // Tutup popup jika tekan ESC
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="absolute top-16 left-4 bg-white shadow-lg rounded-md p-3 w-40 text-black z-50"
    >
      <button
        onClick={onLogout}
        className="flex items-center gap-2 w-full p-2 rounded hover:bg-gray-100 text-red-500 font-medium"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
};

export default Popup;

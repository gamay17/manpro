import React from "react";
import { CircleHelp, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { createRoot, type Root } from "react-dom/client";

interface AlertDialogProps {
  title: string;
  text: string;
  icon?: "warning" | "success" | "question" | "info";
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const AlertDialog: React.FC<AlertDialogProps> & {
  confirm: (options: Omit<AlertDialogProps, "onConfirm" | "onCancel">) => Promise<boolean>;
} = ({
  title,
  text,
  icon = "info",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "#FFB300",
  onConfirm,
  onCancel,
}) => {
  const renderIcon = () => {
    const baseClass = "w-14 h-14 mb-4 mx-auto";
    switch (icon) {
      case "warning":
        return <AlertTriangle className={`${baseClass} text-yellow-500`} />;
      case "success":
        return <CheckCircle className={`${baseClass} text-green-500`} />;
      case "question":
        return <CircleHelp className={`${baseClass} text-blue-500`} />;
      default:
        return <Info className={`${baseClass} text-primary`} />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl p-6 w-[90%] sm:w-[380px] shadow-2xl text-center animate-fade-in scale-100">
        {renderIcon()}
        <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{text}</p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{ backgroundColor: confirmColor }}
            className="px-4 py-2 text-white font-semibold rounded-lg hover:opacity-90 transition-all"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- SINGLETON ROOT (anti createRoot berulang) ---------- */

let portalContainer: HTMLDivElement | null = null;
let portalRoot: Root | null = null;

function ensureRoot(): Root {
  if (!portalContainer) {
    portalContainer = document.createElement("div");
    portalContainer.id = "alert-dialog-root";
    document.body.appendChild(portalContainer);
  }
  if (!portalRoot) {
    portalRoot = createRoot(portalContainer);
  }
  return portalRoot;
}

function closeDialog() {
  // Jangan destroy root; cukup kosongkan isinya supaya bisa dipakai lagi.
  portalRoot?.render(null);
}

AlertDialog.confirm = ({
  title,
  text,
  icon,
  confirmText,
  cancelText,
  confirmColor,
}) => {
  return new Promise<boolean>((resolve) => {
    const onConfirm = () => {
      resolve(true);
      closeDialog();
    };
    const onCancel = () => {
      resolve(false);
      closeDialog();
    };

    const root = ensureRoot();
    root.render(
      <AlertDialog
        title={title}
        text={text}
        icon={icon}
        confirmText={confirmText}
        cancelText={cancelText}
        confirmColor={confirmColor}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
  });
};

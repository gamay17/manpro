import Swal, { type SweetAlertIcon } from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export const AlertDialog = {

  confirm: async (options: {
    title: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    cancelColor?: string;
    icon?: SweetAlertIcon;
  }) => {
    const {
      title,
      text = "",
      confirmText = "Ya",
      cancelText = "Batal",
      confirmColor = "#3B82F6",
      cancelColor = "#6b7280",
      icon = "question",
    } = options;

    const result = await Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: confirmColor,
      cancelButtonColor: cancelColor,
      background: "#ffffff",
    });

    return result.isConfirmed;
  },
};

import React from "react";

type ButtonProps = {
  type?: "button" | "submit" | "reset";
  text: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  type = "button",
  text,
  onClick,
  className = "",
  disabled = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-2 border rounded font-semibold cursor-pointer font-poppins transition ${className}`}
    >
      {text}
    </button>
  );
};

export default Button;

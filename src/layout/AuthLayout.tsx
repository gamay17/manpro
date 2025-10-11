import React, { type JSX } from "react";
import { Outlet } from "react-router-dom";
import Background from "../assets/image/background.png";

const AuthLayout: React.FC = (): JSX.Element => {
  return (
    <div
      className="
        relative min-h-screen flex justify-center items-center 
        px-4 py-8 overflow-hidden
      "
      style={{
        backgroundImage: `url(${Background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Lapisan gradasi + blur ringan agar kontras dan lembut */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-black/30 backdrop-blur-[3px]" />

      {/* Card utama (tempat form) */}
      <div
        className="
          relative z-10 w-full max-w-md sm:max-w-lg 
          bg-secondary/75 backdrop-blur-md 
          rounded-3xl border border-tertiary
          shadow-2xl
          p-6 sm:p-10 
          flex flex-col items-center justify-center
          transition-all duration-300
        "
      >
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;

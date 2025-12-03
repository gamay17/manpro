import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Background from "../assets/image/background.png";

const AuthLayout: React.FC = () => {
  const location = useLocation();

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
      {/* Overlay + blur */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-black/40 backdrop-blur-[3px]" />

      {/* Card utama (semua halaman auth masuk ke sini lewat <Outlet />) */}
      <div
        className="
          relative z-10 w-full max-w-md sm:max-w-lg 
          bg-secondary backdrop-blur-md 
          rounded-3xl border border-tertiary/70
          shadow-2xl
          px-6 py-7 sm:px-10 sm:py-9 
          flex flex-col justify-center
          transition-all duration-300
        "
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              },
            }}
            exit={{
              opacity: 0,
              y: -20,
              scale: 0.98,
              transition: {
                duration: 0.4,
                ease: [0.65, 0, 0.35, 1],
              },
            }}
            className="w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthLayout;

import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, cubicBezier, type Variants } from "framer-motion";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const smoothEase = cubicBezier(0.22, 1, 0.36, 1);

const pageIn: Variants = {
  initial: { opacity: 0, y: 32, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: smoothEase,
      opacity: { duration: 0.8, ease: "easeOut" },
    },
  },
};

const UserLayout: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const content = document.getElementById("layout-content");
    if (content) content.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <div
     className="
  flex h-screen w-full overflow-hidden
  bg-gradient-to-br from-[#F5F5F5] via-[#FFF7DA] to-[#EAEAEA]
"
    >
      <Sidebar isOpen={isOpen} />

      <div className="flex flex-col flex-1 min-w-0">
        <Header isOpen={isOpen} setIsOpen={setIsOpen} />

        <main
          id="layout-content"
          className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4"
        >
          <motion.div
            key={location.pathname}
            variants={pageIn}
            initial="initial"
            animate="animate"
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default UserLayout;

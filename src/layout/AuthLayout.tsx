import React, { type JSX } from "react";
import { Outlet } from "react-router-dom";
import Background from "../assets/image/background.png";

const AuthLayout: React.FC = (): JSX.Element => {
  return (
    <div
      className={`
        min-h-screen flex justify-center items-center px-4
        sm:bg-primary sm:bg-cover sm:bg-center
      `}
      style={{
        backgroundImage: `url(${Background})`,
        backgroundPosition: "center",
      }}
    >
      <div
        className="
          w-full max-w-sm sm:max-w-md 
          min-h-[480px] sm:min-h-[550px] 
          p-6 bg-secondary shadow-lg rounded-xl flex flex-col items-center
        "
      >
        
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;

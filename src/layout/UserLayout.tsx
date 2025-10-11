import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const UserLayout: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen w-full border-b border-quinary">
      <Sidebar isOpen={isOpen} />
      <div className="flex flex-col flex-1">
        <Header isOpen={isOpen} setIsOpen={setIsOpen} />

        <main className="flex-1 p-6 overflow-y-auto bg-tertiary">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;

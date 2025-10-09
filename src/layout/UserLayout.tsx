// src/layouts/UserLayout.tsx
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const UserLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Header />

        <main className="flex-1 p-6 overflow-y-auto bg-tertiary">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;

import React, { useEffect, useMemo, useState } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  ListTodo,
  KanbanSquare,
  CheckSquare,
} from "lucide-react";

import {
  NavLink,
  Outlet,
  useParams,
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { createProjectService } from "../service/project.service";
import type { Project } from "../types/project";
import LogoutPopup from "../components/Popup";

/* ================= MAIN LAYOUT ================= */

const ProjectLayout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [isOpen, setIsOpen] = useState(true);
  const [projectName, setProjectName] = useState("Project Name");
  const [loadingName, setLoadingName] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const svc = useMemo(
    () => (userId ? createProjectService(userId) : null),
    [userId]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id || !svc) {
        setLoadingName(false);
        return;
      }

      const numericId = Number(id);

      try {
        setLoadingName(true);

        const data = await svc.getById(numericId);
        if (!data || cancelled) return;

        setProjectName(data.name ?? "Project Name");

        // type-safe check status/completed
        type ExtendedProject = Project & {
          status?: string;
          completed?: boolean;
        };

        const extended = data as ExtendedProject;

        const completed =
          extended.status === "completed" || extended.completed === true;

        setIsCompleted(Boolean(completed));
      } catch {
        if (!cancelled) {
          setProjectName("Project Name");
          setIsCompleted(false);
        }
      } finally {
        if (!cancelled) setLoadingName(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, svc]);

  if (!id) {
    return <div className="p-6 text-red-600">Invalid project id.</div>;
  }

  return (
    <div
      className="
        flex h-screen w-full overflow-hidden   
        bg-gradient-to-br from-[#F5F5F5] via-[#FFF7DA] to-[#EAEAEA]
"
    >
      <ProjectSidebar isOpen={isOpen} projectId={id} />

      <div className="flex flex-col flex-1 min-w-0">
        <ProjectHeader
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          projectName={loadingName ? "Loading…" : projectName}
          isCompleted={isCompleted}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectLayout;

/* ================= SIDEBAR ================= */

interface SidebarProps {
  isOpen: boolean;
  projectId: string;
}

const ProjectSidebar: React.FC<SidebarProps> = ({ isOpen, projectId }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);

  const menus = [
    {
      name: "Dashboard",
      path: `/projects/${projectId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    { name: "Tasks", path: `/projects/${projectId}/tasks`, icon: ListTodo },
    {
      name: "Task Board",
      path: `/projects/${projectId}/board`,
      icon: KanbanSquare,
    },
    { name: "My Task", path: `/projects/${projectId}/my`, icon: CheckSquare },
  ];

  const logoutNow = () => {
    logout();
    navigate("/login");
  };

  const initial =
    (user?.name && user.name.trim().charAt(0).toUpperCase()) || "U";

  return (
    <aside
      className={`
        h-screen flex flex-col
        transition-all duration-500
        ${isOpen ? "w-64" : "w-16"}
        bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500
        backdrop-blur-[2px] bg-white/5
        border-r border-amber-300/60
        shadow-[0_18px_45px_rgba(15,23,42,0.25)]
        rounded-br-xl
      `}
    >
      {/* USER */}
      <div
        onClick={() => setShowPopup(!showPopup)}
        className={`cursor-pointer ${isOpen ? "px-4 pt-4" : "px-2 pt-4"}`}
      >
        <div className="flex items-center gap-3">
          {/* Avatar huruf – modern gradient */}
          <div
            className="
              h-11 w-11 rounded-full
              bg-gradient-to-br from-white to-amber-100
              border border-white/70 shadow-sm
              flex items-center justify-center
            "
          >
            <span className="text-lg font-bold text-amber-700">{initial}</span>
          </div>

          {isOpen && (
            <div className="overflow-hidden">
              <span className="text-lg font-bold text-slate-900 truncate">
                {user?.name || "User"}
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 h-px bg-white/60" />
      </div>

      {showPopup && (
        <LogoutPopup onLogout={logoutNow} onClose={() => setShowPopup(false)} />
      )}

      {/* MENU */}
      <div className="flex-grow flex flex-col gap-1 mt-4">
        {menus.map((m) => {
          const Icon = m.icon;

          return (
            <NavLink
              key={m.path}
              to={m.path}
              end={m.exact}
              className={({ isActive }) =>
                `
                  group flex items-center rounded-xl mx-2 transition
                  ${isOpen ? "px-3 py-2.5 gap-3" : "justify-center py-2.5"}
                  ${
                    isActive
                      ? "bg-white text-amber-700 shadow-md border border-amber-100"
                      : "bg-white/10 hover:bg-white/25 text-slate-900"
                  }
                `
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={22}
                    className={
                      isActive
                        ? "text-amber-600"
                        : "text-slate-800 group-hover:text-slate-900"
                    }
                  />

                  {isOpen && (
                    <span
                      className={
                        isActive
                          ? "font-semibold text-base truncate text-amber-700"
                          : "font-semibold text-base truncate text-slate-900 group-hover:text-slate-900"
                      }
                    >
                      {m.name}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="px-3 pb-4 text-[11px] text-slate-100/90">
        {isOpen && "Management Project • v1.0"}
      </div>
    </aside>
  );
};

/* ================= HEADER ================= */

interface HeaderProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  projectName: string;
  isCompleted: boolean;
}

const ProjectHeader: React.FC<HeaderProps> = ({
  isOpen,
  setIsOpen,
  projectName,
  isCompleted,
}) => {
  return (
    <header
      className="
        sticky top-0 z-20 w-full
        flex items-center justify-between
        bg-gradient-to-r from-white/95 to-white/80
        backdrop-blur-md
        px-4 py-2.5 border-b border-slate-200 shadow-sm
      "
    >
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            w-11 h-11 rounded-full flex items-center justify-center
            bg-white border border-slate-200 shadow-sm
            hover:bg-amber-50 transition
          "
        >
          {isOpen ? <PanelLeftClose size={22} /> : <PanelLeftOpen size={22} />}
        </button>

        <div className="flex flex-col">
          {/* Projects label */}
          <Link
            to="/projects"
            className="
              text-sm md:text-base font-semibold
              text-slate-600 hover:text-amber-600 hover:underline
            "
          >
            Projects
          </Link>

          <div className="flex items-center gap-3 mt-0.5">
            {/* Nama project – sedikit lebih kecil */}
            <h1 className="text-base md:text-lg font-bold text-slate-900">
              {projectName}
            </h1>

            <span
              className={`
                px-3 py-0.5 text-[12px] rounded-full border font-medium
                ${
                  isCompleted
                    ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                    : "bg-amber-100 border-amber-200 text-amber-700"
                }
              `}
            >
              {isCompleted ? "Project Completed" : "Active Project"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

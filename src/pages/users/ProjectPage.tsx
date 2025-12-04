
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MoreHorizontal, Plus } from "lucide-react";

import AddProjectModal from "../../components/AddProjectModal";
import EditProjectModal from "../../components/EditProjectModal";
import SearchBar from "../../components/SearchBar";

import { createProjectService } from "../../service/project.service";
import type {
  Project,
  CreateProjectInput,
  ProjectStatus,
} from "../../types/project";
import type { IRegisterResponse } from "../../types/auth";
import type { Division } from "../../types/division";
import type { Task } from "../../types/task";

import { formatDateDisplay } from "../../utils/datetime";
import { useAuth } from "../../hooks/useAuth";
import Select, { type Option } from "../../components/Select";

const ProjectPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();

  const svc = useMemo(
    () => (userId ? createProjectService(String(userId)) : null),
    [userId]
  );

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");

  const [sp, setSp] = useSearchParams();
  const modalOpen = sp.get("new") === "1";

  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const [users, setUsers] = useState<IRegisterResponse[]>([]);



  const [divisions] = useState<Division[]>([]);
  const [tasks] = useState<Task[]>([]);


  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth:users");
      if (!raw) {
        setUsers([]);
        return;
      }
      const parsed = JSON.parse(raw) as Array<
        IRegisterResponse & { password?: string }
      >;
      const cleaned: IRegisterResponse[] = parsed.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
      setUsers(cleaned);
    } catch {
      setUsers([]);
    }
  }, []);

  const userMap = useMemo(() => {
    const m = new Map<string, IRegisterResponse>();
    for (const u of users) m.set(u.id, u);
    return m;
  }, [users]);


  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!svc) return;
      try {
        setLoading(true);
        const list = await svc.getAll();
        if (!cancelled) {
          setProjects(list);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load projects"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [svc]);


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }, [projects, query]);


  const openModal = () => setSp({ new: "1" }, { replace: false });
  const closeModal = () => {
    const next = new URLSearchParams(sp);
    next.delete("new");
    setSp(next, { replace: true });
  };


  const onAdd = async (data: CreateProjectInput) => {
    if (!svc) return;
    try {
      const created = await svc.create(data);
      setProjects((prev) => [created, ...prev]);
    } catch (e) {
      console.error("Failed to create project", e);
      setError("Failed to create project");
    }
  };

  const onDelete = async (id: number) => {
    if (!svc) return;
    try {
      await svc.remove(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error("Failed to delete project", e);
      setError("Failed to delete project");
    }
  };

  const onChangeStatus = async (id: number, status: ProjectStatus) => {
    if (!svc) return;
    try {
      const updated = await svc.setStatus(id, status);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (e) {
      console.error("Failed to change project status", e);
      setError("Failed to change project status");
    }
  };

  const onEdit = async (id: number, data: CreateProjectInput) => {
    if (!svc) return;
    try {
      const updated = await svc.update(id, data);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (e) {
      console.error("Failed to edit project", e);
      setError("Failed to edit project");
    }
  };


  const menuRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuOpen === null) return;
      const el = menuRefs.current.get(menuOpen);
      if (!el) {
        setMenuOpen(null);
        return;
      }
      if (!el.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [menuOpen]);

  const getPmLabel = (p: Project): string => {
    if (!p.managerId) return "Unassigned";
    const u = userMap.get(p.managerId);
    if (u) return u.name || u.email || u.id;
    return p.managerId;
  };


  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-0 pt-4 pb-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search project..."
          className="w-full sm:flex-1 scale-[0.97]"
        />

        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5
                     text-sm text-black font-semibold font-poppins
                     hover:brightness-95 active:scale-[0.98]
                     transition shadow-sm self-start"
        >
          <Plus size={14} />
          <span>Add Project</span>
        </button>
      </div>

            {loading ? (
        <div className="rounded-xl bg-white/85 border border-slate-200 p-3 text-xs sm:text-sm text-slate-600 shadow-sm">
          Loading projects…
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-700 border border-red-200">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white/90 p-5 text-center text-sm text-slate-600 border border-slate-200 shadow-sm font-inter">
          No projects yet.{" "}
          <button
            onClick={openModal}
            className="underline text-quinary hover:opacity-80 font-poppins"
          >
            Create one
          </button>
          .
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((p) => (
            <li
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="
                cursor-pointer rounded-xl bg-white/95
                p-4 sm:p-4
                shadow-[0_8px_25px_rgba(15,23,42,0.06)]
                border border-slate-200/70
                hover:shadow-[0_12px_32px_rgba(15,23,42,0.10)]
                transition
              "
            >
                            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold font-poppins text-quinary text-base">
                    {p.name}
                  </h3>

                  {p.description && (
                    <p className="mt-0.5 text-xs text-quaternary font-inter leading-snug">
                      {p.description}
                    </p>
                  )}
                </div>

                                <div
                  className="relative"
                  ref={(el) => {
                    if (el) menuRefs.current.set(p.id, el);
                    else menuRefs.current.delete(p.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === p.id ? null : p.id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="p-1 rounded hover:bg-slate-100 transition cursor-pointer"
                    aria-label="More actions"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen === p.id}
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {menuOpen === p.id && (
                    <div
                      className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                      role="menu"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(null);
                          setEditProject(p);
                          setEditOpen(true);
                        }}
                        className="block w-full text-left px-3 py-1.5 text-xs font-inter hover:bg-gray-50"
                        role="menuitem"
                      >
                          Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(null);
                          void onDelete(p.id);
                        }}
                        className="block w-full text-left px-3 py-1.5 text-xs font-inter text-red-600 hover:bg-red-50"
                        role="menuitem"
                      >
                          Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-quaternary font-inter">
                <label
                  className="inline-flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <span className="text-quinary font-medium">Status:</span>

                  <Select<ProjectStatus>
                    value={p.status}
                    onChange={(v) => {
                      void onChangeStatus(p.id, v);
                    }}
                    options={[
                      {
                        value: "in-progress",
                        label: "In Progress",
                      } as Option<ProjectStatus>,
                      {
                        value: "completed",
                        label: "Completed",
                      } as Option<ProjectStatus>,
                    ]}
                    className={
                      p.status === "completed"
                        ? "border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                        : "border-blue-400 text-blue-700 hover:bg-blue-50"
                    }
                    menuClassName="rounded-xl"
                  />
                </label>

                {p.startDate && (
                  <span>
                    <span className="text-quinary font-medium">Start: </span>
                    {formatDateDisplay(p.startDate)}
                  </span>
                )}

                {p.endDate && (
                  <span>
                    <span className="text-quinary font-medium">End: </span>
                    {formatDateDisplay(p.endDate)}
                  </span>
                )}

                {p.managerId && (
                  <span>
                    <span className="text-quinary font-medium">Manager: </span>
                    {getPmLabel(p)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

            <AddProjectModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={(data: CreateProjectInput) => {
          void onAdd(data);
          closeModal();
        }}
      />

            {editProject && (
        <EditProjectModal
          open={editOpen}
          initial={{
            name: editProject.name ?? "",
            description: editProject.description ?? "",
            startDate: editProject.startDate ?? "",
            endDate: editProject.endDate ?? "",
            managerId: editProject.managerId ?? "",
          }}

          projectId={editProject.id}
          divisions={divisions.filter((d) => d.projectId === editProject.id)}
          tasks={tasks.filter((t) => t.projectId === editProject.id)}
          onClose={() => {
            setEditOpen(false);
            setEditProject(null);
          }}
          onSubmit={(data: CreateProjectInput) => {
            void onEdit(editProject.id, data);
            setEditOpen(false);
            setEditProject(null);
          }}
        />
      )}
    </div>
  );
};

export default ProjectPage;

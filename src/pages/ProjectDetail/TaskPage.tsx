
import React from "react";
import { useParams } from "react-router-dom";
import { Plus, ChevronDown } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { createProjectService } from "../../service/project.service";
import { createTaskService } from "../../service/task.service";

import AddTaskModal from "../../components/AddTaskModal";
import EditTaskModal from "../../components/EditTaskModal";
import DivisionFilter, {
  type DivisionFilterValue,
} from "../../components/DivisionFilter";

import type {
  Task,
  TaskStatus,
  CreateTaskInput,
} from "../../types/task";
import type { Member } from "../../types/member";
import type { Division } from "../../types/division";
import type { IRegisterResponse } from "../../types/auth";
import type { Project } from "../../types/project";

const statusLabel: Record<TaskStatus, string> = {
  todo: "Todo",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
};


const statusColorClass: Record<TaskStatus, string> = {
  todo: "bg-amber-50 text-amber-700 border border-amber-200",
  "in-progress": "bg-sky-50 text-sky-700 border border-sky-200",
  review: "bg-violet-50 text-violet-700 border border-violet-200",
  done: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};


const statusOptions: TaskStatus[] = ["todo", "in-progress", "review", "done"];

interface StatusDropdownProps {
  status: TaskStatus;
  canChange: boolean;
  onChange: (status: TaskStatus) => void;
}


const StatusDropdown: React.FC<StatusDropdownProps> = ({
  status,
  canChange,
  onChange,
}) => {
  const [open, setOpen] = React.useState(false);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canChange) return;
    setOpen((prev) => !prev);
  };

  const handleSelect = (e: React.MouseEvent, s: TaskStatus) => {
    e.stopPropagation();
    onChange(s);
    setOpen(false);
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={toggle}
        disabled={!canChange}
        className={`
          inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold
          shadow-sm transition
          ${statusColorClass[status]}
          ${
            canChange
              ? "hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-1 cursor-pointer"
              : "cursor-default opacity-95"
          }
        `}
      >
        <span>{statusLabel[status]}</span>
        {canChange && (
          <ChevronDown
            size={14}
            className={`ml-0.5 transition-transform ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
        )}
      </button>

      {open && canChange && (
        <div
          className="
            absolute right-0 mt-1 w-[150px] z-20
            rounded-xl border border-slate-100 bg-white
            shadow-lg py-1
          "
        >
          {statusOptions.map((s) => {
            const active = s === status;
            return (
              <button
                key={s}
                type="button"
                onClick={(e) => handleSelect(e, s)}
                className={`
                  w-full px-3 py-1.5 text-left text-xs
                  flex items-center justify-between
                  hover:bg-amber-50
                  ${
                    active
                      ? "font-semibold text-amber-600"
                      : "text-slate-700"
                  }
                `}
              >
                <span>{statusLabel[s]}</span>
                {active && (
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};


const formatDate = (value?: string | null) => {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
};

type EditPermission = {
  canEditAllFields: boolean;
  canChangeStatusOnly: boolean;
};

const TaskPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);

  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [divisions, setDivisions] = React.useState<Division[]>([]);
  const [users, setUsers] = React.useState<IRegisterResponse[]>([]);

  const [currentMemberId, setCurrentMemberId] =
    React.useState<number | null>(null);
  const [canManageAll, setCanManageAll] = React.useState(false);

  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [openAdd, setOpenAdd] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [editPermission, setEditPermission] = React.useState<EditPermission>({
    canEditAllFields: false,
    canChangeStatusOnly: false,
  });

  const [divisionFilter, setDivisionFilter] =
    React.useState<DivisionFilterValue>("all");

  const membersRef = React.useRef<Member[]>([]);
  const divisionsRef = React.useRef<Division[]>([]);

  React.useEffect(() => {
    membersRef.current = members;
  }, [members]);

  React.useEffect(() => {
    divisionsRef.current = divisions;
  }, [divisions]);

  const projectSvc = React.useMemo(
    () =>
      currentUserId
        ? createProjectService(String(currentUserId))
        : null,
    [currentUserId]
  );

  const taskSvc = React.useMemo(
    () =>
      projectId
        ? createTaskService(
            projectId,
            () => currentUserId,
            () => membersRef.current,
            () => divisionsRef.current
          )
        : null,
    [projectId, currentUserId]
  );

  const userMap = React.useMemo(() => {
    const map = new Map<string, IRegisterResponse>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const memberMap = React.useMemo(() => {
    const map = new Map<number, Member>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const divisionMap = React.useMemo(() => {
    const map = new Map<number, Division>();
    divisions.forEach((d) => map.set(d.id, d));
    return map;
  }, [divisions]);


  const getTaskPermission = React.useCallback(
    (task: Task) => {
      const assignee = task.assigneeId
        ? memberMap.get(task.assigneeId)
        : undefined;
      const assigneeDivision = assignee
        ? divisionMap.get(assignee.divisionId)
        : undefined;

      const isLeaderForThisTask =
        !!currentUserId &&
        !!assigneeDivision &&
        assigneeDivision.coordinatorId === currentUserId;

      const isAssignee =
        !!currentMemberId && assignee?.id === currentMemberId;

      const canEditTask = canManageAll || isLeaderForThisTask; // dipakai hanya untuk "boleh buka modal + dianggap editor"
      const canChangeStatus =
        canManageAll || isLeaderForThisTask || isAssignee;

      return {
        isLeaderForThisTask,
        isAssignee,
        canEditTask,
        canChangeStatus,
      };
    },
    [canManageAll, currentUserId, currentMemberId, memberMap, divisionMap]
  );


  const isLeader = React.useMemo(
    () =>
      !!currentUserId &&
      divisions.some((d) => d.coordinatorId === currentUserId),
    [divisions, currentUserId]
  );

  const canCreateTask = (canManageAll || isLeader) && !!taskSvc;




  const membersForAdd = React.useMemo(() => {
    if (canManageAll) return members;
    if (!isLeader || !currentUserId) return members;

    const leaderDivisionIds = divisions
      .filter((d) => d.coordinatorId === currentUserId)
      .map((d) => d.id);

    if (leaderDivisionIds.length === 0) return members;

    return members.filter(
      (m) =>
        leaderDivisionIds.includes(m.divisionId) || m.userId === currentUserId
    );
  }, [members, divisions, canManageAll, isLeader, currentUserId]);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        if (!projectId || !Number.isFinite(projectId)) {
          throw new Error("Invalid project id.");
        }
        if (!currentUserId) {
          throw new Error("User tidak terdeteksi. Silakan login ulang.");
        }
        if (!projectSvc) {
          throw new Error("Project service tidak tersedia.");
        }

        const project: Project | undefined = await projectSvc.getById(projectId);
        if (!project) throw new Error("Project not found");
        if (cancelled) return;

        const isOwnerOrManager =
          project.ownerId === currentUserId ||
          project.managerId === currentUserId;
        setCanManageAll(isOwnerOrManager);


        let allMembers: Member[] = [];
        try {
          const raw = localStorage.getItem("members");
          if (raw) {
            const parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              allMembers = parsed as Member[];
            }
          }
        } catch {
          allMembers = [];
        }

        const projectMembers = allMembers.filter(
          (m) => m.projectId === projectId
        );

        if (!cancelled) {
          setMembers(projectMembers);
          const meMember = projectMembers.find(
            (m) => m.userId === currentUserId
          );
          setCurrentMemberId(meMember?.id ?? null);
        }


        let divs: Division[] = [];

        try {
          const rawPer = localStorage.getItem(`divisions:${projectId}`);
          if (rawPer) {
            const parsedPer: unknown = JSON.parse(rawPer);
            if (Array.isArray(parsedPer)) {
              divs = (parsedPer as Division[]).map((d) => ({
                ...d,
                projectId: d.projectId ?? projectId,
              }));
            }
          }
        } catch {
          /* ignore */
        }

        try {
          const rawGlobal = localStorage.getItem("divisions");
          if (rawGlobal) {
            const parsedGlobal: unknown = JSON.parse(rawGlobal);
            if (Array.isArray(parsedGlobal)) {
              const globalDivs = parsedGlobal as Division[];
              const filteredGlobal = globalDivs.filter(
                (d) => d.projectId === projectId
              );
              const map = new Map<number, Division>();
              divs.forEach((d) => map.set(d.id, d));
              filteredGlobal.forEach((d) => map.set(d.id, d));
              divs = Array.from(map.values());
            }
          }
        } catch {
          /* ignore */
        }

        if (!cancelled) setDivisions(divs);


        if (taskSvc) {
          const ts = await taskSvc.getAll();
          if (!cancelled) setTasks(ts);
        }


        try {
          const raw = localStorage.getItem("auth:users");
          if (raw) {
            const parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const cleaned: IRegisterResponse[] = (parsed as Array<
                IRegisterResponse & { password?: string }
              >).map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt,
              }));
              if (!cancelled) setUsers(cleaned);
            } else if (!cancelled) {
              setUsers([]);
            }
          } else if (!cancelled) {
            setUsers([]);
          }
        } catch {
          if (!cancelled) setUsers([]);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to load project tasks";
          setLoadError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [projectId, currentUserId, projectSvc, taskSvc]);

  const filteredTasks = React.useMemo(() => {
    if (divisionFilter === "all") return tasks;

    return tasks.filter((t) => {
      const assignee = t.assigneeId
        ? memberMap.get(t.assigneeId)
        : undefined;

      if (divisionFilter === "no-division") {
        return !assignee || !assignee.divisionId;
      }

      return assignee?.divisionId === divisionFilter;
    });
  }, [tasks, divisionFilter, memberMap]);


  const handleStatusChange = async (idTask: number, status: TaskStatus) => {
    if (!taskSvc) return;

    const task = tasks.find((t) => t.id === idTask);
    if (!task) return;

    const { canChangeStatus } = getTaskPermission(task);
    if (!canChangeStatus) {
      alert("Anda tidak punya izin mengubah status task ini.");
      return;
    }

    try {
      const updated = await taskSvc.setStatus(idTask, status);
      setTasks((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengubah status task";
      alert(message);
    }
  };




  const handleRowClick = (task: Task) => {
    const { isLeaderForThisTask, isAssignee } = getTaskPermission(task);

    const canOpenModal = canManageAll || isLeaderForThisTask || isAssignee;
    if (!canOpenModal) return;

    setEditingTask(task);
    setEditPermission({
      canEditAllFields: canManageAll, // hanya Owner/Manager yang boleh edit field & delete
      canChangeStatusOnly: false, // Leader & Member → modal read-only, status tetap via dropdown di tabel
    });
    setOpenEdit(true);
  };


  const handleDeleteTask = async (idTask: number) => {
    if (!taskSvc) return;

    try {
      await taskSvc.remove(idTask);
      setTasks((prev) => prev.filter((t) => t.id !== idTask));
      setOpenEdit(false);
      setEditingTask(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal menghapus task";
      alert(message);
    }
  };

  const handleAddTask = () => {
    if (!canCreateTask) return;
    setOpenAdd(true);
  };

  const handleSubmitAdd = async (input: CreateTaskInput) => {
    if (!taskSvc) return;
    try {
      const created = await taskSvc.create(input);
      setTasks((prev) => [...prev, created]);
      setOpenAdd(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal menambah task";
      alert(message);
    }
  };



  const handleSubmitEdit = async (input: CreateTaskInput) => {
    if (!taskSvc || !editingTask) return;

    const { canEditTask } = getTaskPermission(editingTask);
    if (!canEditTask || !canManageAll) {
      alert("Anda tidak punya izin mengubah task ini.");
      return;
    }

    try {
      const updated = await taskSvc.update(editingTask.id, input);
      setTasks((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      setOpenEdit(false);
      setEditingTask(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal menyimpan perubahan task";
      alert(message);
    }
  };

  if (!projectId || !Number.isFinite(projectId)) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-10">
        <div className="rounded-2xl bg-white p-6 text-red-600">
          Invalid project id.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-10">
        <div className="rounded-2xl bg-white p-6 text-sm text-slate-600">
          Loading tasks…
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-10">
        <div className="rounded-2xl bg-white p-6 text-sm text-red-600">
          {loadError}
        </div>
      </div>
    );
  }

  const hasAnyTask = tasks.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-10 space-y-6">
      
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-poppins text-slate-900">
              Tasks
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Kelola dan pantau progress task pada project ini.
            </p>
          </div>

          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <DivisionFilter
              divisions={divisions}
              value={divisionFilter}
              onChange={setDivisionFilter}
            />

            {canCreateTask && (
              <button
                onClick={handleAddTask}
                className="
                  inline-flex items-center gap-2 rounded-xl
                  bg-primary px-3.5 py-2.5
                  text-xs sm:text-sm font-semibold text-slate-900
                  shadow-[0_10px_25px_rgba(251,191,36,0.4)]
                  hover:brightness-95 active:scale-[0.97]
                  transition-shadow
                "
              >
                <Plus size={16} />
                <span>Tambah Task</span>
              </button>
            )}
          </div>
        </div>

        <div className="w-full h-[3px] rounded-full bg-gradient-to-r from-primary via-amber-400 to-transparent" />
      </div>

      
      <div
        className="
          bg-white/90 backdrop-blur-sm
          rounded-3xl
          shadow-[0_22px_60px_rgba(15,23,42,0.12)]
        "
      >
        
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 border-b border-slate-100/80">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              Daftar Task
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {hasAnyTask
                ? `${filteredTasks.length} task ditampilkan`
                : "Belum ada task yang dibuat"}
            </p>
          </div>
        </div>

        <div className="px-3 sm:px-5 pb-4 sm:pb-5">
          {!hasAnyTask ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-700 mb-1">
                Belum ada task yang dibuat.
              </p>
              <p className="text-xs text-slate-500">
                {canCreateTask ? (
                  <>
                    Klik tombol{" "}
                    <span className="font-semibold text-slate-800">
                      Tambah Task
                    </span>{" "}
                    untuk membuat task pertama pada project ini.
                  </>
                ) : (
                  <>Anda belum memiliki izin untuk membuat task.</>
                )}
              </p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-700 mb-1">
                Tidak ada task yang cocok dengan filter division.
              </p>
              <p className="text-xs text-slate-500">
                Coba ubah pilihan division di bagian atas.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full text-xs sm:text-sm font-inter">
                <thead>
                  <tr className="bg-slate-50/90 text-left text-slate-500 border-b border-slate-100">
                    <th className="py-3 px-3 w-[40px] text-xs font-semibold uppercase tracking-[0.08em] text-center">
                      No
                    </th>
                    <th className="py-3 px-3 w-[240px] text-xs font-semibold uppercase tracking-[0.08em]">
                      Task
                    </th>
                    <th className="py-3 px-3 w-[230px] text-xs font-semibold uppercase tracking-[0.08em]">
                      Assignee
                    </th>
                    <th className="py-3 px-3 w-[180px] text-xs font-semibold uppercase tracking-[0.08em]">
                      Division
                    </th>
                    <th className="py-3 px-3 w-[150px] text-xs font-semibold uppercase tracking-[0.08em] text-center">
                      Status
                    </th>
                    <th className="py-3 px-3 w-[120px] text-xs font-semibold uppercase tracking-[0.08em] text-center whitespace-nowrap">
                      Start
                    </th>
                    <th className="py-3 px-3 w-[120px] text-xs font-semibold uppercase tracking-[0.08em] text-center whitespace-nowrap">
                      Due
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTasks.map((t, idx) => {
                    const assignee = t.assigneeId
                      ? memberMap.get(t.assigneeId)
                      : undefined;
                    const assigneeUser = assignee
                      ? userMap.get(assignee.userId)
                      : undefined;
                    const assigneeDivision = assignee
                      ? divisionMap.get(assignee.divisionId)
                      : undefined;

                    const { canEditTask, canChangeStatus, isAssignee } =
                      getTaskPermission(t);


                    const rowClickable = canEditTask || isAssignee;

                    return (
                      <tr
                        key={t.id}
                        onClick={() => rowClickable && handleRowClick(t)}
                        className={`
                          border-b border-slate-100/80
                          odd:bg-white even:bg-slate-50/40
                          ${
                            rowClickable
                              ? "hover:bg-amber-50/80 cursor-pointer"
                              : ""
                          }
                          transition-colors duration-150
                        `}
                      >
                        <td className="py-3 px-3 align-top text-slate-400 text-xs text-center">
                          {idx + 1}
                        </td>

                        <td className="py-3 px-3 align-top">
                          <div className="flex flex-col gap-1 max-w-[240px]">
                            <span className="font-semibold text-slate-900 text-sm truncate">
                              {t.title}
                            </span>
                            {t.description && (
                              <p
                                className="text-slate-600 text-xs leading-snug line-clamp-2 break-words"
                                title={t.description}
                              >
                                {t.description}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top">
                          {assigneeUser ? (
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-8 w-8 shrink-0 rounded-full bg-primary text-slate-900 text-xs flex items-center justify-center font-semibold shadow-sm ring-2 ring-amber-100">
                                {assigneeUser.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-slate-900 leading-tight truncate">
                                  {assigneeUser.name}
                                </p>
                                <p className="text-[11px] text-slate-500 leading-tight truncate">
                                  {assigneeUser.email}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-[3px] text-[11px] font-medium text-slate-400 border border-dashed border-slate-300">
                              Unassigned
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 align-top">
                          {assigneeDivision ? (
                            <span className="text-sm text-slate-900 font-medium truncate block max-w-[180px]">
                              {assigneeDivision.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-[3px] text-[11px] font-medium text-slate-400 border border-dashed border-slate-200">
                              No division
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 align-top">
                          <div className="inline-flex min-w-[140px] justify-center">
                            <StatusDropdown
                              status={t.status}
                              canChange={canChangeStatus}
                              onChange={(newStatus) =>
                                handleStatusChange(t.id, newStatus)
                              }
                            />
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top text-slate-700 text-xs text-center whitespace-nowrap">
                          {t.startDate ? (
                            formatDate(t.startDate)
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 align-top text-slate-700 text-xs text-center whitespace-nowrap">
                          {t.dueDate ? (
                            formatDate(t.dueDate)
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      
      <AddTaskModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSubmit={handleSubmitAdd}
        members={membersForAdd}
        divisions={divisions}
        users={users}
      
        
      />

      <EditTaskModal
        open={openEdit}
        task={editingTask}
        onClose={() => setOpenEdit(false)}
        onSubmit={handleSubmitEdit}
        onDelete={handleDeleteTask}
        members={members}
        divisions={divisions}
        users={users}
        canEditAllFields={editPermission.canEditAllFields}
        canChangeStatusOnly={editPermission.canChangeStatusOnly}
      />
    </div>
  );
};

export default TaskPage;

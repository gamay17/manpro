import React from "react";
import { useParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { createProjectService } from "../../service/project.service";
import { createTaskService } from "../../service/task.service";

import EditTaskModal from "../../components/EditTaskModal";
import Button from "../../components/Button";

import type { Task, TaskStatus, CreateTaskInput } from "../../types/task";
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

const columnHeaderClass: Record<TaskStatus, string> = {
  todo: "bg-amber-200 text-amber-800 border-amber-200",
  "in-progress": "bg-blue-200 text-blue-800 border-blue-200",
  review: "bg-violet-200 text-violet-800 border-violet-200",
  done: "bg-emerald-200 text-emerald-800 border-emerald-200",
};

const statusOptions: TaskStatus[] = ["todo", "in-progress", "review", "done"];


const formatDate = (value?: string | null) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
};


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
                  ${active ? "font-semibold text-amber-600" : "text-slate-700"}
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


type EditPermission = {
  canEditAllFields: boolean;
  canChangeStatusOnly: boolean;
};

type ViewMode = "table" | "board";

const MyTaskPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);

  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [divisions, setDivisions] = React.useState<Division[]>([]);
  const [users, setUsers] = React.useState<IRegisterResponse[]>([]);

  const [currentMemberId, setCurrentMemberId] = React.useState<number | null>(
    null
  );
  const [canManageAll, setCanManageAll] = React.useState(false);

  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [openEdit, setOpenEdit] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [editPermission, setEditPermission] = React.useState<EditPermission>({
    canEditAllFields: false,
    canChangeStatusOnly: false,
  });

  const [view, setView] = React.useState<ViewMode>("table");


  const [draggedTaskId, setDraggedTaskId] = React.useState<number | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOverStatus, setDragOverStatus] = React.useState<TaskStatus | null>(
    null
  );
  const [lastDroppedTaskId, setLastDroppedTaskId] = React.useState<
    number | null
  >(null);

  const membersRef = React.useRef<Member[]>([]);
  const divisionsRef = React.useRef<Division[]>([]);

  React.useEffect(() => {
    membersRef.current = members;
  }, [members]);

  React.useEffect(() => {
    divisionsRef.current = divisions;
  }, [divisions]);

  const projectSvc = React.useMemo(
    () => (currentUserId ? createProjectService(currentUserId) : null),
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

      const isAssignee = !!currentMemberId && assignee?.id === currentMemberId;

      const canEditTask = canManageAll || isLeaderForThisTask;
      const canChangeStatus = canManageAll || isLeaderForThisTask || isAssignee;
      const canDrag = canChangeStatus;

      return {
        isLeaderForThisTask,
        isAssignee,
        canEditTask,
        canChangeStatus,
        canDrag,
      };
    },
    [canManageAll, currentUserId, currentMemberId, memberMap, divisionMap]
  );


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

        const project: Project | undefined = await projectSvc.getById(
          projectId
        );
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
              const cleaned: IRegisterResponse[] = (
                parsed as Array<IRegisterResponse & { password?: string }>
              ).map((u) => ({
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
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load my tasks";
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


  const myTasks = React.useMemo(() => {
    if (!currentMemberId) return [];
    return tasks.filter((t) => t.assigneeId === currentMemberId);
  }, [tasks, currentMemberId]);


  const handleStatusChange = async (idTask: number, status: TaskStatus) => {
    if (!taskSvc) return;

    const task = myTasks.find((t) => t.id === idTask);
    if (!task) return;

    const { canChangeStatus } = getTaskPermission(task);
    if (!canChangeStatus) {
      alert("Anda tidak punya izin mengubah status task ini.");
      return;
    }

    try {
      const updated = await taskSvc.setStatus(idTask, status);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal mengubah status task";
      alert(message);
    }
  };


  const handleDragStart = (taskId: number) => {
    const task = myTasks.find((t) => t.id === taskId);
    if (!task) return;

    const { canDrag } = getTaskPermission(task);
    if (!canDrag) return;

    setDraggedTaskId(taskId);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setIsDragging(false);
    setDragOverStatus(null);
  };

  const handleColumnDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    status: TaskStatus
  ) => {
    e.preventDefault();
    setDragOverStatus(status);
  };

  const handleColumnDrop = async (status: TaskStatus) => {
    if (!draggedTaskId) {
      handleDragEnd();
      return;
    }

    const task = myTasks.find((t) => t.id === draggedTaskId);
    if (!task) {
      handleDragEnd();
      return;
    }

    const { canChangeStatus } = getTaskPermission(task);
    if (!canChangeStatus) {
      handleDragEnd();
      return;
    }

    if (task.status === status) {
      handleDragEnd();
      return;
    }

    await handleStatusChange(draggedTaskId, status);
    setLastDroppedTaskId(draggedTaskId);
    window.setTimeout(() => setLastDroppedTaskId(null), 220);
    handleDragEnd();
  };




  const handleRowOrCardClick = (task: Task) => {
    if (isDragging) return;

    const { isLeaderForThisTask, isAssignee } = getTaskPermission(task);
    const canOpenModal = canManageAll || isLeaderForThisTask || isAssignee;
    if (!canOpenModal) return;

    setEditingTask(task);
    setEditPermission({
      canEditAllFields: canManageAll,
      canChangeStatusOnly: false, // untuk MyTask: modal hanya view mode utk leader/member
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
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal menghapus task";
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
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setOpenEdit(false);
      setEditingTask(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal menyimpan perubahan task";
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
          Loading my tasks…
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

  const hasAnyMyTask = myTasks.length > 0;
  const statuses: TaskStatus[] = ["todo", "in-progress", "review", "done"];

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-10 space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-poppins text-slate-900">
            My Tasks
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Lihat dan update task yang ditugaskan kepada Anda pada project ini.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-white/80 border border-amber-100 p-1 shadow-sm self-start sm:self-auto">
          <Button
            text="Table"
            onClick={() => setView("table")}
            className={
              view === "table"
                ? "rounded-xl bg-primary text-secondary border border-transparent shadow-sm px-5 py-2.5 text-base font-semibold"
                : "rounded-xl bg-transparent text-quinary border border-transparent px-5 py-2.5 text-base font-semibold hover:bg-amber-50"
            }
          />

          <Button
            text="Board"
            onClick={() => setView("board")}
            className={
              view === "board"
                ? "rounded-xl bg-primary text-secondary border border-transparent shadow-sm px-5 py-2.5 text-base font-semibold"
                : "rounded-xl bg-transparent text-quinary border border-transparent px-5 py-2.5 text-base font-semibold hover:bg-amber-50"
            }
          />
        </div>
      </div>

      <div className="w-full h-[3px] rounded-full bg-gradient-to-r from-primary via-amber-400 to-transparent" />

      
      {view === "table" && (
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
                My Task List
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {hasAnyMyTask
                  ? `${myTasks.length} task ditugaskan kepada Anda`
                  : "Belum ada task yang ditugaskan kepada Anda."}
              </p>
            </div>
          </div>

          <div className="px-3 sm:px-5 pb-4 sm:pb-5">
            {!hasAnyMyTask ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  Tidak ada task untuk Anda.
                </p>
                <p className="text-xs text-slate-500">
                  Task yang di-assign ke Anda akan tampil di sini.
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
                      <th className="py-3 px-3 w-[260px] text-xs font-semibold uppercase tracking-[0.08em]">
                        Task
                      </th>
                      <th className="py-3 px-3 w-[200px] text-xs font-semibold uppercase tracking-[0.08em]">
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
                    {myTasks.map((t, idx) => {
                      const assignee = t.assigneeId
                        ? memberMap.get(t.assigneeId)
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
                          onClick={() =>
                            rowClickable && handleRowOrCardClick(t)
                          }
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
                            <div className="flex flex-col gap-1 max-w-[260px]">
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
                            {assigneeDivision ? (
                              <span className="text-sm text-slate-900 font-medium truncate block max-w-[200px]">
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
      )}

      
      {view === "board" && (
        <div className="space-y-4">
          {!hasAnyMyTask ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-slate-50/60 px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-700 mb-1">
                Tidak ada task untuk Anda.
              </p>
              <p className="text-xs text-slate-500">
                Task yang di-assign ke Anda akan tampil di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
              {statuses.map((status) => {
                const tasksInColumn = myTasks.filter(
                  (t) => t.status === status
                );
                const isActiveDrop = dragOverStatus === status;

                return (
                  <div
                    key={status}
                    className={`rounded-2xl bg-white border border-slate-100 shadow-sm
                      transition-all duration-200 ease-out
                      ${
                        isActiveDrop
                          ? "ring-2 ring-primary/60 ring-offset-2"
                          : ""
                      }`}
                    onDragOver={(e) => handleColumnDragOver(e, status)}
                    onDrop={() => handleColumnDrop(status)}
                  >
                    <div
                      className={`flex items-center justify-between px-3 py-2.5 rounded-t-2xl border-b text-xs sm:text-sm font-semibold font-poppins ${columnHeaderClass[status]}`}
                    >
                      <span>{statusLabel[status]}</span>
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 rounded-full bg-white/80 text-[11px] text-slate-700 border border-slate-200 px-2">
                        {tasksInColumn.length}
                      </span>
                    </div>

                    <div className="p-3 space-y-3 transition-all duration-200 ease-out">
                      {tasksInColumn.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic text-center py-4">
                          No task in this column
                        </p>
                      ) : (
                        tasksInColumn.map((t) => {
                          const assignee = t.assigneeId
                            ? memberMap.get(t.assigneeId)
                            : undefined;
                          const assigneeDivision = assignee
                            ? divisionMap.get(assignee.divisionId)
                            : undefined;
                          const assigneeUser =
                            assignee && userMap.get(assignee.userId);

                          const { canDrag, canEditTask, isAssignee } =
                            getTaskPermission(t);
                          const isRecentlyDropped = lastDroppedTaskId === t.id;

                          const cardClickable = canEditTask || isAssignee;

                          return (
                            <div
                              key={t.id}
                              draggable={canDrag}
                              onDragStart={() => handleDragStart(t.id)}
                              onDragEnd={handleDragEnd}
                              onClick={() =>
                                cardClickable && handleRowOrCardClick(t)
                              }
                              className={`group rounded-2xl border px-3 py-3
                                bg-white/95
                                border-slate-200 shadow-xs
                                transition-all duration-200 ease-out
                                hover:shadow-md hover:-translate-y-[1px]
                                ${
                                  canDrag
                                    ? "cursor-grab active:cursor-grabbing"
                                    : "cursor-default"
                                }
                                ${
                                  isRecentlyDropped
                                    ? "bg-amber-50 border-amber-200"
                                    : ""
                                }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-[3px] text-[10px] font-medium text-sky-700">
                                  {assigneeDivision
                                    ? assigneeDivision.name
                                    : "No division"}
                                </span>

                                {cardClickable && (
                                  <span className="text-[10px] text-slate-400">
                                    •••
                                  </span>
                                )}
                              </div>

                              <h4 className="font-semibold text-[13px] text-slate-900 font-poppins leading-snug mb-1.5 line-clamp-2">
                                {t.title}
                              </h4>

                              {t.description && (
                                <p className="text-[11px] text-slate-600 leading-snug mb-2 line-clamp-3 break-words">
                                  {t.description}
                                </p>
                              )}

                              <div className="mt-1 flex items-center justify-between gap-3 text-[10px] text-slate-500">
                                <div className="flex gap-4">
                                  <div className="flex flex-col">
                                    <span className="uppercase tracking-[0.08em] text-[9px] text-slate-400">
                                      Start
                                    </span>
                                    <span className="font-medium text-slate-700">
                                      {t.startDate || "-"}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="uppercase tracking-[0.08em] text-[9px] text-slate-400">
                                      Due
                                    </span>
                                    <span className="font-medium text-slate-700">
                                      {t.dueDate || "-"}
                                    </span>
                                  </div>
                                </div>

                                {assigneeUser && (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="h-6 w-6 rounded-full bg-primary text-secondary text-[10px] flex items-center justify-center font-semibold shadow-sm">
                                      {assigneeUser.name
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-700 max-w-[90px] truncate">
                                      {assigneeUser.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      
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

export default MyTaskPage;

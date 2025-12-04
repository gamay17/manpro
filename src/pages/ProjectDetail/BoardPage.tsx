
import React from "react";
import { useParams } from "react-router-dom";
import { Plus, MoreHorizontal } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { createProjectService } from "../../service/project.service";
import { createTaskService } from "../../service/task.service";

import AddTaskModal from "../../components/AddTaskModal";
import EditTaskModal from "../../components/EditTaskModal";
import DivisionFilter, {
  type DivisionFilterValue,
} from "../../components/DivisionFilter";

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


const columnHeaderClass: Record<TaskStatus, string> = {
  todo: "bg-amber-200 text-amber-800 border-amber-200",
  "in-progress": "bg-blue-200 text-blue-800 border-blue-200",
  review: "bg-violet-200 text-violet-800 border-violet-200",
  done: "bg-emerald-200 text-emerald-800 border-emerald-200",
};

type EditPermission = {
  canEditAllFields: boolean;
  canChangeStatusOnly: boolean;
};

const BoardPage: React.FC = () => {
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

  const [openAdd, setOpenAdd] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [editPermission, setEditPermission] = React.useState<EditPermission>({
    canEditAllFields: false,
    canChangeStatusOnly: false,
  });

  const [divisionFilter, setDivisionFilter] =
    React.useState<DivisionFilterValue>("all");


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

  const isLeaderGlobal = React.useMemo(
    () =>
      !!currentUserId &&
      divisions.some((d) => d.coordinatorId === currentUserId),
    [divisions, currentUserId]
  );

  const canCreateTask = canManageAll || isLeaderGlobal;


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
            err instanceof Error ? err.message : "Failed to load project board";
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
      const assignee = t.assigneeId ? memberMap.get(t.assigneeId) : undefined;

      if (divisionFilter === "no-division") {
        return !assignee || !assignee.divisionId;
      }

      if (typeof divisionFilter === "number") {
        return assignee?.divisionId === divisionFilter;
      }

      return true;
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
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal mengubah status task";
      alert(message);
    }
  };


  const handleDragStart = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
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

    const task = tasks.find((t) => t.id === draggedTaskId);
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


  const handleCardClick = (task: Task) => {
    if (isDragging) return;

    const { canEditTask, isLeaderForThisTask } = getTaskPermission(task);
    if (!canEditTask) return;

    setEditingTask(task);
    setEditPermission({
      canEditAllFields: canManageAll, // owner/manager
      canChangeStatusOnly: !canManageAll && isLeaderForThisTask, // leader
    });
    setOpenEdit(true);
  };


  const handleDeleteTask = async (idTask: number) => {
    if (!taskSvc) return;

    try {
      await taskSvc.remove(idTask);
      setTasks((prev) => prev.filter((t) => t.id !== idTask));
      setOpenEdit(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal menghapus task";
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
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal menambah task";
      alert(message);
    }
  };

  const handleSubmitEdit = async (input: CreateTaskInput) => {
    if (!taskSvc || !editingTask) return;

    const { canEditTask } = getTaskPermission(editingTask);
    if (!canEditTask) {
      alert("Anda tidak punya izin mengubah task ini.");
      return;
    }

    try {
      const updated = await taskSvc.update(editingTask.id, input);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setOpenEdit(false);
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
          Loading task board…
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

  const totalTasks = filteredTasks.length;
  const statuses: TaskStatus[] = ["todo", "in-progress", "review", "done"];

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-10 space-y-6">
      
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-poppins text-quinary">
            Tasks Board
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola dan pantau progress task pada project ini.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DivisionFilter
            divisions={divisions}
            value={divisionFilter}
            onChange={setDivisionFilter}
            className="ml-0"
          />

          {canCreateTask && (
            <button
              onClick={handleAddTask}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5
                         text-xs sm:text-sm font-semibold text-secondary font-poppins
                         border border-primary shadow-md
                         hover:brightness-95 hover:shadow-lg active:scale-[0.985]
                         transition"
            >
              <Plus size={16} />
              <span>Tambah Task</span>
            </button>
          )}
        </div>
      </div>

      <div className="w-full h-[2px] bg-primary/70 rounded-full" />

      
      <div>
        {totalTasks === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-slate-50/60 px-4 py-6 text-center">
            <p className="text-sm font-medium text-slate-700 mb-1">
              Belum ada task yang dibuat.
            </p>
            <p className="text-xs text-slate-500">
              {canCreateTask ? (
                <>
                  Gunakan tombol{" "}
                  <span className="font-semibold">Tambah Task</span> untuk
                  membuat task pertama pada project ini.
                </>
              ) : (
                <>Anda belum memiliki izin untuk membuat task.</>
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
            {statuses.map((status) => {
              const tasksInColumn = filteredTasks.filter(
                (t) => t.status === status
              );
              const isActiveDrop = dragOverStatus === status;

              return (
                <div
                  key={status}
                  className={`rounded-2xl bg-white border border-slate-100 shadow-sm
                    transition-all duration-200 ease-out
                    ${
                      isActiveDrop ? "ring-2 ring-primary/60 ring-offset-2" : ""
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
                        const assigneeUser = assignee
                          ? userMap.get(assignee.userId)
                          : undefined;
                        const assigneeDivision = assignee
                          ? divisionMap.get(assignee.divisionId)
                          : undefined;

                        const { canDrag, canEditTask } = getTaskPermission(t);

                        const isRecentlyDropped = lastDroppedTaskId === t.id;

                        return (
                          <div
                            key={t.id}
                            draggable={canDrag}
                            onDragStart={() => handleDragStart(t.id)}
                            onDragEnd={handleDragEnd}
                            className={`
                              group relative rounded-2xl border px-4 py-4
                                bg-gradient-to-b from-white via-white to-slate-50/80
                              border-slate-200/70
                              shadow-sm
                              hover:shadow-lg hover:-translate-y-[3px]
                              transition-all duration-200 ease-out
                              ${
                                canDrag
                                  ? "cursor-grab active:cursor-grabbing"
                                  : "cursor-default"
                              }
                  ${
                    isRecentlyDropped
                      ? "bg-amber-50/90 border-amber-200 shadow-md"
                      : ""
                  }
                `}
                          >
                            
                            <div className="flex justify-between items-start mb-3.5">
                              
                              <div className="flex items-start gap-3">
                                
                                <div className="relative">
                                  <div
                                    className="h-9 w-9 rounded-full bg-primary text-secondary 
                    flex items-center justify-center text-xs font-semibold shadow"
                                  >
                                    {assigneeUser
                                      ? assigneeUser.name
                                          .charAt(0)
                                          .toUpperCase()
                                      : "?"}
                                  </div>
                                </div>

                                
                                <div className="flex flex-col leading-tight">
                                  <span className="text-[12px] font-semibold text-slate-900">
                                    {assigneeUser
                                      ? assigneeUser.name
                                      : "Unassigned"}
                                  </span>

                                  <span
                                    className="inline-flex items-center gap-1 mt-1 
                     bg-slate-100 text-slate-600 px-2 py-[2px] rounded-full
                     text-[10px] border border-slate-200"
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                    {assigneeDivision
                                      ? assigneeDivision.name
                                      : "No division"}
                                  </span>
                                </div>
                              </div>

                              
                              {canEditTask && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCardClick(t);
                                  }}
                                  className="h-7 w-7 flex items-center justify-center rounded-full 
                   hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                                >
                                  <MoreHorizontal size={16} />
                                </button>
                              )}
                            </div>

                            
                            <div className="w-full h-px bg-slate-200/70 mb-3" />

                            
                            <div className="mb-2.5">
                              <h4 className="font-semibold text-[13px] text-slate-900 font-poppins leading-snug mb-1 line-clamp-2">
                                {t.title}
                              </h4>

                              {t.description && (
                                <p className="text-[11px] text-slate-600 leading-snug line-clamp-3">
                                  {t.description}
                                </p>
                              )}
                            </div>

                            
                            <div className="flex justify-between items-center text-[10px] text-slate-600 mt-2">
                              <div className="flex flex-col">
                                <span className="uppercase tracking-[0.12em] text-[9px] text-slate-400">
                                  Start
                                </span>
                                <span className="font-medium text-slate-800 mt-[1px]">
                                  {t.startDate || "-"}
                                </span>
                              </div>

                              <div className="flex flex-col text-right">
                                <span className="uppercase tracking-[0.12em] text-[9px] text-slate-400">
                                  Due
                                </span>
                                <span className="font-medium text-slate-800 mt-[1px]">
                                  {t.dueDate || "-"}
                                </span>
                              </div>
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

      
      <AddTaskModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSubmit={handleSubmitAdd}
        members={members}
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

export default BoardPage;

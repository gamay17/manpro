
import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { useParams } from "react-router-dom";

import Button from "../../components/Button";
import DivisionMemberPage from "./DivisionMemberPage";
import EditDivisionModal from "../../components/EditDivisionModal";

import type {
  Division,
  DivisionStatus,
  CreateDivisionInput,
} from "../../types/division";
import type { IRegisterResponse } from "../../types/auth";
import type { Project } from "../../types/project";
import type {
  Member,
  CreateMemberInput,
  MemberRole,
} from "../../types/member";
import type { Task, TaskStatus } from "../../types/task";

import { nowLocalDatetime } from "../../utils/datetime";
import { canManageProject } from "../../utils/permissions";
import { useAuth } from "../../hooks/useAuth";
import { createTaskService } from "../../service/task.service";

const DIVISION_STORAGE_KEY = "divisions";
const PROJECT_STORAGE_KEY = "projects";
const MEMBER_STORAGE_KEY = "members";

type ActiveTab = "division" | "statistic";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("division");

  const { id: projectIdParam } = useParams<{ id: string }>();
  const projectId = projectIdParam ? Number(projectIdParam) : 0;

  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  const [project, setProject] = useState<Project | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [users, setUsers] = useState<IRegisterResponse[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);


  const [editOpen, setEditOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(
    null
  );


  const membersRef = useRef<Member[]>([]);
  const divisionsRef = useRef<Division[]>([]);

  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  useEffect(() => {
    divisionsRef.current = divisions;
  }, [divisions]);

  
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

  
  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }
    try {
      const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
      if (!raw) {
        setProject(null);
        return;
      }
      const parsed = JSON.parse(raw) as Project[];
      const found = parsed.find((p) => p.id === projectId) || null;
      setProject(found);
    } catch {
      setProject(null);
    }
  }, [projectId]);

  
  const loadAllDivisions = useCallback((): Division[] => {
    try {
      const raw = localStorage.getItem(DIVISION_STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Division[]) : [];
    } catch {
      return [];
    }
  }, []);

  const saveDivisionsForProject = useCallback(
    (pid: number, projectDivisions: Division[]) => {
      const all = loadAllDivisions();
      const others = all.filter((d) => d.projectId !== pid);
      const merged = [...others, ...projectDivisions];
      localStorage.setItem(DIVISION_STORAGE_KEY, JSON.stringify(merged));
    },
    [loadAllDivisions]
  );

  
  useEffect(() => {
    if (!projectId) {
      setDivisions([]);
      return;
    }
    const all = loadAllDivisions();
    const forThisProject = all.filter((d) => d.projectId === projectId);
    setDivisions(forThisProject);
  }, [projectId, loadAllDivisions]);

  
  const loadAllMembers = useCallback((): Member[] => {
    try {
      const raw = localStorage.getItem(MEMBER_STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Member[]) : [];
    } catch {
      return [];
    }
  }, []);

  const saveMembersForProject = useCallback(
    (pid: number, projectMembers: Member[]) => {
      const all = loadAllMembers();
      const others = all.filter((m) => m.projectId !== pid);
      const merged = [...others, ...projectMembers];
      localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(merged));
    },
    [loadAllMembers]
  );

  const calcNextMemberId = useCallback((list: Member[]): number => {
    return (list.reduce((max, m) => Math.max(max, m.id), 0) || 0) + 1;
  }, []);

  
  const canEdit = !!(user && project && canManageProject(user.id, project));
  const canManageMembers = canEdit; // sama rule dengan division

  /**
   * ===== Auto ensure Owner, Manager, Leader jadi member (sinkron) =====
   */
  const ensureCoreMembers = useCallback(
    (
      pid: number,
      projectObj: Project | null,
      projectDivisions: Division[],
      currentMembers: Member[]
    ): Member[] => {
      if (!projectObj) return currentMembers;

      const now = nowLocalDatetime();
      let next = [...currentMembers];


      const addIfNotExists = (
        userId: string | undefined,
        role: MemberRole,
        divisionId: number
      ) => {
        if (!userId) return;
        const already = next.some(
          (m) =>
            m.projectId === pid &&
            m.userId === userId &&
            m.role === role &&
            m.divisionId === divisionId
        );
        if (already) return;

        next = [
          ...next,
          {
            id: calcNextMemberId(next),
            projectId: pid,
            userId,
            divisionId,
            role,
            createdAt: now,
            updatedAt: now,
          },
        ];
      };


      addIfNotExists(projectObj.ownerId, "owner", 0);
      addIfNotExists(projectObj.managerId, "manager", 0);




      next = next.map((m) => {
        if (m.projectId !== pid || m.role !== "leader") return m;

        const div = projectDivisions.find((d) => d.id === m.divisionId);
        if (!div || div.coordinatorId !== m.userId) {
          return { ...m, role: "member", updatedAt: now };
        }
        return m;
      });


      projectDivisions.forEach((d) => {
        if (!d.coordinatorId) return;

        const coordId = d.coordinatorId;


        if (
          coordId === projectObj.ownerId ||
          coordId === projectObj.managerId
        ) {
          return;
        }


        const userRows = next
          .map((m, idx) => ({ m, idx }))
          .filter(({ m }) => m.projectId === pid && m.userId === coordId);

        if (userRows.length === 0) {

          next.push({
            id: calcNextMemberId(next),
            projectId: pid,
            userId: coordId,
            divisionId: d.id,
            role: "leader",
            createdAt: now,
            updatedAt: now,
          });
          return;
        }


        const existingInDiv = userRows.find(({ m }) => m.divisionId === d.id);
        const baseIndex = existingInDiv?.idx ?? userRows[0].idx;


        next[baseIndex] = {
          ...next[baseIndex],
          divisionId: d.id,
          role: "leader",
          updatedAt: now,
        };


        next = next.filter((m, idx) => {
          if (m.projectId !== pid) return true;
          if (m.userId !== coordId) return true;
          if (idx === baseIndex) return true;
          if (m.divisionId === 0) return true;
          return false;
        });
      });

      return next;
    },
    [calcNextMemberId]
  );

  
  useEffect(() => {
    if (!projectId) {
      setMembers([]);
      return;
    }
    const all = loadAllMembers();
    const forThisProject = all.filter((m) => m.projectId === projectId);

    const ensured = ensureCoreMembers(
      projectId,
      project,
      divisions,
      forThisProject
    );

    setMembers(ensured);
    saveMembersForProject(projectId, ensured);
  }, [
    projectId,
    project,
    divisions,
    loadAllMembers,
    saveMembersForProject,
    ensureCoreMembers,
  ]);

  
  const taskSvc = useMemo(
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

  useEffect(() => {
    let cancelled = false;

    const loadTasks = async () => {
      if (!taskSvc) {
        setTasks([]);
        return;
      }

      try {
        const ts = await taskSvc.getAll();
        if (!cancelled) setTasks(ts);
      } catch {
        if (!cancelled) setTasks([]);
      }
    };

    loadTasks();
    return () => {
      cancelled = true;
    };
  }, [taskSvc]);

  
  const calcNextDivisionId = useMemo(
    () => (list: Division[]) =>
      (list.reduce((max, d) => Math.max(max, d.id), 0) || 0) + 1,
    []
  );

  
  const canChangeDivisionStatus = (divisionId: number): boolean => {
    if (!user) return false;
    if (canEdit) return true; // PM/Owner bebas

    const target = divisions.find((d) => d.id === divisionId);
    if (!target) return false;

    return target.coordinatorId === user.id;
  };

  
  const handleAddDivision = (input: CreateDivisionInput) => {
    if (!canEdit) return;

    setDivisions((prev) => {
      const id = calcNextDivisionId(prev);
      const now = nowLocalDatetime();

      const newDivision: Division = {
        id,
        projectId,
        name: input.name.trim(),
        mainTask: input.mainTask?.trim() || "",
        coordinatorId: input.coordinatorId,
        status: input.status ?? "todo",
        startDate: input.startDate,
        dueDate: input.dueDate,
        createdAt: now,
        updatedAt: now,
      };

      const nextList = [...prev, newDivision];
      saveDivisionsForProject(projectId, nextList);


      setMembers((prevMembers) => {
        const ensured = ensureCoreMembers(
          projectId,
          project,
          nextList,
          prevMembers
        );
        saveMembersForProject(projectId, ensured);
        return ensured;
      });

      return nextList;
    });
  };

  const handleChangeStatus = (id: number, status: DivisionStatus) => {
    if (!canChangeDivisionStatus(id)) return;

    setDivisions((prev) => {
      const now = nowLocalDatetime();
      const nextList = prev.map((d) =>
        d.id === id ? { ...d, status, updatedAt: now } : d
      );
      saveDivisionsForProject(projectId, nextList);
      return nextList;
    });
  };

  const handleDeleteDivision = (id: number) => {
    if (!canEdit) return;

    setDivisions((prev) => {
      const nextList = prev.filter((d) => d.id !== id);
      saveDivisionsForProject(projectId, nextList);
      return nextList;
    });

  };

  const handleEditDivision = (division: Division) => {
    if (!canEdit) return;
    setSelectedDivision(division);
    setEditOpen(true);
  };

  const handleUpdateDivision = (id: number, data: CreateDivisionInput) => {
    if (!canEdit) return;

    setDivisions((prev) => {
      const now = nowLocalDatetime();
      const nextList = prev.map((d) =>
        d.id === id
          ? {
              ...d,
              name: data.name.trim(),
              mainTask: data.mainTask?.trim() || "",
              coordinatorId: data.coordinatorId,
              status: data.status,
              startDate: data.startDate,
              dueDate: data.dueDate,
              updatedAt: now,
            }
          : d
      );
      saveDivisionsForProject(projectId, nextList);


      setMembers((prevMembers) => {
        const ensured = ensureCoreMembers(
          projectId,
          project,
          nextList,
          prevMembers
        );
        saveMembersForProject(projectId, ensured);
        return ensured;
      });

      return nextList;
    });
  };

  
  const handleAddMember = (input: CreateMemberInput) => {
    if (!canManageMembers) return;
    setMembers((prev) => {
      const now = nowLocalDatetime();
      const id = calcNextMemberId(prev);

      const newMember: Member = {
        id,
        projectId,
        userId: input.userId,
        divisionId: input.divisionId,
        role: input.role,
        createdAt: now,
        updatedAt: now,
      };

      const next = [...prev, newMember];
      saveMembersForProject(projectId, next);
      return next;
    });
  };

  const handleDeleteMember = (id: number) => {
    if (!canManageMembers) return;

    setMembers((prev) => {
      const next = prev.filter((m) => m.id !== id);
      saveMembersForProject(projectId, next);
      return next;
    });
  };

  const handleUpdateMember = (id: number, input: CreateMemberInput) => {
    if (!canManageMembers) return;

    setMembers((prev) => {
      const now = nowLocalDatetime();
      const next = prev.map((m) =>
        m.id === id
          ? {
              ...m,
              divisionId: input.divisionId,
              updatedAt: now,
            }
          : m
      );
      saveMembersForProject(projectId, next);
      return next;
    });
  };

  const divisionCount = divisions.length;
  const memberCount = members.length;

  
  const statusOrder: TaskStatus[] = [
    "todo",
    "in-progress",
    "review",
    "done",
  ];

  const statusCounts = useMemo(() => {
    const base: Record<TaskStatus, number> = {
      todo: 0,
      "in-progress": 0,
      review: 0,
      done: 0,
    };
    tasks.forEach((t) => {
      base[t.status] = (base[t.status] ?? 0) + 1;
    });
    return base;
  }, [tasks]);

  const totalTasks = tasks.length;
  const doneCount = statusCounts.done;
  const overallProgress =
    totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  type DivisionStat = {
    id: number;
    name: string;
    total: number;
  };

  const divisionStats: DivisionStat[] = useMemo(() => {
    const map = new Map<number, number>();

    tasks.forEach((t) => {
      if (!t.assigneeId) return;
      const member = members.find((m) => m.id === t.assigneeId);
      if (!member || !member.divisionId) return;
      const prev = map.get(member.divisionId) ?? 0;
      map.set(member.divisionId, prev + 1);
    });

    const list: DivisionStat[] = [];
    map.forEach((total, divId) => {
      const div = divisions.find((d) => d.id === divId);
      list.push({
        id: divId,
        name: div?.name ?? `Division ${divId}`,
        total,
      });
    });

    list.sort((a, b) => b.total - a.total);
    return list;
  }, [tasks, members, divisions]);

  const maxDivisionTotal = divisionStats.reduce(
    (max, s) => Math.max(max, s.total),
    0
  );

  const subtitle =
    activeTab === "division"
      ? "Kelola dan pantau struktur divisi serta member pada project ini."
      : "Lihat ringkasan statistik task dan progress keseluruhan project.";


  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl sm:text-4xl font-bold font-poppins text-quinary mb-2">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-quinary/80 font-poppins">
          Anda harus login untuk mengakses dashboard.
        </p>
      </div>
    );
  }


  if (!project) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl sm:text-4xl font-bold font-poppins text-quinary mb-2">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-quinary/80 font-poppins">
          Project tidak ditemukan atau sudah dihapus.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-10 space-y-6">
      
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-poppins text-quinary">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-quinary/75 mt-1">
              {subtitle}
            </p>
          </div>

          
          <div className="inline-flex rounded-2xl bg-white/80 border border-amber-100 p-1.5 shadow-sm self-start sm:self-auto">
            <Button
              text="Division & Member"
              onClick={() => setActiveTab("division")}
              className={
                activeTab === "division"
                  ? "rounded-xl bg-primary text-secondary border border-transparent shadow-sm px-5 py-2 text-[12px] sm:text-sm font-semibold"
                  : "rounded-xl bg-transparent text-quinary border border-transparent px-5 py-2 text-[12px] sm:text-sm font-semibold hover:bg-amber-50"
              }
            />

            <Button
              text="Statistik"
              onClick={() => setActiveTab("statistic")}
              className={
                activeTab === "statistic"
                  ? "rounded-xl bg-primary text-secondary border border-transparent shadow-sm px-5 py-2 text-[12px] sm:text-sm font-semibold"
                  : "rounded-xl bg-transparent text-quinary border border-transparent px-5 py-2 text-[12px] sm:text-sm font-semibold hover:bg-amber-50"
              }
            />
          </div>
        </div>

        <div className="w-full h-[3px] rounded-full bg-gradient-to-r from-primary via-amber-400 to-amber-200" />
      </div>

      
      <div className="mt-2">
        {activeTab === "division" ? (
          <>
            <DivisionMemberPage
              project={project} // ✅ kirim project ke DivisionMemberPage
              divisions={divisions}
              users={users}
              divisionCount={divisionCount}
              memberCount={memberCount}

              canEdit={canEdit}
              currentUserId={user.id}
              onAddDivision={handleAddDivision}
              onChangeStatus={handleChangeStatus}
              onEdit={handleEditDivision}
              onDelete={handleDeleteDivision}

              members={members}
              canManageMembers={canManageMembers}
              onAddMember={handleAddMember}
              onDeleteMember={handleDeleteMember}
              onUpdateMember={handleUpdateMember}
            />

            <EditDivisionModal
              open={editOpen}
              division={selectedDivision}
              project={project} // ✅ kirim project ke EditDivisionModal
              users={users}
              existingDivisions={divisions}
              existingMembers={members}
              onClose={() => setEditOpen(false)}
              onSubmit={handleUpdateDivision}
              onDelete={(id: number) => {
                handleDeleteDivision(id);
                setEditOpen(false);
              }}
            />
          </>
        ) : (
          <div className="mt-4 space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statusOrder.map((status) => {
                const count = statusCounts[status];
                const labelMap: Record<TaskStatus, string> = {
                  todo: "To Do",
                  "in-progress": "In Progress",
                  review: "Review",
                  done: "Done",
                };
                const colorClass: Record<TaskStatus, string> = {
                  todo: "bg-amber-50 border-amber-100",
                  "in-progress": "bg-sky-50 border-sky-100",
                  review: "bg-violet-50 border-violet-100",
                  done: "bg-emerald-50 border-emerald-100",
                };
                const textClass: Record<TaskStatus, string> = {
                  todo: "text-amber-700",
                  "in-progress": "text-sky-700",
                  review: "text-violet-700",
                  done: "text-emerald-700",
                };
                return (
                  <div
                    key={status}
                    className={`rounded-2xl border ${colorClass[status]} px-4 py-3 shadow-sm flex flex-col gap-1`}
                  >
                    <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">
                      {labelMap[status]}
                    </span>
                    <div className="flex items-end justify-between">
                      <span
                        className={`text-3xl font-black font-poppins ${textClass[status]}`}
                      >
                        {count}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Total Task
                    </p>
                  </div>
                );
              })}
            </div>

            
            <div className="bg-white/95 rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.07)] border border-gray-100/80 p-5 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-quinary mb-1">
                    Project Overall Progress
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 max-w-md">
                    Progress dihitung dari persentase task yang berstatus{" "}
                    <span className="font-semibold text-emerald-600">
                      Done
                    </span>{" "}
                    terhadap total seluruh task di project ini.
                  </p>

                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full bg-emerald-400" />
                      <span className="text-[11px] text-slate-600">
                        Done ({doneCount} task)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full bg-slate-200" />
                      <span className="text-[11px] text-slate-600">
                        Belum selesai ({totalTasks - doneCount} task)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <div className="relative h-40 w-40 sm:h-48 sm:w-48">
                    <div
                      className="h-full w-full rounded-full"
                      style={{
                        backgroundImage: `conic-gradient(#34d399 ${
                          overallProgress * 3.6
                        }deg, #e5e7eb 0deg)`,
                      }}
                    />
                    <div className="absolute inset-[18%] rounded-full bg-white/95 flex flex-col items-center justify-center">
                      <span className="text-xs text-slate-500">
                        Progress
                      </span>
                      <span className="text-3xl sm:text-4xl font-black font-poppins text-emerald-600">
                        {overallProgress}%
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {totalTasks === 0
                          ? "Belum ada task"
                          : `${doneCount} dari ${totalTasks} task selesai`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            
            <div className="bg-white/95 rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.07)] border border-gray-100/80 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4 gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-quinary">
                    Distribusi Task per Divisi
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 max-w-md">
                    Menampilkan jumlah task yang dimiliki tiap divisi. Membantu
                    melihat sebaran beban kerja antar divisi dalam project.
                  </p>
                </div>
              </div>

              {divisionStats.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">
                  Belum ada task yang memiliki assignee dengan divisi.
                </p>
              ) : (
                <div className="space-y-3">
                  {divisionStats.map((stat) => {
                    const widthPercent =
                      maxDivisionTotal > 0
                        ? (stat.total / maxDivisionTotal) * 100
                        : 0;
                    return (
                      <div
                        key={stat.id}
                        className="flex items-center gap-3 text-[11px] sm:text-xs"
                      >
                        <div className="w-32 sm:w-40 text-slate-700 font-medium truncate">
                          {stat.name}
                        </div>
                        <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-3 rounded-full bg-primary transition-all"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                        <div className="w-8 text-right font-semibold text-slate-700">
                          {stat.total}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

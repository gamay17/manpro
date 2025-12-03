// src/pages/dashboard/DashboardPage.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
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
import type { Member, CreateMemberInput, MemberRole } from "../../types/member";

import { nowLocalDatetime } from "../../utils/datetime";
import { canManageProject } from "../../utils/permissions";
import { useAuth } from "../../hooks/useAuth";

const DIVISION_STORAGE_KEY = "divisions";
const PROJECT_STORAGE_KEY = "projects";
const MEMBER_STORAGE_KEY = "members";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"division" | "statistic">(
    "division"
  );

  const { id: projectIdParam } = useParams<{ id: string }>();
  const projectId = projectIdParam ? Number(projectIdParam) : 0;

  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [users, setUsers] = useState<IRegisterResponse[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // state untuk EditDivisionModal
  const [editOpen, setEditOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(
    null
  );

  /** ===== Load users (auth:users) untuk lookup ===== */
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

  /** ===== Load project dari localStorage ===== */
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

  /** ===== Helpers Division ===== */
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

  /** ===== Load divisions khusus project ini ===== */
  useEffect(() => {
    if (!projectId) {
      setDivisions([]);
      return;
    }
    const all = loadAllDivisions();
    const forThisProject = all.filter((d) => d.projectId === projectId);
    setDivisions(forThisProject);
  }, [projectId, loadAllDivisions]);

  /** ===== Helpers Member ===== */
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

  /** ===== Permission: PM/Owner boleh manage ===== */
  const canEdit = !!(user && project && canManageProject(user.id, project));
  const canManageMembers = canEdit; // sama rule dengan division

  /**
   * ===== Auto ensure Owner, Manager, Leader jadi member (sinkron) =====
   *
   * - Owner & Manager: selalu ada di members (divisionId = 0, role owner/manager)
   * - Leader: HARUS sama dengan coordinatorId tiap division.
   *   - Kalau ada Member.role === "leader" tapi bukan coordinator → diturunkan jadi "member"
   *   - Kalau ada division.coordinatorId tapi belum ada Member → dibuat / dinaikkan jadi "leader"
   *   - Kalau user awalnya member di divisi lain dan jadi leader di divisi baru,
   *     row member lamanya DIPINDAHKAN (update divisionId + role), bukan diduplikasi.
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

      // helper untuk owner / manager
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

      // Owner & Manager (divisionId = 0)
      addIfNotExists(projectObj.ownerId, "owner", 0);
      addIfNotExists(projectObj.managerId, "manager", 0);

      // ===== Sinkron leader <-> coordinator =====

      // 1) Turunkan semua leader yang sudah tidak sesuai coordinator lagi → jadi "member"
      next = next.map((m) => {
        if (m.projectId !== pid || m.role !== "leader") return m;

        const div = projectDivisions.find((d) => d.id === m.divisionId);
        // kalau division sudah tidak ada, atau coordinatorId beda, turunkan jadi member
        if (!div || div.coordinatorId !== m.userId) {
          return { ...m, role: "member", updatedAt: now };
        }
        return m;
      });

      // 2) Untuk setiap division yang punya coordinatorId,
      //    pastikan ada Member dengan role "leader" yang cocok.
      //    Kalau user sudah punya row "member" di divisi lain → DIPINDAHKAN, bukan di-duplikat.
      projectDivisions.forEach((d) => {
        if (!d.coordinatorId) return;

        const coordId = d.coordinatorId;

        // Rule: Owner & Manager tidak boleh jadi leader division
        if (
          coordId === projectObj.ownerId ||
          coordId === projectObj.managerId
        ) {
          return;
        }

        // Ambil semua row member untuk user ini di project ini
        const userRows = next
          .map((m, idx) => ({ m, idx }))
          .filter(({ m }) => m.projectId === pid && m.userId === coordId);

        if (userRows.length === 0) {
          // belum ada member sama sekali → buat baru sebagai leader
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

        // Sudah ada row untuk user ini.
        // Cari kalau ada yang sudah di division yang sama.
        const existingInDiv = userRows.find(({ m }) => m.divisionId === d.id);
        const baseIndex = existingInDiv?.idx ?? userRows[0].idx;

        // Update base row → jadi leader di division ini
        next[baseIndex] = {
          ...next[baseIndex],
          divisionId: d.id,
          role: "leader",
          updatedAt: now,
        };

        // Hapus row lain untuk user ini di project ini,
        // KECUALI row dengan divisionId = 0 (owner/manager project-level)
        next = next.filter((m, idx) => {
          if (m.projectId !== pid) return true;
          if (m.userId !== coordId) return true;
          if (idx === baseIndex) return true;
          if (m.divisionId === 0) return true; // keep owner/manager
          return false; // buang duplikat member/leader lain
        });
      });

      return next;
    },
    [calcNextMemberId]
  );

  /** ===== Load & normalisasi members untuk project ini ===== */
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

  /** ===== Helpers Division ID ===== */
  const calcNextDivisionId = useMemo(
    () => (list: Division[]) =>
      (list.reduce((max, d) => Math.max(max, d.id), 0) || 0) + 1,
    []
  );

  /** ===== Permission ubah status division ===== */
  const canChangeDivisionStatus = (divisionId: number): boolean => {
    if (!user) return false;
    if (canEdit) return true; // PM/Owner bebas

    const target = divisions.find((d) => d.id === divisionId);
    if (!target) return false;

    return target.coordinatorId === user.id;
  };

  /** ===== Handlers Division ===== */
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

      // sinkron owner/manager/leader setelah ada division baru
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

    // Catatan: member di division ini dihapus via cascade di DivisionMemberPage
  };

  const handleEditDivision = (division: Division) => {
    if (!canEdit) return;
    setSelectedDivision(division);
    setEditOpen(true);
  };

  // 🔥 terima id dari EditDivisionModal
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

      // sinkron leader <-> coordinator setelah update
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

  /** ===== Handlers Member ===== */
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
              // kalau mau boleh ubah role, tambahkan: role: input.role,
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

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-10 space-y-6">
      {/* HEADER: title + subtitle kiri, tab button di kanan */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-poppins text-quinary">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-quinary/75 mt-1">
              Kelola dan pantau struktur divisi serta member pada project ini.
            </p>
          </div>

          {/* Tab Button dipindah ke kanan */}
          <div className="inline-flex rounded-xl bg-white/80 border border-amber-100 p-1 shadow-sm self-start sm:self-auto">
            <Button
              text="Division & Member"
              onClick={() => setActiveTab("division")}
              className={
                activeTab === "division"
                  ? "rounded-xl bg-primary text-secondary border border-transparent shadow-sm px-4 py-1.5 text-[11px] sm:text-sm font-semibold"
                  : "rounded-xl bg-transparent text-quinary border border-transparent px-4 py-1.5 text-[11px] sm:text-sm font-semibold hover:bg-amber-50"
              }
            />

            <Button
              text="Statistik"
              onClick={() => setActiveTab("statistic")}
              className={
                activeTab === "statistic"
                  ? "rounded-xl bg-primary text-secondary border border-transparent shadow-sm px-4 py-1.5 text-[11px] sm:text-sm font-semibold"
                  : "rounded-xl bg-transparent text-quinary border border-transparent px-4 py-1.5 text-[11px] sm:text-sm font-semibold hover:bg-amber-50"
              }
            />
          </div>
        </div>

        <div className="w-full h-[3px] rounded-full bg-gradient-to-r from-primary via-amber-400 to-amber-200" />
      </div>

      {/* Konten tab */}
      <div className="mt-2">
        {activeTab === "division" ? (
          <>
            <DivisionMemberPage
              divisions={divisions}
              users={users}
              divisionCount={divisionCount}
              memberCount={memberCount}
              // DIVISION
              canEdit={canEdit}
              currentUserId={user.id}
              onAddDivision={handleAddDivision}
              onChangeStatus={handleChangeStatus}
              onEdit={handleEditDivision}
              onDelete={handleDeleteDivision}
              // MEMBER
              members={members}
              canManageMembers={canManageMembers}
              onAddMember={handleAddMember}
              onDeleteMember={handleDeleteMember}
              onUpdateMember={handleUpdateMember}
            />

            <EditDivisionModal
              open={editOpen}
              division={selectedDivision}
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
          <div className="mt-4 bg-white/95 rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.07)] border border-gray-100/80 p-6 min-h-[360px] flex items-center justify-center">
            <p className="text-sm sm:text-base text-quinary font-poppins text-center">
              Statistik akan ditampilkan di sini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

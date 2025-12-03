// src/service/project.service.ts
import type {
  Project,
  ProjectStatus,
  CreateProjectInput,
} from "../types/project";
import type { Division } from "../types/division";
import type { Member } from "../types/member";
import type { Task } from "../types/task";
import { nowLocalDatetime, toDateOnly } from "../utils/datetime";

/** ====== Key global di localStorage ====== */
const STORAGE_KEY = "projects";
const MEMBER_STORAGE_KEY = "members";
const DIVISION_STORAGE_KEY = "divisions";
const TASK_STORAGE_KEY = "tasks";

/** ====== Helpers ====== */
type UnknownRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null;

const asString = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;

const asNumber = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const asStatus = (v: unknown): ProjectStatus | undefined =>
  v === "completed" || v === "in-progress" ? v : undefined;

function sleep(ms = 150) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** ====== Normalizer ====== */
function normalizeProject(input: unknown): Project | null {
  if (!isRecord(input)) return null;

  const id = asNumber(input.id);
  if (id === undefined) return null;

  const status = asStatus(input.status) ?? "in-progress";
  const name = asString(input.name) ?? "";
  const description = asString(input.description);
  const startDate = toDateOnly(asString(input.startDate));
  const endDate = toDateOnly(asString(input.endDate));

  const ownerId = asString(input.ownerId) ?? "";
  const managerId = asString(input.managerId);

  const createdAt = asString(input.createdAt);
  const updatedAt =
    asString((input as UnknownRecord)["updatedAt"]) ??
    asString((input as UnknownRecord)["updateAt"]);

  if (!ownerId) return null;

  return {
    id,
    name,
    status,
    description,
    startDate,
    endDate,
    ownerId,
    managerId,
    createdAt,
    updatedAt,
  };
}

/** ====== I/O Global ====== */
function readAll(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const out: Project[] = [];
    for (const item of parsed) {
      const p = normalizeProject(item);
      if (p) out.push(p);
    }
    return out;
  } catch {
    return [];
  }
}

function writeAll(list: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function nextId(list: Project[]): number {
  return (list.reduce((max, p) => Math.max(max, p.id), 0) || 0) + 1;
}

/** ====== Service ====== */
export function createProjectService(currentUserId: string) {
  if (!currentUserId) {
    throw new Error("createProjectService requires currentUserId");
  }

  function visibleAsOwnerOrManager(p: Project): boolean {
    return p.ownerId === currentUserId || p.managerId === currentUserId;
  }

  async function isCoordinatorOnProject(projectId: number): Promise<boolean> {
    try {
      const raw = localStorage.getItem(DIVISION_STORAGE_KEY);
      if (!raw) return false;

      const divisions: Division[] = JSON.parse(raw);
      return divisions.some(
        (d) => d.projectId === projectId && d.coordinatorId === currentUserId
      );
    } catch {
      return false;
    }
  }

  async function isMemberOnProject(projectId: number): Promise<boolean> {
    try {
      const raw = localStorage.getItem(MEMBER_STORAGE_KEY);
      if (!raw) return false;

      const members: Member[] = JSON.parse(raw);
      return members.some(
        (m) => m.projectId === projectId && m.userId === currentUserId
      );
    } catch {
      return false;
    }
  }

  return {
    /** Ambil semua project yang user bisa lihat */
    async getAll(): Promise<Project[]> {
      await sleep(120);
      const all = readAll();
      const visible: Project[] = [];

      for (const p of all) {
        if (visibleAsOwnerOrManager(p)) {
          visible.push(p);
          continue;
        }
        if (await isCoordinatorOnProject(p.id)) {
          visible.push(p);
          continue;
        }
        if (await isMemberOnProject(p.id)) {
          visible.push(p);
          continue;
        }
      }

      return [...visible].sort((a, b) => {
        const ta = a.createdAt ?? "";
        const tb = b.createdAt ?? "";
        if (ta !== tb) return tb.localeCompare(ta);
        return b.id - a.id;
      });
    },

    async getById(id: number): Promise<Project | undefined> {
      await sleep(80);
      const all = readAll();
      const p = all.find((proj) => proj.id === id);
      if (!p) return;

      if (visibleAsOwnerOrManager(p)) return p;
      if (await isCoordinatorOnProject(p.id)) return p;
      if (await isMemberOnProject(p.id)) return p;

      return undefined;
    },

    /** Tambah project */
    async create(input: CreateProjectInput): Promise<Project> {
      await sleep(120);
      const all = readAll();

      const project: Project = {
        id: nextId(all),
        name: input.name.trim(),
        status: "in-progress",
        description: input.description?.trim() || undefined,
        startDate: toDateOnly(input.startDate) || undefined,
        endDate: toDateOnly(input.endDate) || undefined,
        ownerId: currentUserId,
        managerId: input.managerId || currentUserId,
        createdAt: nowLocalDatetime(),
        updatedAt: nowLocalDatetime(),
      };

      if (!project.name) throw new Error("Project name is required");

      all.push(project);
      writeAll(all);
      return project;
    },

    /** Update project */
    async update(
      id: number,
      patch: Partial<Omit<Project, "id" | "ownerId">>
    ): Promise<Project> {
      await sleep(100);
      const all = readAll();
      const idx = all.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error("Project not found");

      const current = all[idx];

      if (!visibleAsOwnerOrManager(current)) {
        throw new Error("Forbidden");
      }

      const next: Project = {
        ...current,
        ...patch,
        name: (patch.name ?? current.name).trim(),
        startDate:
          toDateOnly(patch.startDate ?? current.startDate) || undefined,
        endDate: toDateOnly(patch.endDate ?? current.endDate) || undefined,
        updatedAt: nowLocalDatetime(),
      };

      all[idx] = next;
      writeAll(all);
      return next;
    },

    async setStatus(id: number, status: ProjectStatus): Promise<Project> {
      if (status !== "completed" && status !== "in-progress")
        throw new Error("Invalid status");
      return this.update(id, { status });
    },

    /** Hapus project + semua division, member, task terkait */
    async remove(id: number): Promise<void> {
      await sleep(100);
      const all = readAll();
      const target = all.find((p) => p.id === id);
      if (!target) return;

      if (target.ownerId !== currentUserId) {
        throw new Error("Only owner can delete this project");
      }

      // === 1. Hapus project ===
      const nextProjects = all.filter((p) => p.id !== id);
      writeAll(nextProjects);

      // === 2. Ambil divisions / members / tasks ===
      const divisions: Division[] = JSON.parse(
        localStorage.getItem(DIVISION_STORAGE_KEY) || "[]"
      );
      const members: Member[] = JSON.parse(
        localStorage.getItem(MEMBER_STORAGE_KEY) || "[]"
      );
      const tasks: Task[] = JSON.parse(
        localStorage.getItem(TASK_STORAGE_KEY) || "[]"
      );

      // === 3. Hapus divisions milik project ===
      const nextDivisions = divisions.filter((d) => d.projectId !== id);

      // === 4. Hapus members milik project ===
      const removedMemberIds = members
        .filter((m) => m.projectId === id)
        .map((m) => m.id);

      const nextMembers = members.filter((m) => m.projectId !== id);

      // === 5. Hapus tasks milik project & tasks assigned ke member yang dihapus ===
      const nextTasks = tasks.filter((t) => {
        if (t.projectId === id) return false;
        if (t.assigneeId && removedMemberIds.includes(t.assigneeId))
          return false;
        return true;
      });

      // === 6. Save ===
      localStorage.setItem(DIVISION_STORAGE_KEY, JSON.stringify(nextDivisions));
      localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(nextMembers));
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(nextTasks));
    },

    async clearAll(): Promise<void> {
      await sleep(50);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DIVISION_STORAGE_KEY);
      localStorage.removeItem(MEMBER_STORAGE_KEY);
      localStorage.removeItem(TASK_STORAGE_KEY);
    },
  };
}

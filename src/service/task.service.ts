

import type {
  Task,
  TaskStatus,
  CreateTaskInput
} from "../types/task";

import type { Member } from "../types/member";
import type { Division } from "../types/division";

import { nowLocalDatetime, toDateOnly } from "../utils/datetime";

/** =============================
 * GLOBAL STORAGE KEY
 ============================== */
const TASK_STORAGE_KEY = "tasks";


type UnknownRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null;

const asString = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;

const asNumber = (v: unknown): number | undefined => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const asStatus = (v: unknown): TaskStatus | undefined =>
  v === "todo" || v === "in-progress" || v === "review" || v === "done"
    ? v
    : undefined;


function normalizeTask(input: unknown): Task | null {
  if (!isRecord(input)) return null;

  const id = asNumber(input.id);
  if (id === undefined) return null;

  const projectId = asNumber(input.projectId);
  if (projectId === undefined) return null;

  const title = asString(input.title)?.trim() ?? "";
  if (!title) return null;

  const description = asString(input.description) || undefined;
  const assigneeId = asNumber(input.assigneeId);
  const status = asStatus(input.status) ?? "todo";

  const startDate = toDateOnly(asString(input.startDate));
  const dueDate = toDateOnly(asString(input.dueDate));

  const createdAt = asString(input.createdAt);
  const updatedAt = asString(input.updatedAt);

  return {
    id,
    projectId,
    title,
    description,
    assigneeId,
    status,
    startDate: startDate || undefined,
    dueDate: dueDate || undefined,
    createdAt,
    updatedAt,
  };
}


function migrateDatesIfNeeded(
  list: Task[],
  writeFn: (next: Task[]) => void
): Task[] {
  let changed = false;
  const cleaned = list.map((t) => {
    const sd = toDateOnly(t.startDate);
    const dd = toDateOnly(t.dueDate);
    if (sd !== (t.startDate ?? "") || dd !== (t.dueDate ?? "")) {
      changed = true;
      return {
        ...t,
        startDate: sd || undefined,
        dueDate: dd || undefined,
      };
    }
    return t;
  });
  if (changed) writeFn(cleaned);
  return cleaned;
}


function readAll(): Task[] {
  try {
    const raw = localStorage.getItem(TASK_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const out: Task[] = [];
    for (const item of parsed) {
      const t = normalizeTask(item);
      if (t) out.push(t);
    }

    return migrateDatesIfNeeded(out, writeAll);
  } catch {
    return [];
  }
}

function writeAll(list: Task[]): void {
  localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(list));
}

function nextId(list: Task[]): number {
  return (list.reduce((max, t) => Math.max(max, t.id), 0) || 0) + 1;
}

/** =============================
 * SERVICE
 ============================== */
export function createTaskService(
  projectId: number,
  getCurrentUserId: () => string | null,
  getMembers: () => Member[],
  getDivisions: () => Division[]
) {
  if (!projectId) throw new Error("createTaskService requires projectId");

  
  function currentMember(): Member | undefined {
    const uid = getCurrentUserId();
    if (!uid) return undefined;
    return getMembers().find(
      (m) => m.userId === uid && m.projectId === projectId
    );
  }

  function isOwnerOrPM(): boolean {
    const m = currentMember();
    return m?.role === "owner" || m?.role === "manager";
  }

  function isLeaderOfDivision(divisionId: number): boolean {
    const uid = getCurrentUserId();
    const div = getDivisions().find((d) => d.id === divisionId);
    return div?.coordinatorId === uid;
  }

  function canManageTask(assigneeId?: number): boolean {
    if (isOwnerOrPM()) return true;

    const members = getMembers();
    const m = members.find((m) => m.id === assigneeId);
    if (!m) return false;

    if (currentMember()?.role === "leader") {
      return isLeaderOfDivision(m.divisionId);
    }

    return false;
  }

  function canUpdateStatus(task: Task): boolean {
    if (isOwnerOrPM()) return true;

    const m = currentMember();
    return m?.id === task.assigneeId;
  }

  
  return {
    
    async getAll(): Promise<Task[]> {
      await new Promise((r) => setTimeout(r, 60));
      const all = readAll();
      return all
        .filter((t) => t.projectId === projectId)
        .sort((a, b) => b.id - a.id);
    },

    async getById(id: number): Promise<Task | undefined> {
      await new Promise((r) => setTimeout(r, 50));
      return readAll().find((t) => t.id === id && t.projectId === projectId);
    },

    async create(input: CreateTaskInput): Promise<Task> {
      await new Promise((r) => setTimeout(r, 90));

      const all = readAll();
      const now = nowLocalDatetime();

      const task: Task = {
        id: nextId(all),
        projectId,
        title: input.title.trim(),
        description: input.description?.trim() || undefined,
        assigneeId: input.assigneeId,
        status: input.status ?? "todo",
        startDate: toDateOnly(input.startDate) || undefined,
        dueDate: toDateOnly(input.dueDate) || undefined,
        createdAt: now,
        updatedAt: now,
      };

      if (!task.title) throw new Error("Task title is required");

      if (!canManageTask(task.assigneeId)) {
        throw new Error("Anda tidak punya izin membuat task ini");
      }

      all.push(task);
      writeAll(all);
      return task;
    },

    async update(
      id: number,
      patch: Partial<Omit<Task, "id" | "projectId">>
    ): Promise<Task> {
      await new Promise((r) => setTimeout(r, 90));

      const all = readAll();
      const idx = all.findIndex(
        (t) => t.id === id && t.projectId === projectId
      );
      if (idx === -1) throw new Error("Task not found");

      const current = all[idx];

      if (!canManageTask(current.assigneeId)) {
        throw new Error("Forbidden");
      }

      const next: Task = {
        ...current,
        ...patch,
        title: (patch.title ?? current.title).trim(),
        description: patch.description?.trim() || current.description,
        startDate:
          toDateOnly(patch.startDate ?? current.startDate) || undefined,
        dueDate:
          toDateOnly(patch.dueDate ?? current.dueDate) || undefined,
        updatedAt: nowLocalDatetime(),
      };

      all[idx] = next;
      writeAll(all);
      return next;
    },

    async setStatus(id: number, status: TaskStatus): Promise<Task> {
      await new Promise((r) => setTimeout(r, 70));

      const all = readAll();
      const idx = all.findIndex(
        (t) => t.id === id && t.projectId === projectId
      );
      if (idx === -1) throw new Error("Task not found");

      const current = all[idx];

      if (!canUpdateStatus(current)) {
        throw new Error("Forbidden");
      }

      const next: Task = {
        ...current,
        status,
        updatedAt: nowLocalDatetime(),
      };

      all[idx] = next;
      writeAll(all);
      return next;
    },

    async remove(id: number): Promise<void> {
      await new Promise((r) => setTimeout(r, 70));

      const all = readAll();
      const task = all.find(
        (t) => t.id === id && t.projectId === projectId
      );
      if (!task) return;

      if (!canManageTask(task.assigneeId)) {
        throw new Error("Forbidden");
      }

      const next = all.filter(
        (t) => !(t.id === id && t.projectId === projectId)
      );
      writeAll(next);
    },

    async clearAll(): Promise<void> {
      if (!isOwnerOrPM()) {
        throw new Error("Only owner/pm can clear all tasks");
      }

      await new Promise((r) => setTimeout(r, 50));

      const all = readAll();
      const next = all.filter((t) => t.projectId !== projectId);
      writeAll(next);
    },
  };
}

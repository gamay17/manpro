
import type {
  Division,
  DivisionStatus,
  CreateDivisionInput,
} from "../types/division";
import { nowLocalDatetime, toDateOnly } from "../utils/datetime";


const NS = "divisions";
const keyForProject = (projectId: number) => `${NS}:${projectId}`;


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

const asStatus = (v: unknown): DivisionStatus | undefined =>
  v === "todo" || v === "in-progress" || v === "review" || v === "done"
    ? v
    : undefined;

function sleep(ms = 150) {
  return new Promise<void>((r) => setTimeout(r, ms));
}


function normalizeDivision(input: unknown, projectId: number): Division | null {
  if (!isRecord(input)) return null;

  const id = asNumber(input.id);
  if (id === undefined) return null;

  const name = asString(input.name)?.trim() ?? "";
  if (!name) return null;

  const status = asStatus(input.status) ?? "todo";
  const mainTask = asString(input.mainTask)?.trim() || undefined;
  const coordinatorId = asString(input.coordinatorId) || undefined;
  const startDate = toDateOnly(asString(input.startDate));
  const dueDate = toDateOnly(asString(input.dueDate));
  const createdAt = asString(input.createdAt);
  const updatedAt = asString(input.updatedAt);

  const pId = asNumber(input.projectId) ?? projectId;

  const d: Division = {
    id,
    projectId: pId,
    name,
    mainTask,
    coordinatorId,
    status,
    startDate: startDate || undefined,
    dueDate: dueDate || undefined,
    createdAt,
    updatedAt,
  };

  return d;
}


function migrateDatesIfNeeded(
  list: Division[],
  writeFn: (next: Division[]) => void
): Division[] {
  let changed = false;
  const cleaned = list.map((d) => {
    const sd = toDateOnly(d.startDate);
    const dd = toDateOnly(d.dueDate);
    if (sd !== (d.startDate ?? "") || dd !== (d.dueDate ?? "")) {
      changed = true;
      return { ...d, startDate: sd || undefined, dueDate: dd || undefined };
    }
    return d;
  });
  if (changed) writeFn(cleaned);
  return cleaned;
}



export function createDivisionService(
  projectId: number,
  canManage: () => boolean,
  getCurrentUserId?: () => string | null
) {
  if (!projectId) {
    throw new Error("createDivisionService requires projectId");
  }

  const STORAGE_KEY = keyForProject(projectId);

  
  function assertCanManage() {
    if (!canManage()) {
      throw new Error(
        "Anda tidak memiliki izin untuk mengubah division pada project ini"
      );
    }
  }

  function write(list: Division[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function read(): Division[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : [];
      const out: Division[] = [];
      for (const item of list) {
        const d = normalizeDivision(item, projectId);
        if (d) out.push(d);
      }
      return migrateDatesIfNeeded(out, write);
    } catch {
      return [];
    }
  }

  function nextId(list: Division[]): number {
    return (list.reduce((max, d) => Math.max(max, d.id), 0) || 0) + 1;
  }

  
  function applyPatch(
    list: Division[],
    idx: number,
    patch: Partial<Omit<Division, "id" | "projectId">>
  ): Division {
    const current = list[idx];

    const next: Division = {
      ...current,
      ...patch,
      name: (patch.name ?? current.name).trim(),
      mainTask: patch.mainTask
        ? patch.mainTask.trim()
        : current.mainTask ?? undefined,
      coordinatorId:
        patch.coordinatorId !== undefined
          ? patch.coordinatorId || undefined
          : current.coordinatorId,
      status: patch.status
        ? asStatus(patch.status) ?? current.status
        : current.status,
      startDate: toDateOnly(patch.startDate ?? current.startDate) || undefined,
      dueDate: toDateOnly(patch.dueDate ?? current.dueDate) || undefined,
      updatedAt: nowLocalDatetime(),
    };

    list[idx] = next;
    write(list);
    return next;
  }

  return {
    
    async getAll(): Promise<Division[]> {
      await sleep(100);
      const list = read();
      return [...list].sort((a, b) => {
        const ta = a.createdAt ?? "";
        const tb = b.createdAt ?? "";
        if (ta !== tb) return ta.localeCompare(tb); // lama → baru
        return a.id - b.id;
      });
    },

    
    async getById(id: number): Promise<Division | undefined> {
      await sleep(60);
      return read().find((d) => d.id === id);
    },

    
    async create(input: CreateDivisionInput): Promise<Division> {
      assertCanManage();

      await sleep(120);
      const list = read();

      const now = nowLocalDatetime();
      const division: Division = {
        id: nextId(list),
        projectId,
        name: input.name.trim(),
        mainTask: input.mainTask?.trim() || undefined,
        coordinatorId: input.coordinatorId || undefined,
        status: input.status ?? "todo",
        startDate: toDateOnly(input.startDate) || undefined,
        dueDate: toDateOnly(input.dueDate) || undefined,
        createdAt: now,
        updatedAt: now,
      };

      if (!division.name) {
        throw new Error("Division name is required");
      }

      list.push(division);
      write(list);
      return division;
    },

    
    async update(
      id: number,
      patch: Partial<Omit<Division, "id" | "projectId">>
    ): Promise<Division> {
      assertCanManage();

      await sleep(100);
      const list = read();
      const idx = list.findIndex((d) => d.id === id);
      if (idx === -1) throw new Error("Division not found");

      return applyPatch(list, idx, patch);
    },

   
    async setStatus(id: number, status: DivisionStatus): Promise<Division> {
      if (!asStatus(status)) {
        throw new Error("Invalid division status");
      }

      await sleep(100);
      const list = read();
      const idx = list.findIndex((d) => d.id === id);
      if (idx === -1) throw new Error("Division not found");

      const division = list[idx];

      const currentUserId = getCurrentUserId?.() ?? null;
      const isCoordinator =
        currentUserId && division.coordinatorId === currentUserId;




      if (!isCoordinator && !canManage()) {
        throw new Error(
          "Anda tidak memiliki izin untuk mengubah status division ini"
        );
      }

      return applyPatch(list, idx, { status });
    },

    
    async remove(id: number): Promise<void> {
      assertCanManage();

      await sleep(80);
      const list = read().filter((d) => d.id !== id);
      write(list);
    },

    
    async clearAll(): Promise<void> {
      assertCanManage();

      await sleep(50);
      localStorage.removeItem(STORAGE_KEY);
    },
  };
}

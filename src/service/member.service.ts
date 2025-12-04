import type { Member, MemberRole, CreateMemberInput } from "../types/member";
import { nowLocalDatetime } from "../utils/datetime";

const STORAGE_KEY = "members";

export function createMemberService(
  projectId: number,
  getCurrentProjectRole: () => MemberRole | null // role user di project
) {
  if (!projectId) throw new Error("projectId is required");

  
  const readAll = (): Member[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Member[]) : [];
    } catch {
      return [];
    }
  };

  const writeAll = (list: Member[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const nextId = (all: Member[]) =>
    (all.reduce((m, c) => Math.max(m, c.id), 0) || 0) + 1;

  const readProjectMembers = () =>
    readAll().filter((m) => m.projectId === projectId);

  const canManage = (): boolean => {
    const role = getCurrentProjectRole();
    return role === "manager" || role === "owner";
  };

  

  return {
    async getAll(): Promise<Member[]> {
      return readProjectMembers();
    },

    async create(input: CreateMemberInput): Promise<Member> {
      if (!canManage())
        throw new Error("Anda tidak punya izin menambah member");

      const all = readAll();
      const now = nowLocalDatetime();

      const newMember: Member = {
        id: nextId(all),
        projectId,
        userId: input.userId,
        divisionId: input.divisionId,
        role: input.role,
        createdAt: now,
        updatedAt: now,
      };

      all.push(newMember);
      writeAll(all);

      return newMember;
    },

    async update(
      id: number,
      patch: Partial<Omit<Member, "id" | "projectId">>
    ): Promise<Member> {
      if (!canManage())
        throw new Error("Anda tidak punya izin mengedit member");

      const all = readAll();
      const idx = all.findIndex((m) => m.id === id);
      if (idx === -1) throw new Error("Member not found");

      const now = nowLocalDatetime();
      const updated: Member = {
        ...all[idx],
        ...patch,
        updatedAt: now,
      };

      all[idx] = updated;
      writeAll(all);

      return updated;
    },

    async remove(id: number): Promise<void> {
      if (!canManage())
        throw new Error("Anda tidak punya izin menghapus member");

      const all = readAll();
      const filtered = all.filter((m) => m.id !== id);
      writeAll(filtered);
    },

    
    async getUserRole(userId: string): Promise<MemberRole | null> {
      const members = readProjectMembers();
      const found = members.find((m) => m.userId === userId);
      return found ? found.role : null;
    },
  };
}

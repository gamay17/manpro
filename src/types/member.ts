export type MemberRole = "owner" | "manager" | "leader" | "member";

export interface Member {
  id: number;
  projectId: number;
  userId: string;      // referensi ke auth:users
  divisionId: number;  // referensi ke divisions
  role: MemberRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberInput {
  userId: string;
  divisionId: number;
  role: MemberRole;
}

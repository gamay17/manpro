// src/types/project.ts
export type ProjectStatus = "completed" | "in-progress";

export interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
  description?: string;
  startDate?: string;
  endDate?: string;

  // relasi user
  ownerId: string;      // yang membuat project
  managerId?: string;   // PM (user.id)

  createdAt?: string;
  updatedAt?: string;
}

// form dari UI: kita tidak isi id, ownerId, status, createdAt, updatedAt
export type CreateProjectInput = Omit<
  Project,
  "id" | "createdAt" | "updatedAt" | "status" | "ownerId"
>;

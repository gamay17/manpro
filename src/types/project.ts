export type ProjectStatus = "completed" | "in-progress";

export interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
  description?: string;
  startDate?: string;
  endDate?: string;
  ownerId: string;      
  managerId?: string;   

  createdAt?: string;
  updatedAt?: string;
}
export type CreateProjectInput = Omit<
  Project,
  "id" | "createdAt" | "updatedAt" | "status" | "ownerId"
>;

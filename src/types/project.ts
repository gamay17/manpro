export type ProjectStatus = "completed" | "in-progress" | "pending" | "cancelled";

export interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
}

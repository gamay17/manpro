export type ProjectStatus = "completed" | "in-progress";

export interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
}


import type { DivisionStatus } from "./division";
export type TaskStatus = DivisionStatus;

export interface Task {
  id: number;         
  projectId: number;   

  title: string;       
  description?: string; 

  assigneeId?: number; 

  status: TaskStatus;  
  startDate?: string;  
  dueDate?: string;    

  createdAt?: string;
  updatedAt?: string;
}
export type CreateTaskInput = Omit<
  Task,
  "id" | "projectId" | "createdAt" | "updatedAt"
>;

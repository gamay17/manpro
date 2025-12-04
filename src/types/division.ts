export type DivisionStatus = "todo" | "in-progress" | "review" | "done";

export interface Division {
  id: number;
  projectId: number;

  name: string;
  mainTask?: string;

  coordinatorId?: string;

  status: DivisionStatus;

  startDate?: string;
  dueDate?: string;

  createdAt?: string;
  updatedAt?: string;
}

export type CreateDivisionInput = Omit<
  Division,
  "id" | "projectId" | "createdAt" | "updatedAt"
>;

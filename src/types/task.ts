// src/types/task.ts

import type { DivisionStatus } from "./division";

// TaskStatus sama seperti DivisionStatus
// (todo | in-progress | review | done)
export type TaskStatus = DivisionStatus;

export interface Task {
  id: number;          // primary key task
  projectId: number;   // relasi ke project.id

  title: string;       // nama task
  description?: string; // opsional, detail tugas

  assigneeId?: number; // relasi ke Member.id

  status: TaskStatus;  // todo | in-progress | review | done

  // date-only string "YYYY-MM-DD"
  startDate?: string;  // kapan mulai
  dueDate?: string;    // kapan deadline

  createdAt?: string;
  updatedAt?: string;
}

// Input untuk form "Tambah Task"
// id, projectId, createdAt, updatedAt akan di-generate di service
export type CreateTaskInput = Omit<
  Task,
  "id" | "projectId" | "createdAt" | "updatedAt"
>;

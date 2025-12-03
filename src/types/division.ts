// src/types/division.ts

// Status divisi (kayak status task)
export type DivisionStatus = "todo" | "in-progress" | "review" | "done";

export interface Division {
  id: number;          // primary key divisi
  projectId: number;   // relasi ke project.id

  name: string;        // nama divisi (kolom "Divisi")
  mainTask?: string;   // tugas utama divisi (kolom "Main Task")

  // koordinator / ketua divisi, relasi ke user.id (auth)
  coordinatorId?: string;

  status: DivisionStatus; // todo | in-progress | done

  // date-only string "YYYY-MM-DD"
  startDate?: string;     // kolom "Start date"
  dueDate?: string;       // kolom "Due date"

  createdAt?: string;
  updatedAt?: string;
}

// Data yang dikirim dari form "Tambah Divisi"
// id, projectId, createdAt, updatedAt akan diisi di service
export type CreateDivisionInput = Omit<
  Division,
  "id" | "projectId" | "createdAt" | "updatedAt"
>;


import type { Project } from "../types/project";
import type { Division } from "../types/division";
import type { Task } from "../types/task";

function toDate(value?: string): Date | null {
  if (!value) return null;
  return new Date(value);
}

export function isRangeValid(startDate?: string, endDate?: string): boolean {
  if (!startDate || !endDate) return true; 
  return toDate(startDate)! <= toDate(endDate)!;
}

export function isChildWithinParent(
  parent: { startDate?: string; endDate?: string },
  child: { startDate?: string; dueDate?: string }
): boolean {
  const pStart = toDate(parent.startDate);
  const pEnd = toDate(parent.endDate);
  const cStart = toDate(child.startDate);
  const cEnd = toDate(child.dueDate);

  if (!pStart || !pEnd || !cStart || !cEnd) return true;

  return pStart <= cStart && cEnd <= pEnd;
}

export function getDurationInDays(startDate?: string, endDate?: string): number | null {
  if (!startDate || !endDate) return null;
  const start = toDate(startDate)!;
  const end = toDate(endDate)!;
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}


export function validateDivisionDates(
  project: Project,
  division: Division
): string[] {
  const errors: string[] = [];

  if (!isRangeValid(division.startDate, division.dueDate)) {
    errors.push("Tanggal mulai divisi harus lebih kecil atau sama dengan tanggal due.");
  }

  if (
    !isChildWithinParent(
      { startDate: project.startDate, endDate: project.endDate },
      { startDate: division.startDate, dueDate: division.dueDate }
    )
  ) {
    errors.push("Tanggal divisi harus berada di dalam rentang tanggal project.");
  }

  return errors;
}

export function validateTaskDatesAgainstProject(
  project: Project,
  task: Task
): string[] {
  const errors: string[] = [];

  if (!isRangeValid(task.startDate, task.dueDate)) {
    errors.push("Tanggal mulai task harus lebih kecil atau sama dengan tanggal due.");
  }

  if (
    !isChildWithinParent(
      { startDate: project.startDate, endDate: project.endDate },
      { startDate: task.startDate, dueDate: task.dueDate }
    )
  ) {
    errors.push("Tanggal task harus berada di dalam rentang tanggal project.");
  }

  return errors;
}

export function validateTaskDatesAgainstDivision(
  division: Division,
  task: Task
): string[] {
  const errors: string[] = [];

  if (!isRangeValid(task.startDate, task.dueDate)) {
    errors.push("Tanggal mulai task harus lebih kecil atau sama dengan tanggal due.");
  }

  if (
    !isChildWithinParent(
      { startDate: division.startDate, endDate: division.dueDate },
      { startDate: task.startDate, dueDate: task.dueDate }
    )
  ) {
    errors.push("Tanggal task harus berada di dalam rentang tanggal division.");
  }

  return errors;
}



export function findProjectDateConflicts(
  projectDraft: Project,        
  divisions: Division[],
  tasks: Task[]
) {

  const relatedDivisions = divisions.filter(
    (d) => d.projectId === projectDraft.id
  );
  const relatedTasks = tasks.filter(
    (t) => t.projectId === projectDraft.id
  );

  const divisionConflicts = relatedDivisions.filter((div) =>
    !isChildWithinParent(
      { startDate: projectDraft.startDate, endDate: projectDraft.endDate },
      { startDate: div.startDate, dueDate: div.dueDate }
    )
  );

  const taskConflicts = relatedTasks.filter((task) =>
    !isChildWithinParent(
      { startDate: projectDraft.startDate, endDate: projectDraft.endDate },
      { startDate: task.startDate, dueDate: task.dueDate }
    )
  );

  return { divisionConflicts, taskConflicts };
}

export function validateProjectDateChange(
  projectDraft: Project,
  divisions: Division[],
  tasks: Task[]
): string[] {
  const { divisionConflicts, taskConflicts } = findProjectDateConflicts(
    projectDraft,
    divisions,
    tasks
  );

  const errors: string[] = [];

  if (divisionConflicts.length > 0) {
    errors.push(
      `Ada ${divisionConflicts.length} divisi yang tanggalnya di luar rentang project baru.`
    );
  }

  if (taskConflicts.length > 0) {
    errors.push(
      `Ada ${taskConflicts.length} task yang tanggalnya di luar rentang project baru.`
    );
  }

  if (errors.length > 0) {
    errors.push("Silakan sesuaikan dulu tanggal divisi/task tersebut.");
  }

  return errors;
}

import type { Project } from "../types/project";

export function canManageProject(
  userId: string | undefined,
  project: Project | null | undefined
): boolean {
  if (!userId || !project) return false;

  const isOwner = userId === project.ownerId;
  const isManager = project.managerId != null && userId === project.managerId;

  return isOwner || isManager;
}

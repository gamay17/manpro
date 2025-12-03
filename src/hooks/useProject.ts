// src/hooks/useProjects.ts
import { useMemo, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { createProjectService } from "../service/project.service";
import type { Project, CreateProjectInput } from "../types/project";

export function useProjects() {
  const { user } = useAuth();
  const svc = useMemo(
    () => (user ? createProjectService(user.id) : null),
    [user]
  );

  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function refresh() {
    if (!svc) return;
    try {
      setLoading(true);
      setData(await svc.getAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (svc) refresh();  
  }, [refresh, svc]);

  return {
    data,
    loading,
    error,
    refresh,
    create: async (dto: CreateProjectInput) => {
      if (!svc) return;
      const p = await svc.create(dto);
      setData((d) => [p, ...d]);
    },
    update: async (id: number, patch: Partial<Omit<Project, "id">>) => {
      if (!svc) return;
      const p = await svc.update(id, patch);
      setData((d) => d.map((x) => (x.id === id ? p : x)));
    },
    setStatus: async (id: number, status: "completed" | "in-progress") => {
      if (!svc) return;
      const p = await svc.setStatus(id, status);
      setData((d) => d.map((x) => (x.id === id ? p : x)));
    },
    remove: async (id: number) => {
      if (!svc) return;
      await svc.remove(id);
      setData((d) => d.filter((x) => x.id !== id));
    },
    clearAll: async () => {
      if (!svc) return;
      await svc.clearAll();
      setData([]);
    },
  };
}

import { useCallback, useEffect, useState } from 'react';
import type { Division } from '../types/division';
import { DivisionsService } from '../service/division.service';

export interface UseDivisions {
  items: Division[];
  loading: boolean;
  error: string | null;
  refresh: () => void;

  create: (
    payload: Omit<Division, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<{ ok: true; data: Division } | { ok: false; errors: string[] }>;

  update: (
    id: string,
    patch: Partial<Omit<Division, 'id' | 'createdAt'>>
  ) => Promise<{ ok: true; data: Division } | { ok: false; errors: string[] }>;

  remove: (id: string) => Promise<void>;
}

export function useDivisions(projectId: string): UseDivisions {
  const [items, setItems] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      const list = DivisionsService.list(projectId);
      setItems(list);
    } catch {
      setError('Gagal memuat data divisi.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    load();
  }, [projectId, load]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  const create: UseDivisions['create'] = async (payload) => {
    const res = DivisionsService.create(projectId, payload);
    if (res.ok) load();
    return res;
  };

  const update: UseDivisions['update'] = async (id, patch) => {
    const res = DivisionsService.update(projectId, id, patch);
    if (res.ok) load();
    return res;
  };

  const remove: UseDivisions['remove'] = async (id) => {
    DivisionsService.remove(projectId, id);
    load();
  };

  return { items, loading, error, refresh, create, update, remove };
}

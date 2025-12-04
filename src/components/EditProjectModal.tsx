// src/components/EditProjectModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, cubicBezier } from "framer-motion";
import { FolderPen } from "lucide-react";
import type { CreateProjectInput, Project } from "../types/project";
import type { IRegisterResponse } from "../types/auth";
import type { Division } from "../types/division";
import type { Task } from "../types/task";
import { isRangeValid, validateProjectDateChange } from "../utils/timerules";

interface EditProjectModalProps {
  open: boolean;
  initial: CreateProjectInput;
  projectId: number;
  divisions: Division[];
  tasks: Task[];
  onClose: () => void;
  onSubmit: (data: CreateProjectInput) => void;
}

const easeOutQuint = cubicBezier(0.22, 1, 0.36, 1);

const EditProjectModal: React.FC<EditProjectModalProps> = ({
  open,
  initial,
  projectId,
  divisions,
  tasks,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<CreateProjectInput>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    managerId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const [users, setUsers] = useState<IRegisterResponse[]>([]);
  const [pmInput, setPmInput] = useState("");
  const [pmOpen, setPmOpen] = useState(false);
  const pmRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<string[]>([]);

  // Prefill saat modal dibuka
  useEffect(() => {
    if (!open) return;

    setForm({
      name: initial.name ?? "",
      description: initial.description ?? "",
      startDate: initial.startDate ?? "",
      endDate: initial.endDate ?? "",
      managerId: initial.managerId ?? "",
    });
    setErrors([]);
  }, [open, initial]);

  // Ambil list user dari localStorage (mock auth:users)
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem("auth:users");
      if (!raw) {
        setUsers([]);
        return;
      }
      const parsed = JSON.parse(raw) as Array<
        IRegisterResponse & { password?: string }
      >;
      const cleaned: IRegisterResponse[] = parsed.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
      setUsers(cleaned);
    } catch {
      setUsers([]);
    }
  }, [open]);

  // Map id → user
  const userMap = useMemo(() => {
    const m = new Map<string, IRegisterResponse>();
    for (const u of users) m.set(u.id, u);
    return m;
  }, [users]);

  // Set tampilan PM input berdasarkan managerId + users
  useEffect(() => {
    if (!open) return;

    if (!form.managerId) {
      setPmInput("");
      return;
    }
    const u = userMap.get(form.managerId);
    if (u) {
      setPmInput(`${u.name} (${u.email})`);
    } else {
      setPmInput(form.managerId);
    }
  }, [open, form.managerId, userMap]);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    if (!pmOpen) return;

    const handler = (e: MouseEvent) => {
      if (!pmRef.current) return;
      if (!pmRef.current.contains(e.target as Node)) {
        setPmOpen(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [pmOpen]);

  const setField =
    (key: keyof CreateProjectInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setErrors([]);
    };

  // Filter user berdasarkan teks input
  const filteredUsers = useMemo(() => {
    const q = pmInput.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, pmInput]);

  const selectPm = (u: IRegisterResponse) => {
    setForm((prev) => ({ ...prev, managerId: u.id }));
    setPmInput(`${u.name} (${u.email})`);
    setPmOpen(false);
    setErrors([]);
  };

  // Semua field wajib diisi (sama seperti AddProject)
  const allFilled =
    (form.name?.trim() || "") &&
    (form.description?.trim() || "") &&
    (form.startDate || "") &&
    (form.endDate || "") &&
    (form.managerId || "");

  // Validasi rentang tanggal pakai helper
  const validDateRange = isRangeValid(form.startDate, form.endDate);

  const canSubmit = !!allFilled && validDateRange;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    // Draft project untuk validasi konflik tanggal dengan division/task
    const projectDraft: Project = {
      id: projectId,
      name: form.name,
      description: form.description,
      startDate: form.startDate,
      endDate: form.endDate,
      managerId: form.managerId,
      // field lain yang tidak dipakai di timeRules, isi dummy saja
      ownerId: "",
      status: "in-progress",
      createdAt: undefined,
      updatedAt: undefined,
    };

    const conflictErrors = validateProjectDateChange(
      projectDraft,
      divisions,
      tasks
    );

    if (conflictErrors.length > 0) {
      setErrors(conflictErrors);
      return;
    }

    try {
      setSubmitting(true);
      await new Promise((r) => setTimeout(r, 150));
      onSubmit({
        name: form.name,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        managerId: form.managerId,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          {}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[1.5px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {}
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative z-50 mx-auto mt-16 w-[90%] max-w-xl rounded-2xl bg-white p-5 sm:p-6 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.35)]"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.4, ease: easeOutQuint },
            }}
            exit={{
              opacity: 0,
              y: -16,
              scale: 0.98,
              transition: { duration: 0.25, ease: easeOutQuint },
            }}
          >
            {}
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-400 text-black">
                <FolderPen size={20} />
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                Edit Project
              </h3>
            </div>
            <div className="mb-5 h-0.5 w-full bg-gradient-to-r from-amber-400 to-amber-300 rounded" />

            {}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Project Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={setField("name")}
                  placeholder="Project name"
                  className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Description <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={setField("description")}
                  placeholder="Project description"
                  className="w-full resize-none rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </div>

              {}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Start Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={setField("startDate")}
                    className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    End Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={setField("endDate")}
                    min={form.startDate || undefined}
                    className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                </div>
              </div>

              {}
              {(!validDateRange || errors.length > 0) && (
                <div className="text-xs text-rose-600 space-y-1">
                  {!validDateRange && (
                    <p>End Date must be the same or after Start Date.</p>
                  )}
                  {errors.length > 0 && (
                    <ul className="list-disc pl-4">
                      {errors.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {}
              <div ref={pmRef} className="relative">
                <label className="block text-sm font-semibold mb-1">
                  Project Manager <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={pmInput}
                  onChange={(e) => {
                    setPmInput(e.target.value);
                    setPmOpen(true);
                    setForm((prev) => ({ ...prev, managerId: "" }));
                    setErrors([]);
                  }}
                  onFocus={() => setPmOpen(true)}
                  placeholder="Search user by name or email"
                  className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
                {pmOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {users.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        No users found. Please register a user first.
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        No match for "{pmInput}"
                      </div>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectPm(u);
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 text-left"
                        >
                          <span>{u.name}</span>
                          <span className="text-xs text-gray-500">
                            {u.email}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-5 py-2 text-sm font-extrabold text-black shadow-sm ring-1 ring-amber-400 transition hover:-translate-y-[1px] hover:bg-amber-400 disabled:opacity-60"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditProjectModal;

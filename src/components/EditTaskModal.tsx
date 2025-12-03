// src/components/EditTaskModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, cubicBezier } from "framer-motion";
import { ListTodo, Trash2, ChevronDown } from "lucide-react";

import type { Task, TaskStatus, CreateTaskInput } from "../types/task";
import type { Member } from "../types/member";
import type { Division } from "../types/division";
import type { IRegisterResponse } from "../types/auth";

interface EditTaskModalProps {
  open: boolean;
  task: Task | null;

  members: Member[];
  divisions: Division[];
  users: IRegisterResponse[];

  onClose: () => void;
  onSubmit: (data: CreateTaskInput) => void;
  onDelete: (id: number) => void;
}

const easeOutQuint = cubicBezier(0.22, 1, 0.36, 1);

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "todo",        label: "Todo" },
  { value: "in-progress", label: "In Progress" },
  { value: "review",      label: "Review" },
  { value: "done",        label: "Done" },
];

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  open,
  task,
  members,
  divisions,
  users,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const [form, setForm] = useState<CreateTaskInput>({
    title: "",
    description: "",
    assigneeId: undefined,
    status: "todo",
    startDate: "",
    dueDate: "",
  });

  const [assigneeInput, setAssigneeInput] = useState("");
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const userMap = useMemo(() => {
    const map = new Map<string, IRegisterResponse>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const divisionMap = useMemo(() => {
    const map = new Map<number, Division>();
    divisions.forEach((d) => map.set(d.id, d));
    return map;
  }, [divisions]);

  const memberMap = useMemo(() => {
    const map = new Map<number, Member>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  // isi form dari task ketika modal dibuka
  useEffect(() => {
    if (open && task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        assigneeId: task.assigneeId,
        status: task.status,
        startDate: task.startDate || "",
        dueDate: task.dueDate || "",
      });

      const currentMember = task.assigneeId
        ? memberMap.get(task.assigneeId)
        : undefined;

      const currentUser = currentMember
        ? userMap.get(currentMember.userId)
        : undefined;

      setAssigneeInput(
        currentUser ? `${currentUser.name} (${currentUser.email})` : ""
      );

      setAssigneeOpen(false);
      setStatusOpen(false);
      setError("");

      setTimeout(() => titleRef.current?.focus(), 60);
    }
  }, [open, task, memberMap, userMap]);

  // tutup dropdown assignee jika klik di luar
  useEffect(() => {
    if (!assigneeOpen) return;
    const handler = (e: MouseEvent) => {
      if (!assigneeRef.current) return;
      if (!assigneeRef.current.contains(e.target as Node)) {
        setAssigneeOpen(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [assigneeOpen]);

  // tutup dropdown status jika klik di luar
  useEffect(() => {
    if (!statusOpen) return;
    const handler = (e: MouseEvent) => {
      if (!statusRef.current) return;
      if (!statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [statusOpen]);

  const setField =
    (key: keyof CreateTaskInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setError("");
    };

  // list calon assignee = semua member di project + user + division
  const filteredAssignees = useMemo(() => {
    const q = assigneeInput.trim().toLowerCase();

    return members
      .map((m) => {
        const user = userMap.get(m.userId);
        const division = divisionMap.get(m.divisionId);
        return { member: m, user, division };
      })
      .filter(({ user }) => !!user)
      .filter(({ user, division }) => {
        if (!q) return true;
        return (
          user!.name.toLowerCase().includes(q) ||
          user!.email.toLowerCase().includes(q) ||
          (division?.name || "").toLowerCase().includes(q)
        );
      });
  }, [members, userMap, divisionMap, assigneeInput]);

  const selectAssignee = (member: Member, label: string) => {
    setForm((prev) => ({ ...prev, assigneeId: member.id }));
    setAssigneeInput(label);
    setAssigneeOpen(false);
    setError("");
  };

  const trimmedTitle = form.title?.trim() || "";
  const trimmedDescription = form.description?.trim() || "";

  const allFilled =
    trimmedTitle &&
    (form.startDate || "") &&
    (form.dueDate || "") &&
    form.assigneeId;

  const validDateRange =
    form.startDate &&
    form.dueDate &&
    new Date(form.dueDate).getTime() >= new Date(form.startDate).getTime();

  const isDateError =
    !!form.startDate && !!form.dueDate && !validDateRange;

  const canSubmit = !!allFilled && !isDateError;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      if (!trimmedTitle) {
        setError("Task title is required.");
      } else if (!form.assigneeId) {
        setError("Assignee is required.");
      } else if (isDateError) {
        setError("Due date must be greater than or equal to start date.");
      } else {
        setError("All required fields must be filled.");
      }
      return;
    }

    try {
      setSubmitting(true);
      await new Promise((r) => setTimeout(r, 150));

      const payload: CreateTaskInput = {
        title: trimmedTitle,
        description: trimmedDescription || undefined,
        assigneeId: form.assigneeId,
        status: form.status,
        startDate: form.startDate,
        dueDate: form.dueDate,
      };

      onSubmit(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[1.5px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
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
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-400 text-black">
                <ListTodo size={18} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  Edit Task
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500">
                  Update task details, status, and assignee.
                </p>
              </div>
            </div>
            <div className="mb-3 h-0.5 w-full bg-gradient-to-r from-amber-400 to-amber-300 rounded" />

            {/* Info kecil */}
            <p className="text-[11px] text-gray-500 mb-3">
              Task must have a title, assignee, and valid date range.
            </p>

            {/* Form */}
            <form onSubmit={submit} className="space-y-3">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Task Title <span className="text-rose-600">*</span>
                </label>
                <input
                  ref={titleRef}
                  type="text"
                  value={form.title}
                  onChange={setField("title")}
                  placeholder="e.g. Prepare design system, QA sprint #5"
                  className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition bg-gray-100
                    ${
                      !trimmedTitle && error
                        ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                        : "border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    }`}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Description
                </label>
                <textarea
                  value={form.description || ""}
                  onChange={setField("description")}
                  placeholder="Short description of this task (optional)"
                  className="w-full resize-none rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  rows={3}
                />
              </div>

              {/* Status + Dates */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Status */}
                <div ref={statusRef}>
                  <label className="block text-sm font-semibold mb-1">
                    Status
                  </label>

                  {/* Custom Status Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusOpen((prev) => !prev);
                      }}
                      className={`
                        w-full flex items-center justify-between rounded-md px-3 py-2 text-sm 
                        border bg-gray-100 transition
                        ${
                          statusOpen
                            ? "border-amber-500 ring-2 ring-amber-200"
                            : "border-gray-300 hover:border-amber-400"
                        }
                      `}
                    >
                      <span>
                        {
                          statusOptions.find(
                            (s) => s.value === form.status
                          )?.label
                        }
                      </span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          statusOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {statusOpen && (
                      <div
                        className="
                          absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 
                          bg-white shadow-lg
                        "
                      >
                        {statusOptions.map((opt) => {
                          const active = opt.value === form.status;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onMouseDown={() => {
                                setForm((prev) => ({
                                  ...prev,
                                  status: opt.value,
                                }));
                                setStatusOpen(false);
                                setError("");
                              }}
                              className={`
                                w-full px-3 py-2 text-left text-sm flex items-center justify-between
                                ${
                                  active
                                    ? "bg-amber-50 text-amber-600 font-semibold"
                                    : "hover:bg-gray-100"
                                }
                              `}
                            >
                              {opt.label}
                              {active && (
                                <span className="h-2 w-2 rounded-full bg-amber-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Start Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate || ""}
                    onChange={setField("startDate")}
                    className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Due Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.dueDate || ""}
                    onChange={setField("dueDate")}
                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none bg-gray-100 transition
                      ${
                        isDateError
                          ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                          : "border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      }`}
                  />
                  {isDateError && (
                    <p className="mt-1 text-[11px] text-rose-600">
                      Due date must be greater than or equal to start date.
                    </p>
                  )}
                </div>
              </div>

              {/* Assignee autocomplete */}
              <div ref={assigneeRef} className="relative">
                <label className="block text-sm font-semibold mb-1">
                  Assignee <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={assigneeInput}
                  onChange={(e) => {
                    setAssigneeInput(e.target.value);
                    setAssigneeOpen(true);
                    setForm((prev) => ({ ...prev, assigneeId: undefined }));
                    setError("");
                  }}
                  onFocus={() => setAssigneeOpen(true)}
                  placeholder="Search member by name, email, or division"
                  className={`w-full rounded-md border bg-gray-100 px-3 py-2 text-sm outline-none transition
                    ${
                      !form.assigneeId && error
                        ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                        : "border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    }`}
                />

                {assigneeOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {members.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        No members found in this project.
                      </div>
                    ) : filteredAssignees.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        No member match for &quot;{assigneeInput}&quot;.
                      </div>
                    ) : (
                      filteredAssignees.map(({ member, user, division }) => {
                        const label = `${user!.name} (${user!.email})`;
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectAssignee(member, label);
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 text-left gap-3"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {user!.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {user!.email}
                              </span>
                            </div>
                            {division && (
                              <span className="text-[10px] px-2 py-[2px] rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                                {division.name}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-xs text-rose-600 font-medium mt-1">
                  {error}
                </p>
              )}

              {/* Footer */}
              <div className="mt-4 flex justify-between gap-2">
                {/* Delete */}
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  className="
                    inline-flex items-center gap-2 rounded border border-rose-200 
                    bg-rose-50 px-4 py-2 text-xs sm:text-sm font-semibold text-rose-600
                    shadow-sm hover:bg-rose-100 hover:-translate-y-[1px] active:translate-y-0 
                    active:scale-[0.99] transition
                  "
                >
                  <Trash2 size={14} />
                  <span>Delete Task</span>
                </button>

                <div className="flex gap-2">
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
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditTaskModal;

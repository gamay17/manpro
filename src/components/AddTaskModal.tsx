// src/components/AddTaskModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, cubicBezier } from "framer-motion";
import { ListTodo } from "lucide-react";

import type { CreateTaskInput, TaskStatus } from "../types/task";
import type { Member } from "../types/member";
import type { Division } from "../types/division";
import type { IRegisterResponse } from "../types/auth";
import { isRangeValid, isChildWithinParent } from "../utils/timerules";

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskInput) => void;

  
  members: Member[];
  
  divisions: Division[];
  
  users: IRegisterResponse[];
}

const easeOutQuint = cubicBezier(0.22, 1, 0.36, 1);

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  open,
  onClose,
  onSubmit,
  members,
  divisions,
  users,
}) => {
  const [form, setForm] = useState<CreateTaskInput>({
    title: "",
    description: "",
    assigneeId: undefined,
    status: "todo" as TaskStatus,
    startDate: "",
    dueDate: "",
  });

  const [assigneeInput, setAssigneeInput] = useState("");
  const [assigneeOpen, setAssigneeOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);

  // mapping helper
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

  // reset form ketika modal dibuka
  useEffect(() => {
    if (open) {
      setForm({
        title: "",
        description: "",
        assigneeId: undefined,
        status: "todo",
        startDate: "",
        dueDate: "",
      });
      setAssigneeInput("");
      setAssigneeOpen(false);
      setError("");
      setTimeout(() => titleRef.current?.focus(), 60);
    }
  }, [open]);

  // tutup dropdown assignee ketika klik di luar
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

  const setField =
    (key: keyof CreateTaskInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setError("");
    };

  // list calon assignee = members + info user + division
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
    const div = divisionMap.get(member.divisionId);

    setForm((prev) => {
      let next = { ...prev, assigneeId: member.id };

      // kalau task punya tanggal yang di luar division baru, reset tanggal
      if (
        div &&
        !isChildWithinParent(
          { startDate: div.startDate, endDate: div.dueDate },
          { startDate: next.startDate, dueDate: next.dueDate }
        )
      ) {
        next = { ...next, startDate: "", dueDate: "" };
      }

      return next;
    });

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

  // 🔎 cari division dari assignee (kalau ada)
  const assigneeMember = form.assigneeId
    ? members.find((m) => m.id === form.assigneeId)
    : undefined;
  const assigneeDivision = assigneeMember
    ? divisionMap.get(assigneeMember.divisionId)
    : undefined;

  // ✅ 1) cek range task sendiri: start <= due
  const validOwnRange = isRangeValid(form.startDate, form.dueDate);

  // ✅ 2) cek task di dalam range division assignee
  const withinDivision = assigneeDivision
    ? isChildWithinParent(
        { startDate: assigneeDivision.startDate, endDate: assigneeDivision.dueDate },
        { startDate: form.startDate, dueDate: form.dueDate }
      )
    : true;

  // gabungkan error tanggal
  let dateErrorMsg = "";
  if (form.startDate && form.dueDate) {
    if (!validOwnRange) {
      dateErrorMsg = "Due date must be greater than or equal to start date.";
    } else if (!withinDivision) {
      dateErrorMsg =
        "Task dates must be within the date range of the assignee's division.";
    }
  }
  const hasDateError = !!dateErrorMsg;

  const canSubmit = !!allFilled && !hasDateError;

  // 🎯 Batas tanggal untuk input, supaya "tidak bisa pilih di luar range"
  const divisionStart = assigneeDivision?.startDate || "";
  const divisionEnd = assigneeDivision?.dueDate || "";

  const startMin = divisionStart || undefined;
  const startMax =
    (form.dueDate || divisionEnd || "") || undefined;

  const dueMin =
    (form.startDate || divisionStart || "") || undefined;
  const dueMax = divisionEnd || undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      if (!trimmedTitle) {
        setError("Task title is required.");
      } else if (!form.assigneeId) {
        setError("Assignee is required.");
      } else if (hasDateError) {
        setError(dateErrorMsg);
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
        status: "todo", // paksa selalu todo untuk task baru
        startDate: form.startDate,
        dueDate: form.dueDate,
      };

      onSubmit(payload);

      setForm({
        title: "",
        description: "",
        assigneeId: undefined,
        status: "todo",
        startDate: "",
        dueDate: "",
      });
      setAssigneeInput("");
      setError("");
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
                <ListTodo size={18} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  Add New Task
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500">
                  New task will start with status <b>Todo</b>.
                </p>
              </div>
            </div>
            <div className="mb-3 h-0.5 w-full bg-gradient-to-r from-amber-400 to-amber-300 rounded" />

            {}
            <form onSubmit={submit} className="space-y-3">
              {}
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

              {}
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

              {}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {}
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Start Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate || ""}
                    onChange={setField("startDate")}
                    min={startMin}
                    max={startMax}
                    className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                </div>

                {}
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Due Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.dueDate || ""}
                    onChange={setField("dueDate")}
                    min={dueMin}
                    max={dueMax}
                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none bg-gray-100 transition
                      ${
                        hasDateError
                          ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                          : "border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      }`}
                  />
                  {hasDateError && (
                    <p className="mt-1 text-[11px] text-rose-600">
                      {dateErrorMsg}
                    </p>
                  )}
                </div>
              </div>

              {}
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

              {}
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
                  Confirm
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddTaskModal;

// src/components/AddDivisionModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, cubicBezier } from "framer-motion";
import { FolderPlus } from "lucide-react";
import type { CreateDivisionInput, Division } from "../types/division";
import type { Member } from "../types/member";
import type { IRegisterResponse } from "../types/auth";

interface AddDivisionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDivisionInput) => void;

  /** Daftar division yang sudah ada di project ini */
  existingDivisions: Division[];

  /** Semua member di project ini (untuk blok user yang sudah punya role spesial) */
  existingMembers: Member[];
}

const easeOutQuint = cubicBezier(0.22, 1, 0.36, 1);

// Tipe lokal: user yang mungkin punya role
type UserWithRole = IRegisterResponse & { role?: string };

const AddDivisionModal: React.FC<AddDivisionModalProps> = ({
  open,
  onClose,
  onSubmit,
  existingDivisions,
  existingMembers,
}) => {
  const [form, setForm] = useState<CreateDivisionInput>({
    name: "",
    mainTask: "",
    coordinatorId: "",
    status: "todo", // selalu default todo
    startDate: "",
    dueDate: "",
  });

  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [coordInput, setCoordInput] = useState("");
  const [coordOpen, setCoordOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const coordRef = useRef<HTMLDivElement>(null);

  // Nama division yang sudah terpakai
  const existingNames = useMemo(
    () =>
      new Set(
        existingDivisions
          .map((d) => d.name?.trim().toLowerCase())
          .filter(Boolean) as string[]
      ),
    [existingDivisions]
  );

  // User yang sudah jadi koordinator di division lain
  const usedCoordinatorIds = useMemo(
    () =>
      new Set(
        existingDivisions
          .map((d) => d.coordinatorId)
          .filter(Boolean) as string[]
      ),
    [existingDivisions]
  );

  // User yang punya role spesial di project (owner / manager / leader)
  const usedSpecialRoleUserIds = useMemo(
    () =>
      new Set(
        existingMembers
          .filter(
            (m) =>
              m.role &&
              m.role.toLowerCase() !== "member" // selain member
          )
          .map((m) => m.userId)
      ),
    [existingMembers]
  );

  // Ambil list user dari localStorage
  useEffect(() => {
    if (!open) return;

    try {
      const raw = localStorage.getItem("auth:users");
      if (!raw) {
        setUsers([]);
        return;
      }

      const parsed = JSON.parse(raw) as Array<
        UserWithRole & { password?: string }
      >;

      // Ambil field yang dipakai saja, tanpa password
      const cleaned: UserWithRole[] = parsed.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));

      setUsers(cleaned);
    } catch {
      setUsers([]);
    }
  }, [open]);

  // Reset form saat modal dibuka
  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        mainTask: "",
        coordinatorId: "",
        status: "todo",
        startDate: "",
        dueDate: "",
      });
      setCoordInput("");
      setCoordOpen(false);
      setError("");
      setTimeout(() => nameRef.current?.focus(), 60);
    }
  }, [open]);

  // Tutup dropdown koordinator kalau klik di luar
  useEffect(() => {
    if (!coordOpen) return;

    const handler = (e: MouseEvent) => {
      if (!coordRef.current) return;
      if (!coordRef.current.contains(e.target as Node)) {
        setCoordOpen(false);
      }
    };

    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [coordOpen]);

  const setField =
    (key: keyof CreateDivisionInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setError("");
    };

  // Filter user yang boleh jadi koordinator (leader baru)
  const filteredUsers = useMemo(() => {
    const q = coordInput.trim().toLowerCase();
    const blockedRoles = ["owner", "manager"]; // member boleh jadi leader

    return users
      // role tertentu di auth tidak boleh jadi leader
      .filter((u) => {
        if (!u.role) return true;
        return !blockedRoles.includes(u.role.toLowerCase());
      })
      // tidak boleh koordinator di 2 division
      .filter((u) => !usedCoordinatorIds.has(u.id))
      // tidak boleh punya role spesial lain di project (owner/manager/leader)
      .filter((u) => !usedSpecialRoleUserIds.has(u.id))
      // filter teks
      .filter((u) => {
        if (!q) return true;
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      });
  }, [users, coordInput, usedCoordinatorIds, usedSpecialRoleUserIds]);

  const selectCoordinator = (u: UserWithRole) => {
    setForm((prev) => ({ ...prev, coordinatorId: u.id }));
    setCoordInput(`${u.name} (${u.email})`);
    setCoordOpen(false);
    setError("");
  };

  const trimmedName = (form.name ?? "").trim();
  const trimmedMainTask = (form.mainTask ?? "").trim();

  const isDuplicateName =
    trimmedName && existingNames.has(trimmedName.toLowerCase());

  // ❗ Tidak boleh pilih user yang:
  //    - sudah jadi coordinator di division lain
  //    - atau punya role spesial lain di project (owner/manager/leader)
  const isCoordinatorAlreadyUsed =
    !!form.coordinatorId &&
    (usedCoordinatorIds.has(form.coordinatorId) ||
      usedSpecialRoleUserIds.has(form.coordinatorId));

  const allFilled =
    trimmedName &&
    trimmedMainTask &&
    (form.startDate || "") &&
    (form.dueDate || "") &&
    (form.coordinatorId || "");

  const validDateRange =
    form.startDate &&
    form.dueDate &&
    new Date(form.dueDate).getTime() >= new Date(form.startDate).getTime();

  const canSubmit =
    !!allFilled &&
    validDateRange &&
    !isDuplicateName &&
    !isCoordinatorAlreadyUsed;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      if (isDuplicateName) {
        setError("Division name already exists in this project.");
      } else if (isCoordinatorAlreadyUsed) {
        setError(
          "This user is already a leader/owner/manager in this project and cannot be a coordinator."
        );
      } else if (!validDateRange) {
        setError("Due date must be greater than or equal to start date.");
      } else {
        setError("All required fields must be filled.");
      }
      return;
    }

    try {
      setSubmitting(true);
      await new Promise((r) => setTimeout(r, 150));

      const payload: CreateDivisionInput = {
        name: trimmedName,
        mainTask: trimmedMainTask,
        coordinatorId: form.coordinatorId,
        status: "todo",
        startDate: form.startDate,
        dueDate: form.dueDate,
      };

      onSubmit(payload);

      setForm({
        name: "",
        mainTask: "",
        coordinatorId: "",
        status: "todo",
        startDate: "",
        dueDate: "",
      });
      setCoordInput("");
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
                <FolderPlus size={18} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  Add New Division
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500">
                  New division will start with status <b>Todo</b>.
                </p>
              </div>
            </div>
            <div className="mb-3 h-0.5 w-full bg-gradient-to-r from-amber-400 to-amber-300 rounded" />

            {/* Form */}
            <form onSubmit={submit} className="space-y-3">
              {/* Division Name */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Division Name <span className="text-rose-600">*</span>
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  value={form.name ?? ""}
                  onChange={setField("name")}
                  placeholder="e.g. Design, QA, Marketing"
                  className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition bg-gray-100
                    ${
                      isDuplicateName
                        ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                        : "border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    }`}
                />
                {isDuplicateName && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    Division name already exists in this project.
                  </p>
                )}
              </div>

              {/* Main Task */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Main Task <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={form.mainTask ?? ""}
                  onChange={setField("mainTask")}
                  placeholder="Main responsibility of this division"
                  className="w-full resize-none rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Start Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate ?? ""}
                    onChange={setField("startDate")}
                    className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Due Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.dueDate ?? ""}
                    onChange={setField("dueDate")}
                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none bg-gray-100 transition
                      ${
                        validDateRange
                          ? "border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                          : "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                      }`}
                  />
                  {!validDateRange && form.startDate && form.dueDate && (
                    <p className="mt-1 text-[11px] text-rose-600">
                      Due date must be greater than or equal to start date.
                    </p>
                  )}
                </div>
              </div>

              {/* Coordinator */}
              <div ref={coordRef} className="relative">
                <label className="block text-sm font-semibold mb-1">
                  Coordinator <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={coordInput}
                  onChange={(e) => {
                    setCoordInput(e.target.value);
                    setCoordOpen(true);
                    setForm((prev) => ({ ...prev, coordinatorId: "" }));
                    setError("");
                  }}
                  onFocus={() => setCoordOpen(true)}
                  placeholder="Search user by name or email"
                  className={`w-full rounded-md border bg-gray-100 px-3 py-2 text-sm outline-none transition
                    ${
                      isCoordinatorAlreadyUsed
                        ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                        : "border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    }`}
                />
                {coordOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {users.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        No users found. Please register a user first.
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        No available coordinator for "{coordInput}".
                      </div>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectCoordinator(u);
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
                {isCoordinatorAlreadyUsed && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    This user is already a leader/owner/manager in this project and cannot be a coordinator.
                  </p>
                )}
              </div>

              {error && (
                <p className="text-xs text-rose-600 font-medium mt-1">
                  {error}
                </p>
              )}

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

export default AddDivisionModal;

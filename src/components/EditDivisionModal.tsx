// src/components/EditDivisionModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, cubicBezier } from "framer-motion";
import { FolderPlus, Trash2, ChevronDown } from "lucide-react";
import type {
  CreateDivisionInput,
  Division,
  DivisionStatus,
} from "../types/division";
import type { IRegisterResponse } from "../types/auth";
import type { Member } from "../types/member";

interface EditDivisionModalProps {
  open: boolean;
  division: Division | null; // data divisi yang diedit
  users: IRegisterResponse[];
  existingDivisions: Division[];
  existingMembers: Member[];
  onClose: () => void;

  // kirim juga division.id ke parent
  onSubmit: (id: number, data: CreateDivisionInput) => void;

  onDelete: (id: number) => void;
}

const easeOutQuint = cubicBezier(0.22, 1, 0.36, 1);

const statusOptions: { value: DivisionStatus; label: string }[] = [
  { value: "todo",        label: "Todo" },
  { value: "in-progress", label: "In Progress" },
  { value: "review",      label: "Review" },
  { value: "done",        label: "Done" },
];

// sama seperti di AddDivisionModal
type UserWithRole = IRegisterResponse & { role?: string };

const EditDivisionModal: React.FC<EditDivisionModalProps> = ({
  open,
  division,
  users,
  existingDivisions,
  existingMembers,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const [form, setForm] = useState<CreateDivisionInput>({
    name: "",
    mainTask: "",
    coordinatorId: "",
    status: "todo",
    startDate: "",
    dueDate: "",
  });

  const [coordInput, setCoordInput] = useState("");
  const [coordOpen, setCoordOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const coordRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const userMap = useMemo(() => {
    const map = new Map<string, IRegisterResponse>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  // nama divisi lain (selain divisi yang sedang diedit)
  const existingNames = useMemo(() => {
    if (!division) return new Set<string>();
    const currentId = division.id;
    const names = existingDivisions
      .filter((d) => d.id !== currentId)
      .map((d) => d.name?.trim().toLowerCase())
      .filter(Boolean) as string[];
    return new Set(names);
  }, [existingDivisions, division]);

  // koordinator yang sudah dipakai divisi lain (selain divisi ini)
  const usedCoordinatorIds = useMemo(() => {
    if (!division) return new Set<string>();
    const currentId = division.id;
    const ids = existingDivisions
      .filter((d) => d.id !== currentId)
      .map((d) => d.coordinatorId)
      .filter(Boolean) as string[];
    return new Set(ids);
  }, [existingDivisions, division]);

  // user dengan role spesial di project (owner / manager / leader)
  const usedSpecialRoleUserIds = useMemo(
    () =>
      new Set(
        existingMembers
          .filter(
            (m) =>
              m.role &&
              m.role.toLowerCase() !== "member" // selain member → owner / manager / leader
          )
          .map((m) => m.userId)
      ),
    [existingMembers]
  );

  // isi form dari division ketika modal dibuka
  useEffect(() => {
    if (open && division) {
      setForm({
        name: division.name || "",
        mainTask: division.mainTask || "",
        coordinatorId: division.coordinatorId || "",
        status: division.status,
        startDate: division.startDate || "",
        dueDate: division.dueDate || "",
      });

      const coordUser = division.coordinatorId
        ? userMap.get(division.coordinatorId)
        : undefined;

      setCoordInput(
        coordUser ? `${coordUser.name} (${coordUser.email})` : ""
      );
      setCoordOpen(false);
      setStatusOpen(false);
      setError("");

      setTimeout(() => nameRef.current?.focus(), 60);
    }
  }, [open, division, userMap]);

  // tutup dropdown koordinator jika klik di luar
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
    (key: keyof CreateDivisionInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setError("");
    };

  // ✅ Filter user koordinator:
  //    - owner & manager TIDAK boleh dipilih
  //    - user yang sudah jadi coordinator di division lain TIDAK boleh dipilih
  //    - user dengan role spesial lain (owner/manager/leader) boleh muncul
  //      di project, tapi kalau dia leader division lain, dia sudah kena blok via usedCoordinatorIds.
  const filteredUsers = useMemo(() => {
    const q = coordInput.trim().toLowerCase();
    const blockedRoles = ["owner", "manager"]; // member boleh jadi leader

    return users
      .filter((u) => {
        const ur = u as UserWithRole;
        const role = ur.role?.toLowerCase();
        const isCurrentCoordinator =
          !!division?.coordinatorId && u.id === division.coordinatorId;

        // owner / manager tidak boleh jadi leader,
        // kecuali kalau dia koordinator yang sedang terpilih di divisi ini
        if (role && blockedRoles.includes(role)) {
          return isCurrentCoordinator;
        }

        // tidak boleh jadi koordinator di dua division berbeda
        if (!isCurrentCoordinator && usedCoordinatorIds.has(u.id)) {
          return false;
        }

        // kalau punya role spesial (owner/manager/leader) di project lain,
        // kita tetap izinkan asal bukan leader division lain (itu sudah ketangkap di usedCoordinatorIds)
        return true;
      })
      .filter((u) => {
        if (!q) return true;
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      });
  }, [users, coordInput, usedCoordinatorIds, division]);

  const selectCoordinator = (u: IRegisterResponse) => {
    setForm((prev) => ({ ...prev, coordinatorId: u.id }));
    setCoordInput(`${u.name} (${u.email})`);
    setCoordOpen(false);
    setError("");
  };

  const trimmedName = form.name?.trim() || "";
  const trimmedMainTask = form.mainTask?.trim() || "";

  const isDuplicateName =
    trimmedName && existingNames.has(trimmedName.toLowerCase());

  // ❗ Tidak boleh:
  //    - pakai user yang sudah jadi coordinator di division lain
  //    - atau user yang punya role spesial (owner/manager/leader) DI DIVISION LAIN
  const isCoordinatorAlreadyUsed =
    !!form.coordinatorId &&
    form.coordinatorId !== division?.coordinatorId &&
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

  const isDateError =
    !!form.startDate && !!form.dueDate && !validDateRange;

  const canSubmit =
    !!allFilled &&
    !isDuplicateName &&
    !isCoordinatorAlreadyUsed &&
    !isDateError;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !division) {
      if (isDuplicateName) {
        setError("Division name already exists in this project.");
      } else if (isCoordinatorAlreadyUsed) {
        setError(
          "This user is already a leader/owner/manager in this project and cannot be a coordinator here."
        );
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

      const payload: CreateDivisionInput = {
        name: trimmedName,
        mainTask: trimmedMainTask,
        coordinatorId: form.coordinatorId,
        status: form.status,
        startDate: form.startDate,
        dueDate: form.dueDate,
      };

      onSubmit(division.id, payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!division) return null;

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
                  Edit Division
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500">
                  Update division information, status, and coordinator.
                </p>
              </div>
            </div>
            <div className="mb-3 h-0.5 w-full bg-gradient-to-r from-amber-400 to-amber-300 rounded" />

            {/* Info kecil */}
            <p className="text-[11px] text-gray-500 mb-3">
              Division name must be unique, each user can only lead one division, and owner/manager cannot be a division leader.
            </p>

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
                  value={form.name}
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
                  value={form.mainTask || ""}
                  onChange={setField("mainTask")}
                  placeholder="Main responsibility of this division"
                  className="w-full resize-none rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </div>

              {/* Status + Dates */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Status */}
                <div ref={statusRef}>
                  <label className="block text-sm font-semibold mb-1">
                    Status
                  </label>

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

              {/* Coordinator - autocomplete */}
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
                    This user is already a leader/owner/manager in this project and cannot be a coordinator here.
                  </p>
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
                  onClick={() => onDelete(division.id)}
                  className="
                    inline-flex items-center gap-2 rounded border border-rose-200 
                    bg-rose-50 px-4 py-2 text-xs sm:text-sm font-semibold text-rose-600
                    shadow-sm hover:bg-rose-100 hover:-translate-y-[1px] active:translate-y-0 
                    active:scale-[0.99] transition
                  "
                >
                  <Trash2 size={14} />
                  <span>Delete Division</span>
                </button>

                <div className="flex gap-2 ml-auto">
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

export default EditDivisionModal;

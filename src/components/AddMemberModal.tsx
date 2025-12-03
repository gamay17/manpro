// src/components/AddMemberModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, cubicBezier } from "framer-motion";
import { UserPlus, ChevronDown } from "lucide-react";

import type { CreateMemberInput } from "../types/member";
import type { IRegisterResponse } from "../types/auth";
import type { Division } from "../types/division";
import type { Member } from "../types/member";

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMemberInput) => void;

  users: IRegisterResponse[];
  divisions: Division[];
  existingMembers: Member[];
}

const easeOutQuint = cubicBezier(0.22, 1, 0.36, 1);

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  open,
  onClose,
  onSubmit,
  users,
  divisions,
  existingMembers,
}) => {
  const [form, setForm] = useState<CreateMemberInput>({
    userId: "",
    divisionId: 0,
    role: "member",
  });

  const [userInput, setUserInput] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [divisionOpen, setDivisionOpen] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userRef = useRef<HTMLDivElement>(null);
  const divisionRef = useRef<HTMLDivElement>(null);

  /** RESET modal saat dibuka */
  useEffect(() => {
    if (open) {
      setForm({
        userId: "",
        divisionId: 0,
        role: "member",
      });
      setUserInput("");
      setDropdownOpen(false);
      setDivisionOpen(false);
      setError("");
    }
  }, [open]);

  /** Tutup dropdown user saat klik di luar */
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (!userRef.current) return;
      if (!userRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [dropdownOpen]);

  /** Tutup dropdown division saat klik di luar */
  useEffect(() => {
    if (!divisionOpen) return;
    const handler = (e: MouseEvent) => {
      if (!divisionRef.current) return;
      if (!divisionRef.current.contains(e.target as Node)) {
        setDivisionOpen(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [divisionOpen]);

  /** Filter user */
  const filteredUsers = useMemo(() => {
    const q = userInput.trim().toLowerCase();

    return users.filter((u) => {
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, userInput]);

  /** Cek duplicate user */
  const isDuplicate =
    !!form.userId &&
    existingMembers.some((m) => m.userId === form.userId);

  const canSubmit =
    !!form.userId &&
    form.divisionId > 0 &&
    !isDuplicate;

  /** Pilih user */
  const selectUser = (u: IRegisterResponse) => {
    setForm((prev) => ({ ...prev, userId: u.id }));
    setUserInput(`${u.name} (${u.email})`);
    setDropdownOpen(false);
    setError("");
  };

  /** Submit form */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      if (isDuplicate) {
        setError("This user is already a member of this project.");
      } else {
        setError("All fields are required.");
      }
      return;
    }

    try {
      setSubmitting(true);
      await new Promise((r) => setTimeout(r, 150));

      onSubmit({
        userId: form.userId,
        divisionId: form.divisionId,
        role: "member",
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
                <UserPlus size={18} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  Add New Member
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500">
                  Add a user to this project as a <b>Member</b>.
                </p>
              </div>
            </div>
            <div className="mb-3 h-0.5 w-full bg-gradient-to-r from-amber-400 to-amber-300 rounded" />

            {/* Form */}
            <form onSubmit={submit} className="space-y-3">
              {/* User Input */}
              <div ref={userRef} className="relative">
                <label className="block text-sm font-semibold mb-1">
                  User <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    setDropdownOpen(true);
                    setForm((prev) => ({ ...prev, userId: "" }));
                    setError("");
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Search name/email"
                  className={`w-full rounded-md border bg-gray-100 px-3 py-2 text-sm outline-none transition
                    ${
                      isDuplicate
                        ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                        : "border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    }`}
                />

                {dropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {filteredUsers.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        No users found.
                      </div>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectUser(u);
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

                {isDuplicate && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    This user is already a member of this project.
                  </p>
                )}
              </div>

              {/* Division — Custom Dropdown */}
              <div ref={divisionRef} className="relative">
                <label className="block text-sm font-semibold mb-1">
                  Division <span className="text-rose-600">*</span>
                </label>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDivisionOpen((prev) => !prev);
                  }}
                  className={`
                    w-full flex items-center justify-between rounded-md px-3 py-2 text-sm 
                    border bg-gray-100 transition
                    ${
                      divisionOpen
                        ? "border-amber-500 ring-2 ring-amber-200"
                        : "border-gray-300 hover:border-amber-400"
                    }
                  `}
                >
                  <span
                    className={
                      form.divisionId === 0 ? "text-gray-400" : "text-gray-800"
                    }
                  >
                    {form.divisionId === 0
                      ? "Select Division"
                      : divisions.find((d) => d.id === form.divisionId)?.name}
                  </span>

                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      divisionOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {divisionOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {divisions.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        No divisions found.
                      </div>
                    ) : (
                      divisions.map((d) => {
                        const active = d.id === form.divisionId;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onMouseDown={() => {
                              setForm((prev) => ({
                                ...prev,
                                divisionId: d.id,
                              }));
                              setDivisionOpen(false);
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
                            {d.name}
                            {active && (
                              <span className="h-2 w-2 rounded-full bg-amber-400" />
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

              {/* Buttons */}
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
                  disabled={!canSubmit || submitting}
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

export default AddMemberModal;

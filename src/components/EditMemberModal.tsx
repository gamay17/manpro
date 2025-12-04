import React, { useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion, cubicBezier } from "framer-motion";
import { UserCog, Trash2, ChevronDown } from "lucide-react";

import type { CreateMemberInput, Member, MemberRole } from "../types/member";
import type { IRegisterResponse } from "../types/auth";
import type { Division } from "../types/division";

interface EditMemberModalProps {
  open: boolean;
  member: Member | null;
  users: IRegisterResponse[];
  divisions: Division[];

  onClose: () => void;
  onSubmit: (data: CreateMemberInput) => void;
  onDelete: (id: number) => void;
}

const easeOutQuint = cubicBezier(0.22, 1, 0.36, 1);


type NormalizedRole = "owner" | "manager" | "leader" | "member";


const roleLabel: Record<NormalizedRole, string> = {
  owner: "Owner",
  manager: "Manager",
  leader: "Leader",
  member: "Member",
};


function normalizeRole(raw: string): NormalizedRole {
  const v = raw.trim().toLowerCase();

  if (v === "owner") return "owner";

  if (v === "manager" || v === "pm" || v === "project manager" || v === "project_manager") {
    return "manager";
  }

  if (
    v === "leader" ||
    v === "ketua" ||
    v === "ketua divisi" ||
    v === "ketua_divisi"
  ) {
    return "leader";
  }

  // apa pun selain itu dianggap member
  return "member";
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({
  open,
  member,
  users,
  divisions,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const [form, setForm] = useState<CreateMemberInput>({
    userId: "",
    divisionId: 0,
    role: "member",
  });
  const [submitting, setSubmitting] = useState(false);

  const [divisionOpen, setDivisionOpen] = useState(false);
  const divisionRef = useRef<HTMLDivElement>(null);

  const userMap = useMemo(() => {
    const m = new Map<string, IRegisterResponse>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  const currentUser = member ? userMap.get(member.userId) : undefined;

  // reset form saat modal dibuka / member berubah
  useEffect(() => {
    if (open && member) {
      setForm({
        userId: member.userId,
        divisionId: member.divisionId,
        role: member.role,
      });
      setDivisionOpen(false);
    }
  }, [open, member]);

  // tutup dropdown division kalau klik di luar (samakan behaviour)
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

  if (!member) return null;

  const canSubmit = form.divisionId > 0 && !!form.userId;

  const normalizedRole: NormalizedRole = normalizeRole(String(member.role));
  const canDelete = normalizedRole !== "owner" && normalizedRole !== "manager";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      await new Promise((r) => setTimeout(r, 150));

      // role tidak diubah di modal ini → pakai role dari data
      onSubmit({
        userId: form.userId,
        divisionId: form.divisionId,
        role: member.role as MemberRole,
      });

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!canDelete) return;
    onDelete(member.id);
  };

  const currentDivisionName =
    divisions.find((d) => d.id === form.divisionId)?.name || "Select Division";

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
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {}
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-black">
                  <UserCog size={18} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    Edit Member
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-500">
                    Update division for this member. Role is managed automatically.
                  </p>
                </div>
              </div>

              {}
              <div>
                <span
                  className={`
                    inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold shadow-sm border
                    ${
                      normalizedRole === "owner"
                        ? "bg-purple-500 text-white border-purple-600"
                        : normalizedRole === "manager"
                        ? "bg-primary text-black border-primary"
                        : normalizedRole === "leader"
                        ? "bg-amber-400 text-black border-amber-500"
                        : "bg-gray-200 text-gray-700 border-gray-300"
                    }
                  `}
                >
                  {roleLabel[normalizedRole]}
                </span>
              </div>
            </div>

            {}
            <div className="mb-3 h-0.5 w-full bg-gradient-to-r from-primary to-amber-300 rounded" />

            {}
            <form onSubmit={handleSubmit} className="space-y-4">
              {}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  User
                </label>
                <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-white text-xs flex items-center justify-center font-semibold shadow-sm">
                    {currentUser?.name?.charAt(0).toUpperCase() ||
                      member.userId.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-900 truncate">
                      {currentUser?.name || "(Unknown user)"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {currentUser?.email || member.userId}
                    </p>
                  </div>
                </div>
              </div>

              {}
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
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-gray-300 hover:border-primary"
                    }
                  `}
                >
                  <span
                    className={
                      form.divisionId === 0 ? "text-gray-400" : "text-gray-800"
                    }
                  >
                    {currentDivisionName}
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
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "hover:bg-gray-100"
                              }
                            `}
                          >
                            <span>{d.name}</span>
                            {active && (
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {}
              <div className="mt-4 flex items-center justify-between gap-3">
                {}
                <div>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="inline-flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                    >
                      <Trash2 size={14} />
                      Delete Member
                    </button>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      Owner &amp; Manager cannot be deleted.
                    </p>
                  )}
                </div>

                {}
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
                    disabled={!canSubmit || submitting}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-extrabold text-black shadow-sm ring-1 ring-primary transition hover:-translate-y-[1px] hover:bg-primary/90 disabled:opacity-60"
                  >
                    Save changes
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

export default EditMemberModal;

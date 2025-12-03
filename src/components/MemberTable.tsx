import React from "react";
import { Plus } from "lucide-react";

import type { Member } from "../types/member";
import type { IRegisterResponse } from "../types/auth";
import type { Division } from "../types/division";

interface MemberTableProps {
  members: Member[];
  users: IRegisterResponse[];
  divisions: Division[];

  canManageMembers?: boolean; // PM/Owner
  onRowClick?: (member: Member) => void; // klik row untuk edit

  // untuk tombol Tambah Member di header tabel
  onAddMember?: () => void;
}

/** Role normalisasi internal */
type NormalizedRole = "owner" | "manager" | "leader" | "member";

/** Label UI */
const roleLabel: Record<NormalizedRole, string> = {
  owner: "Owner",
  manager: "Manager",
  leader: "Leader",
  member: "Member",
};

/** Sorting prioritas */
const roleOrder: Record<NormalizedRole, number> = {
  owner: 1,
  manager: 2,
  leader: 3,
  member: 4,
};

/** Normalisasi role bebas → role UI */
function normalizeRole(raw: string): NormalizedRole {
  const v = raw.trim().toLowerCase();

  if (v === "owner") return "owner";
  if (v === "pm" || v === "manager" || v === "project manager")
    return "manager";
  if (v === "ketua" || v === "leader" || v === "ketua divisi") return "leader";

  return "member";
}

const MemberTable: React.FC<MemberTableProps> = ({
  members,
  users,
  divisions,
  canManageMembers = false,
  onRowClick,
  onAddMember,
}) => {
  /* MAP USER */
  const userMap = React.useMemo(() => {
    const map = new Map<string, IRegisterResponse>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  /* MAP DIVISION */
  const divisionMap = React.useMemo(() => {
    const map = new Map<number, Division>();
    divisions.forEach((d) => map.set(d.id, d));
    return map;
  }, [divisions]);

  /* SORT MEMBER LIST (owner → manager → leader → member) */
  const sortedMembers = React.useMemo(() => {
    return [...members].sort((a, b) => {
      const ra = normalizeRole(String(a.role));
      const rb = normalizeRole(String(b.role));

      const o1 = roleOrder[ra];
      const o2 = roleOrder[rb];
      if (o1 !== o2) return o1 - o2;

      const nameA = userMap.get(a.userId)?.name || "";
      const nameB = userMap.get(b.userId)?.name || "";
      return nameA.localeCompare(nameB);
    });
  }, [members, userMap]);

  const handleRowClick = (member: Member) => {
    if (!onRowClick || !canManageMembers) return;

    const r = normalizeRole(String(member.role));
    // Owner, Manager, dan Leader tidak bisa diedit dari modul member
    if (r === "owner" || r === "manager" || r === "leader") return;

    onRowClick(member);
  };

  return (
    <div className="mt-6 bg-white/95 rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.08)] border border-gray-100/80">
      {/* Header, disamakan dengan DivisionTable */}
      <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-slate-100/80">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900">
          Members
        </h3>

        {canManageMembers && onAddMember && (
          <button
            onClick={onAddMember}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2
                       text-[11px] sm:text-sm font-semibold text-black
                       hover:brightness-95 active:scale-[0.985]
                       transition shadow-[0_10px_25px_rgba(251,191,36,0.45)]"
          >
            <Plus size={16} />
            <span>Tambah Member</span>
          </button>
        )}
      </div>

      <div className="px-3 sm:px-4 pb-4 sm:pb-5">
        {members.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-slate-50/60 px-4 py-6 text-center">
            <p className="text-sm font-medium text-slate-700 mb-1">
              Belum ada member pada project ini.
            </p>
            <p className="text-xs text-slate-500">
              Tambahkan member agar semua orang tahu peran dan divisinya.
            </p>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full table-fixed text-[11px] sm:text-sm font-inter">
              <thead>
                <tr className="text-left bg-slate-50/80 border-b border-slate-100/80">
                  <th className="py-3 px-3 w-[40px] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-slate-500 text-center">
                    No
                  </th>
                  <th className="py-3 px-3 w-[230px] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    User
                  </th>
                  <th className="py-3 px-3 w-[200px] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Division
                  </th>
                  <th className="py-3 px-3 w-[140px] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-slate-500 text-center">
                    Role
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedMembers.map((m, idx) => {
                  const user = userMap.get(m.userId);
                  const division = divisionMap.get(m.divisionId);
                  const r = normalizeRole(String(m.role));

                  const rowClickable =
                    !!onRowClick &&
                    canManageMembers &&
                    r !== "owner" &&
                    r !== "manager" &&
                    r !== "leader"; // 🔒 leader juga tidak editable

                  return (
                    <tr
                      key={m.id}
                      onClick={() => handleRowClick(m)}
                      className={`
                        border-b border-slate-100
                        odd:bg-white even:bg-slate-50/60
                        transition-colors duration-150
                        ${
                          rowClickable
                            ? "hover:bg-amber-50/80 cursor-pointer"
                            : "hover:bg-slate-50"
                        }
                      `}
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-slate-400 align-top text-[11px] sm:text-xs text-center">
                        {idx + 1}
                      </td>

                      {/* User */}
                      <td className="py-3 px-3 align-top">
                        {user ? (
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-primary text-white text-xs flex items-center justify-center font-semibold shadow-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] text-slate-900 leading-tight truncate">
                                {user.name}
                              </p>
                              <p className="text-[10px] text-slate-500 leading-tight truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            (unknown user)
                          </span>
                        )}
                      </td>

                      {/* Division */}
                      <td className="py-3 px-3 align-top">
                        {division ? (
                          <span className="truncate inline-block max-w-[180px] text-[12px] text-slate-800">
                            {division.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-[3px] text-[10px] font-medium text-slate-400 border border-slate-300">
                            -
                          </span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3 align-top text-center">
                        <span
                          className={`
                            inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold shadow-sm border
                            ${
                              r === "owner"
                                ? "bg-purple-500 text-white border-purple-600"
                                : r === "manager"
                                ? "bg-blue-500 text-white border-blue-600"
                                : r === "leader"
                                ? "bg-amber-300 text-black border-amber-400"
                                : "bg-gray-100 text-gray-700 border-gray-300"
                            }
                          `}
                        >
                          {roleLabel[r]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberTable;

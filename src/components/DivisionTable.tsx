// src/components/DivisionTable.tsx
import React from "react";
import { Plus, ChevronDown } from "lucide-react";

import type { Division, DivisionStatus } from "../types/division";
import type { IRegisterResponse } from "../types/auth";

interface DivisionTableProps {
  divisions: Division[];
  users: IRegisterResponse[];

  canEdit?: boolean;
  currentUserId?: string;

  onChangeStatus?: (id: number, status: DivisionStatus) => void;
  onEdit?: (division: Division) => void;
  onDelete?: (id: number) => void; // masih di interface, tapi tidak dipakai di table

  // untuk tombol Tambah Divisi di header tabel
  onAddDivision?: () => void;
}

const statusLabel: Record<DivisionStatus, string> = {
  todo: "Todo",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
};

// warna disamakan feel-nya dengan TaskPage
const statusColorClass: Record<DivisionStatus, string> = {
  todo: "bg-amber-50 text-amber-700 border border-amber-200",
  "in-progress": "bg-sky-50 text-sky-700 border border-sky-200",
  review: "bg-violet-50 text-violet-700 border border-violet-200",
  done: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

const statusOptions: DivisionStatus[] = [
  "todo",
  "in-progress",
  "review",
  "done",
];

interface StatusDropdownProps {
  status: DivisionStatus;
  canChange: boolean;
  onChange: (status: DivisionStatus) => void;
}

// dropdown custom ala TaskPage
const StatusDropdown: React.FC<StatusDropdownProps> = ({
  status,
  canChange,
  onChange,
}) => {
  const [open, setOpen] = React.useState(false);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canChange) return;
    setOpen((prev) => !prev);
  };

  const handleSelect = (e: React.MouseEvent, s: DivisionStatus) => {
    e.stopPropagation();
    onChange(s);
    setOpen(false);
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={toggle}
        disabled={!canChange}
        className={`
          inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold
          shadow-sm transition
          ${statusColorClass[status]}
          ${
            canChange
              ? "hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-1 cursor-pointer"
              : "cursor-default opacity-95"
          }
        `}
      >
        <span>{statusLabel[status]}</span>
        {canChange && (
          <ChevronDown
            size={14}
            className={`ml-0.5 transition-transform ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
        )}
      </button>

      {open && canChange && (
        <div
          className="
            absolute right-0 mt-1 w-[150px] z-20
            rounded-xl border border-slate-100 bg-white
            shadow-lg py-1
          "
        >
          {statusOptions.map((s) => {
            const active = s === status;
            return (
              <button
                key={s}
                type="button"
                onClick={(e) => handleSelect(e, s)}
                className={`
                  w-full px-3 py-1.5 text-left text-[11px]
                  flex items-center justify-between
                  hover:bg-amber-50
                  ${
                    active
                      ? "font-semibold text-amber-600"
                      : "text-slate-700"
                  }
                `}
              >
                <span>{statusLabel[s]}</span>
                {active && (
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DivisionTable: React.FC<DivisionTableProps> = ({
  divisions,
  users,
  canEdit = false,
  currentUserId,
  onChangeStatus,
  onEdit,
  onAddDivision,
}) => {
  const userMap = React.useMemo(() => {
    const map = new Map<string, IRegisterResponse>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const handleStatusChange = (id: number, value: DivisionStatus) => {
    if (!onChangeStatus) return;
    onChangeStatus(id, value);
  };

  const handleRowClick = (division: Division) => {
    if (!canEdit || !onEdit) return;
    onEdit(division);
  };

  return (
    <div className="mt-6 bg-white/95 rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.08)] border border-gray-100/80">
      {}
      <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-slate-100/80">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900">
          Divisions
        </h3>

        {}
        {canEdit && onAddDivision && (
          <button
            onClick={onAddDivision}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2
                       text-[11px] sm:text-sm font-semibold text-black
                       hover:brightness-95 active:scale-[0.985]
                       transition shadow-[0_10px_25px_rgba(251,191,36,0.45)]"
          >
            <Plus size={16} />
            <span>Tambah Divisi</span>
          </button>
        )}
      </div>

      <div className="px-3 sm:px-4 pb-4 sm:pb-5">
        {divisions.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-slate-50/60 px-4 py-6 text-center">
            <p className="text-sm font-medium text-slate-700 mb-1">
              Belum ada divisi yang dibuat.
            </p>
            <p className="text-xs text-slate-500">
              Gunakan tombol{" "}
              <span className="font-semibold">Tambah Divisi</span> untuk
              membuat divisi pertama pada project ini.
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
                  <th className="py-3 px-3 w-[170px] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Division
                  </th>
                  <th className="py-3 px-3 w-[260px] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Main Task
                  </th>
                  <th className="py-3 px-3 w-[240px] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Coordinator
                  </th>
                  <th className="py-3 px-3 w-[150px] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-slate-500 text-center">
                    Status
                  </th>
                  <th className="py-3 px-3 w-[120px] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-slate-500 text-center whitespace-nowrap">
                    Start
                  </th>
                  <th className="py-3 px-3 w-[120px] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-slate-500 text-center whitespace-nowrap">
                    Due
                  </th>
                </tr>
              </thead>

              <tbody>
                {divisions.map((d, idx) => {
                  const coordinator = d.coordinatorId
                    ? userMap.get(d.coordinatorId)
                    : undefined;

                  const rowClickable = canEdit && !!onEdit;

                  const isCoordinator =
                    !!currentUserId && d.coordinatorId === currentUserId;

                  const canChangeThisStatus =
                    !!onChangeStatus && (canEdit || isCoordinator);

                  const isMyDivision =
                    !!currentUserId && d.coordinatorId === currentUserId;

                  return (
                    <tr
                      key={d.id}
                      onClick={() => handleRowClick(d)}
                      className={`
                        border-b border-slate-100
                        odd:bg-white even:bg-slate-50/60
                        ${
                          rowClickable
                            ? "hover:bg-amber-50/80 cursor-pointer"
                            : ""
                        }
                        transition-colors duration-150
                      `}
                    >
                      {}
                      <td className="py-3 px-3 align-top text-slate-400 text-[11px] sm:text-xs text-center">
                        {idx + 1}
                      </td>

                      {}
                      <td className="py-3 px-3 align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-900 text-[13px] truncate">
                            {d.name}
                          </span>
                          {isMyDivision && (
                            <span className="inline-flex max-w-fit items-center rounded-full bg-emerald-50 px-2 py-[2px] text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                              Your division
                            </span>
                          )}
                        </div>
                      </td>

                      {}
                      <td className="py-3 px-3 align-top">
                        <p
                          className="text-slate-700 max-w-[260px] text-[11px] sm:text-[12px] leading-snug line-clamp-2"
                          title={d.mainTask || undefined}
                        >
                          {d.mainTask || (
                            <span className="text-slate-400">No main task</span>
                          )}
                        </p>
                      </td>

                      {}
                      <td className="py-3 px-3 align-top">
                        {coordinator ? (
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 shrink-0 rounded-full bg-primary text-white text-xs flex items-center justify-center font-semibold shadow-sm">
                              {coordinator.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] text-slate-900 leading-tight truncate">
                                {coordinator.name}
                              </p>
                              <p className="text-[10px] text-slate-500 leading-tight truncate">
                                {coordinator.email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-[3px] text-[10px] font-medium text-slate-400 border border-dashed border-slate-300">
                            No coordinator
                          </span>
                        )}
                      </td>

                      {}
                      <td className="py-3 px-3 align-top">
                        <div className="inline-flex min-w-[140px] justify-center">
                          <StatusDropdown
                            status={d.status}
                            canChange={canChangeThisStatus}
                            onChange={(newStatus) =>
                              handleStatusChange(d.id, newStatus)
                            }
                          />
                        </div>
                      </td>

                      {}
                      <td className="py-3 px-3 align-top text-slate-700 text-[11px] sm:text-[12px] text-center whitespace-nowrap">
                        {d.startDate || (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 align-top text-slate-700 text-[11px] sm:text-[12px] text-center whitespace-nowrap">
                        {d.dueDate || <span className="text-slate-400">-</span>}
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

export default DivisionTable;

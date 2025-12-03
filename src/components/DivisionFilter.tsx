// src/components/DivisionFilter.tsx
import React from "react";
import { ChevronDown, Check } from "lucide-react";
import type { Division } from "../types/division";

export type DivisionFilterValue = "all" | "no-division" | number;

interface DivisionFilterProps {
  divisions: Division[];
  value: DivisionFilterValue;
  onChange: (v: DivisionFilterValue) => void;
  className?: string;
}

const DivisionFilter: React.FC<DivisionFilterProps> = ({
  divisions,
  value,
  onChange,
  className = "",
}) => {
  const [open, setOpen] = React.useState(false);

  const sorted = React.useMemo(
    () => [...divisions].sort((a, b) => a.name.localeCompare(b.name)),
    [divisions]
  );

  const selectedLabel =
    value === "all"
      ? "All divisions"
      : value === "no-division"
      ? "No division"
      : sorted.find((d) => d.id === value)?.name || "Select division";

  return (
    <div className={`relative ${className}`}>
      {/* BUTTON */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="
          flex items-center justify-between
          min-w-[200px] px-4 py-2.5
          bg-white rounded-xl border border-amber-200
          text-sm font-semibold text-slate-700
          shadow-sm hover:shadow-md hover:border-amber-300
          transition-all
        "
      >
        {selectedLabel}
        <ChevronDown
          size={18}
          className={`transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="
            absolute left-0 mt-2 w-full z-50
            bg-white border border-slate-200 rounded-xl
            shadow-xl py-1
            animate-fade-in
          "
        >
          {[
            { label: "All divisions", value: "all" as DivisionFilterValue },
            // { label: "No division", value: "no-division" as DivisionFilterValue },
            ...sorted.map((d) => ({ label: d.name, value: d.id })),
          ].map((item) => {
            const active = item.value === value;
            return (
              <button
                key={item.label}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between
                  px-4 py-2 text-sm text-left
                  hover:bg-amber-50 transition
                  ${active ? "text-amber-600 font-semibold" : "text-slate-700"}
                `}
              >
                {item.label}

                {active && (
                  <Check size={16} className="text-amber-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DivisionFilter;

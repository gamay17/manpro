import  { useEffect, useMemo, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export type Option<T extends string = string> = {
  value: T;
  label: string;
};

interface SelectProps<T extends string = string> {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
}

function cx(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(" ");
}


function measureTextWidth(text: string, font = "14px Inter") {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;

  ctx.font = font;
  return ctx.measureText(text).width;
}

export default function Select<T extends string = string>({
  value,
  onChange,
  options,
  className,
  menuClassName,
  disabled,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? options[0],
    [options, value]
  );


  const maxWidth = useMemo(() => {
    const widths = options.map((o) => measureTextWidth(o.label));
    const longest = Math.max(...widths);
    return longest + 50; // Extra ruang untuk icon & padding
  }, [options]);

  useEffect(() => {
    setOpen(false);
  }, [value]);

  return (
    <div className="relative inline-block text-left font-poppins">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{ width: maxWidth }} // width stabil
        className={cx(
          "flex items-center justify-between gap-2 rounded-full border px-3 py-1.5",
          "bg-white/90 backdrop-blur-[1px] shadow-sm",
          "text-sm font-medium",
          "whitespace-nowrap",           // ⭐ mencegah wrap
          "transition-all duration-200 hover:shadow",
          "border-gray-200",
          disabled && "opacity-60 cursor-not-allowed",
          className
        )}
      >
        <span className="whitespace-nowrap">{selected.label}</span>
        <ChevronDown
          size={16}
          className={cx(
            "opacity-70 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={cx(
            "absolute z-50 mt-2 w-full max-h-64 overflow-auto",
            "rounded-2xl border border-gray-200 bg-white shadow-xl",
            "p-1.5 outline-none",
            menuClassName
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;

            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => onChange(opt.value)}
                className={cx(
                  "flex items-center justify-between gap-3 cursor-pointer rounded-xl px-3 py-2 text-sm",
                  "whitespace-nowrap",          // ⭐ mencegah wrap pada menu
                  isSelected
                    ? "font-semibold text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <span className="whitespace-nowrap">{opt.label}</span>
                {isSelected && <Check size={16} className="opacity-80" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

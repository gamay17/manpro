import { useEffect, useState } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  value?: string;
  onChange?: (q: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: SearchBarProps) => {
  const [internal, setInternal] = useState(value ?? "");

  useEffect(() => {
    if (value !== undefined) setInternal(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInternal(v);
    onChange?.(v);
  };

  return (
    <div
      className={`
        flex items-center w-full max-w-xl 
        px-3 py-2.5 rounded-lg
        bg-white/70 backdrop-blur-sm
        border border-slate-200/70
        shadow-[0_4px_14px_rgba(15,23,42,0.05)]
        transition-all duration-200
        hover:shadow-[0_6px_18px_rgba(15,23,42,0.08)]
        ${className}
      `}
    >
      <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />

      <input
        type="text"
        placeholder={placeholder}
        value={internal}
        onChange={handleChange}
        className="
          ml-3 w-full bg-transparent 
          outline-none
          text-slate-700 
          placeholder-slate-400
          text-sm
        "
      />
    </div>
  );
};

export default SearchBar;

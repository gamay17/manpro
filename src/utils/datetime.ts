


export const nowLocalDatetime = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
};


export const toDateOnly = (value?: string | null): string => {
  if (!value) return "";
  const s = String(value);
  if (s.includes("T")) return s.split("T")[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
};


export const formatDateDisplay = (value?: string | null): string => {
  if (!value) return "";
  const s = String(value).split("T")[0]; 
  const parts = s.split("-");
  if (parts.length !== 3) return value;
  const [y, m, d] = parts;
  return `${d}-${m}-${y}`;
};

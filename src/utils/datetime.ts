// src/utils/datetime.ts

/**
 * Format sekarang dalam bentuk lokal (tanpa zona waktu)
 * Cocok untuk <input type="datetime-local" />
 * Contoh hasil: "2025-10-14T09:05"
 */
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

/**
 * Pastikan string tanggal hanya dalam format "YYYY-MM-DD"
 * Berguna untuk input type="date"
 * Jika value mengandung waktu (T...), maka akan dipotong bagian jamnya.
 */
export const toDateOnly = (value?: string | null): string => {
  if (!value) return "";
  const s = String(value);
  if (s.includes("T")) return s.split("T")[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
};

/** Format "YYYY-MM-DD" → "DD-MM-YYYY" */
export const formatDateDisplay = (value?: string | null): string => {
  if (!value) return "";
  const s = String(value).split("T")[0]; // potong waktu jika ada
  const parts = s.split("-");
  if (parts.length !== 3) return value;
  const [y, m, d] = parts;
  return `${d}-${m}-${y}`;
};

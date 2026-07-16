export const months = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

const JAKARTA_UTC_OFFSET_HOURS = 7;

export function getDateAtTime(baseDate: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export function getJakartaDayKey(date: Date) {
  const jakartaDate = new Date(date.getTime() + JAKARTA_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  return new Date(
    Date.UTC(
      jakartaDate.getUTCFullYear(),
      jakartaDate.getUTCMonth(),
      jakartaDate.getUTCDate(),
    ),
  );
}

export function getJakartaDayRange(nowUtc = new Date()) {
  const shifted = new Date(
    nowUtc.getTime() + JAKARTA_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );

  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const d = shifted.getUTCDate();

  const startUtc = new Date(
    Date.UTC(y, m, d, -JAKARTA_UTC_OFFSET_HOURS, 0, 0, 0),
  );
  const endUtc = new Date(
    Date.UTC(y, m, d, 23 - JAKARTA_UTC_OFFSET_HOURS, 59, 59, 999),
  );

  return { startUtc, endUtc };
}

export function formatDateId(date: string | Date | null | undefined) {
  if (!date) return "-";
  const value = date instanceof Date ? date : new Date(date);
  return value.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateWithWeekdayId(date: string | Date | null | undefined) {
  if (!date) return "-";
  const value = date instanceof Date ? date : new Date(date);
  return value.toLocaleDateString("id-ID", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTimeId(date: string | Date | null | undefined) {
  if (!date) return "-";
  const value = date instanceof Date ? date : new Date(date);
  return value.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDate(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function diffDays(start: Date, end: Date) {
  return Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

export function formatMonthYear(date: Date) {
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function formatNumberInput(value: number | string | null | undefined) {
  const numeric = Number(value || 0);
  return numeric ? numeric.toLocaleString("id-ID") : "";
}

export function formatDateInputValue(
  value: string | Date | null | undefined
) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

export function formatTimeInputValue(
  value: string | Date | null | undefined
) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date);
}

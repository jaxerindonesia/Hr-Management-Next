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

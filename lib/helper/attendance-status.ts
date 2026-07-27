const PRESENT_STATUSES = new Set([
  "on time",
  "present",
  "half day",
  "lembur",
]);

const ABSENT_STATUSES = new Set([
  "absent",
  "alpha",
  "tidak hadir",
]);

const LATE_STATUSES = new Set([
  "late",
  "late - present",
  "late - half day",
]);

function normalizeStatus(status?: string | null) {
  return status?.trim().toLowerCase() ?? "";
}

export function isPresentAttendanceStatus(status?: string | null) {
  return PRESENT_STATUSES.has(normalizeStatus(status));
}

export function isAbsentAttendanceStatus(status?: string | null) {
  return ABSENT_STATUSES.has(normalizeStatus(status));
}

export function isLateAttendanceStatus(status?: string | null) {
  return LATE_STATUSES.has(normalizeStatus(status));
}

export function isWorkedAttendanceStatus(status?: string | null) {
  return isPresentAttendanceStatus(status) || isLateAttendanceStatus(status);
}

export function normalizeAttendanceStatus(status?: string | null) {
  return normalizeStatus(status);
}

export function formatAttendanceStatusLabel(status?: string | null) {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case "":
      return "Belum Absen";
    case "on time":
      return "Tepat Waktu"
    case "present":
      return "Hadir";
    case "half day":
      return "Setengah Hari";
    case "late":
      return "Terlambat";
    case "late - present":
      return "Terlambat - Hadir";
    case "late - half day":
      return "Terlambat - Setengah Hari";
    case "absent":
    case "alpha":
    case "tidak hadir":
      return "Tidak Hadir";
    case "lembur":
      return "Lembur";
    default:
      return status ?? "Belum Absen";
  }
}

const PRESENT_STATUSES = new Set([
  "on time",
  "present",
  "half day",
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

"use client";

const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export default function LiveDate() {
  return <>{DATE_FORMATTER.format(new Date())}</>;
}

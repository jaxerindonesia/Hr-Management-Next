"use client";

import { useEffect, useState } from "react";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Jakarta",
});

function formatDateTime(date: Date) {
  const parts = DATE_TIME_FORMATTER.formatToParts(date);

  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  const second = parts.find((part) => part.type === "second")?.value ?? "00";

  const dateLabel = `${weekday}, ${day} ${month} ${year}`.trim();

  return `${dateLabel} • ${hour}.${minute}.${second}`;
}

export default function LiveClock() {
  const [currentTime, setCurrentTime] = useState(() => formatDateTime(new Date()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(formatDateTime(new Date()));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return <>{currentTime}</>;
}

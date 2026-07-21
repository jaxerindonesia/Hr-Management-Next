import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DARK_GLASS_PANEL_CLASS =
  "border-slate-200/80 bg-white/55 shadow-[0_16px_36px_rgba(148,163,184,0.10)] ring-1 ring-white/70 backdrop-blur-sm dark:border-white/[0.08] dark:bg-transparent dark:shadow-[0_18px_40px_rgba(2,6,23,0.18)] dark:ring-1 dark:ring-white/[0.05] dark:backdrop-blur-sm";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiResponse<T = any> = {
  data?: T[];
  total?: number;
};

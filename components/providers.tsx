"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AbsenceProvider } from "@/lib/absence-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AbsenceProvider>{children}</AbsenceProvider>
    </ThemeProvider>
  );
}

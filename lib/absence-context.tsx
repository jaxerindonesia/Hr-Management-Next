"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ABSENCE_TYPES as DEFAULT_ABSENCE_TYPES } from "@/lib/absence-types";

interface AbsenceContextType {
  absenceTypes: string[];
  addAbsenceType: (type: string) => void;
  removeAbsenceType: (type: string) => void;
}

const AbsenceContext = createContext<AbsenceContextType | undefined>(undefined);

export function AbsenceProvider({ children }: { children: React.ReactNode }) {
  const [absenceTypes, setAbsenceTypes] = useState<string[]>(DEFAULT_ABSENCE_TYPES);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTypes = localStorage.getItem("hr_absence_types");
      if (savedTypes) {
        try {
          setAbsenceTypes(JSON.parse(savedTypes));
        } catch (e) {
          console.error("Failed to parse absence types", e);
        }
      }
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem("hr_absence_types", JSON.stringify(absenceTypes));
    }
  }, [absenceTypes, isInitialized]);

  const addAbsenceType = (type: string) => {
    if (!absenceTypes.includes(type)) {
      setAbsenceTypes([...absenceTypes, type]);
    }
  };

  const removeAbsenceType = (type: string) => {
    setAbsenceTypes(absenceTypes.filter((t) => t !== type));
  };

  return (
    <AbsenceContext.Provider value={{ absenceTypes, addAbsenceType, removeAbsenceType }}>
      {children}
    </AbsenceContext.Provider>
  );
}

export function useAbsenceTypes() {
  const context = useContext(AbsenceContext);
  if (context === undefined) {
    throw new Error("useAbsenceTypes must be used within an AbsenceProvider");
  }
  return context;
}

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { handleUnauthorizedClient } from "@/lib/helper/response-api";

export type TenantConfig = {
  companyName: string | null;
  logoUrl: string | null;
  logoDarkUrl: string | null;
} | null;

const TenantConfigContext = createContext<TenantConfig>(null);

function parseStoredTenantConfig(raw: string | null): TenantConfig {
  try {
    if (!raw) return null;
    const user = JSON.parse(raw);
    const logoUrl = user?.tenantLogoUrl || null;
    if (!logoUrl) return null;

    return {
      companyName: user?.tenantName || null,
      logoUrl,
      logoDarkUrl: null,
    };
  } catch {
    return null;
  }
}

export function TenantConfigProvider({ children }: { children: ReactNode }) {
  const [remoteTenantConfig, setRemoteTenantConfig] =
    useState<TenantConfig>(null);
  const storedUserData = useSyncExternalStore(
    () => () => {},
    () => localStorage.getItem("hr_user_data"),
    () => null,
  );
  const storedTenantConfig = useMemo(
    () => parseStoredTenantConfig(storedUserData),
    [storedUserData],
  );
  const tenantConfig = remoteTenantConfig ?? storedTenantConfig;

  useEffect(() => {
    let isCancelled = false;

    const fetchTenantConfig = async () => {
      try {
        const response = await fetch("/api/tenant-config");
        if (response.status === 401) {
          handleUnauthorizedClient();
          return;
        }
        if (!response.ok) return;

        const json = await response.json();
        if (!isCancelled && json.data) {
          setRemoteTenantConfig(json.data);
        }
      } catch {
        // Pertahankan logo dari sesi lokal saat jaringan bermasalah.
      }
    };

    void fetchTenantConfig();
    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <TenantConfigContext.Provider value={tenantConfig}>
      {children}
    </TenantConfigContext.Provider>
  );
}

export function useTenantConfig() {
  return useContext(TenantConfigContext);
}

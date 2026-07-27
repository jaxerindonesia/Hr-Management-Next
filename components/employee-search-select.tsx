"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";

import type { UserLookupDto } from "@/lib/dto/user-lookup";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseApiError } from "@/lib/helper/response-api";

type Props = {
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

const SEARCH_DEBOUNCE_MS = 350;

function formatEmployeeLabel(employee: UserLookupDto) {
  const meta = [employee.department?.name, employee.position].filter(Boolean).join(" • ");
  return meta ? `${employee.name} (${meta})` : employee.name;
}

export default function EmployeeSearchSelect({
  disabled = false,
  onChange,
  placeholder = "Pilih Karyawan",
  value,
}: Props) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [employees, setEmployees] = useState<UserLookupDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    let isCancelled = false;

    const fetchEmployees = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        params.set("limit", "20");
        if (value) {
          params.set("selectedUserId", value);
        }
        if (debouncedSearchTerm) {
          params.set("search", debouncedSearchTerm);
        }

        const res = await fetch(`/api/users/lookup?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(await parseApiError(res, "Gagal mengambil data karyawan"));
        }

        const json = await res.json();
        if (!isCancelled) {
          setEmployees(json.data || []);
        }
      } catch (fetchError) {
        if (!isCancelled) {
          setEmployees([]);
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Gagal memuat data karyawan",
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchEmployees();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearchTerm, value]);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === value) ?? null,
    [employees, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-9 w-full justify-between rounded-md px-3 py-2 text-sm font-normal"
        >
          <span className="truncate text-left">
            {selectedEmployee ? formatEmployeeLabel(selectedEmployee) : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-3" align="start">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari nama, departemen, atau posisi"
              className="pl-9"
            />
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat karyawan...
              </div>
            ) : error ? (
              <p className="py-4 text-sm text-red-500">{error}</p>
            ) : employees.length === 0 ? (
              <p className="py-4 text-sm text-gray-500">Tidak ada karyawan ditemukan.</p>
            ) : (
              employees.map((employee) => {
                const isSelected = employee.id === value;

                return (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => {
                      onChange(employee.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-start justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-accent dark:hover:bg-accent/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {employee.name}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {[employee.department?.name, employee.position].filter(Boolean).join(" • ") || "-"}
                      </p>
                    </div>
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

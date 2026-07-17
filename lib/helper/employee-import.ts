export const EMPLOYEE_IMPORT_BATCH_SIZE = 20;

export type EmployeeImportColumn = {
  key: string;
  label: string;
  required?: boolean;
  description: string;
  sample: string;
};

export type EmployeeImportPayload = {
  tenantName?: string;
  roleName: string;
  departmentName?: string;
  nik?: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  joinDate?: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  address?: string;
  salary?: number;
  status?: string;
  password: string;
};

export type EmployeeImportValidationError = {
  column: string;
  message: string;
};

const COMMON_COLUMNS: EmployeeImportColumn[] = [
  {
    key: "roleName",
    label: "Role",
    required: true,
    description: "Nama role harus sesuai data di sistem, contoh: Admin atau Karyawan.",
    sample: "Karyawan",
  },
  {
    key: "departmentName",
    label: "Departemen",
    description: "Opsional. Isi nama departemen sesuai data di sistem.",
    sample: "IT",
  },
  {
    key: "nik",
    label: "NIK",
    description: "Opsional. Nomor induk karyawan.",
    sample: "EMP-001",
  },
  {
    key: "name",
    label: "Nama Lengkap",
    required: true,
    description: "Nama lengkap karyawan.",
    sample: "Budi Santoso",
  },
  {
    key: "email",
    label: "Email",
    required: true,
    description: "Harus unik dan belum pernah terdaftar.",
    sample: "budi@company.com",
  },
  {
    key: "phone",
    label: "No. Telepon",
    description: "Opsional. Nomor telepon aktif.",
    sample: "081234567890",
  },
  {
    key: "position",
    label: "Posisi",
    description: "Opsional. Jabatan atau posisi kerja.",
    sample: "Frontend Developer",
  },
  {
    key: "joinDate",
    label: "Tanggal Bergabung",
    description: "Format tanggal: YYYY-MM-DD.",
    sample: "2026-07-17",
  },
  {
    key: "gender",
    label: "Gender",
    description: "Isi: male / female atau Laki-laki / Perempuan.",
    sample: "male",
  },
  {
    key: "birthPlace",
    label: "Tempat Lahir",
    description: "Opsional. Tempat lahir karyawan.",
    sample: "Jakarta",
  },
  {
    key: "birthDate",
    label: "Tanggal Lahir",
    description: "Format tanggal: YYYY-MM-DD.",
    sample: "1998-01-15",
  },
  {
    key: "address",
    label: "Alamat",
    description: "Opsional. Alamat lengkap karyawan.",
    sample: "Jl. Melati No. 10, Jakarta",
  },
  {
    key: "salary",
    label: "Gaji",
    description: "Opsional. Hanya angka tanpa pemisah ribuan.",
    sample: "7500000",
  },
  {
    key: "status",
    label: "Status",
    description: "Isi: active / inactive. Default active jika kosong.",
    sample: "active",
  },
  {
    key: "password",
    label: "Password",
    required: true,
    description: "Minimal 6 karakter.",
    sample: "password123",
  },
];

export function getEmployeeImportColumns(isSuperAdmin: boolean) {
  if (!isSuperAdmin) return COMMON_COLUMNS;

  return [
    {
      key: "tenantName",
      label: "Perusahaan",
      required: true,
      description: "Nama perusahaan wajib diisi untuk Super Admin dan harus sesuai tenant di sistem.",
      sample: "PT Jaxer Grup Indonesia",
    },
    ...COMMON_COLUMNS,
  ];
}

export function getEmployeeImportHeaders(isSuperAdmin: boolean) {
  return getEmployeeImportColumns(isSuperAdmin).map((column) =>
    column.required ? `${column.label} *` : column.label,
  );
}

export function buildEmployeeImportTemplateRows(isSuperAdmin: boolean) {
  const columns = getEmployeeImportColumns(isSuperAdmin);
  const headerRow = Object.fromEntries(
    columns.map((column) => [
      column.required ? `${column.label} *` : column.label,
      column.required ? "WAJIB DIISI" : "Opsional",
    ]),
  );
  const sampleRow = Object.fromEntries(
    columns.map((column) => [
      column.required ? `${column.label} *` : column.label,
      column.sample,
    ]),
  );

  return [
    headerRow,
    sampleRow,
  ];
}

export function buildEmployeeImportInfoRows(isSuperAdmin: boolean) {
  const columns = getEmployeeImportColumns(isSuperAdmin);

  return columns.map((column) => ({
    Kolom: column.required ? `${column.label} *` : column.label,
    Wajib: column.required ? "Ya" : "Tidak",
    Keterangan: column.description,
    Contoh: column.sample,
  }));
}

function normalizeDateValue(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, dd, mm, yyyy] = slashMatch;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  const dashMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dashMatch) {
    const [, yyyy, mm, dd] = dashMatch;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return raw;
}

function normalizeGenderValue(value: unknown) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "male" || raw === "laki-laki" || raw === "lakilaki") return "male";
  if (raw === "female" || raw === "perempuan") return "female";
  return raw;
}

function normalizeStatusValue(value: unknown) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "active";
  if (raw === "aktif") return "active";
  if (raw === "tidak aktif") return "inactive";
  return raw;
}

function normalizeNumberValue(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;

  const numeric = Number(raw.replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : undefined;
}

export function normalizeEmployeeImportRow(
  row: Record<string, unknown>,
  isSuperAdmin: boolean,
): EmployeeImportPayload {
  const getValue = (label: string) => row[label] ?? row[`${label} *`] ?? "";

  return {
    tenantName: isSuperAdmin ? String(getValue("Perusahaan")).trim() : undefined,
    roleName: String(getValue("Role")).trim(),
    departmentName: String(getValue("Departemen")).trim(),
    nik: String(getValue("NIK")).trim(),
    name: String(getValue("Nama Lengkap")).trim(),
    email: String(getValue("Email")).trim(),
    phone: String(getValue("No. Telepon")).trim(),
    position: String(getValue("Posisi")).trim(),
    joinDate: normalizeDateValue(getValue("Tanggal Bergabung")),
    gender: normalizeGenderValue(getValue("Gender")),
    birthPlace: String(getValue("Tempat Lahir")).trim(),
    birthDate: normalizeDateValue(getValue("Tanggal Lahir")),
    address: String(getValue("Alamat")).trim(),
    salary: normalizeNumberValue(getValue("Gaji")),
    status: normalizeStatusValue(getValue("Status")),
    password: String(getValue("Password")).trim(),
  };
}

export function validateEmployeeImportRow(
  row: EmployeeImportPayload,
  isSuperAdmin: boolean,
) {
  const errors: EmployeeImportValidationError[] = [];

  if (isSuperAdmin && !row.tenantName) {
    errors.push({ column: "Perusahaan", message: "Perusahaan wajib diisi" });
  }
  if (!row.roleName) {
    errors.push({ column: "Role", message: "Role wajib diisi" });
  }
  if (!row.name) {
    errors.push({ column: "Nama Lengkap", message: "Nama Lengkap wajib diisi" });
  }
  if (!row.email) {
    errors.push({ column: "Email", message: "Email wajib diisi" });
  }
  if (!row.password) {
    errors.push({ column: "Password", message: "Password wajib diisi" });
  }
  if (row.password && row.password.length < 6) {
    errors.push({ column: "Password", message: "Password minimal 6 karakter" });
  }

  return errors;
}

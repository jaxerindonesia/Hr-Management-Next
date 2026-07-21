"use client";

export const FINANCE_IMPORT_BATCH_SIZE = 20;

export type FinanceImportError = {
  row: number;
  column?: string;
  message: string;
};

export type AccountImportRow = {
  code: string;
  name: string;
  accountCategoryCode: string;
  normalBalance: string;
  parentCode: string;
  isActive: string;
};

export type PartnerImportRow = {
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
};

export function buildAccountImportTemplateRows() {
  return [
    {
      Kode: "Format kode akun",
      Nama: "Nama akun",
      "Kode Kategori Akun": "Harus sudah ada di master kategori akun",
      "Saldo Normal": "DEBIT/CREDIT",
      "Kode Parent": "Opsional, isi kode akun parent jika ada",
      Status: "Aktif/Nonaktif",
    },
    {
      Kode: "1101",
      Nama: "Kas Kecil",
      "Kode Kategori Akun": "AST",
      "Saldo Normal": "DEBIT",
      "Kode Parent": "",
      Status: "Aktif",
    },
  ];
}

export function buildPartnerImportTemplateRows() {
  return [
    {
      Kode: "CUST-001",
      Nama: "PT Contoh Sentosa",
      Telepon: "08123456789",
      Email: "finance@contoh.co.id",
      Alamat: "Jakarta",
    },
  ];
}

export function buildAccountImportInfoRows() {
  return [
    { Kolom: "Kode", Wajib: "Ya", Keterangan: "Harus unik per tenant", Contoh: "1101" },
    { Kolom: "Nama", Wajib: "Ya", Keterangan: "Nama akun", Contoh: "Kas Kecil" },
    { Kolom: "Kode Kategori Akun", Wajib: "Ya", Keterangan: "Kode kategori akun yang sudah terdaftar", Contoh: "AST" },
    { Kolom: "Saldo Normal", Wajib: "Ya", Keterangan: "Hanya boleh DEBIT atau CREDIT", Contoh: "DEBIT" },
    { Kolom: "Kode Parent", Wajib: "Tidak", Keterangan: "Isi jika akun memiliki parent", Contoh: "1100" },
    { Kolom: "Status", Wajib: "Tidak", Keterangan: "Aktif atau Nonaktif, default Aktif", Contoh: "Aktif" },
  ];
}

export function buildPartnerImportInfoRows() {
  return [
    { Kolom: "Kode", Wajib: "Ya", Keterangan: "Harus unik per tenant", Contoh: "CUST-001" },
    { Kolom: "Nama", Wajib: "Ya", Keterangan: "Nama customer/vendor", Contoh: "PT Contoh Sentosa" },
    { Kolom: "Telepon", Wajib: "Tidak", Keterangan: "Nomor telepon", Contoh: "08123456789" },
    { Kolom: "Email", Wajib: "Ya", Keterangan: "Harus email valid dan unik per tenant", Contoh: "finance@contoh.co.id" },
    { Kolom: "Alamat", Wajib: "Tidak", Keterangan: "Alamat partner", Contoh: "Jakarta" },
  ];
}

export function normalizeAccountImportRow(row: Record<string, unknown>): AccountImportRow {
  return {
    code: String(row["Kode"] ?? "").trim(),
    name: String(row["Nama"] ?? "").trim(),
    accountCategoryCode: String(row["Kode Kategori Akun"] ?? "").trim(),
    normalBalance: String(row["Saldo Normal"] ?? "").trim().toUpperCase(),
    parentCode: String(row["Kode Parent"] ?? "").trim(),
    isActive: String(row["Status"] ?? "").trim(),
  };
}

export function normalizePartnerImportRow(row: Record<string, unknown>): PartnerImportRow {
  return {
    code: String(row["Kode"] ?? "").trim(),
    name: String(row["Nama"] ?? "").trim(),
    phone: String(row["Telepon"] ?? "").trim(),
    email: String(row["Email"] ?? "").trim().toLowerCase(),
    address: String(row["Alamat"] ?? "").trim(),
  };
}

export function validateAccountImportRow(row: AccountImportRow) {
  const errors: Array<{ column: string; message: string }> = [];
  if (!row.code) errors.push({ column: "Kode", message: "Kode wajib diisi" });
  if (!row.name) errors.push({ column: "Nama", message: "Nama wajib diisi" });
  if (!row.accountCategoryCode) errors.push({ column: "Kode Kategori Akun", message: "Kode kategori akun wajib diisi" });
  if (!row.normalBalance) {
    errors.push({ column: "Saldo Normal", message: "Saldo normal wajib diisi" });
  } else if (!["DEBIT", "CREDIT"].includes(row.normalBalance)) {
    errors.push({ column: "Saldo Normal", message: "Saldo normal harus DEBIT atau CREDIT" });
  }
  if (row.isActive && !["AKTIF", "NONAKTIF", "ACTIVE", "INACTIVE"].includes(row.isActive.toUpperCase())) {
    errors.push({ column: "Status", message: "Status harus Aktif atau Nonaktif" });
  }
  return errors;
}

export function validatePartnerImportRow(row: PartnerImportRow) {
  const errors: Array<{ column: string; message: string }> = [];
  if (!row.code) errors.push({ column: "Kode", message: "Kode wajib diisi" });
  if (!row.name) errors.push({ column: "Nama", message: "Nama wajib diisi" });
  if (!row.email) {
    errors.push({ column: "Email", message: "Email wajib diisi" });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errors.push({ column: "Email", message: "Email harus valid" });
  }
  return errors;
}

export function isAccountRowEmpty(row: AccountImportRow) {
  return Object.values(row).every((value) => !String(value ?? "").trim());
}

export function isPartnerRowEmpty(row: PartnerImportRow) {
  return Object.values(row).every((value) => !String(value ?? "").trim());
}

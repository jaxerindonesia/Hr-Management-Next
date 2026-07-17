export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { requireSessionUser, ensureTenantScope } from "@/lib/auth/tenant";
import { isSuperAdmin } from "@/lib/auth/session";
import type { EmployeeImportPayload } from "@/lib/helper/employee-import";

type ImportRequestRow = {
  rowNumber: number;
  payload: EmployeeImportPayload;
};

type ImportErrorItem = {
  row: number;
  column?: string;
  message: string;
};

function normalizeText(value: string | undefined | null) {
  return String(value ?? "").trim().toLowerCase();
}

function mapGender(gender?: string) {
  const raw = normalizeText(gender);
  if (!raw) return null;
  if (raw === "male" || raw === "laki-laki" || raw === "lakilaki") return "male";
  if (raw === "female" || raw === "perempuan") return "female";
  return null;
}

function mapStatus(status?: string) {
  const raw = normalizeText(status);
  if (!raw || raw === "active" || raw === "aktif") return "active";
  if (raw === "inactive" || raw === "tidak aktif") return "inactive";
  return "active";
}

function parseDate(dateValue?: string) {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const body = await req.json();
    const rows = Array.isArray(body?.rows) ? (body.rows as ImportRequestRow[]) : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Data import tidak ditemukan" },
        { status: 400 },
      );
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const userIsSuperAdmin = isSuperAdmin(auth.user.roleName);

    const [roles, departments, tenants] = await Promise.all([
      prisma.role.findMany({
        select: { id: true, name: true },
      }),
      prisma.department.findMany({
        where: scopedTenantId ? { tenantId: scopedTenantId, deletedAt: null } : { deletedAt: null },
        select: { id: true, name: true, tenantId: true },
      }),
      userIsSuperAdmin
        ? prisma.tenant.findMany({
            select: { id: true, companyName: true },
          })
        : Promise.resolve([]),
    ]);

    const requestedEmails = rows
      .map((row) => normalizeText(row.payload?.email))
      .filter(Boolean);

    const existingUsers = requestedEmails.length
      ? await prisma.user.findMany({
          where: { email: { in: requestedEmails } },
          select: { email: true },
        })
      : [];

    const existingEmailSet = new Set(existingUsers.map((user) => normalizeText(user.email)));
    const batchEmailSet = new Set<string>();
    const roleMap = new Map(roles.map((role) => [normalizeText(role.name), role]));
    const tenantMap = new Map(tenants.map((tenant) => [normalizeText(tenant.companyName), tenant]));
    const errors: ImportErrorItem[] = [];
    let created = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const item = rows[index];
      const row = item.payload;
      const rowNumber = item.rowNumber || index + 2;

      const email = normalizeText(row.email);
      const roleName = normalizeText(row.roleName);
      const tenantName = normalizeText(row.tenantName);
      const departmentName = normalizeText(row.departmentName);

      if (!row.name || !email || !row.password || !roleName) {
        if (!row.name) {
          errors.push({ row: rowNumber, column: "Nama Lengkap", message: "Nama Lengkap wajib diisi" });
        }
        if (!email) {
          errors.push({ row: rowNumber, column: "Email", message: "Email wajib diisi" });
        }
        if (!row.password) {
          errors.push({ row: rowNumber, column: "Password", message: "Password wajib diisi" });
        }
        if (!roleName) {
          errors.push({ row: rowNumber, column: "Role", message: "Role wajib diisi" });
        }
        continue;
      }

      if (row.password.length < 6) {
        errors.push({
          row: rowNumber,
          column: "Password",
          message: "Password minimal 6 karakter",
        });
        continue;
      }

      if (existingEmailSet.has(email) || batchEmailSet.has(email)) {
        errors.push({
          row: rowNumber,
          column: "Email",
          message: `Email ${row.email} sudah terdaftar`,
        });
        continue;
      }

      const role = roleMap.get(roleName);
      if (!role) {
        errors.push({
          row: rowNumber,
          column: "Role",
          message: `Role ${row.roleName} tidak ditemukan`,
        });
        continue;
      }

      let finalTenantId = scopedTenantId;
      if (!finalTenantId) {
        const tenant = tenantMap.get(tenantName);
        if (!tenant) {
          errors.push({
            row: rowNumber,
            column: "Perusahaan",
            message: `Perusahaan ${row.tenantName || "-"} tidak ditemukan`,
          });
          continue;
        }
        finalTenantId = tenant.id;
      }

      let departmentId: string | null = null;
      if (departmentName) {
        const department = departments.find(
          (item) =>
            normalizeText(item.name) === departmentName &&
            (item.tenantId ?? null) === finalTenantId,
        );

        if (!department) {
          errors.push({
            row: rowNumber,
            column: "Departemen",
            message: `Departemen ${row.departmentName} tidak ditemukan`,
          });
          continue;
        }

        departmentId = department.id;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(row.password, salt);

      await prisma.user.create({
        data: {
          tenantId: finalTenantId,
          roleId: role.id,
          departmentId,
          email: row.email.trim(),
          name: row.name.trim(),
          password: hashedPassword,
          salt,
          nik: row.nik?.trim() || null,
          phone: row.phone?.trim() || null,
          position: row.position?.trim() || null,
          joinDate: parseDate(row.joinDate),
          salary: typeof row.salary === "number" ? row.salary : null,
          gender: mapGender(row.gender),
          address: row.address?.trim() || null,
          birthDate: parseDate(row.birthDate),
          birthPlace: row.birthPlace?.trim() || null,
          currentToken: "",
          status: mapStatus(row.status),
        },
      });

      batchEmailSet.add(email);
      created += 1;
    }

    return NextResponse.json({
      message:
        errors.length > 0
          ? "Import selesai dengan beberapa catatan"
          : "Import data karyawan berhasil",
      data: {
        total: rows.length,
        created,
        failed: errors.length,
        errors,
      },
    });
  } catch (error) {
    console.error("Error importing users:", error);
    return NextResponse.json(
      { message: "Gagal mengimpor data karyawan" },
      { status: 500 },
    );
  }
}

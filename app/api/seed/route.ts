import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ===============================
    // ROLE PERMISSIONS (STANDARD)
    // ===============================

    const roles = [
      {
        name: "Super Admin",
        permission: [
          { model: "users", action: "get-all" },
          { model: "users", action: "get-by-id" },
          { model: "users", action: "create" },
          { model: "users", action: "update" },

          { model: "roles", action: "get-all" },
          { model: "roles", action: "get-by-id" },
          { model: "roles", action: "create" },
          { model: "roles", action: "update" },

          { model: "submissions", action: "get-all" },
          { model: "submissions", action: "get-by-id" },
          { model: "submissions", action: "create" },
          { model: "submissions", action: "update" },

          { model: "submission_types", action: "get-all" },
          { model: "submission_types", action: "get-by-id" },
          { model: "submission_types", action: "create" },
          { model: "submission_types", action: "update" },

          { model: "attendances", action: "get-all" },
          { model: "attendances", action: "get-by-id" },
          { model: "attendances", action: "create" },
          { model: "attendances", action: "update" },

          { model: "payrolls", action: "get-all" },
          { model: "payrolls", action: "get-by-id" },
          { model: "payrolls", action: "create" },
          { model: "payrolls", action: "update" },

          { model: "reimbursements", action: "get-all" },
          { model: "reimbursements", action: "get-by-id" },
          { model: "reimbursements", action: "create" },
          { model: "reimbursements", action: "update" },
          { model: "reimbursements", action: "delete" },

          { model: "performances", action: "get-all" },
          { model: "performances", action: "get-by-id" },
          { model: "performances", action: "create" },
          { model: "performances", action: "update" },
        ],
      },

      {
        name: "Karyawan",
        permission: [
          { model: "dashboard", action: "view" },

          { model: "leaves", action: "get-all" },
          { model: "leaves", action: "get-by-id" },
          { model: "leaves", action: "create" },

          { model: "attendance", action: "get-all" },
          { model: "attendance", action: "create" },
        ],
      },
    ];

    const createdRoles = [];

    for (const roleData of roles) {
      const existingRole = await prisma.role.findFirst({
        where: { name: roleData.name },
      });

      let role;

      if (!existingRole) {
        role = await prisma.role.create({
          data: roleData,
        });
      } else {
        // 🔥 update permission kalau sudah ada
        role = await prisma.role.update({
          where: { id: existingRole.id },
          data: {
            permission: roleData.permission,
          },
        });
      }

      createdRoles.push(role);
    }

    // ===============================
    // USERS SEED
    // ===============================

    const adminRole = createdRoles.find((r) => r.name === "Super Admin");
    const employeeRole = createdRoles.find((r) => r.name === "Karyawan");

    if (!adminRole || !employeeRole) {
      return NextResponse.json(
        { message: "Gagal membuat role" },
        { status: 500 },
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password", salt);

    const users = [
      {
        email: "admin@company.com",
        name: "Administrator",
        roleId: adminRole.id,
        password: hashedPassword,
        salt,
        currentToken: "",
        nik: "ADM001",
        position: "Head of IT",
        department: "Management",
        joinDate: new Date(),
      },
      {
        email: "karyawan@company.com",
        name: "Budi Santoso",
        roleId: employeeRole.id,
        password: hashedPassword,
        salt,
        currentToken: "",
        nik: "EMP001",
        position: "Staff",
        department: "IT",
        joinDate: new Date(),
      },
    ];

    const createdUsers = [];

    for (const userData of users) {
      let user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: userData,
        });
        createdUsers.push(user);
      }
    }

    return NextResponse.json({
      message: "Seed berhasil",
      roles: createdRoles,
      newUsers: createdUsers,
      credentials: {
        admin: { email: "admin@company.com", password: "password" },
        employee: { email: "karyawan@company.com", password: "password" },
      },
    });
  } catch (error) {
    console.error("SEED ERROR:", error);

    return NextResponse.json(
      {
        message: "Seed gagal",
        error: String(error),
      },
      { status: 500 },
    );
  }
}

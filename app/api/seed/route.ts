import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Buat Roles
    const roles = [
      {
        name: "Super Admin", // Sesuai dengan pengecekan di dashboard
        permission: {
          dashboard: { read: true, write: true },
          employees: { read: true, write: true },
          payroll: { read: true, write: true },
          settings: { read: true, write: true },
        },
      },
      {
        name: "Karyawan",
        permission: {
          dashboard: { read: true, write: false },
          leaves: { read: true, write: true },
          attendance: { read: true, write: true },
        },
      },
    ];

    const createdRoles = [];

    for (const roleData of roles) {
      let role = await prisma.role.findFirst({
        where: { name: roleData.name },
      });

      if (!role) {
        role = await prisma.role.create({
          data: roleData,
        });
      }
      createdRoles.push(role);
    }

    const adminRole = createdRoles.find((r) => r.name === "Super Admin");
    const employeeRole = createdRoles.find((r) => r.name === "Karyawan");

    if (!adminRole || !employeeRole) {
      return NextResponse.json({ message: "Gagal membuat role" }, { status: 500 });
    }

    // 2. Buat Users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password", salt);

    const users = [
      {
        email: "admin@company.com",
        name: "Administrator",
        roleId: adminRole.id,
        password: hashedPassword,
        salt: salt,
        currentToken: "",
        nik: "ADM001",
        position: "Head of IT",
        department: "Management",
        joinDate: new Date(),
      },
      {
        email: "karyawan@company.com",
        name: "Budi Santoso", // Nama sesuai data dummy dashboard
        roleId: employeeRole.id,
        password: hashedPassword,
        salt: salt,
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
      { message: "Seed gagal", error: String(error) },
      { status: 500 }
    );
  }
}
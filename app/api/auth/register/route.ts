export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      name,
      password,
      roleId,
      nik,
      phone,
      position,
      department,
      joinDate,
      salary,
    } = body;

    if (!email || !name || !password || !roleId) {
      return NextResponse.json(
        { message: "Email, name, password, and role are required fields" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        salt,
        roleId,
        nik,
        phone,
        position,
        department,
        joinDate: joinDate ? new Date(joinDate) : null,
        salary,
        currentToken: "",
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        data: user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      { message: "Failed to register user" },
      { status: 500 }
    );
  }
}

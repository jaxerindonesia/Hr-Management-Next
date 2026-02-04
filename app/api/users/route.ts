export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        nik: true,
        phone: true,
        position: true,
        department: true,
        joinDate: true,
        salary: true,
      },
    });

    const res = {
      message: "Users retrieved successfully",
      data: users,
    }

    return NextResponse.json(res);
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    return NextResponse.json(
      { message: "Failed to retrieve user data" },
      { status: 500 }
    );
  }
}

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
        message: "User successfully created.",
        data: user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE USER ERROR:", error);

    return NextResponse.json(
      { message: "Failed to create user" },
      { status: 500 }
    );
  }
}

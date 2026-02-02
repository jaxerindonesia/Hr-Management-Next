export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("GET ROLES ERROR:", error);

    return NextResponse.json(
      { message: "Failed to retrieve role data" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, permissions } = body;

    if (!name || !permissions) {
      return NextResponse.json(
        { message: "Name and permissions must be filled in." },
        { status: 400 }
      );
    }

    const role = await prisma.role.create({
      data: {
        name,
        permission: permissions,
      },
    });

    return NextResponse.json(
      {
        message: "Role successfully created.",
        data: role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE ROLE ERROR:", error);

    return NextResponse.json(
      { message: "Failed to create role" },
      { status: 500 }
    );
  }
}

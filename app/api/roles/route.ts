export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const search = searchParams.get("search") || "";

    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.role.count({ where }),
    ]);

    return NextResponse.json({
      message: "Roles retrieved successfully",
      data: roles,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET ROLES ERROR:", error);

    return NextResponse.json(
      { message: "Failed to retrieve role data" },
      { status: 500 },
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
        { status: 400 },
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
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE ROLE ERROR:", error);

    return NextResponse.json(
      { message: "Failed to create role" },
      { status: 500 },
    );
  }
}

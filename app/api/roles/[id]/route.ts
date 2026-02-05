export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = {
  params: { id: string };
};

export async function GET(_: Request, { params }: Params) {
  const p = await params;
  try {
    const role = await prisma.role.findUnique({
      where: { id: p.id },
    });

    if (!role) {
      return NextResponse.json(
        { message: "Role not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error("GET ROLE ERROR:", error);

    return NextResponse.json(
      { message: "Failed to retrieve role" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  const p = await params;
  try {
    const body = await req.json();
    const { name, permissions } = body;

    const role = await prisma.role.update({
      where: { id: p.id },
      data: {
        name,
        permission: permissions,
      },
    });

    return NextResponse.json({
      message: "Role successfully updated",
      data: role,
    });
  } catch (error) {
    console.error("UPDATE ROLE ERROR:", error);

    return NextResponse.json(
      { message: "Failed to update role" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const p = await params;
  try {
    await prisma.role.delete({
      where: { id: p.id },
    });

    return NextResponse.json({
      message: "Role successfully deleted",
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete role" },
      { status: 500 }
    );
  }
}

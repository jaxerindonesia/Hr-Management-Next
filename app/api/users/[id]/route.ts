export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve user" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};

    if (body.email) updateData.email = body.email;
    if (body.name) updateData.name = body.name;
    if (body.roleId) updateData.roleId = body.roleId;
    if (body.departmentId) updateData.departmentId = body.departmentId;
    if (body.nik) updateData.nik = body.nik;
    if (body.phone) updateData.phone = body.phone;
    if (body.position) updateData.position = body.position;
    if (body.salary !== undefined) updateData.salary = body.salary;

    if (body.joinDate) {
      updateData.joinDate = new Date(body.joinDate);
    }

    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(body.password, salt);

      updateData.password = hashedPassword;
      updateData.salt = salt;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "User successfully updated",
      data: user,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "User successfully deleted",
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete user" },
      { status: 500 },
    );
  }
}

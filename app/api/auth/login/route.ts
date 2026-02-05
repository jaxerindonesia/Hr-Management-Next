export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, remember_me } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password must be filled in" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Email not found" },
        { status: 401 }
      );
    }

    if (user.deletedAt) {
      return NextResponse.json(
        { message: "User is no longer active" },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { message: "Password is incorrect" },
        { status: 401 }
      );
    }

    const expiresIn = remember_me ? "7d" : "1d";

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role.name,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn,
      }
    );

    // simpan token ke DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentToken: token,
      },
    });

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
      },
    });

    // set cookie token (selalu)
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: remember_me
        ? 60 * 60 * 24 * 7 // 7 hari
        : 60 * 60 * 24, // 1 hari
    });

    // optional cookie remember_me
    if (remember_me) {
      response.cookies.set("remember_me", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to login user" },
      { status: 500 }
    );
  }
}

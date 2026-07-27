export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;
    const forbid = requirePermission(auth.user, "users", "get-all");
    if (forbid) return forbid;

    const { searchParams } = new URL(req.url);
    const selectedUserId = searchParams.get("selectedUserId")?.trim() || "";
    const search = searchParams.get("search")?.trim() || "";
    const limit = Math.min(
      20,
      Math.max(1, Number.parseInt(searchParams.get("limit") || "10", 10)),
    );

    const where: Prisma.UserWhereInput = {};
    const scopedTenantId = ensureTenantScope(auth.user);
    if (scopedTenantId) {
      where.tenantId = scopedTenantId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } },
        {
          department: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [{ name: "asc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        position: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (selectedUserId && !users.some((user) => user.id === selectedUserId)) {
      const selectedUser = await prisma.user.findFirst({
        where: {
          id: selectedUserId,
          ...(scopedTenantId ? { tenantId: scopedTenantId } : {}),
        },
        select: {
          id: true,
          name: true,
          position: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (selectedUser) {
        users.unshift(selectedUser);
      }
    }

    return NextResponse.json({
      message: "User lookup retrieved successfully",
      data: users,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to retrieve user lookup data" },
      { status: 500 },
    );
  }
}

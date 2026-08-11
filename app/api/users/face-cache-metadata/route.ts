export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { requirePermission } from "@/lib/auth/permission";
import { refreshMinioObjectCacheControl } from "@/lib/minio";

export async function POST(request: NextRequest) {
  const auth = await requireSessionUser();
  if (auth.error) return auth.error;
  const forbid = requirePermission(auth.user, "users", "update");
  if (forbid) return forbid;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 25));
  const tenantId = ensureTenantScope(auth.user);
  const where = {
    avatarUrl: { not: null },
    ...(tenantId ? { tenantId } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { id: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, avatarUrl: true },
    }),
    prisma.user.count({ where }),
  ]);

  let updated = 0;
  let skipped = 0;
  for (const user of users) {
    try {
      if (user.avatarUrl && await refreshMinioObjectCacheControl(user.avatarUrl)) {
        updated += 1;
      } else {
        skipped += 1;
      }
    } catch {
      skipped += 1;
    }
  }

  return NextResponse.json({
    page,
    limit,
    total,
    updated,
    skipped,
    hasNextPage: page * limit < total,
  });
}

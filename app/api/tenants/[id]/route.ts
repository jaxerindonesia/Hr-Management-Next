export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSessionUser, requireSuperAdmin } from "@/lib/auth/tenant";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const forbid = requireSuperAdmin(auth.user);
    if (forbid) return forbid;

    const { id } = await params;
    const body = await req.json();
    const { companyName, adminEmail, logoUrl, logoDarkUrl, isActive, subscriptionStart, subscriptionEnd } =
      body;

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        ...(companyName !== undefined ? { companyName } : {}),
        ...(adminEmail !== undefined ? { adminEmail } : {}),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(logoDarkUrl !== undefined ? { logoDarkUrl } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(subscriptionStart !== undefined
          ? { subscriptionStart: subscriptionStart ? new Date(subscriptionStart) : null }
          : {}),
        ...(subscriptionEnd !== undefined
          ? { subscriptionEnd: subscriptionEnd ? new Date(subscriptionEnd) : null }
          : {}),
      },
    });

    return NextResponse.json({ message: "Tenant berhasil diperbarui", data: updated });
  } catch (error) {
    console.error("UPDATE TENANT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update tenant" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const forbid = requireSuperAdmin(auth.user);
    if (forbid) return forbid;

    const { id } = await params;
    await prisma.tenant.delete({ where: { id } });

    return NextResponse.json({ message: "Tenant berhasil dihapus" });
  } catch (error) {
    console.error("DELETE TENANT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete tenant" },
      { status: 500 },
    );
  }
}

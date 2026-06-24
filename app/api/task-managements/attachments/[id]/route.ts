export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { deleteFromMinio } from "@/lib/minio";

type Params = {
  params: {
    id: string;
  };
};

export async function DELETE(_: Request, { params }: Params) {
  const p = await params;

  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const scopedTenantId = ensureTenantScope(auth.user);
    const attachment = await prisma.taskAttachment.findFirst({
      where: {
        id: p.id,
        ...(scopedTenantId ? { task: { tenantId: scopedTenantId } } : {}),
      },
      select: {
        id: true,
        url: true,
        objectKey: true,
      },
    });

    if (!attachment) {
      return NextResponse.json({ message: "Attachment not found" }, { status: 404 });
    }

    await deleteFromMinio(attachment.objectKey || attachment.url);
    await prisma.taskAttachment.delete({ where: { id: attachment.id } });

    return NextResponse.json({
      message: "Attachment successfully deleted",
    });
  } catch (error) {
    console.error("DELETE TASK ATTACHMENT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete attachment" },
      { status: 500 },
    );
  }
}

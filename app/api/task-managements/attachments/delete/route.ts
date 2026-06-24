export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { deleteFromMinio } from "@/lib/minio";

export async function POST(req: Request) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const body = await req.json();
    const attachmentId = body.attachmentId ? String(body.attachmentId) : "";
    const objectKey = body.objectKey ? String(body.objectKey) : "";

    if (!attachmentId && !objectKey) {
      return NextResponse.json(
        { message: "attachmentId or objectKey is required" },
        { status: 400 },
      );
    }

    const scopedTenantId = ensureTenantScope(auth.user);

    const attachment = attachmentId
      ? await prisma.taskAttachment.findFirst({
          where: {
            id: attachmentId,
            ...(scopedTenantId ? { task: { tenantId: scopedTenantId } } : {}),
          },
          select: { id: true, url: true, objectKey: true },
        })
      : null;

    if (attachmentId && !attachment) {
      return NextResponse.json({ message: "Attachment not found" }, { status: 404 });
    }

    const targetKey = attachment?.objectKey || objectKey;
    const targetUrl = attachment?.url || "";

    await deleteFromMinio(targetKey || targetUrl);

    if (attachment?.id) {
      await prisma.taskAttachment.delete({ where: { id: attachment.id } });
    }

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

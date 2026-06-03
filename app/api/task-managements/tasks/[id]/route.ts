export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

type Params = {
  params: {
    id: string;
  };
};

type AttachmentInput = {
  name: string;
  url: string;
  type: string | null;
};

function normalizeAttachments(value: unknown): AttachmentInput[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((raw) => {
      const item = raw as { name?: unknown; url?: unknown; type?: unknown };
      return {
        name: String(item.name || item.url || "").trim(),
        url: String(item.url || "").trim(),
        type: item.type ? String(item.type).trim() : null,
      };
    })
    .filter((item) => item.name && item.url);
}

async function findScopedTask(id: string, tenantId: string | null) {
  return prisma.task.findFirst({
    where: {
      id,
      ...(tenantId ? { tenantId } : {}),
    },
    include: {
      list: { select: { id: true, departmentId: true } },
    },
  });
}

async function validateList(listId: string, departmentId: string, tenantId: string | null) {
  return prisma.taskList.findFirst({
    where: {
      id: listId,
      departmentId,
      ...(tenantId ? { tenantId } : {}),
    },
    select: { id: true },
  });
}

async function validateMembers(memberIds: string[], departmentId: string, tenantId: string | null) {
  const uniqueIds = Array.from(new Set(memberIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: {
      id: { in: uniqueIds },
      departmentId,
      deletedAt: null,
      ...(tenantId ? { tenantId } : {}),
    },
    select: { id: true },
  });

  if (users.length !== uniqueIds.length) return null;
  return uniqueIds;
}

export async function PUT(req: Request, { params }: Params) {
  const p = await params;

  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const scopedTenantId = ensureTenantScope(auth.user);
    const existing = await findScopedTask(p.id, scopedTenantId);
    if (!existing) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const nextListId =
      body.listId !== undefined ? String(body.listId) : existing.listId;

    if (nextListId !== existing.listId) {
      const nextList = await validateList(
        nextListId,
        existing.departmentId,
        scopedTenantId,
      );
      if (!nextList) {
        return NextResponse.json(
          { message: "Target list not found for this department" },
          { status: 400 },
        );
      }
    }

    const updateData: {
      title?: string;
      description?: string | null;
      dueDate?: Date | null;
      labelColor?: string;
      position?: number;
      listId?: string;
    } = {};

    if (body.title !== undefined) {
      updateData.title = String(body.title).trim();
      if (!updateData.title) {
        return NextResponse.json(
          { message: "Task title is required" },
          { status: 400 },
        );
      }
    }
    if (body.description !== undefined) {
      updateData.description = body.description ? String(body.description) : null;
    }
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }
    if (body.labelColor !== undefined) {
      updateData.labelColor = String(body.labelColor);
    }
    if (body.position !== undefined) {
      updateData.position = Number(body.position);
    }
    if (body.listId !== undefined) {
      updateData.listId = nextListId;
    }

    const memberIds = body.memberIds
      ? await validateMembers(
          Array.isArray(body.memberIds) ? body.memberIds.map(String) : [],
          existing.departmentId,
          scopedTenantId,
        )
      : undefined;

    if (memberIds === null) {
      return NextResponse.json(
        { message: "Selected members must belong to this department" },
        { status: 400 },
      );
    }

    const attachments =
      body.attachments !== undefined
        ? normalizeAttachments(body.attachments)
        : undefined;

    const task = await prisma.$transaction(async (tx) => {
      if (memberIds !== undefined) {
        await tx.taskAssignee.deleteMany({ where: { taskId: p.id } });
        if (memberIds.length > 0) {
          await tx.taskAssignee.createMany({
            data: memberIds.map((userId) => ({ taskId: p.id, userId })),
          });
        }
      }

      if (attachments !== undefined) {
        await tx.taskAttachment.deleteMany({ where: { taskId: p.id } });
        if (attachments.length > 0) {
          await tx.taskAttachment.createMany({
            data: attachments.map((attachment) => ({
              taskId: p.id,
              name: attachment.name,
              url: attachment.url,
              type: attachment.type,
              tenantId: existing.tenantId,
            })),
          });
        }
      }

      return tx.task.update({
        where: { id: p.id },
        data: updateData,
        include: {
          assignees: {
            include: {
              user: { select: { id: true, name: true, email: true, position: true, avatarUrl: true } },
            },
          },
          attachments: true,
        },
      });
    });

    return NextResponse.json({
      message: "Task successfully updated",
      data: task,
    });
  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const p = await params;

  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const scopedTenantId = ensureTenantScope(auth.user);
    const existing = await findScopedTask(p.id, scopedTenantId);
    if (!existing) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id: p.id } });

    return NextResponse.json({
      message: "Task successfully deleted",
    });
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete task" },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";

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

async function resolveList(listId: string, departmentId: string, tenantId: string | null) {
  return prisma.taskList.findFirst({
    where: {
      id: listId,
      departmentId,
      ...(tenantId ? { tenantId } : {}),
    },
    include: {
      department: {
        select: { id: true, tenantId: true },
      },
    },
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

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (auth.error) return auth.error;

    const body = await req.json();
    const title = String(body.title || "").trim();
    const departmentId = String(body.departmentId || "");
    const listId = String(body.listId || "");

    if (!title || !departmentId || !listId) {
      return NextResponse.json(
        { message: "Task title, department, and list are required" },
        { status: 400 },
      );
    }

    const scopedTenantId = ensureTenantScope(auth.user);
    const list = await resolveList(listId, departmentId, scopedTenantId);
    if (!list) {
      return NextResponse.json(
        { message: "Task list not found" },
        { status: 404 },
      );
    }

    const memberIds = await validateMembers(
      Array.isArray(body.memberIds) ? body.memberIds.map(String) : [],
      departmentId,
      scopedTenantId,
    );
    if (memberIds === null) {
      return NextResponse.json(
        { message: "Selected members must belong to this department" },
        { status: 400 },
      );
    }

    const attachments = normalizeAttachments(body.attachments);
    const position =
      body.position !== undefined
        ? Number(body.position)
        : await prisma.task.count({ where: { listId } });

    const task = await prisma.task.create({
      data: {
        title,
        description: body.description ? String(body.description) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        labelColor: body.labelColor ? String(body.labelColor) : "#2563eb",
        position,
        listId,
        departmentId,
        tenantId: list.department.tenantId,
        assignees: {
          create: memberIds.map((userId) => ({ userId })),
        },
        attachments: {
          create: attachments.map((attachment) => ({
            name: attachment.name,
            url: attachment.url,
            type: attachment.type || null,
            tenantId: list.department.tenantId,
          })),
        },
      },
      include: {
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, position: true, avatarUrl: true } },
          },
        },
        attachments: true,
      },
    });

    return NextResponse.json(
      {
        message: "Task successfully created",
        data: task,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);
    return NextResponse.json(
      { message: "Failed to create task" },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureTenantScope, requireSessionUser } from "@/lib/auth/tenant";
import { canManageTaskDepartment } from "@/lib/auth/task-management";

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
      ...(tenantId ? { board: { tenantId } } : {}),
    },
    include: {
      board: {
        select: { id: true, departmentId: true, tenantId: true },
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

async function validateCategories(categoryIds: string[], departmentId: string) {
  const uniqueIds = Array.from(new Set(categoryIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const categories = await prisma.taskCategory.findMany({
    where: {
      id: { in: uniqueIds },
      departmentId,
    },
    select: { id: true },
  });

  if (categories.length !== uniqueIds.length) return null;
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
    if (!canManageTaskDepartment(auth.user, departmentId)) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 },
      );
    }
    const list = await resolveList(listId, departmentId, scopedTenantId);
    if (
      !list ||
      list.board.departmentId !== departmentId ||
      (scopedTenantId && list.board.tenantId !== scopedTenantId)
    ) {
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

    const categoryIds = await validateCategories(
      Array.isArray(body.categoryIds) ? body.categoryIds.map(String) : [],
      departmentId,
    );
    if (categoryIds === null) {
      return NextResponse.json(
        { message: "Selected categories must belong to this department" },
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
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        position,
        listId,
        departmentId,
        createdById: auth.user.id,
        tenantId: list.board.tenantId,
        members: {
          create: memberIds.map((userId) => ({ userId })),
        },
        categories: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
        attachments: {
          create: attachments.map((attachment) => ({
            name: attachment.name,
            url: attachment.url,
            type: attachment.type || null,
          })),
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, position: true, avatarUrl: true } },
          },
        },
        categories: {
          include: { category: true },
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

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
    const p = await params;
    try {
        const item = await prisma.reimbursement.findFirst({
            where: { id: p.id },
            include: {
                user: { select: { id: true, name: true, position: true, department: true } },
            },
        });

        if (!item) {
            return NextResponse.json({ message: "Reimbursement not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Success", data: item });
    } catch (error) {
        return NextResponse.json({ message: "Failed to retrieve reimbursement" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: Params) {
    const p = await params;
    try {
        const body = await req.json();
        const updateData: any = {};

        if (body.title !== undefined) updateData.title = body.title;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.amount !== undefined) updateData.amount = Number(body.amount);
        if (body.date !== undefined) updateData.date = new Date(body.date);
        if (body.description !== undefined) updateData.description = body.description;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.approvedBy !== undefined) updateData.approvedBy = body.approvedBy;
        if (body.approvedAt !== undefined) updateData.approvedAt = body.approvedAt ? new Date(body.approvedAt) : null;

        const updated = await prisma.reimbursement.update({
            where: { id: p.id },
            data: updateData,
        });

        return NextResponse.json({ message: "Reimbursement successfully updated", data: updated });
    } catch (error) {
        return NextResponse.json({ message: "Failed to update reimbursement" }, { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: Params) {
    const p = await params;
    try {
        await prisma.reimbursement.delete({ where: { id: p.id } });
        return NextResponse.json({ message: "Reimbursement successfully deleted" });
    } catch (error) {
        return NextResponse.json({ message: "Failed to delete reimbursement" }, { status: 500 });
    }
}

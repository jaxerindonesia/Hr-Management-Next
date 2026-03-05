export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const reimbursements = await prisma.reimbursement.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: { id: true, name: true, position: true, department: true },
                },
            },
        });

        return NextResponse.json({
            message: "Reimbursements retrieved successfully",
            data: reimbursements,
        });
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to retrieve reimbursements data" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, title, category, amount, date, description, receiptUrl } = body;

        if (!userId || !title || !category || !amount || !date) {
            return NextResponse.json(
                { message: "userId, title, category, amount, and date are required" },
                { status: 400 }
            );
        }

        const reimbursement = await prisma.reimbursement.create({
            data: {
                userId,
                title,
                category,
                amount: Number(amount),
                date: new Date(date),
                description: description ?? null,
                receiptUrl: receiptUrl ?? null,
                status: "pending",
            },
        });

        return NextResponse.json(
            { message: "Reimbursement successfully created.", data: reimbursement },
            { status: 201 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Failed to create reimbursement" },
            { status: 500 }
        );
    }
}

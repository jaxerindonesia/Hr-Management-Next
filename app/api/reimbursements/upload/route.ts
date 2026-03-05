export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
        }

        // Allowed types
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { message: "Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau PDF." },
                { status: 415 }
            );
        }

        // Max 5MB
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { message: "Ukuran file melebihi batas maksimal 5MB." },
                { status: 413 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save to /public/uploads/reimbursements/
        const ext = file.name.split(".").pop() ?? "jpg";
        const fileName = `reimburse_${Date.now()}.${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", "reimbursements");

        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, fileName), buffer);

        const url = `/uploads/reimbursements/${fileName}`;

        return NextResponse.json({ message: "Upload berhasil", url }, { status: 201 });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ message: "Gagal mengupload file" }, { status: 500 });
    }
}

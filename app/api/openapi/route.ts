export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { generateOpenApiSpec } from "@/lib/swagger";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  try {
    const spec = await generateOpenApiSpec();
    return NextResponse.json(spec);
  } catch {
    return NextResponse.json(
      { message: "Failed to generate OpenAPI spec" },
      { status: 500 },
    );
  }
}

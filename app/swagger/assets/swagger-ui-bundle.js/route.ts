export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(
    process.cwd(),
    "node_modules",
    "swagger-ui-dist",
    "swagger-ui-bundle.js",
  );

  try {
    const js = await fs.readFile(filePath, "utf8");
    return new NextResponse(js, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
      },
    });
  } catch {
    return new NextResponse("// swagger-ui-bundle.js not found", {
      status: 500,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
      },
    });
  }
}

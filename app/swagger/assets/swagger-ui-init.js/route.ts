export const runtime = "nodejs";

import { NextResponse } from "next/server";

const SWAGGER_INIT_JS = `
window.ui = SwaggerUIBundle({
  url: "/api/openapi",
  dom_id: "#swagger-ui",
  deepLinking: true,
  displayRequestDuration: true,
  persistAuthorization: true,
});
`;

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(SWAGGER_INIT_JS, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
    },
  });
}

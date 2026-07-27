export const runtime = "nodejs";

import { NextResponse } from "next/server";

const SWAGGER_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Swagger UI</title>
    <link
      rel="stylesheet"
      href="/swagger/assets/swagger-ui.css"
    />
    <style>
      body { margin: 0; background: #f8fafc; }
      #swagger-ui { max-width: 100%; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script nonce="__NONCE__" src="/swagger/assets/swagger-ui-bundle.js"></script>
    <script nonce="__NONCE__" src="/swagger/assets/swagger-ui-init.js"></script>
  </body>
</html>`;

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }

  const nonce = req.headers.get("x-nonce") || "";
  const html = SWAGGER_HTML.replaceAll("__NONCE__", nonce);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

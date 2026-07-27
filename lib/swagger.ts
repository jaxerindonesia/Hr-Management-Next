import { promises as fs } from "fs";
import path from "path";

type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "options"
  | "head";

type OpenApiPathItem = Partial<
  Record<
    HttpMethod,
    {
      tags: string[];
      summary: string;
      description: string;
      parameters?: Array<Record<string, unknown>>;
      requestBody?: Record<string, unknown>;
      responses: Record<string, unknown>;
    }
  >
>;

const API_ROOT = path.join(process.cwd(), "app", "api");
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"] as const;

function toOpenApiPath(routeFilePath: string) {
  const relativePath = path.relative(API_ROOT, routeFilePath);
  const routePath = relativePath.replace(/\\/g, "/").replace(/\/route\.ts$/, "");

  return `/api/${routePath}`
    .replace(/\[(\.\.\.)?([^\]]+)\]/g, (_match, _catchAll, paramName) => `{${paramName}}`)
    .replace(/\/+/g, "/");
}

function toTagName(openApiPath: string) {
  const segments = openApiPath.split("/").filter(Boolean);
  return segments[1] || "general";
}

function toSummary(method: string, openApiPath: string) {
  const readablePath = openApiPath
    .replace(/^\/api\//, "")
    .replace(/\//g, " / ")
    .replace(/\{([^}]+)\}/g, ":$1");

  return `${method} ${readablePath}`;
}

function extractPathParameters(openApiPath: string) {
  const matches = [...openApiPath.matchAll(/\{([^}]+)\}/g)];
  return matches.map((match) => ({
    name: match[1],
    in: "path",
    required: true,
    schema: { type: "string" },
    description: `Path parameter: ${match[1]}`,
  }));
}

function extractDocValue(fileContent: string, key: string) {
  const match = fileContent.match(new RegExp(`@${key}\\s+(.+)`));
  return match?.[1]?.trim() || null;
}

function buildOperation(method: typeof HTTP_METHODS[number], openApiPath: string, fileContent: string) {
  const parameters = extractPathParameters(openApiPath);
  const summary = extractDocValue(fileContent, `${method.toLowerCase()}Summary`) || toSummary(method, openApiPath);
  const description =
    extractDocValue(fileContent, `${method.toLowerCase()}Description`) ||
    `Auto generated documentation for ${method} ${openApiPath}.`;

  const operation: OpenApiPathItem[HttpMethod] = {
    tags: [extractDocValue(fileContent, "tag") || toTagName(openApiPath)],
    summary,
    description,
    responses: {
      "200": {
        description: "Successful response",
      },
      "400": {
        description: "Bad request",
      },
      "401": {
        description: "Unauthorized",
      },
      "403": {
        description: "Forbidden",
      },
      "500": {
        description: "Internal server error",
      },
    },
  };

  if (parameters.length > 0) {
    operation.parameters = parameters;
  }

  if (["POST", "PUT", "PATCH"].includes(method)) {
    operation.requestBody = {
      required: false,
      content: {
        "application/json": {
          schema: {
            type: "object",
            additionalProperties: true,
          },
        },
        "multipart/form-data": {
          schema: {
            type: "object",
            additionalProperties: true,
          },
        },
      },
    };
  }

  return operation;
}

async function collectRouteFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return collectRouteFiles(fullPath);
      if (entry.isFile() && entry.name === "route.ts") return [fullPath];
      return [];
    }),
  );

  return files.flat();
}

export async function generateOpenApiSpec() {
  const routeFiles = await collectRouteFiles(API_ROOT);
  const paths: Record<string, OpenApiPathItem> = {};

  await Promise.all(
    routeFiles.map(async (routeFile) => {
      const fileContent = await fs.readFile(routeFile, "utf8");
      const openApiPath = toOpenApiPath(routeFile);
      const pathItem: OpenApiPathItem = {};

      for (const method of HTTP_METHODS) {
        const exportedMethod = new RegExp(
          `export\\s+(async\\s+)?function\\s+${method}\\b|export\\s+const\\s+${method}\\b`,
        );

        if (!exportedMethod.test(fileContent)) continue;
        pathItem[method.toLowerCase() as HttpMethod] = buildOperation(
          method,
          openApiPath,
          fileContent,
        );
      }

      if (Object.keys(pathItem).length > 0) {
        paths[openApiPath] = pathItem;
      }
    }),
  );

  return {
    openapi: "3.0.3",
    info: {
      title: "HR Management API",
      version: "1.0.0",
      description:
        "Auto generated Swagger documentation for all Next.js route handlers under app/api. Only available in development.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Masukkan token JWT tanpa prefix Bearer. Swagger akan menambahkan prefix Bearer otomatis.",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description:
            "Dipakai jika ingin mengikuti cookie auth aplikasi. Untuk testing manual biasanya lebih praktis gunakan bearerAuth.",
        },
      },
    },
    security: [
      { bearerAuth: [] },
      { cookieAuth: [] },
    ],
    paths,
  };
}

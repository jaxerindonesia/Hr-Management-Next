import prisma from "@/lib/prisma";
import { buildTenantScopedObjectName } from "@/lib/minio";

export async function resolveTenantStorageName(tenantId?: string | null) {
  if (!tenantId) return "shared";

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { companyName: true },
  });

  return tenant?.companyName?.trim() || tenantId;
}

export async function buildTenantStorageObjectName(
  tenantId: string | null | undefined,
  moduleName: string,
  filename: string,
) {
  const tenantName = await resolveTenantStorageName(tenantId);
  return buildTenantScopedObjectName(tenantName, moduleName, filename);
}

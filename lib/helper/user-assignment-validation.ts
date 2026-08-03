import prisma from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth/session";

type UserAssignmentInput = {
  actorRoleName: string;
  tenantId: string | null;
  roleId: string;
  departmentId?: string | null;
  branchId?: string | null;
};

export async function validateUserAssignment({
  actorRoleName,
  tenantId,
  roleId,
  departmentId,
  branchId,
}: UserAssignmentInput) {
  const role = await prisma.role.findFirst({
    where: {
      id: roleId,
      ...(tenantId
        ? { OR: [{ tenantId: null }, { tenantId }] }
        : { tenantId: null }),
    },
    select: { name: true },
  });

  if (!role) return "Role tidak valid untuk tenant ini";
  if (isSuperAdmin(role.name) && !isSuperAdmin(actorRoleName)) {
    return "Hanya Super Admin yang dapat menetapkan role Super Admin";
  }

  if (!departmentId) return null;
  if (!tenantId) return "Departemen hanya dapat diberikan kepada user tenant";

  const department = await prisma.department.findFirst({
    where: { id: departmentId, tenantId, deletedAt: null },
    select: { branchId: true },
  });
  if (!department) return "Departemen tidak valid untuk tenant ini";
  if (department.branchId && department.branchId !== branchId) {
    return "Departemen tidak sesuai dengan cabang karyawan";
  }

  return null;
}

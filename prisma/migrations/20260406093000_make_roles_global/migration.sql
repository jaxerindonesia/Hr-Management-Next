ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "roles_tenant_id_fkey";
DROP INDEX IF EXISTS "roles_tenant_id_idx";
ALTER TABLE "roles" DROP COLUMN IF EXISTS "tenant_id";

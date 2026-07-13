-- Scope account categories by tenant without removing existing data.
ALTER TABLE "account_categories"
ADD COLUMN IF NOT EXISTS "tenant_id" UUID;

ALTER TABLE "account_categories"
ADD CONSTRAINT "account_categories_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "account_categories_code_key";

CREATE UNIQUE INDEX IF NOT EXISTS "account_categories_tenant_id_code_key"
ON "account_categories"("tenant_id", "code");

CREATE INDEX IF NOT EXISTS "account_categories_tenant_id_idx"
ON "account_categories"("tenant_id");

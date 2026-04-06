CREATE TABLE "tenants" (
  "id" UUID NOT NULL,
  "company_name" TEXT NOT NULL,
  "admin_email" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "subscription_start" TIMESTAMP(3),
  "subscription_end" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "roles" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "departments" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "users" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "submission_types" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "leave_configs" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "submissions" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "attendances" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "attendance_configs" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "payrolls" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "performances" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "reimbursements" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "company_configs" ADD COLUMN "tenant_id" UUID;

CREATE INDEX "roles_tenant_id_idx" ON "roles"("tenant_id");
CREATE INDEX "departments_tenant_id_idx" ON "departments"("tenant_id");
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");
CREATE INDEX "submission_types_tenant_id_idx" ON "submission_types"("tenant_id");
CREATE INDEX "leave_configs_tenant_id_idx" ON "leave_configs"("tenant_id");
CREATE INDEX "submissions_tenant_id_idx" ON "submissions"("tenant_id");
CREATE INDEX "attendances_tenant_id_idx" ON "attendances"("tenant_id");
CREATE INDEX "attendance_configs_tenant_id_idx" ON "attendance_configs"("tenant_id");
CREATE INDEX "payrolls_tenant_id_idx" ON "payrolls"("tenant_id");
CREATE INDEX "performances_tenant_id_idx" ON "performances"("tenant_id");
CREATE INDEX "reimbursements_tenant_id_idx" ON "reimbursements"("tenant_id");
CREATE INDEX "company_configs_tenant_id_idx" ON "company_configs"("tenant_id");

ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "departments" ADD CONSTRAINT "departments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "submission_types" ADD CONSTRAINT "submission_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leave_configs" ADD CONSTRAINT "leave_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attendance_configs" ADD CONSTRAINT "attendance_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "performances" ADD CONSTRAINT "performances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "company_configs" ADD CONSTRAINT "company_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

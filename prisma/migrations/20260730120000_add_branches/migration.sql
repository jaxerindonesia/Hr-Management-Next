CREATE TABLE "branches" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "address" TEXT,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "attendance_radius_meters" INTEGER NOT NULL DEFAULT 100,
  "location_lock_enabled" BOOLEAN NOT NULL DEFAULT false,
  "office_start_time" TEXT NOT NULL DEFAULT '09:00',
  "office_end_time" TEXT NOT NULL DEFAULT '17:00',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "branches_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "branches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "branches_tenant_id_name_key" ON "branches"("tenant_id", "name");
CREATE INDEX "branches_tenant_id_idx" ON "branches"("tenant_id");
ALTER TABLE "users" ADD COLUMN "branch_id" UUID;
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attendances" ADD COLUMN "branch_id" UUID, ADD COLUMN "check_in_distance_meters" DOUBLE PRECISION, ADD COLUMN "check_out_distance_meters" DOUBLE PRECISION;
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "attendances_branch_id_idx" ON "attendances"("branch_id");

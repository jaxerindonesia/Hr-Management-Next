CREATE TABLE "overtime_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID,
    "pay_method" TEXT NOT NULL DEFAULT 'PER_HOUR',
    "hourly_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "daily_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overtime_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "overtime_approver_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID,
    "approver_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "overtime_approver_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "overtimes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID,
    "user_id" UUID NOT NULL,
    "attendance_id" UUID,
    "overtime_date" TIMESTAMP(3) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "overtime_minutes" INTEGER NOT NULL,
    "requested_minutes" INTEGER NOT NULL,
    "description" TEXT,
    "reject_reason" TEXT,
    "pay_method" TEXT NOT NULL,
    "hourly_rate" DOUBLE PRECISION NOT NULL,
    "daily_rate" DOUBLE PRECISION NOT NULL,
    "payout_amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overtimes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "overtime_approval_decisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "overtime_id" UUID NOT NULL,
    "approver_user_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overtime_approval_decisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "overtimes_attendance_id_key" ON "overtimes"("attendance_id");
CREATE INDEX "overtime_configs_tenant_id_idx" ON "overtime_configs"("tenant_id");
CREATE UNIQUE INDEX "overtime_approver_configs_tenant_id_approver_user_id_key" ON "overtime_approver_configs"("tenant_id", "approver_user_id");
CREATE INDEX "overtime_approver_configs_tenant_id_idx" ON "overtime_approver_configs"("tenant_id");
CREATE INDEX "overtimes_tenant_id_idx" ON "overtimes"("tenant_id");
CREATE INDEX "overtimes_user_id_overtime_date_idx" ON "overtimes"("user_id", "overtime_date");
CREATE UNIQUE INDEX "overtime_approval_decisions_overtime_id_approver_user_id_key" ON "overtime_approval_decisions"("overtime_id", "approver_user_id");
CREATE INDEX "overtime_approval_decisions_overtime_id_idx" ON "overtime_approval_decisions"("overtime_id");

ALTER TABLE "overtime_configs" ADD CONSTRAINT "overtime_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "overtime_approver_configs" ADD CONSTRAINT "overtime_approver_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "overtime_approver_configs" ADD CONSTRAINT "overtime_approver_configs_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "overtime_approval_decisions" ADD CONSTRAINT "overtime_approval_decisions_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "overtime_approval_decisions" ADD CONSTRAINT "overtime_approval_decisions_overtime_id_fkey" FOREIGN KEY ("overtime_id") REFERENCES "overtimes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

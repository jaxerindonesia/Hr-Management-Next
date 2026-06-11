CREATE TABLE "overtime_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID,
    "pay_method" TEXT NOT NULL DEFAULT 'PER_HOUR',
    "hourly_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "daily_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtime_buffer" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overtime_configs_pkey" PRIMARY KEY ("id")
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

CREATE UNIQUE INDEX "overtimes_attendance_id_key" ON "overtimes"("attendance_id");
CREATE INDEX "overtime_configs_tenant_id_idx" ON "overtime_configs"("tenant_id");
CREATE INDEX "overtimes_tenant_id_idx" ON "overtimes"("tenant_id");
CREATE INDEX "overtimes_user_id_overtime_date_idx" ON "overtimes"("user_id", "overtime_date");

ALTER TABLE "overtime_configs" ADD CONSTRAINT "overtime_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

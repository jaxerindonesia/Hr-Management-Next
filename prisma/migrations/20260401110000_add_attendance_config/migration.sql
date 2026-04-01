CREATE TABLE "attendance_configs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "office_start_time" TEXT NOT NULL,
  "office_end_time" TEXT NOT NULL,
  "late_tolerance_minutes" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "attendance_configs_pkey" PRIMARY KEY ("id")
);

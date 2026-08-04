ALTER TABLE "branches"
ADD COLUMN "schedule_type" TEXT NOT NULL DEFAULT 'REGULAR';

CREATE TABLE "branch_working_schedules" (
  "id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "day_of_week" TEXT NOT NULL,
  "is_work_day" BOOLEAN NOT NULL DEFAULT TRUE,
  "start_time" TEXT,
  "end_time" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "branch_working_schedules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "branch_working_schedules_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "branch_working_schedules_branch_id_day_of_week_key" ON "branch_working_schedules"("branch_id", "day_of_week");
CREATE INDEX "branch_working_schedules_branch_id_idx" ON "branch_working_schedules"("branch_id");

INSERT INTO "branch_working_schedules" ("id", "branch_id", "day_of_week", "is_work_day", "start_time", "end_time", "updated_at")
SELECT gen_random_uuid(), branch."id", day.code,
  day.code = ANY(COALESCE(config."working_days", ARRAY['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']::TEXT[])),
  CASE WHEN branch."custom_working_hours_enabled" THEN branch."office_start_time" ELSE COALESCE(config."office_start_time", '09:00') END,
  CASE WHEN branch."custom_working_hours_enabled" THEN branch."office_end_time" ELSE COALESCE(config."office_end_time", '17:00') END,
  CURRENT_TIMESTAMP
FROM "branches" branch
CROSS JOIN (VALUES ('MONDAY'), ('TUESDAY'), ('WEDNESDAY'), ('THURSDAY'), ('FRIDAY'), ('SATURDAY'), ('SUNDAY')) AS day(code)
LEFT JOIN LATERAL (
  SELECT "working_days", "office_start_time", "office_end_time" FROM "attendance_configs"
  WHERE "tenant_id" = branch."tenant_id"
  ORDER BY "updated_at" DESC LIMIT 1
) config ON TRUE;

UPDATE "branches"
SET "custom_working_hours_enabled" = TRUE;

CREATE TABLE "work_shifts" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT NOT NULL,
  "crosses_midnight" BOOLEAN NOT NULL DEFAULT FALSE,
  "late_tolerance_minutes" INTEGER,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "work_shifts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "work_shifts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "work_shifts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "work_shifts_branch_id_name_key" ON "work_shifts"("branch_id", "name");
CREATE UNIQUE INDEX "work_shifts_branch_id_code_key" ON "work_shifts"("branch_id", "code");
CREATE INDEX "work_shifts_tenant_id_idx" ON "work_shifts"("tenant_id");
CREATE INDEX "work_shifts_branch_id_idx" ON "work_shifts"("branch_id");

CREATE TABLE "employee_shift_schedules" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "shift_id" UUID NOT NULL,
  "work_date" DATE NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "employee_shift_schedules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employee_shift_schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "employee_shift_schedules_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "employee_shift_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "employee_shift_schedules_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "work_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "employee_shift_schedules_user_id_work_date_key" ON "employee_shift_schedules"("user_id", "work_date");
CREATE INDEX "employee_shift_schedules_tenant_id_work_date_idx" ON "employee_shift_schedules"("tenant_id", "work_date");
CREATE INDEX "employee_shift_schedules_branch_id_work_date_idx" ON "employee_shift_schedules"("branch_id", "work_date");
CREATE INDEX "employee_shift_schedules_shift_id_idx" ON "employee_shift_schedules"("shift_id");

ALTER TABLE "attendances"
ADD COLUMN "work_shift_id" UUID,
ADD COLUMN "scheduled_start_at" TIMESTAMP(3),
ADD COLUMN "scheduled_end_at" TIMESTAMP(3),
ADD COLUMN "schedule_source" TEXT;

ALTER TABLE "attendances" ADD CONSTRAINT "attendances_work_shift_id_fkey" FOREIGN KEY ("work_shift_id") REFERENCES "work_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "attendances_work_shift_id_idx" ON "attendances"("work_shift_id");

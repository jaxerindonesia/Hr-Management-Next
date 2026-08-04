ALTER TABLE "employee_shift_schedules"
ADD COLUMN "is_day_off" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "employee_shift_schedules"
ALTER COLUMN "shift_id" DROP NOT NULL;

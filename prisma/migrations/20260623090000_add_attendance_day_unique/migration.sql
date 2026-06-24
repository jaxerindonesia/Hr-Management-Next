ALTER TABLE "attendances"
ADD COLUMN "attendance_day" TIMESTAMPTZ;

UPDATE "attendances"
SET "attendance_day" = date_trunc('day', ("date" AT TIME ZONE 'Asia/Jakarta')) AT TIME ZONE 'Asia/Jakarta';

ALTER TABLE "attendances"
ALTER COLUMN "attendance_day" SET NOT NULL;

CREATE UNIQUE INDEX "attendances_user_id_attendance_day_key"
ON "attendances"("user_id", "attendance_day");

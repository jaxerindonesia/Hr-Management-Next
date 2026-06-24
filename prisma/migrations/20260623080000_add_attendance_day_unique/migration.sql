ALTER TABLE "attendances"
ADD COLUMN IF NOT EXISTS "attendance_day" TIMESTAMPTZ;

UPDATE "attendances"
SET "attendance_day" = date_trunc('day', ("date" AT TIME ZONE 'Asia/Jakarta')) AT TIME ZONE 'Asia/Jakarta'
WHERE "attendance_day" IS NULL;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY
        user_id,
        attendance_day
      ORDER BY
        CASE WHEN check_out IS NULL THEN 1 ELSE 0 END,
        updated_at DESC,
        created_at DESC,
        id ASC
    ) AS rn
  FROM attendances
  WHERE attendance_day IS NOT NULL
)
DELETE FROM attendances a
USING ranked r
WHERE a.id = r.id
  AND r.rn > 1;

ALTER TABLE "attendances"
ALTER COLUMN "attendance_day" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "attendances_user_id_attendance_day_key"
ON "attendances"("user_id", "attendance_day");

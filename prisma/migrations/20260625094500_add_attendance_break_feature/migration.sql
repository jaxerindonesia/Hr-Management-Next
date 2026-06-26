ALTER TABLE "attendance_configs"
ADD COLUMN IF NOT EXISTS "break_enabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "attendances"
ADD COLUMN IF NOT EXISTS "break_sessions" JSONB,
ADD COLUMN IF NOT EXISTS "break_duration" TEXT;

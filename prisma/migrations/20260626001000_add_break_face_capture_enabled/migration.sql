ALTER TABLE "attendance_configs"
ADD COLUMN IF NOT EXISTS "break_face_capture_enabled" BOOLEAN NOT NULL DEFAULT false;

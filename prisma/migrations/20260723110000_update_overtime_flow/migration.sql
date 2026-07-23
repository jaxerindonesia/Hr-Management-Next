ALTER TABLE "overtimes"
ALTER COLUMN "start_time" DROP NOT NULL,
ALTER COLUMN "end_time" DROP NOT NULL,
ALTER COLUMN "overtime_minutes" SET DEFAULT 0,
ALTER COLUMN "requested_minutes" SET DEFAULT 0;

ALTER TABLE "overtimes"
ADD COLUMN "proof_url" TEXT,
ADD COLUMN "check_in_location" JSONB,
ADD COLUMN "check_out_location" JSONB,
ADD COLUMN "check_in_face_image" TEXT,
ADD COLUMN "check_out_face_image" TEXT;

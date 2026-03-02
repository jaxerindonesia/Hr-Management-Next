-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "check_in_location" JSONB,
ADD COLUMN     "check_out_location" JSONB,
ADD COLUMN     "work_hours" TEXT;

-- DropIndex
DROP INDEX "attendances_user_id_date_key";

-- AlterTable
ALTER TABLE "attendances" ALTER COLUMN "attendance_day" SET DATA TYPE TIMESTAMP(3);

ALTER TABLE "payrolls"
ADD COLUMN "salary_type" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN "salary_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "paid_attendance_days" INTEGER NOT NULL DEFAULT 0;

UPDATE "payrolls"
SET "salary_rate" = "basic_salary";

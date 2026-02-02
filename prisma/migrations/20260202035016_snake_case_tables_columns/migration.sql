/*
  Warnings:

  - You are about to drop the `Attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payroll` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Performance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Submission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubmissionType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payroll" DROP CONSTRAINT "Payroll_userId_fkey";

-- DropForeignKey
ALTER TABLE "Performance" DROP CONSTRAINT "Performance_userId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_submissionTypeId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_roleId_fkey";

-- DropTable
DROP TABLE "Attendance";

-- DropTable
DROP TABLE "Payroll";

-- DropTable
DROP TABLE "Performance";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "Submission";

-- DropTable
DROP TABLE "SubmissionType";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "permission" JSONB NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nik" TEXT,
    "phone" TEXT,
    "position" TEXT,
    "department" TEXT,
    "join_date" TIMESTAMP(3),
    "salary" DOUBLE PRECISION,
    "avatar_url" TEXT,
    "password" TEXT NOT NULL,
    "current_token" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "submission_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "submission_type_id" UUID NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "check_in" TIMESTAMP(3),
    "check_out" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "basic_salary" DOUBLE PRECISION NOT NULL,
    "allowances" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_salary" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performances" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "productivity" INTEGER NOT NULL,
    "quality" INTEGER NOT NULL,
    "teamwork" INTEGER NOT NULL,
    "discipline" INTEGER NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "evaluated_by" TEXT NOT NULL,
    "evaluated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "performances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "submission_types_name_key" ON "submission_types"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submission_type_id_fkey" FOREIGN KEY ("submission_type_id") REFERENCES "submission_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performances" ADD CONSTRAINT "performances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

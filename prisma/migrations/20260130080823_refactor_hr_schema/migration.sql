/*
  Warnings:

  - You are about to drop the column `employeeId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `Performance` table. All the data in the column will be lost.
  - You are about to drop the `Employee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Leave` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Performance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Leave" DROP CONSTRAINT "Leave_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Payroll" DROP CONSTRAINT "Payroll_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Performance" DROP CONSTRAINT "Performance_employeeId_fkey";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "employeeId",
ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Payroll" DROP COLUMN "employeeId",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Performance" DROP COLUMN "employeeId",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "userId" UUID NOT NULL;

-- DropTable
DROP TABLE "Employee";

-- DropTable
DROP TABLE "Leave";

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "permission" JSONB NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nik" TEXT,
    "phone" TEXT,
    "position" TEXT,
    "department" TEXT,
    "joinDate" TIMESTAMP(3),
    "salary" DOUBLE PRECISION,
    "avatarUrl" TEXT,
    "password" TEXT NOT NULL,
    "currentToken" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SubmissionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "submissionTypeId" UUID NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionType_name_key" ON "SubmissionType"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_submissionTypeId_fkey" FOREIGN KEY ("submissionTypeId") REFERENCES "SubmissionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

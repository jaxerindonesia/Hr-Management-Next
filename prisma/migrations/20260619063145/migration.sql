-- AlterTable
ALTER TABLE "overtime_approval_decisions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "overtime_approver_configs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "overtime_configs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "overtimes" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "approved_by" SET DATA TYPE TEXT;

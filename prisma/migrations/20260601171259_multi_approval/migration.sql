-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "birth_place" TEXT,
ADD COLUMN     "gender" TEXT;

-- RenameIndex
ALTER INDEX "submission_approval_decisions_submission_id_approver_user_id_ke" RENAME TO "submission_approval_decisions_submission_id_approver_user_i_key";

-- RenameIndex
ALTER INDEX "submission_approver_configs_submission_type_id_approver_user_id" RENAME TO "submission_approver_configs_submission_type_id_approver_use_key";

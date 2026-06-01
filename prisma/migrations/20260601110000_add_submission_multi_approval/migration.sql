CREATE TABLE "submission_approver_configs" (
  "id" UUID NOT NULL,
  "submission_type_id" UUID NOT NULL,
  "approver_user_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "submission_approver_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "submission_approval_decisions" (
  "id" UUID NOT NULL,
  "submission_id" UUID NOT NULL,
  "approver_user_id" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reason" TEXT,
  "decided_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "submission_approval_decisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "submission_approver_configs_submission_type_id_approver_user_id_key" ON "submission_approver_configs"("submission_type_id", "approver_user_id");
CREATE INDEX "submission_approver_configs_submission_type_id_idx" ON "submission_approver_configs"("submission_type_id");
CREATE UNIQUE INDEX "submission_approval_decisions_submission_id_approver_user_id_key" ON "submission_approval_decisions"("submission_id", "approver_user_id");
CREATE INDEX "submission_approval_decisions_submission_id_idx" ON "submission_approval_decisions"("submission_id");

ALTER TABLE "submission_approver_configs" ADD CONSTRAINT "submission_approver_configs_submission_type_id_fkey" FOREIGN KEY ("submission_type_id") REFERENCES "submission_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "submission_approver_configs" ADD CONSTRAINT "submission_approver_configs_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "submission_approval_decisions" ADD CONSTRAINT "submission_approval_decisions_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "submission_approval_decisions" ADD CONSTRAINT "submission_approval_decisions_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

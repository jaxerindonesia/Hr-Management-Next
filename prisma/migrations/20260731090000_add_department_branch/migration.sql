ALTER TABLE "departments"
ADD COLUMN "branch_id" UUID;

CREATE INDEX "departments_branch_id_idx" ON "departments"("branch_id");

ALTER TABLE "departments"
ADD CONSTRAINT "departments_branch_id_fkey"
FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

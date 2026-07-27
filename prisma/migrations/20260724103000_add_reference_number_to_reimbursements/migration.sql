ALTER TABLE "reimbursements"
ADD COLUMN "reference_number" TEXT;

UPDATE "reimbursements"
SET "reference_number" = CONCAT(
  'RBM-',
  EXTRACT(YEAR FROM "created_at")::TEXT,
  '-',
  UPPER(SUBSTRING("id"::TEXT, 1, 8))
)
WHERE "reference_number" IS NULL;

CREATE INDEX "reimbursements_reference_number_idx"
ON "reimbursements"("reference_number");

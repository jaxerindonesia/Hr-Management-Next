ALTER TABLE "payrolls"
ADD COLUMN "reference_number" TEXT;

UPDATE "payrolls"
SET "reference_number" = CONCAT(
  'PYR-',
  EXTRACT(YEAR FROM "created_at")::TEXT,
  '-',
  UPPER(SUBSTRING("id"::TEXT, 1, 8))
)
WHERE "reference_number" IS NULL;

CREATE INDEX "payrolls_reference_number_idx"
ON "payrolls"("reference_number");

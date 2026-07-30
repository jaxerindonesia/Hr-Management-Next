UPDATE "branches"
SET "code" = UPPER(TRIM("code"))
WHERE "code" IS NOT NULL;

WITH duplicate_codes AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "tenant_id", "code"
      ORDER BY "created_at", "id"
    ) AS duplicate_number
  FROM "branches"
  WHERE "code" IS NOT NULL
)
UPDATE "branches" AS branch
SET "code" = branch."code" || '-' || SUBSTRING(REPLACE(branch."id"::text, '-', ''), 1, 6)
FROM duplicate_codes
WHERE branch."id" = duplicate_codes."id"
  AND duplicate_codes.duplicate_number > 1;

CREATE UNIQUE INDEX "branches_tenant_id_code_key"
ON "branches"("tenant_id", "code");

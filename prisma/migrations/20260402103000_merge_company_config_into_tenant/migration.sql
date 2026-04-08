ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logo_url" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logo_dark_url" TEXT;

DO $$
DECLARE
  has_company_configs BOOLEAN;
  has_tenant_id BOOLEAN;
  has_logo_dark_url BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'company_configs'
  ) INTO has_company_configs;

  IF NOT has_company_configs THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'company_configs'
      AND column_name = 'tenant_id'
  ) INTO has_tenant_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'company_configs'
      AND column_name = 'logo_dark_url'
  ) INTO has_logo_dark_url;

  IF has_tenant_id THEN
    IF has_logo_dark_url THEN
      EXECUTE '
        UPDATE "tenants" t
        SET
          "company_name" = COALESCE(cc."company_name", t."company_name"),
          "logo_url" = COALESCE(cc."logo_url", t."logo_url"),
          "logo_dark_url" = COALESCE(cc."logo_dark_url", t."logo_dark_url")
        FROM "company_configs" cc
        WHERE cc."tenant_id" = t."id"
      ';
    ELSE
      EXECUTE '
        UPDATE "tenants" t
        SET
          "company_name" = COALESCE(cc."company_name", t."company_name"),
          "logo_url" = COALESCE(cc."logo_url", t."logo_url")
        FROM "company_configs" cc
        WHERE cc."tenant_id" = t."id"
      ';
    END IF;
  END IF;
END $$;

DROP TABLE IF EXISTS "company_configs";

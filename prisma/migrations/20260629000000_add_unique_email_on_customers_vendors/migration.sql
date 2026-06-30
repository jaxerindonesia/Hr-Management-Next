-- Add unique constraints for customer/vendor code and email per tenant
CREATE UNIQUE INDEX IF NOT EXISTS "customers_tenant_id_email_key" ON "customers"("tenant_id", "email");
CREATE UNIQUE INDEX IF NOT EXISTS "vendors_tenant_id_email_key" ON "vendors"("tenant_id", "email");

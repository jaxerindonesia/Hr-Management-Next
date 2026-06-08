-- AddForeignKey
ALTER TABLE "petty_cashes" ADD CONSTRAINT "petty_cashes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

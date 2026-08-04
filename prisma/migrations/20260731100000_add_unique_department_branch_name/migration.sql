CREATE UNIQUE INDEX "departments_tenant_id_branch_id_name_key"
ON "departments"("tenant_id", "branch_id", "name");

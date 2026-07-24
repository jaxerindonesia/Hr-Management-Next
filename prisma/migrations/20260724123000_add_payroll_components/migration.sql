CREATE TABLE "payroll_component_configs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "input_type" TEXT NOT NULL,
    "default_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_component_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payroll_component_values" (
    "id" UUID NOT NULL,
    "payroll_id" UUID NOT NULL,
    "component_config_id" UUID,
    "name_snapshot" TEXT NOT NULL,
    "type_snapshot" TEXT NOT NULL,
    "input_type_snapshot" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "base_value" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_component_values_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payroll_component_configs_tenant_id_idx" ON "payroll_component_configs"("tenant_id");
CREATE INDEX "payroll_component_configs_type_idx" ON "payroll_component_configs"("type");
CREATE INDEX "payroll_component_values_payroll_id_idx" ON "payroll_component_values"("payroll_id");
CREATE INDEX "payroll_component_values_component_config_id_idx" ON "payroll_component_values"("component_config_id");
CREATE INDEX "payroll_component_values_type_snapshot_idx" ON "payroll_component_values"("type_snapshot");

ALTER TABLE "payroll_component_configs"
ADD CONSTRAINT "payroll_component_configs_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payroll_component_values"
ADD CONSTRAINT "payroll_component_values_payroll_id_fkey"
FOREIGN KEY ("payroll_id") REFERENCES "payrolls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payroll_component_values"
ADD CONSTRAINT "payroll_component_values_component_config_id_fkey"
FOREIGN KEY ("component_config_id") REFERENCES "payroll_component_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

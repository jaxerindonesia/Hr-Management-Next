-- CreateTable
CREATE TABLE "petty_cashes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "transfer_date" TIMESTAMP(3),
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID,

    CONSTRAINT "petty_cashes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petty_cash_usages" (
    "id" UUID NOT NULL,
    "petty_cash_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "usage_date" TIMESTAMP(3) NOT NULL,
    "receipt_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "petty_cash_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "petty_cashes_tenant_id_idx" ON "petty_cashes"("tenant_id");

-- CreateIndex
CREATE INDEX "petty_cashes_user_id_idx" ON "petty_cashes"("user_id");

-- CreateIndex
CREATE INDEX "petty_cash_usages_petty_cash_id_idx" ON "petty_cash_usages"("petty_cash_id");

-- AddForeignKey
ALTER TABLE "petty_cashes" ADD CONSTRAINT "petty_cashes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_usages" ADD CONSTRAINT "petty_cash_usages_petty_cash_id_fkey" FOREIGN KEY ("petty_cash_id") REFERENCES "petty_cashes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

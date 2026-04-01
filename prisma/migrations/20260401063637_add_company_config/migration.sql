-- AlterTable
ALTER TABLE "attendance_configs" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "company_configs" (
    "id" UUID NOT NULL,
    "company_name" TEXT,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_configs_pkey" PRIMARY KEY ("id")
);

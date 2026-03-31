-- AlterTable
ALTER TABLE "submission_types" ADD COLUMN     "leave_config_id" UUID;

-- CreateTable
CREATE TABLE "leave_configs" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "max_days" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_configs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "submission_types" ADD CONSTRAINT "submission_types_leave_config_id_fkey" FOREIGN KEY ("leave_config_id") REFERENCES "leave_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

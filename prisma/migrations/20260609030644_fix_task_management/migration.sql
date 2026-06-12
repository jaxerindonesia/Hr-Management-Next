/*
  Warnings:

  - You are about to drop the column `tenant_id` on the `task_attachments` table. All the data in the column will be lost.
  - You are about to drop the column `department_id` on the `task_lists` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_id` on the `task_lists` table. All the data in the column will be lost.
  - You are about to drop the `task_assignees` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `board_id` to the `task_lists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by_id` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "task_assignees" DROP CONSTRAINT "task_assignees_task_id_fkey";

-- DropForeignKey
ALTER TABLE "task_assignees" DROP CONSTRAINT "task_assignees_user_id_fkey";

-- DropForeignKey
ALTER TABLE "task_attachments" DROP CONSTRAINT "task_attachments_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "task_lists" DROP CONSTRAINT "task_lists_department_id_fkey";

-- DropForeignKey
ALTER TABLE "task_lists" DROP CONSTRAINT "task_lists_tenant_id_fkey";

-- DropIndex
DROP INDEX "task_attachments_tenant_id_idx";

-- DropIndex
DROP INDEX "task_lists_department_id_idx";

-- DropIndex
DROP INDEX "task_lists_tenant_id_idx";

-- AlterTable
ALTER TABLE "task_attachments" DROP COLUMN "tenant_id",
ADD COLUMN     "size" INTEGER,
ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "task_lists" DROP COLUMN "department_id",
DROP COLUMN "tenant_id",
ADD COLUMN     "board_id" UUID NOT NULL,
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "created_by_id" UUID NOT NULL,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "label_name" TEXT,
ALTER COLUMN "label_color" DROP NOT NULL,
ALTER COLUMN "label_color" DROP DEFAULT;

-- DropTable
DROP TABLE "task_assignees";

-- CreateTable
CREATE TABLE "task_boards" (
    "id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "tenant_id" UUID,

    CONSTRAINT "task_boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_members" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_boards_department_id_idx" ON "task_boards"("department_id");

-- CreateIndex
CREATE INDEX "task_boards_tenant_id_idx" ON "task_boards"("tenant_id");

-- CreateIndex
CREATE INDEX "task_members_task_id_idx" ON "task_members"("task_id");

-- CreateIndex
CREATE INDEX "task_members_user_id_idx" ON "task_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_members_task_id_user_id_key" ON "task_members"("task_id", "user_id");

-- CreateIndex
CREATE INDEX "task_lists_board_id_idx" ON "task_lists"("board_id");

-- CreateIndex
CREATE INDEX "tasks_created_by_id_idx" ON "tasks"("created_by_id");

-- AddForeignKey
ALTER TABLE "task_boards" ADD CONSTRAINT "task_boards_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_boards" ADD CONSTRAINT "task_boards_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_lists" ADD CONSTRAINT "task_lists_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "task_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_members" ADD CONSTRAINT "task_members_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_members" ADD CONSTRAINT "task_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

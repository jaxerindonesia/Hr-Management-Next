/*
  Warnings:

  - You are about to drop the column `label_color` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `label_name` on the `tasks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "label_color",
DROP COLUMN "label_name";

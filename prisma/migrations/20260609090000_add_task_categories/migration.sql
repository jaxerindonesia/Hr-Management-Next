-- CreateTable
CREATE TABLE "task_categories" (
    "id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_category_on_tasks" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_category_on_tasks_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "task_categories_department_id_idx" ON "task_categories"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_categories_department_id_name_key" ON "task_categories"("department_id", "name");

-- CreateIndex
CREATE INDEX "task_category_on_tasks_task_id_idx" ON "task_category_on_tasks"("task_id");

-- CreateIndex
CREATE INDEX "task_category_on_tasks_category_id_idx" ON "task_category_on_tasks"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_category_on_tasks_task_id_category_id_key" ON "task_category_on_tasks"("task_id", "category_id");

-- AddForeignKey
ALTER TABLE "task_categories" ADD CONSTRAINT "task_categories_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_category_on_tasks" ADD CONSTRAINT "task_category_on_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_category_on_tasks" ADD CONSTRAINT "task_category_on_tasks_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "task_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

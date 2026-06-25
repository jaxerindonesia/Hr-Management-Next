-- CreateTable
CREATE TABLE "task_done_move_permissions" (
    "id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_done_move_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_done_move_permissions_department_id_idx" ON "task_done_move_permissions"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_done_move_permissions_department_id_user_id_key" ON "task_done_move_permissions"("department_id", "user_id");

-- AddForeignKey
ALTER TABLE "task_done_move_permissions" ADD CONSTRAINT "task_done_move_permissions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_done_move_permissions" ADD CONSTRAINT "task_done_move_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

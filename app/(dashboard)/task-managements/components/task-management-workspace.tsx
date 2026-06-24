import Image from "next/image";
import { Dispatch, SetStateAction } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Member = {
  id: string;
  name: string;
  email?: string | null;
  position?: string | null;
  avatarUrl?: string | null;
};

type TaskAttachment = {
  id?: string;
  name: string;
  url: string;
  objectKey?: string | null;
  type?: string | null;
};

type TaskCard = {
  id: string;
  title: string;
  description?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  createdAt?: string | null;
  position: number;
  listId: string;
  departmentId: string;
  members: { user: Member }[];
  categories: { category: { id: string; name: string } }[];
  attachments: TaskAttachment[];
};

type TaskList = {
  id: string;
  name: string;
  position: number;
  tasks: TaskCard[];
};

type BoardData = {
  department: {
    id: string;
    name: string;
    tenantId?: string | null;
    users: Member[];
  };
  lists: TaskList[];
};

type ListTheme = {
  accent: string;
  dot: string;
  border: string;
  empty: string;
};

type Props = {
  board: BoardData | null;
  boardView: "board" | "gantt" | "calendar";
  setBoardView: Dispatch<SetStateAction<"board" | "gantt" | "calendar">>;
  timelineMonth: Date;
  setTimelineMonth: Dispatch<SetStateAction<Date>>;
  loadingBoard: boolean;
  draggedListId: string;
  draggedTaskId: string;
  editingListId: string;
  editingListName: string;
  taskById: Map<string, TaskCard>;
  getListTheme: (name: string, index: number) => ListTheme;
  getTaskListTheme: (listId: string) => ListTheme;
  formatMonthYear: (date: Date) => string;
  formatDate: (value?: string | null) => string;
  toDate: (value?: string | null) => Date;
  diffDays: (start: Date, end: Date) => number;
  isSameDay: (a: Date, b: Date) => boolean;
  boardTasks: (TaskCard & { listName: string })[];
  calendarDays: Date[];
  monthDays: Date[];
  openCreateTask: (listId: string) => void;
  openEditTask: (task: TaskCard) => void;
  openTaskDetail: (task: TaskCard) => void;
  moveTask: (task: TaskCard, listId: string) => Promise<void>;
  moveList: (targetListId: string) => Promise<void>;
  deleteList: (list: TaskList) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateList: (listId: string) => Promise<void>;
  setDraggedListId: Dispatch<SetStateAction<string>>;
  setDraggedTaskId: Dispatch<SetStateAction<string>>;
  setEditingListId: Dispatch<SetStateAction<string>>;
  setEditingListName: Dispatch<SetStateAction<string>>;
  canManageSelectedDepartment: boolean;
};

function getCalendarTaskColor(task: TaskCard, getTaskListTheme: (listId: string) => ListTheme) {
  return getTaskListTheme(task.listId).accent;
}

function getMemberInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0]?.slice(0, 2);
  return initials?.toUpperCase() || "?";
}

function getMemberBadgeColor(index: number) {
  return [
    "bg-blue-600 text-white",
    "bg-emerald-600 text-white",
    "bg-violet-600 text-white",
    "bg-amber-500 text-white",
  ][index % 4];
}

export function TaskManagementWorkspace({
  board,
  boardView,
  setBoardView,
  timelineMonth,
  setTimelineMonth,
  loadingBoard,
  draggedListId,
  draggedTaskId,
  editingListId,
  editingListName,
  taskById,
  getListTheme,
  getTaskListTheme,
  formatMonthYear,
  formatDate,
  toDate,
  diffDays,
  isSameDay,
  boardTasks,
  calendarDays,
  monthDays,
  openCreateTask,
  openEditTask,
  openTaskDetail,
  moveTask,
  moveList,
  deleteList,
  deleteTask,
  updateList,
  setDraggedListId,
  setDraggedTaskId,
  setEditingListId,
  setEditingListName,
  canManageSelectedDepartment,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-gray-200 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex overflow-x-auto">
          {[
            { id: "board", label: "Board" },
            { id: "gantt", label: "Gantt Chart" },
            { id: "calendar", label: "Kalender" },
          ].map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setBoardView(view.id as "board" | "gantt" | "calendar")}
              className={`min-w-fit border-b-2 px-4 py-3 text-sm font-semibold transition ${
                boardView === view.id
                  ? "border-blue-600 text-blue-600 dark:text-blue-300"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>

        {boardView !== "board" && (
          <div className="mb-3 flex items-center gap-2 lg:mb-0">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() =>
                setTimelineMonth(
                  new Date(timelineMonth.getFullYear(), timelineMonth.getMonth() - 1, 1),
                )
              }
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-40 rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm font-semibold text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
              {formatMonthYear(timelineMonth)}
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() =>
                setTimelineMonth(
                  new Date(timelineMonth.getFullYear(), timelineMonth.getMonth() + 1, 1),
                )
              }
              title="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-9 rounded-lg"
              onClick={() => {
                const today = new Date();
                setTimelineMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              }}
            >
              Hari ini
            </Button>
          </div>
        )}
      </div>

      {loadingBoard ? (
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          Memuat board tugas...
        </div>
      ) : boardView === "board" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {board?.lists.map((list, listIndex) => {
            const theme = getListTheme(list.name, listIndex);

            return (
              <section
                key={list.id}
                onDragEnter={(event) => {
                  if (canManageSelectedDepartment && draggedListId) event.preventDefault();
                }}
                onDragOver={(event) => {
                  if (canManageSelectedDepartment) event.preventDefault();
                }}
                onDrop={() => {
                  if (!canManageSelectedDepartment) return;
                  if (draggedListId) {
                    void moveList(list.id);
                    setDraggedListId("");
                    return;
                  }

                  const task = taskById.get(draggedTaskId);
                  if (task) void moveTask(task, list.id);
                  setDraggedTaskId("");
                }}
                className={`flex max-h-[calc(100vh-220px)] min-w-[300px] max-w-[300px] flex-col rounded-xl border border-gray-200 border-t-2 bg-white shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900 ${theme.border} ${
                  draggedListId === list.id ? "opacity-60" : ""
                }`}
              >
                <div className="border-b border-gray-100 p-4 dark:border-gray-800">
                  {editingListId === list.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editingListName}
                        onChange={(e) => setEditingListName(e.target.value)}
                        className="h-8"
                      />
                      <Button size="icon-sm" onClick={() => void updateList(list.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => setEditingListId("")}
                      >
                        <Trash2 className="h-4 w-4 opacity-0" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className="flex min-w-0 cursor-grab items-start gap-2 active:cursor-grabbing"
                        draggable={canManageSelectedDepartment}
                        onDragStart={() => setDraggedListId(list.id)}
                        onDragEnd={() => setDraggedListId("")}
                        title={canManageSelectedDepartment ? "Drag untuk mengubah urutan list" : undefined}
                      >
                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${theme.dot}`} />
                            <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                              {list.name}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {list.tasks.length} task
                          </p>
                        </div>
                      </div>
                      {canManageSelectedDepartment && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditingListId(list.id);
                              setEditingListName(list.name);
                            }}
                            title="Edit list"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => void deleteList(list)}
                            title="Hapus list"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                  {list.tasks.length > 0 ? (
                    list.tasks.map((task) => (
                      <article
                        key={task.id}
                        draggable={canManageSelectedDepartment}
                        onDragStart={() => setDraggedTaskId(task.id)}
                        onDragEnd={() => setDraggedTaskId("")}
                        role="button"
                        tabIndex={0}
                        onClick={() => openTaskDetail(task)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openTaskDetail(task);
                          }
                        }}
                        className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
                        style={{
                          borderTopWidth: 4,
                          borderTopColor: theme.accent,
                        }}
                      >
                        <div className="mb-3 flex flex-wrap gap-1">
                          {task.categories.length > 0 ? (
                            task.categories.map(({ category }) => (
                              <span
                                key={category.id}
                                className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={{
                                  backgroundColor: `${theme.accent}1A`,
                                  color: theme.accent,
                                }}
                              >
                                {category.name}
                              </span>
                            ))
                          ) : (
                            <span className="inline-flex rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-400 dark:bg-gray-900 dark:text-gray-500">
                              No category
                            </span>
                          )}
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {task.title}
                          </h4>
                          {canManageSelectedDepartment && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditTask(task);
                                }}
                                title="Edit task"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void deleteTask(task.id);
                                }}
                                title="Hapus task"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {task.description && (
                          <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                            {task.description}
                          </p>
                        )}

                        {task.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {task.attachments.slice(0, 2).map((attachment, index) => (
                              <button
                                key={`${attachment.url}-${index}`}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(attachment.url, "_blank", "noopener,noreferrer");
                                }}
                                className="flex w-full items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-2 text-left transition hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
                              >
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white dark:bg-gray-950">
                                  {attachment.url.match(/\.(png|jpg|jpeg|webp|gif)$/i) ? (
                                    <Image
                                      src={attachment.url}
                                      alt={attachment.name || "Attachment"}
                                      width={48}
                                      height={48}
                                      className="h-12 w-12 object-cover"
                                    />
                                  ) : (
                                    <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">
                                      {(attachment.type || "File").slice(0, 4)}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                                    {attachment.name || "Attachment"}
                                  </p>
                                  <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                                    {attachment.url}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {task.members.slice(0, 2).map((member, index) => (
                                <div
                                  key={member.user.id}
                                  title={member.user.name}
                                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold shadow-sm dark:border-gray-950 ${getMemberBadgeColor(index)}`}
                                >
                                  {getMemberInitials(member.user.name)}
                                </div>
                              ))}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {task.members.length} member
                            </p>
                          </div>
                          {task.dueDate && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div
                      className={`flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-6 text-center ${theme.empty} dark:border-gray-700`}
                    >
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/80 dark:bg-gray-950/50">
                        <CalendarDays className="h-10 w-10" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Belum ada task
                      </h4>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Tambahkan task baru ke list ini
                      </p>
                    </div>
                  )}
                </div>

                {canManageSelectedDepartment && (
                  <div className="border-t border-gray-100 p-3 dark:border-gray-800">
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-lg"
                      onClick={() => openCreateTask(list.id)}
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Task
                    </Button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : boardView === "gantt" ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Gantt Chart</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Timeline task untuk {board?.department.name || "department"}
              </p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{boardTasks.length} task</p>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {(() => {
                const monthStart = new Date(timelineMonth.getFullYear(), timelineMonth.getMonth(), 1);
                const monthEnd = new Date(timelineMonth.getFullYear(), timelineMonth.getMonth() + 1, 0);
                const dayCount = monthDays.length;
                const gridTemplateColumns = `260px 120px 120px repeat(${dayCount}, minmax(40px, 1fr))`;

                return (
                  <>
                    <div
                      className="grid border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400"
                      style={{ gridTemplateColumns }}
                    >
                      <div className="p-3">Nama Tugas</div>
                      <div className="p-3">Mulai</div>
                      <div className="p-3">Selesai</div>
                      {monthDays.map((day) => (
                        <div
                          key={day.toISOString()}
                          className="border-l border-gray-100 p-3 text-center dark:border-gray-800"
                        >
                          {day.getDate()}
                        </div>
                      ))}
                    </div>

                    {boardTasks.length > 0 ? (
                      boardTasks.map((task) => {
                        const start = toDate(task.startDate || task.createdAt || task.dueDate);
                        const end = task.dueDate ? toDate(task.dueDate) : start;
                        if (end < monthStart || start > monthEnd) {
                          return null;
                        }
                        const visibleStart = start > monthStart ? start : monthStart;
                        const visibleEnd = end < monthEnd ? end : monthEnd;
                        const startIndex = diffDays(monthStart, visibleStart);
                        const endIndex = diffDays(monthStart, visibleEnd);
                        const color = getCalendarTaskColor(task, getTaskListTheme);

                        return (
                          <div
                            key={task.id}
                            className="grid border-b border-gray-100 text-sm dark:border-gray-800"
                            style={{ gridTemplateColumns }}
                          >
                            <div className="p-3">
                              <p className="font-semibold text-gray-900 dark:text-white">{task.title}</p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {task.listName}
                              </p>
                            </div>
                            <div className="p-3 text-gray-700 dark:text-gray-300">
                              {formatDate(task.startDate || task.createdAt || task.dueDate)}
                            </div>
                            <div className="p-3 text-gray-700 dark:text-gray-300">
                              {formatDate(task.dueDate || task.startDate || task.createdAt)}
                            </div>
                            {monthDays.map((day, index) => {
                              const active = index >= startIndex && index <= endIndex;
                              const isFirst = index === startIndex;
                              const isLast = index === endIndex;
                              return (
                                <div
                                  key={`${task.id}-${day.toISOString()}`}
                                  className="relative border-l border-gray-100 p-2 dark:border-gray-800"
                                >
                                  {active ? (
                                    <div
                                      className={`h-8 ${isFirst ? "rounded-l-lg" : ""} ${
                                        isLast ? "rounded-r-lg" : ""
                                      }`}
                                      style={{ backgroundColor: color, opacity: 0.85 }}
                                    />
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        Tambahkan task dengan start date dan due date untuk melihat Gantt Chart.
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Kalender</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Jadwal task untuk {board?.department.name || "department"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              {board?.lists.map((list, index) => {
                const theme = getListTheme(list.name, index);
                return (
                  <div key={list.id} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                    <span>{list.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
            {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((day) => (
              <div key={day} className="border-l border-gray-100 p-3 first:border-l-0 dark:border-gray-800">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const tasks = boardTasks.filter((task) =>
                isSameDay(toDate(task.startDate || task.dueDate || task.createdAt), day),
              );

              return (
                <div
                  key={day.toISOString()}
                  className="min-h-36 border-l border-b border-gray-100 p-2 first:border-l-0 dark:border-gray-800"
                >
                  <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {day.getDate()}
                  </div>
                  <div className="space-y-2">
                    {tasks.map((task) => {
                      const theme = getTaskListTheme(task.listId);
                      return (
                        <div
                          key={task.id}
                          className="rounded-lg px-3 py-2 text-xs text-white shadow-sm"
                          style={{ backgroundColor: theme.accent }}
                        >
                          <div className="font-semibold">{task.title}</div>
                          <div className="mt-0.5 text-[11px] opacity-90">{task.listName}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

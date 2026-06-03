"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Edit,
  FileText,
  GripVertical,
  Grid3X3,
  LinkIcon,
  List,
  ListPlus,
  MoreHorizontal,
  Plus,
  Save,
  Search,
  TimerReset,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DepartmentCard = {
  id: string;
  name: string;
  tenantId?: string | null;
  users: { id: string; name: string }[];
  tasks?: {
    id: string;
    dueDate?: string | null;
    list?: { name: string } | null;
  }[];
  _count: {
    users: number;
    tasks: number;
  };
};

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
  type?: string | null;
};

type TaskCard = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  createdAt?: string | null;
  labelColor: string;
  position: number;
  listId: string;
  departmentId: string;
  assignees: { user: Member }[];
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

type TaskFormState = {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  labelColor: string;
  listId: string;
  memberIds: string[];
  attachments: TaskAttachment[];
};

const EMPTY_TASK_FORM: TaskFormState = {
  title: "",
  description: "",
  dueDate: "",
  labelColor: "#2563eb",
  listId: "",
  memberIds: [],
  attachments: [],
};

const LABEL_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#f59e0b",
  "#7c3aed",
  "#0891b2",
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0]?.slice(0, 2);
  return initials?.toUpperCase() || "?";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toDate(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function diffDays(start: Date, end: Date) {
  return Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function normalizeAttachmentType(url: string) {
  const lower = url.toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF";
  if (/\.(png|jpg|jpeg|webp|gif)$/.test(lower)) return "Foto";
  return "Link";
}

function getListTheme(name: string, index: number) {
  const key = name.toLowerCase();
  if (key.includes("to do")) {
    return {
      dot: "bg-sky-500",
      border: "border-t-sky-400",
      empty: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300",
    };
  }
  if (key.includes("progress") || key.includes("process")) {
    return {
      dot: "bg-amber-500",
      border: "border-t-amber-400",
      empty: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300",
    };
  }
  if (key.includes("review")) {
    return {
      dot: "bg-blue-600",
      border: "border-t-blue-400",
      empty: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300",
    };
  }
  if (key.includes("done") || key.includes("completed") || key.includes("selesai")) {
    return {
      dot: "bg-emerald-500",
      border: "border-t-emerald-400",
      empty: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
    };
  }

  const themes = [
    {
      dot: "bg-violet-500",
      border: "border-t-violet-400",
      empty: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300",
    },
    {
      dot: "bg-rose-500",
      border: "border-t-rose-400",
      empty: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300",
    },
  ];
  return themes[index % themes.length];
}

export default function TaskManagementPage() {
  const [departments, setDepartments] = useState<DepartmentCard[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [board, setBoard] = useState<BoardData | null>(null);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [departmentView, setDepartmentView] = useState<"grid" | "list">("grid");
  const [boardView, setBoardView] = useState<"board" | "gantt" | "calendar">("board");
  const [timelineMonth, setTimelineMonth] = useState(() => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [editingListId, setEditingListId] = useState("");
  const [editingListName, setEditingListName] = useState("");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskFormState>(EMPTY_TASK_FORM);
  const [savingTask, setSavingTask] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState("");
  const [draggedListId, setDraggedListId] = useState("");

  const selectedDepartment = useMemo(
    () => departments.find((item) => item.id === selectedDepartmentId) || null,
    [departments, selectedDepartmentId],
  );

  const taskDashboardStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return departments.reduce(
      (acc, department) => {
        const tasks = department.tasks || [];
        acc.totalTasks += department._count.tasks;
        acc.totalMembers += department._count.users;

        tasks.forEach((task) => {
          const listName = task.list?.name.toLowerCase() || "";
          const isCompleted = ["done", "completed", "selesai"].some((keyword) =>
            listName.includes(keyword),
          );
          if (isCompleted) acc.completed += 1;
          else acc.onProgress += 1;

          if (!isCompleted && task.dueDate) {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            if (dueDate < today) acc.overdue += 1;
          }
        });

        return acc;
      },
      {
        activeDepartments: departments.length,
        totalMembers: 0,
        totalTasks: 0,
        onProgress: 0,
        completed: 0,
        overdue: 0,
      },
    );
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    const query = departmentSearch.trim().toLowerCase();
    if (!query) return departments;
    return departments.filter((department) =>
      department.name.toLowerCase().includes(query),
    );
  }, [departmentSearch, departments]);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoadingDepartments(true);
      const res = await fetch("/api/task-managements/departments");
      if (!res.ok) throw new Error("Gagal memuat department");
      const json = await res.json();
      setDepartments(json.data || []);
    } catch {
      toast.error("Gagal memuat department");
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  const fetchBoard = useCallback(async (departmentId: string) => {
    try {
      setLoadingBoard(true);
      const params = new URLSearchParams({ departmentId });
      const res = await fetch(`/api/task-managements/lists?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat board");
      const json = await res.json();
      setBoard(json.data || null);
    } catch {
      toast.error("Gagal memuat board tugas");
    } finally {
      setLoadingBoard(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    if (selectedDepartmentId) fetchBoard(selectedDepartmentId);
  }, [selectedDepartmentId, fetchBoard]);

  const openCreateTask = (listId: string) => {
    setTaskForm({ ...EMPTY_TASK_FORM, listId });
    setTaskModalOpen(true);
  };

  const openEditTask = (task: TaskCard) => {
    setTaskForm({
      id: task.id,
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      labelColor: task.labelColor || "#2563eb",
      listId: task.listId,
      memberIds: task.assignees.map((item) => item.user.id),
      attachments: task.attachments.map((item) => ({
        id: item.id,
        name: item.name,
        url: item.url,
        type: item.type || normalizeAttachmentType(item.url),
      })),
    });
    setTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setTaskModalOpen(false);
    setTaskForm(EMPTY_TASK_FORM);
  };

  const createList = async () => {
    const name = newListName.trim();
    if (!name || !selectedDepartmentId) return;

    try {
      const res = await fetch("/api/task-managements/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, departmentId: selectedDepartmentId }),
      });
      if (!res.ok) throw new Error("Gagal membuat list");
      setNewListName("");
      toast.success("List berhasil ditambahkan");
      fetchBoard(selectedDepartmentId);
    } catch {
      toast.error("Gagal menambahkan list");
    }
  };

  const updateList = async (listId: string) => {
    const name = editingListName.trim();
    if (!name) return;

    try {
      const res = await fetch(`/api/task-managements/lists/${listId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Gagal mengubah list");
      setEditingListId("");
      setEditingListName("");
      toast.success("List berhasil diubah");
      fetchBoard(selectedDepartmentId);
    } catch {
      toast.error("Gagal mengubah list");
    }
  };

  const deleteList = async (list: TaskList) => {
    if (list.tasks.length > 0) {
      toast.error("List masih berisi task");
      return;
    }

    if (!window.confirm(`Hapus list ${list.name}?`)) return;

    try {
      const res = await fetch(`/api/task-managements/lists/${list.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus list");
      toast.success("List berhasil dihapus");
      fetchBoard(selectedDepartmentId);
    } catch {
      toast.error("Gagal menghapus list");
    }
  };

  const saveTask = async () => {
    if (!taskForm.title.trim() || !selectedDepartmentId || !taskForm.listId) {
      toast.error("Nama task dan list wajib diisi");
      return;
    }

    try {
      setSavingTask(true);
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || null,
        dueDate: taskForm.dueDate || null,
        labelColor: taskForm.labelColor,
        listId: taskForm.listId,
        departmentId: selectedDepartmentId,
        memberIds: taskForm.memberIds,
        attachments: taskForm.attachments
          .filter((item) => item.name.trim() && item.url.trim())
          .map((item) => ({
            name: item.name.trim(),
            url: item.url.trim(),
            type: item.type || normalizeAttachmentType(item.url),
          })),
      };

      const res = await fetch(
        taskForm.id
          ? `/api/task-managements/tasks/${taskForm.id}`
          : "/api/task-managements/tasks",
        {
          method: taskForm.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error("Gagal menyimpan task");
      toast.success(taskForm.id ? "Task berhasil diubah" : "Task berhasil dibuat");
      closeTaskModal();
      fetchBoard(selectedDepartmentId);
      fetchDepartments();
    } catch {
      toast.error("Gagal menyimpan task");
    } finally {
      setSavingTask(false);
    }
  };

  const moveTask = async (task: TaskCard, listId: string) => {
    if (task.listId === listId) return;

    try {
      const res = await fetch(`/api/task-managements/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId }),
      });
      if (!res.ok) throw new Error("Gagal memindahkan task");
      toast.success("Task berhasil dipindahkan");
      fetchBoard(selectedDepartmentId);
    } catch {
      toast.error("Gagal memindahkan task");
    }
  };

  const moveList = async (targetListId: string) => {
    if (!board || !draggedListId || draggedListId === targetListId) return;

    const fromIndex = board.lists.findIndex((list) => list.id === draggedListId);
    const toIndex = board.lists.findIndex((list) => list.id === targetListId);
    if (fromIndex < 0 || toIndex < 0) return;

    const nextLists = [...board.lists];
    const [movedList] = nextLists.splice(fromIndex, 1);
    nextLists.splice(toIndex, 0, movedList);

    setBoard({ ...board, lists: nextLists });

    try {
      const responses = await Promise.all(
        nextLists.map((list, index) =>
          fetch(`/api/task-managements/lists/${list.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ position: index }),
          }),
        ),
      );
      if (responses.some((response) => !response.ok)) {
        throw new Error("Gagal mengubah urutan list");
      }
    } catch {
      toast.error("Gagal mengubah urutan list");
      fetchBoard(selectedDepartmentId);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm("Hapus task ini?")) return;

    try {
      const res = await fetch(`/api/task-managements/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus task");
      toast.success("Task berhasil dihapus");
      fetchBoard(selectedDepartmentId);
      fetchDepartments();
    } catch {
      toast.error("Gagal menghapus task");
    }
  };

  const toggleMember = (memberId: string) => {
    setTaskForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter((id) => id !== memberId)
        : [...prev.memberIds, memberId],
    }));
  };

  const updateAttachment = (
    index: number,
    field: "name" | "url" | "type",
    value: string,
  ) => {
    setTaskForm((prev) => ({
      ...prev,
      attachments: prev.attachments.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const taskById = useMemo(() => {
    const map = new Map<string, TaskCard>();
    board?.lists.forEach((list) => {
      list.tasks.forEach((task) => map.set(task.id, task));
    });
    return map;
  }, [board]);

  const boardTasks = useMemo(
    () =>
      board?.lists.flatMap((list) =>
        list.tasks.map((task) => ({
          ...task,
          listName: list.name,
        })),
      ) || [],
    [board],
  );

  const taskFormListName = useMemo(
    () => board?.lists.find((list) => list.id === taskForm.listId)?.name || "",
    [board?.lists, taskForm.listId],
  );

  const monthDays = useMemo(() => {
    const lastDay = new Date(
      timelineMonth.getFullYear(),
      timelineMonth.getMonth() + 1,
      0,
    ).getDate();
    return Array.from({ length: lastDay }, (_, index) =>
      new Date(timelineMonth.getFullYear(), timelineMonth.getMonth(), index + 1),
    );
  }, [timelineMonth]);

  const calendarDays = useMemo(() => {
    const monthStart = new Date(timelineMonth.getFullYear(), timelineMonth.getMonth(), 1);
    const offset = (monthStart.getDay() + 6) % 7;
    const gridStart = addDays(monthStart, -offset);
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [timelineMonth]);

  if (!selectedDepartmentId) {
    return (
      <div className="space-y-7">
        <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: "Department",
                helper: "Aktif",
                value: taskDashboardStats.activeDepartments,
                icon: BriefcaseBusiness,
                color: "blue",
              },
              {
                label: "Total Task",
                helper: "Semua Department",
                value: taskDashboardStats.totalTasks,
                icon: FileText,
                color: "emerald",
              },
              {
                label: "On Progress",
                helper: "Sedang Dikerjakan",
                value: taskDashboardStats.onProgress,
                icon: Clock3,
                color: "amber",
              },
              {
                label: "Completed",
                helper: "Selesai",
                value: taskDashboardStats.completed,
                icon: CheckCircle2,
                color: "violet",
              },
              {
                label: "Overdue",
                helper: "Terlambat",
                value: taskDashboardStats.overdue,
                icon: TimerReset,
                color: "rose",
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              const colorMap = {
                blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300",
                emerald:
                  "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
                amber:
                  "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300",
                violet:
                  "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300",
                rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300",
              }[stat.color];

              return (
                <div
                  key={stat.label}
                  className={`flex items-center gap-4 xl:border-r xl:border-gray-200 xl:pr-5 xl:dark:border-gray-800 ${
                    index === 4 ? "xl:border-r-0 xl:pr-0" : ""
                  }`}
                >
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${colorMap}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold leading-7 text-gray-950 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {stat.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stat.helper}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Pilih Department
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Board tugas dibuat berdasarkan department yang sudah terdaftar.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={departmentSearch}
                onChange={(event) => setDepartmentSearch(event.target.value)}
                placeholder="Cari department..."
                className="h-10 w-full pl-10 sm:w-72"
              />
            </div>
            <div className="flex h-10 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
              <Button
                type="button"
                size="icon-sm"
                variant={departmentView === "grid" ? "default" : "ghost"}
                onClick={() => setDepartmentView("grid")}
                title="Tampilan grid"
                className={departmentView === "grid" ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant={departmentView === "list" ? "default" : "ghost"}
                onClick={() => setDepartmentView("list")}
                title="Tampilan list"
                className={departmentView === "list" ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {loadingDepartments ? (
          <div className="rounded-xl border bg-white p-6 text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            Memuat department...
          </div>
        ) : filteredDepartments.length > 0 ? (
          <div
            className={
              departmentView === "grid"
                ? "grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3"
                : "grid grid-cols-1 gap-4"
            }
          >
            {filteredDepartments.map((department, index) => {
              const doneTasks =
                department.tasks?.filter((task) =>
                  ["done", "completed", "selesai"].some((keyword) =>
                    (task.list?.name.toLowerCase() || "").includes(keyword),
                  ),
                ).length || 0;
              const progress =
                department._count.tasks > 0
                  ? Math.round((doneTasks / department._count.tasks) * 100)
                  : 0;
              const palette = [
                {
                  icon: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300",
                  band: "from-blue-50 to-blue-100/70 dark:from-blue-950/40 dark:to-blue-900/20",
                  button:
                    "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50",
                },
                {
                  icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
                  band: "from-emerald-50 to-emerald-100/70 dark:from-emerald-950/40 dark:to-emerald-900/20",
                  button:
                    "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50",
                },
                {
                  icon: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300",
                  band: "from-violet-50 to-violet-100/70 dark:from-violet-950/40 dark:to-violet-900/20",
                  button:
                    "bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-300 dark:hover:bg-violet-900/50",
                },
              ][index % 3];

              return (
              <button
                key={department.id}
                onClick={() => setSelectedDepartmentId(department.id)}
                className={`group overflow-hidden rounded-xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 ${
                  departmentView === "list" ? "flex items-stretch" : ""
                }`}
              >
                <div
                  className={`relative bg-gradient-to-r ${palette.band} ${
                    departmentView === "list" ? "w-24 shrink-0" : "h-20"
                  }`}
                >
                  <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm dark:bg-gray-900/90 dark:text-gray-300">
                    <MoreHorizontal className="h-4 w-4" />
                  </div>
                  <div
                    className={`absolute flex h-16 w-16 items-center justify-center rounded-xl border-4 border-white shadow-md dark:border-gray-900 ${palette.icon} ${
                      departmentView === "list"
                        ? "left-4 top-1/2 -translate-y-1/2"
                        : "bottom-0 left-6 translate-y-1/2"
                    }`}
                  >
                    <BriefcaseBusiness className="h-8 w-8" />
                  </div>
                </div>

                <div className={`flex-1 p-5 ${departmentView === "grid" ? "pt-10" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-gray-900 dark:text-white">
                      {department.name}
                    </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {department.name} Department
                      </p>
                    </div>
                    <div className="flex -space-x-2">
                      {department.users.slice(0, 3).map((user, userIndex) => (
                        <div
                          key={user.id}
                          title={user.name}
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[10px] font-bold text-white shadow-sm dark:border-gray-900"
                          style={{
                            backgroundColor: ["#2563eb", "#059669", "#7c3aed"][userIndex % 3],
                          }}
                        >
                          {getInitials(user.name)}
                        </div>
                      ))}
                      {department._count.users > 3 && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-bold text-gray-600 shadow-sm dark:border-gray-900 dark:bg-gray-800 dark:text-gray-300">
                          +{department._count.users - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800">
                    <div className="flex items-center gap-2 pr-3">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {department._count.users}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Anggota
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 px-3">
                      <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {department._count.tasks}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Task
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pl-3">
                      <div
                        className="grid h-10 w-10 place-items-center rounded-full text-[11px] font-bold text-gray-900 dark:text-white"
                        style={{
                          background: `conic-gradient(#2563eb ${progress}%, #e5e7eb 0)`,
                        }}
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-white dark:bg-gray-900">
                          {progress}%
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Selesai
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-6 flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors ${palette.button}`}
                  >
                    Lihat Board
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            {departments.length > 0
              ? "Department tidak ditemukan."
              : "Belum ada department yang terdaftar."}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSelectedDepartmentId("");
                setBoard(null);
              }}
              title="Kembali"
              className="h-10 w-10 rounded-lg border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-950/50 dark:text-blue-300">
              <BriefcaseBusiness className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-6 text-gray-900 dark:text-white">
                {board?.department.name || selectedDepartment?.name || "Department"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {board?.department.users.length || 0} anggota department
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Nama list baru..."
                className="h-10 w-full rounded-lg border-gray-200 bg-white pl-10 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            <Button
              onClick={createList}
              className="h-10 rounded-lg bg-blue-600 px-4 text-white shadow-sm hover:bg-blue-700"
            >
              <ListPlus className="h-4 w-4" />
              Tambah List
            </Button>
          </div>
        </div>

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
                  if (draggedListId) event.preventDefault();
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedListId) {
                    moveList(list.id);
                    setDraggedListId("");
                    return;
                  }

                  const task = taskById.get(draggedTaskId);
                  if (task) moveTask(task, list.id);
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
                      <Button size="icon-sm" onClick={() => updateList(list.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => setEditingListId("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className="flex min-w-0 cursor-grab items-start gap-2 active:cursor-grabbing"
                        draggable
                        onDragStart={() => setDraggedListId(list.id)}
                        onDragEnd={() => setDraggedListId("")}
                        title="Drag untuk mengubah urutan list"
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
                          onClick={() => deleteList(list)}
                          title="Hapus list"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                  {list.tasks.length > 0 ? (
                    list.tasks.map((task) => (
                    <article
                      key={task.id}
                      draggable
                      onDragStart={() => setDraggedTaskId(task.id)}
                      onDragEnd={() => setDraggedTaskId("")}
                      className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
                    >
                      <div
                        className="mb-3 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800"
                      >
                        <div
                          className="h-full rounded-full"
                        style={{ backgroundColor: task.labelColor }}
                        />
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {task.title}
                        </h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditTask(task)}
                            title="Edit task"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => deleteTask(task.id)}
                            title="Hapus task"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(task.dueDate)}
                        </span>
                        {task.attachments.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <LinkIcon className="h-3.5 w-3.5" />
                            {task.attachments.length}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex -space-x-2">
                          {task.assignees.slice(0, 4).map(({ user }) => (
                            <div
                              key={user.id}
                              title={user.name}
                              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[11px] font-bold text-white dark:border-gray-900"
                            >
                              {getInitials(user.name)}
                            </div>
                          ))}
                          {task.assignees.length > 4 && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-300 text-[11px] font-bold text-gray-700 dark:border-gray-900 dark:bg-gray-700 dark:text-gray-200">
                              +{task.assignees.length - 4}
                            </div>
                          )}
                        </div>
                        <Select value={task.listId} onValueChange={(value) => moveTask(task, value)}>
                          <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {board?.lists.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </article>
                    ))
                  ) : (
                    <div className="flex min-h-[250px] flex-col items-center justify-center rounded-xl px-5 text-center">
                      <div
                        className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full ${theme.empty}`}
                      >
                        <ClipboardList className="h-10 w-10" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Belum ada task
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Tambahkan task baru ke list ini
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 p-3 dark:border-gray-800">
                  <Button
                    variant="outline"
                    className="h-10 w-full rounded-lg border-gray-200 bg-white font-semibold shadow-sm dark:border-gray-700 dark:bg-gray-900"
                    onClick={() => openCreateTask(list.id)}
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Task
                  </Button>
                </div>
              </section>
              );
            })}
          </div>
        ) : boardView === "gantt" ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Gantt Chart</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Timeline task untuk {board?.department.name || "department"}
                </p>
              </div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {boardTasks.length} task
              </div>
            </div>

            {boardTasks.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-[980px]">
                  <div className="grid grid-cols-[320px_1fr] border-b border-gray-100 dark:border-gray-800">
                    <div className="grid grid-cols-[1fr_86px_86px] bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                      <div className="px-4 py-3">Nama Tugas</div>
                      <div className="px-3 py-3">Mulai</div>
                      <div className="px-3 py-3">Selesai</div>
                    </div>
                    <div
                      className="grid bg-gray-50 text-center text-[11px] font-semibold text-gray-500 dark:bg-gray-950 dark:text-gray-400"
                      style={{
                        gridTemplateColumns: `repeat(${monthDays.length}, minmax(30px, 1fr))`,
                      }}
                    >
                      {monthDays.map((day) => (
                        <div
                          key={day.toISOString()}
                          className="border-l border-gray-100 py-3 dark:border-gray-800"
                        >
                          {day.getDate()}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    {boardTasks.map((task, index) => {
                      const monthStart = monthDays[0];
                      const monthEnd = monthDays[monthDays.length - 1];
                      const rawStart = toDate(task.createdAt || task.dueDate);
                      const rawEnd = task.dueDate ? toDate(task.dueDate) : rawStart;
                      const taskStart = rawStart > rawEnd ? rawEnd : rawStart;
                      const taskEnd = rawEnd < rawStart ? rawStart : rawEnd;
                      const clampedStart = taskStart < monthStart ? monthStart : taskStart;
                      const clampedEnd = taskEnd > monthEnd ? monthEnd : taskEnd;
                      const startsAfterMonth = taskStart > monthEnd;
                      const endsBeforeMonth = taskEnd < monthStart;
                      const hidden = startsAfterMonth || endsBeforeMonth;
                      const left = (diffDays(monthStart, clampedStart) / monthDays.length) * 100;
                      const width =
                        ((diffDays(clampedStart, clampedEnd) + 1) / monthDays.length) * 100;
                      const assignee = task.assignees[0]?.user;

                      return (
                        <div
                          key={task.id}
                          className="grid grid-cols-[320px_1fr] border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                        >
                          <div className="grid grid-cols-[1fr_86px_86px] items-center text-sm">
                            <div className="flex min-w-0 items-center gap-2 px-4 py-3">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: task.labelColor }}
                              />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-gray-900 dark:text-white">
                                  {task.title}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  {assignee && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                                      {getInitials(assignee.name)}
                                    </span>
                                  )}
                                  <span className="truncate">{task.listName}</span>
                                </div>
                              </div>
                            </div>
                            <div className="px-3 text-xs text-gray-600 dark:text-gray-300">
                              {formatDate(task.createdAt || task.dueDate)}
                            </div>
                            <div className="px-3 text-xs text-gray-600 dark:text-gray-300">
                              {formatDate(task.dueDate || task.createdAt)}
                            </div>
                          </div>

                          <div
                            className="relative grid min-h-16 items-center"
                            style={{
                              gridTemplateColumns: `repeat(${monthDays.length}, minmax(30px, 1fr))`,
                            }}
                          >
                            {monthDays.map((day) => (
                              <div
                                key={day.toISOString()}
                                className={`h-full border-l border-gray-100 dark:border-gray-800 ${
                                  day.getDay() === 0 || day.getDay() === 6
                                    ? "bg-gray-50/80 dark:bg-gray-950/60"
                                    : ""
                                }`}
                              />
                            ))}
                            {!hidden && (
                              <button
                                type="button"
                                onClick={() => openEditTask(task)}
                                className="absolute h-7 rounded-md px-3 text-left text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                style={{
                                  left: `${left}%`,
                                  width: `${Math.max(width, 4)}%`,
                                  backgroundColor: task.labelColor,
                                  top: `${18 + (index % 2) * 4}px`,
                                }}
                                title={task.title}
                              >
                                <span className="block truncate">{task.title}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                  <CalendarDays className="h-10 w-10" />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">Belum ada timeline</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Tambahkan task dengan due date untuk melihat Gantt Chart.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Kalender</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Jadwal task untuk {board?.department.name || "department"}
                </p>
              </div>
              <div className="hidden flex-wrap gap-3 text-xs font-medium text-gray-500 dark:text-gray-400 sm:flex">
                {board?.lists.slice(0, 4).map((list, index) => (
                  <span key={list.id} className="inline-flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${getListTheme(list.name, index).dot}`} />
                    {list.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 text-center text-xs font-bold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
              {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((day) => (
                <div key={day} className="border-r border-gray-100 px-2 py-3 last:border-r-0 dark:border-gray-800">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const inMonth = day.getMonth() === timelineMonth.getMonth();
                const tasks = boardTasks.filter((task) =>
                  isSameDay(toDate(task.dueDate || task.createdAt), day),
                );

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-28 border-r border-b border-gray-100 p-2 last:border-r-0 dark:border-gray-800 ${
                      inMonth ? "bg-white dark:bg-gray-900" : "bg-gray-50/70 dark:bg-gray-950/70"
                    }`}
                  >
                    <div
                      className={`mb-2 text-xs font-semibold ${
                        isSameDay(day, new Date())
                          ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white"
                          : inMonth
                            ? "text-gray-700 dark:text-gray-200"
                            : "text-gray-400"
                      }`}
                    >
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {tasks.slice(0, 3).map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => openEditTask(task)}
                          className="block w-full truncate rounded-md px-2 py-1 text-left text-[11px] font-semibold text-white"
                          style={{ backgroundColor: task.labelColor }}
                          title={task.title}
                        >
                          {task.title}
                        </button>
                      ))}
                      {tasks.length > 3 && (
                        <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                          +{tasks.length - 3} task
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {taskModalOpen && board && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => !savingTask && closeTaskModal()}
          />
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {taskForm.id ? "Edit Task" : "Tambah Task"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {taskForm.id ? "Perbarui task" : "Buat task baru"}
                    {taskFormListName ? (
                      <>
                        {" "}
                        di list{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-300">
                          {taskFormListName}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeTaskModal}
                disabled={savingTask}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-[calc(92vh-80px)] space-y-6 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    Nama Task <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Contoh: Review payroll Mei"
                    className="h-11 rounded-lg border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    List <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={taskForm.listId}
                    onValueChange={(value) =>
                      setTaskForm((prev) => ({ ...prev, listId: value }))
                    }
                  >
                    <SelectTrigger className="h-11 w-full rounded-lg border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950">
                      <SelectValue placeholder="Pilih list" />
                    </SelectTrigger>
                    <SelectContent>
                      {board.lists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) =>
                      setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                    className="h-11 rounded-lg border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    Deskripsi
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-blue-950"
                    placeholder="Detail singkat task"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Label Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {LABEL_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setTaskForm((prev) => ({ ...prev, labelColor: color }))
                      }
                      className={`grid h-9 w-9 place-items-center rounded-full border-2 transition ${
                        taskForm.labelColor === color
                          ? "border-white ring-2 ring-blue-500 dark:border-gray-900"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    >
                      {taskForm.labelColor === color && (
                        <Check className="h-4 w-4 text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                  <Input
                    type="color"
                    value={taskForm.labelColor}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        labelColor: e.target.value,
                      }))
                    }
                    className="h-9 w-12 rounded-lg border-gray-200 p-1 dark:border-gray-700"
                    title="Custom color"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Members
                </label>
                <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950 sm:grid-cols-2">
                  {board.department.users.length > 0 ? (
                    board.department.users.map((member) => (
                      <label
                        key={member.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition ${
                          taskForm.memberIds.includes(member.id)
                            ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40"
                            : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-900"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={taskForm.memberIds.includes(member.id)}
                          onChange={() => toggleMember(member.id)}
                          className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                        />
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                          {getInitials(member.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {member.name}
                          </span>
                          {member.position && (
                            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                              {member.position}
                            </span>
                          )}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Belum ada anggota aktif di department ini.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    Attachment
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setTaskForm((prev) => ({
                        ...prev,
                        attachments: [
                          ...prev.attachments,
                          { name: "", url: "", type: "Link" },
                        ],
                      }))
                    }
                    className="h-9 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah
                  </Button>
                </div>
                <div className="space-y-2">
                  {taskForm.attachments.length > 0 ? (
                    taskForm.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-950 sm:grid-cols-[1fr_1.4fr_110px_36px]"
                      >
                        <Input
                          value={attachment.name}
                          onChange={(e) => updateAttachment(index, "name", e.target.value)}
                          placeholder="Nama file/link"
                          className="h-10 rounded-lg border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                        />
                        <Input
                          value={attachment.url}
                          onChange={(e) => updateAttachment(index, "url", e.target.value)}
                          placeholder="https://... atau /uploads/file.pdf"
                          className="h-10 rounded-lg border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                        />
                        <Select
                          value={attachment.type || "Link"}
                          onValueChange={(value) => updateAttachment(index, "type", value)}
                        >
                          <SelectTrigger className="h-10 w-full rounded-lg border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Link">Link</SelectItem>
                            <SelectItem value="PDF">PDF</SelectItem>
                            <SelectItem value="Foto">Foto</SelectItem>
                            <SelectItem value="File">File</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setTaskForm((prev) => ({
                              ...prev,
                              attachments: prev.attachments.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            }))
                          }
                          className="h-10 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      Belum ada attachment.
                    </div>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Maks. 10 MB per file
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
                <Button
                  variant="outline"
                  onClick={closeTaskModal}
                  disabled={savingTask}
                  className="h-10 rounded-lg px-5"
                >
                  Batal
                </Button>
                <Button
                  onClick={saveTask}
                  disabled={savingTask}
                  className="h-10 rounded-lg bg-blue-600 px-5 text-white shadow-sm hover:bg-blue-700"
                >
                  <Save className="h-4 w-4" />
                  {savingTask ? "Menyimpan..." : "Simpan Task"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

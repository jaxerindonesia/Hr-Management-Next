"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  Grid3X3,
  List,
  ListPlus,
  Plus,
  Download,
  Search,
  TimerReset,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskManagementDialogs } from "./components/task-management-dialogs";
import { TaskManagementWorkspace } from "./components/task-management-workspace";

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

type TaskFormState = {
  id?: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  listId: string;
  memberIds: string[];
  categoryIds: string[];
  attachments: TaskAttachment[];
};

const EMPTY_TASK_FORM: TaskFormState = {
  title: "",
  description: "",
  startDate: "",
  dueDate: "",
  listId: "",
  memberIds: [],
  categoryIds: [],
  attachments: [],
};

type TaskCategory = {
  id: string;
  name: string;
};

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
      accent: "#0ea5e9",
      dot: "bg-sky-500",
      border: "border-t-sky-400",
      empty: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300",
    };
  }
  if (key.includes("progress") || key.includes("process")) {
    return {
      accent: "#f59e0b",
      dot: "bg-amber-500",
      border: "border-t-amber-400",
      empty: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300",
    };
  }
  if (key.includes("review")) {
    return {
      accent: "#2563eb",
      dot: "bg-blue-600",
      border: "border-t-blue-400",
      empty: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300",
    };
  }
  if (key.includes("done") || key.includes("completed") || key.includes("selesai")) {
    return {
      accent: "#10b981",
      dot: "bg-emerald-500",
      border: "border-t-emerald-400",
      empty: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
    };
  }

  const themes = [
    {
      accent: "#8b5cf6",
      dot: "bg-violet-500",
      border: "border-t-violet-400",
      empty: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300",
    },
    {
      accent: "#f43f5e",
      dot: "bg-rose-500",
      border: "border-t-rose-400",
      empty: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300",
    },
  ];
  return themes[index % themes.length];
}

export default function TaskManagementPage() {
  const router = useRouter();
  const params = useParams<{ id_department?: string }>();
  const [departments, setDepartments] = useState<DepartmentCard[]>([]);
  const routeDepartmentId = typeof params?.id_department === "string" ? params.id_department : "";
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(routeDepartmentId);
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
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserDepartmentId, setCurrentUserDepartmentId] = useState("");
  const [newListName, setNewListName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingListId, setEditingListId] = useState("");
  const [editingListName, setEditingListName] = useState("");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskFormState>(EMPTY_TASK_FORM);
  const [savingTask, setSavingTask] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState("");
  const [draggedListId, setDraggedListId] = useState("");
  const attachmentFileInputRef = useRef<HTMLInputElement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: "list"; list: TaskList }
    | { type: "task"; taskId: string }
    | null
  >(null);

  const selectedDepartment = useMemo(
    () => departments.find((item) => item.id === selectedDepartmentId) || null,
    [departments, selectedDepartmentId],
  );

  const canManageSelectedDepartment = useMemo(() => {
    const normalizedRole = currentUserRole.toLowerCase().replace(/\s/g, "");
    if (normalizedRole === "superadmin" || normalizedRole === "admin") {
      return true;
    }

    return Boolean(
      selectedDepartmentId &&
        currentUserDepartmentId &&
        currentUserDepartmentId === selectedDepartmentId,
    );
  }, [currentUserDepartmentId, currentUserRole, selectedDepartmentId]);

  useEffect(() => {
    if (routeDepartmentId && routeDepartmentId !== selectedDepartmentId) {
      setSelectedDepartmentId(routeDepartmentId);
    }
    if (!routeDepartmentId && selectedDepartmentId) {
      setSelectedDepartmentId("");
    }
  }, [routeDepartmentId, selectedDepartmentId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawUser = localStorage.getItem("hr_user_data");
    if (!rawUser) return;

    try {
      const userData = JSON.parse(rawUser);
      const rawRoleName =
        typeof userData?.role === "string" ? userData.role : userData?.role?.name;
      setCurrentUserRole(rawRoleName || "");
      setCurrentUserDepartmentId(userData?.departmentId || "");
    } catch {
      setCurrentUserRole("");
      setCurrentUserDepartmentId("");
    }
  }, []);

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

  const fetchCategories = useCallback(async (departmentId: string) => {
    try {
      const params = new URLSearchParams({ departmentId });
      const res = await fetch(`/api/task-managements/categories?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat kategori");
      const json = await res.json();
      setCategories(json.data || []);
    } catch {
      toast.error("Gagal memuat kategori");
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchBoard(selectedDepartmentId);
      fetchCategories(selectedDepartmentId);
    }
  }, [selectedDepartmentId, fetchBoard, fetchCategories]);

  const openCreateTask = (listId: string) => {
    setTaskForm({ ...EMPTY_TASK_FORM, listId });
    setTaskModalOpen(true);
  };

  const openEditTask = (task: TaskCard) => {
    setTaskForm({
      id: task.id,
      title: task.title,
      description: task.description || "",
      startDate: task.startDate ? task.startDate.slice(0, 10) : "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      listId: task.listId,
      memberIds: task.members.map((item) => item.user.id),
      categoryIds: task.categories.map((item) => item.category.id),
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
      setListDialogOpen(false);
      toast.success("List berhasil ditambahkan");
      fetchBoard(selectedDepartmentId);
    } catch {
      toast.error("Gagal menambahkan list");
    }
  };

  const createCategory = async () => {
    const name = newCategoryName.trim();
    if (!name || !selectedDepartmentId) return;

    try {
      const res = await fetch("/api/task-managements/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, departmentId: selectedDepartmentId }),
      });
      if (!res.ok) throw new Error("Gagal membuat kategori");
      setNewCategoryName("");
      setCategoryDialogOpen(false);
      toast.success("Kategori berhasil ditambahkan");
      fetchCategories(selectedDepartmentId);
    } catch {
      toast.error("Gagal menambahkan kategori");
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!selectedDepartmentId) return;

    try {
      const res = await fetch(`/api/task-managements/categories/${categoryId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus kategori");
      toast.success("Kategori berhasil dihapus");
      fetchCategories(selectedDepartmentId);
      fetchBoard(selectedDepartmentId);
    } catch {
      toast.error("Gagal menghapus kategori");
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
    setDeleteTarget({ type: "list", list });
    setDeleteDialogOpen(true);
  };

  const saveTask = async () => {
    if (
      !taskForm.title.trim() ||
      !selectedDepartmentId ||
      !taskForm.listId ||
      !taskForm.startDate ||
      !taskForm.dueDate
    ) {
      toast.error("Nama task, list, start date, dan due date wajib diisi");
      return;
    }

    try {
      setSavingTask(true);
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || null,
        startDate: taskForm.startDate || null,
        dueDate: taskForm.dueDate || null,
        listId: taskForm.listId,
        departmentId: selectedDepartmentId,
        memberIds: taskForm.memberIds,
        categoryIds: taskForm.categoryIds,
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
    setDeleteTarget({ type: "task", taskId });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const url =
        deleteTarget.type === "list"
          ? `/api/task-managements/lists/${deleteTarget.list.id}`
          : `/api/task-managements/tasks/${deleteTarget.taskId}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus data");
      toast.success(
        deleteTarget.type === "list" ? "List berhasil dihapus" : "Task berhasil dihapus",
      );
      fetchBoard(selectedDepartmentId);
      fetchDepartments();
    } catch {
      toast.error("Gagal menghapus data");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
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

  const toggleCategory = (categoryId: string) => {
    setTaskForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
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

  const openAttachmentPicker = () => {
    attachmentFileInputRef.current?.click();
  };

  const uploadAttachmentFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/task-managements/attachments/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Gagal upload attachment");
    }

    const json = await res.json();
    return {
      name: json.name || file.name,
      url: json.url,
      type: json.type || normalizeAttachmentType(file.name),
      size: typeof json.size === "number" ? json.size : file.size,
    };
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

  const getTaskListTheme = useCallback(
    (listId: string) => {
      const listIndex = board?.lists.findIndex((list) => list.id === listId) ?? 0;
      const list = board?.lists.find((item) => item.id === listId);
      return getListTheme(list?.name || "", Math.max(listIndex, 0));
    },
    [board?.lists],
  );

  const taskFormListName = useMemo(
    () => board?.lists.find((list) => list.id === taskForm.listId)?.name || "",
    [board?.lists, taskForm.listId],
  );

  const handleExportExcel = async () => {
    if (!board) return;

    try {
      setExportingExcel(true);
      const XLSX = await import("xlsx");

      const rows = board.lists.flatMap((list) =>
        list.tasks.map((task) => ({
          Department: board.department.name || "-",
          "Task Name": task.title || "-",
          Description: task.description || "-",
          "Start Date": task.startDate
            ? new Date(task.startDate).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
            : "-",
          "Due Date": task.dueDate
            ? new Date(task.dueDate).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
            : "-",
          Status: list.name || "-",
          Members: task.members.length
            ? task.members.map((item) => item.user.name).join(", ")
            : "-",
          Categories: task.categories.length
            ? task.categories.map((item) => item.category.name).join(", ")
            : "-",
          Attachments: task.attachments.length
            ? task.attachments.map((item) => item.name).join(", ")
            : "-",
        })),
      );

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Task Management");

      const keys = rows[0] ? Object.keys(rows[0]) : [];
      worksheet["!cols"] = keys.map((key) => ({
        wch:
          Math.max(
            key.length,
            ...rows.map((row) => String(row[key as keyof (typeof rows)[number]] ?? "").length),
          ) + 2,
      }));

      const fileName = `data-task-management-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success(`Berhasil mengekspor ${rows.length} task`);
    } catch {
      toast.error("Gagal mengekspor data task");
    } finally {
      setExportingExcel(false);
    }
  };

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
                  className={`flex items-center gap-4 xl:border-r xl:border-gray-200 xl:pr-5 xl:dark:border-gray-800 ${index === 4 ? "xl:border-r-0 xl:pr-0" : ""
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
                  onClick={() => router.push(`/task-managements/${department.id}`)}
                  className={`group overflow-hidden rounded-xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 ${departmentView === "list" ? "flex items-stretch" : ""
                    }`}
                >
                  <div
                    className={`relative bg-gradient-to-r ${palette.band} ${departmentView === "list" ? "w-24 shrink-0" : "h-20"
                      }`}
                  >
                    <div
                      className={`absolute flex h-16 w-16 items-center justify-center rounded-xl border-4 border-white shadow-md dark:border-gray-900 ${palette.icon} ${departmentView === "list"
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
                          className="grid h-12 w-12 place-items-center rounded-full text-[11px] font-bold text-gray-900 dark:text-white"
                          style={{
                            background: `conic-gradient(#2563eb ${progress}%, #e5e7eb 0)`,
                          }}
                        >
                          <span className="grid h-10 w-10 place-items-center rounded-full bg-white dark:bg-gray-900">
                            {progress}%
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Selesai
                        </p>
                      </div>
                    </div>

                    <div
                      className={`mt-6 flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 ${palette.button} group-hover:-translate-y-0.5 group-hover:shadow-md`}
                    >
                      <span>Lihat Board</span>
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
              onClick={() => router.push("/task-managements")}
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
            <Button
              onClick={handleExportExcel}
              disabled={!selectedDepartmentId || exportingExcel || !board}
              className="h-10 rounded-lg bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              {exportingExcel ? "Mengekspor..." : "Export Excel"}
            </Button>
            {canManageSelectedDepartment && (
              <Button
                onClick={() => setListDialogOpen(true)}
                disabled={!selectedDepartmentId}
                className="h-10 rounded-lg bg-blue-600 px-4 text-white shadow-sm hover:bg-blue-700"
              >
                <ListPlus className="h-4 w-4" />
                Tambah List
              </Button>
            )}
            {canManageSelectedDepartment && (
              <Button
                onClick={() => setCategoryDialogOpen(true)}
                disabled={!selectedDepartmentId}
                className="h-10 rounded-lg bg-slate-900 px-4 text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
                Tambah Kategori
              </Button>
            )}
          </div>
        </div>

        <TaskManagementWorkspace
          board={board}
          boardView={boardView}
          setBoardView={setBoardView}
          timelineMonth={timelineMonth}
          setTimelineMonth={setTimelineMonth}
          loadingBoard={loadingBoard}
          draggedListId={draggedListId}
          draggedTaskId={draggedTaskId}
          editingListId={editingListId}
          editingListName={editingListName}
          taskById={taskById}
          getListTheme={getListTheme}
          getTaskListTheme={getTaskListTheme}
          formatMonthYear={formatMonthYear}
          formatDate={formatDate}
          toDate={toDate}
          diffDays={diffDays}
          isSameDay={isSameDay}
          boardTasks={boardTasks}
          calendarDays={calendarDays}
          monthDays={monthDays}
          openCreateTask={openCreateTask}
          openEditTask={openEditTask}
          moveTask={moveTask}
          moveList={moveList}
          deleteList={deleteList}
          deleteTask={deleteTask}
          updateList={updateList}
          setDraggedListId={setDraggedListId}
          setDraggedTaskId={setDraggedTaskId}
          setEditingListId={setEditingListId}
          setEditingListName={setEditingListName}
          canManageSelectedDepartment={canManageSelectedDepartment}
        />

        <TaskManagementDialogs
          listDialogOpen={listDialogOpen}
          categoryDialogOpen={categoryDialogOpen}
          deleteDialogOpen={deleteDialogOpen}
          deleteTarget={deleteTarget}
          taskModalOpen={taskModalOpen}
          savingTask={savingTask}
          newListName={newListName}
          newCategoryName={newCategoryName}
          board={board}
          categories={categories}
          taskForm={taskForm}
          taskFormListName={taskFormListName}
          attachmentFileInputRef={attachmentFileInputRef}
          formatDate={formatDate}
          openAttachmentPicker={openAttachmentPicker}
          createList={createList}
          createCategory={createCategory}
          deleteCategory={deleteCategory}
          closeTaskModal={closeTaskModal}
          saveTask={saveTask}
          setListDialogOpen={setListDialogOpen}
          setCategoryDialogOpen={setCategoryDialogOpen}
          setDeleteDialogOpen={setDeleteDialogOpen}
          setNewListName={setNewListName}
          setNewCategoryName={setNewCategoryName}
          setTaskForm={setTaskForm}
          toggleCategory={toggleCategory}
          toggleMember={toggleMember}
          updateAttachment={updateAttachment}
          uploadAttachmentFile={uploadAttachmentFile}
          confirmDelete={confirmDelete}
          canManageSelectedDepartment={canManageSelectedDepartment}
        />
      </div>
    </>
  );
}

"use client"

import { useEffect, useState, useCallback } from "react"
import { tasksApi, type Task, type CreateTaskInput } from "@/lib/api"
import { TaskCard } from "@/components/tasks/task-card"
import { TaskListItem } from "@/components/tasks/task-list-item"
import { TaskForm } from "@/components/tasks/task-form"
import { TaskFilters, type ViewMode } from "@/components/tasks/task-filters"
import { ImportDialog } from "@/components/tasks/import-dialog"
import { DeleteDialog } from "@/components/tasks/delete-dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const fetchTasks = useCallback(async () => {
    try {
      const data = await tasksApi.list(statusFilter !== "all" ? { status: statusFilter } : undefined)
      setTasks(data)
    } catch (error) {
      toast({
        title: "Failed to load tasks",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, toast])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleCreateTask = async (data: CreateTaskInput) => {
    const newTask = await tasksApi.create(data)
    setTasks((prev) => [newTask, ...prev])
    toast({
      title: "Task created",
      description: "Your task has been created successfully.",
    })
  }

  const handleUpdateTask = async (data: CreateTaskInput) => {
    if (!editingTask) return
    const updatedTask = await tasksApi.update(editingTask.id, data)
    setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updatedTask : t)))
    setEditingTask(null)
    toast({
      title: "Task updated",
      description: "Your task has been updated successfully.",
    })
  }

  const handleDeleteTask = async () => {
    if (!deletingTask) return
    setIsDeleting(true)
    try {
      await tasksApi.delete(deletingTask.id)
      setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id))
      toast({
        title: "Task deleted",
        description: "Your task has been deleted.",
      })
      setDeleteOpen(false)
      setDeletingTask(null)
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (taskId: number, status: Task["status"]) => {
    try {
      const updatedTask = await tasksApi.update(taskId, { status })
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)))
      toast({
        title: "Status updated",
        description: `Task moved to ${status.replace("_", " ")}`,
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleExport = async () => {
    try {
      const blob = await tasksApi.exportCSV()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `tasks-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Export successful",
        description: "Your tasks have been exported to CSV.",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormOpen(true)
  }

  const handleRetask = (task: Task) => {
    setEditingTask({ ...task, due_date: null })
    setFormOpen(true)
    toast({
      title: "Retask mode",
      description: "Set a new due date for this overdue task.",
    })
  }

  const handleDelete = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      setDeletingTask(task)
      setDeleteOpen(true)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-muted-foreground mt-1">Manage your tasks and track progress</p>
      </div>

      <TaskFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreateClick={() => {
          setEditingTask(null)
          setFormOpen(true)
        }}
        onExport={handleExport}
        onImport={() => setImportOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tasks found. Create your first task!</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onRetask={handleRetask}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onRetask={handleRetask}
            />
          ))}
        </div>
      )}

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
      />

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onSuccess={fetchTasks} />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteTask}
        isLoading={isDeleting}
        taskTitle={deletingTask?.title || ""}
      />
    </div>
  )
}

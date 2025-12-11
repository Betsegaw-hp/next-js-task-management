"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type Task } from "@/lib/api"
import { format, isPast } from "date-fns"
import { Calendar, MoreVertical, Pencil, Trash2, ArrowRight, AlertTriangle, RotateCcw } from "lucide-react"

interface TaskListItemProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: number) => void
  onStatusChange: (taskId: number, status: Task["status"]) => void
  onRetask?: (task: Task) => void
}

function getPriorityColor(priority: number): string {
  if (priority === 0) return "bg-[var(--priority-low)]/20 text-[var(--priority-low)] border-[var(--priority-low)]/30"
  if (priority === 1) return "bg-[var(--priority-medium)]/20 text-[var(--priority-medium)] border-[var(--priority-medium)]/30"
  return "bg-[var(--priority-high)]/20 text-[var(--priority-high)] border-[var(--priority-high)]/30"
}

function getPriorityLabel(priority: number): string {
  if (priority === 0) return "Low"
  if (priority === 1) return "Medium"
  return "High"
}

function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-[var(--status-completed)]/20 text-[var(--status-completed)] border-[var(--status-completed)]/30"
    case "in_progress":
      return "bg-[var(--status-in-progress)]/20 text-[var(--status-in-progress)] border-[var(--status-in-progress)]/30"
    default:
      return "bg-[var(--status-pending)]/20 text-[var(--status-pending)] border-[var(--status-pending)]/30"
  }
}

function formatStatus(status: string): string {
  return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

function safeIsPast(dateString: string | null | undefined): boolean {
  if (!dateString) return false
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return false
    return isPast(date)
  } catch {
    return false
  }
}

function safeFormatDate(dateString: string | null | undefined): string {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    return format(date, "MMM d, yyyy")
  } catch {
    return ""
  }
}

const statusOrder: Task["status"][] = ["pending", "in_progress", "completed"]

export function TaskListItem({ task, onEdit, onDelete, onStatusChange, onRetask }: TaskListItemProps) {
  const isOverdue = task.due_date && task.status !== "completed" && safeIsPast(task.due_date)

  const nextStatus = () => {
    const currentIndex = statusOrder.indexOf(task.status)
    if (currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1]
    }
    return null
  }

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors hover:bg-secondary/30 ${
        isOverdue ? "border-destructive/50 bg-destructive/5" : "border-border/50 bg-card/50"
      }`}
    >
      {isOverdue && (
        <div className="shrink-0">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`font-medium truncate ${isOverdue ? "text-destructive" : ""}`}>
            {task.title}
          </h3>
          {isOverdue && (
            <Badge variant="destructive" className="shrink-0 text-xs">
              Overdue
            </Badge>
          )}
        </div>
        {task.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">{task.description}</p>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
        {task.due_date && (
          <>
            <Calendar className="h-4 w-4" />
            <span className={isOverdue ? "text-destructive font-medium" : ""}>
              {safeFormatDate(task.due_date)}
            </span>
          </>
        )}
      </div>

      <Badge variant="outline" className={`shrink-0 ${getPriorityColor(task.priority)}`}>
        {getPriorityLabel(task.priority)}
      </Badge>

      <Badge variant="outline" className={`shrink-0 ${getStatusColor(task.status)}`}>
        {formatStatus(task.status)}
      </Badge>

      {isOverdue && onRetask ? (
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex shrink-0 text-destructive hover:text-destructive"
          onClick={() => onRetask(task)}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Retask
        </Button>
      ) : nextStatus() && (
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex shrink-0"
          onClick={() => onStatusChange(task.id, nextStatus()!)}
        >
          <ArrowRight className="h-4 w-4 mr-1" />
          {formatStatus(nextStatus()!)}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          {isOverdue && onRetask ? (
            <DropdownMenuItem onClick={() => onRetask(task)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retask
            </DropdownMenuItem>
          ) : nextStatus() && (
            <DropdownMenuItem onClick={() => onStatusChange(task.id, nextStatus()!)}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Move to {formatStatus(nextStatus()!)}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(task.id)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type Task, mlApi } from "@/lib/api"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { Calendar, Clock, MoreVertical, Pencil, Trash2, Sparkles, ArrowRight, Loader2, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: number) => void
  onStatusChange: (taskId: number, status: Task["status"]) => void
  onRetask?: (task: Task) => void
}

function safeFormatDistance(dateString: string | null | undefined): string {
  if (!dateString) return "Recently"
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Recently"
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return "Recently"
  }
}

function safeFormatDate(dateString: string | null | undefined, formatStr: string): string {
  if (!dateString) return "No date"
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid date"
    return format(date, formatStr)
  } catch {
    return "Invalid date"
  }
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

function getPriorityColor(priority: number): string {
  if (priority === 0) return "bg-[var(--priority-low)]/20 text-[var(--priority-low)] border-[var(--priority-low)]/30"
  if (priority === 1)
    return "bg-[var(--priority-medium)]/20 text-[var(--priority-medium)] border-[var(--priority-medium)]/30"
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

const statusOrder: Task["status"][] = ["pending", "in_progress", "completed"]

export function TaskCard({ task, onEdit, onDelete, onStatusChange, onRetask }: TaskCardProps) {
  const [predicting, setPredicting] = useState(false)
  const [prediction, setPrediction] = useState<{ hours: number; confidence: number } | null>(null)
  const { toast } = useToast()

  const isOverdue = task.due_date && task.status !== "completed" && safeIsPast(task.due_date)

  const nextStatus = () => {
    const currentIndex = statusOrder.indexOf(task.status)
    if (currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1]
    }
    return null
  }

  const handlePredictCompletion = async () => {
    setPredicting(true)
    try {
      const daysUntilDue = task.due_date
        ? Math.max(0, Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : undefined

      const backendPriority = task.priority

      const result = await mlApi.predictCompletionTime({
        description_length: task.description?.length || 0,
        priority: backendPriority,
        user_experience: task.user_experience || 1,
        is_complex: (task.description?.length || 0) > 100,
        days_until_due: daysUntilDue,
        status: task.status,
      })

      setPrediction({ hours: result.predicted_hours, confidence: 0.85 })
    } catch {
      toast({
        title: "Prediction failed",
        description: "Could not predict completion time",
        variant: "destructive",
      })
    } finally {
      setPredicting(false)
    }
  }

  return (
    <Card className={`hover:border-border transition-colors ${
      isOverdue 
        ? "bg-destructive/5 border-destructive/50" 
        : "bg-card/50 border-border/50"
    }`}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1 flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold leading-tight truncate ${isOverdue ? "text-destructive" : ""}`}>
              {task.title}
            </h3>
            {isOverdue && (
              <Badge variant="destructive" className="shrink-0 text-xs">
                Overdue
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePredictCompletion} disabled={predicting}>
              <Sparkles className="h-4 w-4 mr-2" />
              Predict Time
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(task.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={getPriorityColor(task.priority)}>
            P{task.priority} - {getPriorityLabel(task.priority)}
          </Badge>
          <Badge variant="outline" className={getStatusColor(task.status)}>
            {formatStatus(task.status)}
          </Badge>
        </div>

        {task.due_date && (
          <div
            className={`flex items-center gap-2 text-sm ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
          >
            <Calendar className="h-4 w-4" />
            <span>
              Due {safeFormatDate(task.due_date, "MMM d, yyyy")}
              {isOverdue && " (Overdue)"}
            </span>
          </div>
        )}

        {prediction && (
          <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>
              Est. {prediction.hours.toFixed(1)}h ({(prediction.confidence * 100).toFixed(0)}% confidence)
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {task.completed ? "Completed" : `Status: ${formatStatus(task.status)}`}
          </span>

          {isOverdue && onRetask ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-destructive hover:text-destructive"
              onClick={() => onRetask(task)}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retask
            </Button>
          ) : nextStatus() && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => onStatusChange(task.id, nextStatus()!)}
            >
              Move to {formatStatus(nextStatus()!)}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>

        {predicting && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Predicting...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

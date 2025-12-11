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
import { Calendar, Clock, MoreVertical, Pencil, Trash2, Sparkles, ArrowRight, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: number) => void
  onStatusChange: (taskId: number, status: Task["status"]) => void
}

function getPriorityColor(priority: number): string {
  if (priority <= 3) return "bg-[var(--priority-low)]/20 text-[var(--priority-low)] border-[var(--priority-low)]/30"
  if (priority <= 6)
    return "bg-[var(--priority-medium)]/20 text-[var(--priority-medium)] border-[var(--priority-medium)]/30"
  return "bg-[var(--priority-high)]/20 text-[var(--priority-high)] border-[var(--priority-high)]/30"
}

function getPriorityLabel(priority: number): string {
  if (priority <= 3) return "Low"
  if (priority <= 6) return "Medium"
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

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const [predicting, setPredicting] = useState(false)
  const [prediction, setPrediction] = useState<{ hours: number; confidence: number } | null>(null)
  const { toast } = useToast()

  const isOverdue = task.due_date && task.status !== "completed" && isPast(new Date(task.due_date))

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
        : 0

      const result = await mlApi.predictCompletionTime({
        priority: task.priority,
        description_length: task.description.length,
        has_due_date: !!task.due_date,
        days_until_due: daysUntilDue,
        status: task.status,
      })

      setPrediction({ hours: result.predicted_hours, confidence: result.confidence })
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
    <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1 flex-1 min-w-0 pr-4">
          <h3 className="font-semibold leading-tight truncate">{task.title}</h3>
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
              Due {format(new Date(task.due_date), "MMM d, yyyy")}
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
            Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
          </span>

          {nextStatus() && (
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

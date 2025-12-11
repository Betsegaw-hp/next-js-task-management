"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Task } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface RecentTasksProps {
  tasks: Task[]
}

function getPriorityColor(priority: number): string {
  if (priority <= 3) return "bg-[var(--priority-low)]/20 text-[var(--priority-low)] border-[var(--priority-low)]/30"
  if (priority <= 6)
    return "bg-[var(--priority-medium)]/20 text-[var(--priority-medium)] border-[var(--priority-medium)]/30"
  return "bg-[var(--priority-high)]/20 text-[var(--priority-high)] border-[var(--priority-high)]/30"
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

export function RecentTasks({ tasks }: RecentTasksProps) {
  const recentTasks = tasks.slice(0, 5)

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Tasks</CardTitle>
        <Link href="/dashboard/tasks" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {recentTasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No tasks yet. Create your first task!</p>
        ) : (
          <div className="space-y-4">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="font-medium truncate">{task.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                    P{task.priority}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(task.status)}>
                    {formatStatus(task.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

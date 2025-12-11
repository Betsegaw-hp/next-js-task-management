"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Task } from "@/lib/api"
import { CheckCircle2, Clock, AlertCircle, ListTodo } from "lucide-react"

interface StatsCardsProps {
  tasks: Task[]
}

export function StatsCards({ tasks }: StatsCardsProps) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === "completed").length
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length
  const pendingTasks = tasks.filter((t) => t.status === "pending").length

  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date || t.status === "completed") return false
    return new Date(t.due_date) < new Date()
  }).length

  const stats = [
    {
      title: "Total Tasks",
      value: totalTasks,
      icon: ListTodo,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Completed",
      value: completedTasks,
      icon: CheckCircle2,
      color: "text-[var(--status-completed)]",
      bgColor: "bg-[var(--status-completed)]/10",
    },
    {
      title: "In Progress",
      value: inProgressTasks,
      icon: Clock,
      color: "text-[var(--status-in-progress)]",
      bgColor: "bg-[var(--status-in-progress)]/10",
    },
    {
      title: "Overdue",
      value: overdueTasks,
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

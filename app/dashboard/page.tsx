"use client"

import { useEffect, useState } from "react"
import { tasksApi, mlApi, type Task, type MLHealthResponse } from "@/lib/api"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentTasks } from "@/components/dashboard/recent-tasks"
import { MLStatus } from "@/components/dashboard/ml-status"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [mlStatus, setMlStatus] = useState<MLHealthResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mlLoading, setMlLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        const [tasksData, mlStatusData] = await Promise.all([tasksApi.list(), mlApi.getHealth().catch(() => null)])
        setTasks(tasksData)
        setMlStatus(mlStatusData)
      } catch (error) {
        toast({
          title: "Failed to load dashboard",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        setMlLoading(false)
      }
    }

    fetchData()
  }, [toast])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your tasks and ML insights</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-card/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your tasks and ML insights</p>
      </div>

      <StatsCards tasks={tasks} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTasks tasks={tasks} />
        <MLStatus status={mlStatus} isLoading={mlLoading} />
      </div>
    </div>
  )
}

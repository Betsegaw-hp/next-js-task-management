"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { MLHealthResponse } from "@/lib/api"
import { Brain, CheckCircle2, XCircle } from "lucide-react"

interface MLStatusProps {
  status: MLHealthResponse | null
  isLoading: boolean
}

export function MLStatus({ status, isLoading }: MLStatusProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            ML Models Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-secondary/50 rounded" />
            <div className="h-10 bg-secondary/50 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Backend returns: { status: string, models_loaded: boolean, details: object }
  const isHealthy = status?.status === "healthy" || status?.models_loaded === true
  const details = status?.details as Record<string, boolean> | undefined

  const models = [
    { 
      name: "Completion Time Predictor", 
      active: details?.completion_model ?? isHealthy 
    },
    { 
      name: "Priority Suggester", 
      active: details?.priority_model ?? isHealthy 
    },
  ]

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          ML Models Status
          {status && (
            <Badge 
              variant="outline" 
              className={isHealthy 
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 ml-auto" 
                : "bg-red-500/10 text-red-500 border-red-500/30 ml-auto"
              }
            >
              {status.status || (isHealthy ? "Healthy" : "Unhealthy")}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {models.map((model) => (
          <div key={model.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <span className="font-medium">{model.name}</span>
            {model.active ? (
              <Badge className="bg-[var(--status-completed)]/20 text-[var(--status-completed)] border-[var(--status-completed)]/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                <XCircle className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

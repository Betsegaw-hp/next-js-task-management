"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mlApi, type MLHealthResponse } from "@/lib/api"
import { Brain, Clock, Target, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export default function MLPage() {
  const [mlStatus, setMlStatus] = useState<MLHealthResponse | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const { toast } = useToast()

  // Completion Time Prediction (matching backend: description_length, priority 0-2, user_experience, is_complex)
  const [ctPriority, setCtPriority] = useState("1") // 0=low, 1=medium, 2=high
  const [ctDescLength, setCtDescLength] = useState("100")
  const [ctUserExperience, setCtUserExperience] = useState("1")
  const [ctIsComplex, setCtIsComplex] = useState("false")
  const [ctDaysUntilDue, setCtDaysUntilDue] = useState("7")
  const [ctStatus, setCtStatus] = useState<"pending" | "in_progress" | "completed">("pending")
  const [ctPredicting, setCtPredicting] = useState(false)
  const [ctResult, setCtResult] = useState<{ hours: number } | null>(null)

  // Priority Prediction (matching backend: text, days_until_due, status)
  const [ppDescription, setPpDescription] = useState("")
  const [ppDaysUntilDue, setPpDaysUntilDue] = useState("7")
  const [ppStatus, setPpStatus] = useState<"pending" | "in_progress" | "completed">("pending")
  const [ppPredicting, setPpPredicting] = useState(false)
  const [ppResult, setPpResult] = useState<{ priority: string; confidence: number } | null>(null)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const status = await mlApi.getHealth()
        setMlStatus(status)
      } catch {
        // Models might not be available
      } finally {
        setStatusLoading(false)
      }
    }
    fetchStatus()
  }, [])

  const handlePredictCompletionTime = async () => {
    setCtPredicting(true)
    try {
      const result = await mlApi.predictCompletionTime({
        description_length: Number.parseInt(ctDescLength),
        priority: Number.parseInt(ctPriority), // 0=low, 1=medium, 2=high
        user_experience: Number.parseInt(ctUserExperience),
        is_complex: ctIsComplex === "true",
        days_until_due: Number.parseInt(ctDaysUntilDue),
        status: ctStatus,
      })
      setCtResult({ hours: result.predicted_hours })
    } catch (error) {
      toast({
        title: "Prediction failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setCtPredicting(false)
    }
  }

  const handlePredictPriority = async () => {
    if (!ppDescription) {
      toast({
        title: "Description required",
        description: "Please enter a task description",
        variant: "destructive",
      })
      return
    }

    setPpPredicting(true)
    try {
      const result = await mlApi.predictPriority({
        text: ppDescription,
        days_until_due: Number.parseInt(ppDaysUntilDue),
        status: ppStatus,
      })
      // Get confidence for the predicted priority level
      const confidenceValue = result.confidence[result.predicted_priority as keyof typeof result.confidence] || 0
      setPpResult({ priority: result.predicted_priority, confidence: confidenceValue })
    } catch (error) {
      toast({
        title: "Prediction failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setPpPredicting(false)
    }
  }

  // Helper to check if models are loaded from health response
  const isCompletionModelActive = mlStatus?.models_loaded || (mlStatus?.details as Record<string, boolean>)?.completion_model
  const isPriorityModelActive = mlStatus?.models_loaded || (mlStatus?.details as Record<string, boolean>)?.priority_model

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ML Insights</h1>
        <p className="text-muted-foreground mt-1">
          Use machine learning to predict task completion times and priorities
        </p>
      </div>

      {/* Model Status */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Model Status
          </CardTitle>
          <CardDescription>Current status of ML models</CardDescription>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                {isCompletionModelActive ? (
                  <CheckCircle2 className="h-5 w-5 text-[var(--status-completed)]" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span>Completion Time Model</span>
              </div>
              <div className="flex items-center gap-2">
                {isPriorityModelActive ? (
                  <CheckCircle2 className="h-5 w-5 text-[var(--status-completed)]" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span>Priority Model</span>
              </div>
              {mlStatus?.status && (
                <Badge 
                  variant="outline" 
                  className={mlStatus.status === "healthy" 
                    ? "bg-emerald-500/10 text-emerald-500 ml-auto" 
                    : "bg-amber-500/10 text-amber-500 ml-auto"
                  }
                >
                  {mlStatus.status}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Completion Time Prediction */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Predict Completion Time
            </CardTitle>
            <CardDescription>Estimate how long a task will take based on its characteristics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority Level</Label>
                <Select value={ctPriority} onValueChange={setCtPriority}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Low (0)</SelectItem>
                    <SelectItem value="1">Medium (1)</SelectItem>
                    <SelectItem value="2">High (2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description Length</Label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={ctDescLength}
                  onChange={(e) => setCtDescLength(e.target.value)}
                  className="bg-input/50"
                />
              </div>

              <div className="space-y-2">
                <Label>User Experience</Label>
                <Select value={ctUserExperience} onValueChange={setCtUserExperience}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Beginner (0)</SelectItem>
                    <SelectItem value="1">Intermediate (1)</SelectItem>
                    <SelectItem value="2">Expert (2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Is Complex Task?</Label>
                <Select value={ctIsComplex} onValueChange={setCtIsComplex}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Days Until Due</Label>
                <Input
                  type="number"
                  value={ctDaysUntilDue}
                  onChange={(e) => setCtDaysUntilDue(e.target.value)}
                  className="bg-input/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={ctStatus} onValueChange={(v) => setCtStatus(v as "pending" | "in_progress" | "completed")}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handlePredictCompletionTime} disabled={ctPredicting} className="w-full">
              {ctPredicting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Predicting...
                </>
              ) : (
                "Predict Completion Time"
              )}
            </Button>

            {ctResult && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{ctResult.hours.toFixed(1)} hours</p>
                  <p className="text-sm text-muted-foreground">Estimated completion time</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Prediction */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Suggest Priority
            </CardTitle>
            <CardDescription>Get AI-suggested priority based on task description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Task Description</Label>
              <Textarea
                value={ppDescription}
                onChange={(e) => setPpDescription(e.target.value)}
                placeholder="Describe the task..."
                rows={3}
                className="bg-input/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Days Until Due</Label>
                <Input
                  type="number"
                  value={ppDaysUntilDue}
                  onChange={(e) => setPpDaysUntilDue(e.target.value)}
                  className="bg-input/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={ppStatus} onValueChange={(v) => setPpStatus(v as "pending" | "in_progress" | "completed")}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handlePredictPriority} disabled={ppPredicting} className="w-full">
              {ppPredicting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Predicting...
                </>
              ) : (
                "Suggest Priority"
              )}
            </Button>

            {ppResult && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">Suggested Priority:</span>
                  <Badge
                    className={
                      ppResult.priority === "low"
                        ? "bg-[var(--priority-low)]/20 text-[var(--priority-low)]"
                        : ppResult.priority === "medium"
                          ? "bg-[var(--priority-medium)]/20 text-[var(--priority-medium)]"
                          : "bg-[var(--priority-high)]/20 text-[var(--priority-high)]"
                    }
                  >
                    {ppResult.priority.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  {(ppResult.confidence * 100).toFixed(0)}% confidence
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

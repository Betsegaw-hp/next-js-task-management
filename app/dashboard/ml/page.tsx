"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mlApi, type MLModelStatus } from "@/lib/api"
import { Brain, Clock, Target, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export default function MLPage() {
  const [mlStatus, setMlStatus] = useState<MLModelStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const { toast } = useToast()

  // Completion Time Prediction
  const [ctPriority, setCtPriority] = useState("5")
  const [ctDescLength, setCtDescLength] = useState("100")
  const [ctHasDueDate, setCtHasDueDate] = useState("true")
  const [ctDaysUntilDue, setCtDaysUntilDue] = useState("7")
  const [ctStatus, setCtStatus] = useState("pending")
  const [ctPredicting, setCtPredicting] = useState(false)
  const [ctResult, setCtResult] = useState<{ hours: number; confidence: number } | null>(null)

  // Priority Prediction
  const [ppDescription, setPpDescription] = useState("")
  const [ppDueDate, setPpDueDate] = useState("")
  const [ppStatus, setPpStatus] = useState("pending")
  const [ppPredicting, setPpPredicting] = useState(false)
  const [ppResult, setPpResult] = useState<{ priority: number; reasoning: string } | null>(null)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const status = await mlApi.getModelStatus()
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
        priority: Number.parseInt(ctPriority),
        description_length: Number.parseInt(ctDescLength),
        has_due_date: ctHasDueDate === "true",
        days_until_due: Number.parseInt(ctDaysUntilDue),
        status: ctStatus,
      })
      setCtResult({ hours: result.predicted_hours, confidence: result.confidence })
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
        description: ppDescription,
        due_date: ppDueDate || new Date().toISOString().split("T")[0],
        status: ppStatus,
      })
      setPpResult({ priority: result.suggested_priority, reasoning: result.reasoning })
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
                {mlStatus?.completion_model ? (
                  <CheckCircle2 className="h-5 w-5 text-[var(--status-completed)]" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span>Completion Time Model</span>
              </div>
              <div className="flex items-center gap-2">
                {mlStatus?.priority_model ? (
                  <CheckCircle2 className="h-5 w-5 text-[var(--status-completed)]" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span>Priority Model</span>
              </div>
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
                <Label>Priority (1-10)</Label>
                <Select value={ctPriority} onValueChange={setCtPriority}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(10)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description Length</Label>
                <Input
                  type="number"
                  value={ctDescLength}
                  onChange={(e) => setCtDescLength(e.target.value)}
                  className="bg-input/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Has Due Date</Label>
                <Select value={ctHasDueDate} onValueChange={setCtHasDueDate}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
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
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={ctStatus} onValueChange={setCtStatus}>
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
                  <p className="text-sm text-muted-foreground">{(ctResult.confidence * 100).toFixed(0)}% confidence</p>
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
            <CardDescription>Get AI-suggested priority based on task description and due date</CardDescription>
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
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={ppDueDate}
                  onChange={(e) => setPpDueDate(e.target.value)}
                  className="bg-input/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={ppStatus} onValueChange={setPpStatus}>
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
                      ppResult.priority <= 3
                        ? "bg-[var(--priority-low)]/20 text-[var(--priority-low)]"
                        : ppResult.priority <= 6
                          ? "bg-[var(--priority-medium)]/20 text-[var(--priority-medium)]"
                          : "bg-[var(--priority-high)]/20 text-[var(--priority-high)]"
                    }
                  >
                    {ppResult.priority}
                  </Badge>
                </div>
                <p className="text-sm text-center text-muted-foreground">{ppResult.reasoning}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

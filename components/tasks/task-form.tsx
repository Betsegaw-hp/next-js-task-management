"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { type Task, type CreateTaskInput, mlApi } from "@/lib/api"
import { Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { calculateDaysUntilDue, priorityLabelToString } from "@/lib/customeUtils"

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  onSubmit: (data: CreateTaskInput) => Promise<void>
}

export function TaskForm({ open, onOpenChange, task, onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("1") // Default medium priority (0=low, 1=medium, 2=high)
  const [dueDate, setDueDate] = useState("")
  const [status, setStatus] = useState<"pending" | "in_progress" | "completed">("pending")
  const [isLoading, setIsLoading] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setPriority(task.priority.toString())
      setDueDate(task.due_date || "")
      setStatus(task.status)
    } else {
      setTitle("")
      setDescription("")
      setPriority("1") // Default medium priority
      setDueDate("")
      setStatus("pending")
    }
  }, [task, open])

  const handleSuggestPriority = async () => {
    if (!description) {
      toast({
        title: "Description required",
        description: "Please enter a description first",
        variant: "destructive",
      })
      return
    }

    setSuggesting(true)
    try {
      const result = await mlApi.predictPriority({
        text: description,
        days_until_due: calculateDaysUntilDue(dueDate),
        status,
      })
      setPriority(priorityLabelToString(result.predicted_priority))
      // Get confidence for the predicted priority level
      const confidenceValue = result.confidence[result.predicted_priority as keyof typeof result.confidence] || 0
      toast({
        title: "Priority suggested",
        description: `Confidence: ${(confidenceValue * 100).toFixed(0)}%`,
      })
    } catch {
      toast({
        title: "Suggestion failed",
        description: "Could not suggest priority",
        variant: "destructive",
      })
    } finally {
      setSuggesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSubmit({
        title,
        description,
        priority: Number.parseInt(priority),
        due_date: dueDate || undefined,
        status,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Failed to save task",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update your task details below." : "Fill in the details for your new task."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                required
                className="bg-input/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                rows={3}
                className="bg-input/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <div className="flex gap-2">
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="bg-input/50">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Low</SelectItem>
                      <SelectItem value="1">Medium</SelectItem>
                      <SelectItem value="2">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleSuggestPriority}
                    disabled={suggesting}
                    title="Suggest priority with AI"
                  >
                    {suggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-input/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : task ? (
                "Update Task"
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

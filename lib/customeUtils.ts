export function calculateDaysUntilDue(dateString: string | null | undefined): number | undefined {
  if (!dateString) return undefined
  
  try {
    const dueDate = new Date(dateString)
    if (isNaN(dueDate.getTime())) return undefined
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  } catch {
    return undefined
  }
}

export type PriorityLabel = "low" | "medium" | "high"
export type PriorityValue = 0 | 1 | 2

export function priorityLabelToValue(label: string): PriorityValue {
  const map: Record<string, PriorityValue> = { low: 0, medium: 1, high: 2 }
  return map[label.toLowerCase()] ?? 1
}

export function priorityValueToLabel(value: number): PriorityLabel {
  const map: Record<number, PriorityLabel> = { 0: "low", 1: "medium", 2: "high" }
  return map[value] ?? "medium"
}

export function priorityLabelToString(label: string): string {
  return priorityLabelToValue(label).toString()
}
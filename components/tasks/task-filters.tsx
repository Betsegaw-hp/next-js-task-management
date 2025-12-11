"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Upload, Plus } from "lucide-react"

interface TaskFiltersProps {
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  onCreateClick: () => void
  onExport: () => void
  onImport: () => void
}

export function TaskFilters({
  statusFilter,
  onStatusFilterChange,
  onCreateClick,
  onExport,
  onImport,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-40 bg-input/50">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={onImport}>
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
        <Button size="sm" onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>
    </div>
  )
}

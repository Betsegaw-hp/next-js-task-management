"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Upload, Plus, LayoutGrid, List } from "lucide-react"

export type ViewMode = "grid" | "list"

interface TaskFiltersProps {
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  onCreateClick: () => void
  onExport: () => void
  onImport: () => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function TaskFilters({
  statusFilter,
  onStatusFilterChange,
  onCreateClick,
  onExport,
  onImport,
  viewMode,
  onViewModeChange,
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

        {/* View Mode Toggle */}
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-r-none"
            onClick={() => onViewModeChange("grid")}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-l-none"
            onClick={() => onViewModeChange("list")}
            title="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
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

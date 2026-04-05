'use client'

import { useState } from 'react'
import { Calendar, GripVertical, MoreHorizontal, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  type Project,
  type Task,
  type TaskStatus,
  priorityColors,
  priorityLabels,
  getProjectById,
} from '@/lib/data'
import { formatDateShort } from '@/lib/date'

interface KanbanBoardProps {
  tasks: Task[]
  projectsById?: Record<string, Project>
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void
  onTaskClick?: (task: Task) => void
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'Por hacer', color: 'bg-zinc-500' },
  { id: 'in-progress', title: 'En progreso', color: 'bg-blue-500' },
  { id: 'blocked', title: 'Bloqueada', color: 'bg-red-500' },
  { id: 'done', title: 'Hecha', color: 'bg-emerald-500' },
]

export function KanbanBoard({
  tasks,
  projectsById,
  onStatusChange,
  onTaskClick,
}: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null)

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((task) => task.status === status)

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    if (draggedTask && onStatusChange) {
      onStatusChange(draggedTask, status)
    }
    setDraggedTask(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
  }

  return (
    <ScrollArea className="w-full pb-4">
      <div className="flex gap-4 min-w-max">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id)

          return (
            <div
              key={column.id}
              className="flex w-72 shrink-0 flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`size-2 rounded-full ${column.color}`} />
                  <h3 className="text-sm font-medium">{column.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="size-6" disabled>
                  <Plus className="size-3.5" />
                </Button>
              </div>

              <div className="flex flex-col gap-2 min-h-[200px]">
                {columnTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    projectsById={projectsById}
                    isDragging={draggedTask === task.id}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onTaskClick?.(task)}
                  />
                ))}

                {columnTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                    <p className="text-xs text-muted-foreground">
                      Sin tareas
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

interface KanbanCardProps {
  task: Task
  projectsById?: Record<string, Project>
  isDragging: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onClick?: () => void
}

function KanbanCard({
  task,
  projectsById,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}: KanbanCardProps) {
  const project = projectsById?.[task.projectId] ?? getProjectById(task.projectId)

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`cursor-grab transition-all duration-200 hover:shadow-md hover:border-foreground/20 ${
        isDragging ? 'opacity-50 rotate-2 scale-105' : ''
      }`}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start gap-2">
          <GripVertical className="size-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="flex-1 space-y-1">
            <CardTitle className="text-sm font-medium leading-tight">
              {task.title}
            </CardTitle>
            {project && (
              <p className="text-xs text-muted-foreground">{project.name}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={(e) => e.stopPropagation()}
                disabled
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>No disponible</DropdownMenuItem>
              <DropdownMenuItem disabled>No disponible</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" disabled>
                No disponible
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className={`text-xs ${priorityColors[task.priority]}`}
          >
            {priorityLabels[task.priority]}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            <span>{formatDateShort(task.dueDate)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

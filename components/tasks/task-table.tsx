import Link from 'next/link'
import { MoreHorizontal } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  taskStatusColors,
  taskStatusLabels,
  priorityColors,
  priorityLabels,
  getProjectById,
} from '@/lib/data'
import { formatDate } from '@/lib/date'

interface TaskTableProps {
  tasks: Task[]
  showProject?: boolean
  projectsById?: Record<string, Project>
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void
  onTaskClick?: (task: Task) => void
}

export function TaskTable({
  tasks,
  showProject = true,
  projectsById,
  onStatusChange,
  onTaskClick,
}: TaskTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Prioridad</TableHead>
            {showProject && <TableHead>Proyecto</TableHead>}
            <TableHead>Vencimiento</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const project = showProject
              ? (projectsById?.[task.projectId] ?? getProjectById(task.projectId))
              : null

            return (
              <TableRow key={task.id} className="group">
                <TableCell>
                  <Checkbox
                    checked={task.status === 'done'}
                    onCheckedChange={(checked) => {
                      if (onStatusChange) {
                        onStatusChange(task.id, checked ? 'done' : 'todo')
                      }
                    }}
                    aria-label={`Marcar ${task.title} como completada`}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <button
                      onClick={() => onTaskClick?.(task)}
                      className={`font-medium text-left hover:underline cursor-pointer ${
                        task.status === 'done'
                          ? 'text-muted-foreground line-through'
                          : ''
                      }`}
                    >
                      {task.title}
                    </button>
                    {task.tags.length > 0 && (
                      <div className="flex gap-1">
                        {task.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {task.tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{task.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${taskStatusColors[task.status]}`}
                  >
                    {taskStatusLabels[task.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${priorityColors[task.priority]}`}
                  >
                    {priorityLabels[task.priority]}
                  </Badge>
                </TableCell>
                  {showProject && (
                  <TableCell>
                    {project && (
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {project.name}
                      </Link>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground">
                  {formatDate(task.dueDate)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled
                      >
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Acciones</span>
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
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

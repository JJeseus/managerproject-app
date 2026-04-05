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
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  type Project,
  statusColors,
  statusLabels,
  priorityColors,
  priorityLabels,
} from '@/lib/data'
import { formatDate } from '@/lib/date'

interface ProjectTableProps {
  projects: Project[]
  taskCountsByProject: Record<
    string,
    {
      total: number
      completed: number
    }
  >
}

export function ProjectTable({ projects, taskCountsByProject }: ProjectTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Avance</TableHead>
            <TableHead>Tareas</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const taskCount = taskCountsByProject[project.id] ?? {
              total: 0,
              completed: 0,
            }

            return (
              <TableRow key={project.id} className="group">
                <TableCell>
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-medium hover:underline"
                  >
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${statusColors[project.status]}`}
                  >
                    {statusLabels[project.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${priorityColors[project.priority]}`}
                  >
                    {priorityLabels[project.priority]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 w-32">
                    <Progress value={project.progress} className="h-2" />
                    <span className="text-xs text-muted-foreground w-8">
                      {project.progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {taskCount.completed}/{taskCount.total}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(project.dueDate)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
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

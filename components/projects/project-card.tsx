import Link from 'next/link'
import { Calendar, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
import { formatDateShort } from '@/lib/date'

interface ProjectCardProps {
  project: Project
  taskCount?: {
    total: number
    completed: number
  }
}

export function ProjectCard({ project, taskCount }: ProjectCardProps) {
  const totalTasks = taskCount?.total ?? 0
  const completedTasks = taskCount?.completed ?? 0

  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <Card className="transition-all duration-200 hover:shadow-md hover:border-foreground/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h3 className="font-semibold leading-none tracking-tight group-hover:text-foreground/80 transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={(e) => e.preventDefault()}
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
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-xs ${statusColors[project.status]}`}
            >
              {statusLabels[project.status]}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${priorityColors[project.priority]}`}
            >
              {priorityLabels[project.priority]}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Avance</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="size-3" />
              <span>Vence {formatDateShort(project.dueDate)}</span>
            </div>
            <span>
              {completedTasks}/{totalTasks} tareas
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

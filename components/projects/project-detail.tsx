'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Calendar, Clock, MoreHorizontal, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { executeMutation } from '@/lib/client/mutations'
import { formatDate, formatDateShort } from '@/lib/date'
import {
  type Note,
  type Project,
  type Task,
  type TaskStatus,
  priorityColors,
  priorityLabels,
  statusColors,
  statusLabels,
} from '@/lib/data'
import { ProjectNotes } from '@/components/notes/project-notes'
import { TaskTable } from '@/components/tasks/task-table'

interface ProjectDetailProps {
  project: Project
  initialTasks: Task[]
  notes: Note[]
}

export function ProjectDetail({ project, initialTasks, notes }: ProjectDetailProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [projectNotes, setProjectNotes] = useState<Note[]>(notes)
  const [isSaving, setIsSaving] = useState(false)
  const completedTasks = tasks.filter((task) => task.status === 'done').length

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const previousTasks = tasks
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
    )

    const result = await executeMutation({
      action: 'updateTaskStatus',
      payload: {
        taskId,
        status: newStatus,
      },
    })

    if (!result.ok) {
      setTasks(previousTasks)
      toast.error(result.message)
    }
  }

  const handleCreateTask = async () => {
    const title = window.prompt('Título de la tarea:')
    if (!title?.trim()) return

    setIsSaving(true)
    const result = await executeMutation({
      action: 'createTask',
      payload: {
        projectId: project.id,
        title: title.trim(),
        description: '',
        priority: 'medium',
        dueDate: new Date().toISOString().slice(0, 10),
        tags: [],
      },
    })
    setIsSaving(false)

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    setTasks((prev) => [result.data.task, ...prev])
    toast.success('Tarea creada')
  }

  const handleAddNote = async (content: string, taskId?: string) => {
    const result = await executeMutation({
      action: 'addNote',
      payload: {
        projectId: project.id,
        taskId,
        content,
      },
    })

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    setProjectNotes((prev) => [result.data.note, ...prev])
    toast.success('Nota guardada')
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid min-h-[220px] grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col justify-between gap-4 p-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={statusColors[project.status]}>
                  {statusLabels[project.status]}
                </Badge>
                <Badge variant="outline" className={priorityColors[project.priority]}>
                  {priorityLabels[project.priority]}
                </Badge>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                {project.name}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {project.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Inicio {formatDate(project.startDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  No disponible
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="size-8" disabled>
                      <MoreHorizontal className="size-4" />
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
            </div>
          </div>
          <div className="relative min-h-[180px] bg-muted md:min-h-0">
            <Image
              src={project.image}
              alt={`Portada de ${project.name}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progress}%</div>
            <Progress value={project.progress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedTasks}/{tasks.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="size-4" />
              Vencimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDateShort(project.dueDate)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(project.dueDate, 'yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="size-4" />
              Prioridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className={`text-sm ${priorityColors[project.priority]}`}>
              {priorityLabels[project.priority]}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="tasks">Tareas ({tasks.length})</TabsTrigger>
            <TabsTrigger value="notes">Notas ({projectNotes.length})</TabsTrigger>
          </TabsList>
          <Button size="sm" className="gap-1" onClick={() => void handleCreateTask()} disabled={isSaving}>
            <Plus className="size-4" />
            Nueva tarea
          </Button>
        </div>

        <TabsContent value="tasks" className="mt-4">
          {tasks.length > 0 ? (
            <TaskTable
              tasks={tasks}
              showProject={false}
              onStatusChange={(taskId, status) => void handleStatusChange(taskId, status)}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">Aún no hay tareas</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => void handleCreateTask()}
                  disabled={isSaving}
                >
                  <Plus className="mr-2 size-4" />
                  Crear primera tarea
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <ProjectNotes
            notes={projectNotes}
            tasks={tasks}
            onAddNote={handleAddNote}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

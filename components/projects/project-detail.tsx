'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Calendar, Clock, MoreHorizontal } from 'lucide-react'
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
  type RoadmapItem,
  type Resource,
  type Task,
  type TaskStatus,
  priorityColors,
  priorityLabels,
  statusColors,
  statusLabels,
} from '@/lib/data'
import { ProjectNotes } from '@/components/notes/project-notes'
import { EditProjectDialog } from '@/components/projects/edit-project-dialog'
import { ProjectRoadmapView } from '@/components/projects/project-roadmap-view'
import { ProjectResourcesMap } from '@/components/projects/project-resources-map'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { TaskDetailPanel } from '@/components/tasks/task-detail-panel'
import { TaskTable } from '@/components/tasks/task-table'

interface ProjectDetailProps {
  project: Project
  initialTasks: Task[]
  notes: Note[]
  resources: Resource[]
  roadmapItems: RoadmapItem[]
}

function calculateProgress(tasks: Task[]) {
  if (tasks.length === 0) return 0
  return Math.round((tasks.filter((task) => task.status === 'done').length / tasks.length) * 100)
}

export function ProjectDetail({
  project,
  initialTasks,
  notes,
  resources,
  roadmapItems,
}: ProjectDetailProps) {
  const [currentProject, setCurrentProject] = useState<Project>(project)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [projectNotes, setProjectNotes] = useState<Note[]>(notes)
  const [projectRoadmapItems, setProjectRoadmapItems] = useState<RoadmapItem[]>(roadmapItems)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const completedTasks = tasks.filter((task) => task.status === 'done').length
  const derivedProgress = calculateProgress(tasks)

  const syncProjectProgress = (nextTasks: Task[]) => {
    setCurrentProject((prev) => ({
      ...prev,
      progress: calculateProgress(nextTasks),
    }))
  }

  const setTaskPatch = (taskId: string, patch: Partial<Task>) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task))
    )
    setSelectedTask((prev) => (prev?.id === taskId ? { ...prev, ...patch } : prev))
  }

  const replaceTasks = (nextTasks: Task[]) => {
    setTasks(nextTasks)
    setSelectedTask((prev) => (prev ? nextTasks.find((task) => task.id === prev.id) ?? null : null))
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const previousTasks = tasks
    const nextTasks = previousTasks.map((task) =>
      task.id === taskId ? { ...task, status: newStatus } : task
    )

    setTasks(nextTasks)
    syncProjectProgress(nextTasks)

    const result = await executeMutation({
      action: 'updateTaskStatus',
      payload: {
        taskId,
        status: newStatus,
      },
    })

    if (!result.ok) {
      setTasks(previousTasks)
      syncProjectProgress(previousTasks)
      toast.error(result.message)
    }
  }

  const handleAddNote = async (content: string, taskId?: string) => {
    const result = await executeMutation({
      action: 'addNote',
      payload: {
        projectId: currentProject.id,
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

  const handleAddSubtask = async (taskId: string, title: string) => {
    const result = await executeMutation({
      action: 'addSubtask',
      payload: { taskId, title },
    })

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    const currentTask = tasks.find((task) => task.id === taskId)
    const currentSubtasks = currentTask?.subtasks ?? []
    setTaskPatch(taskId, {
      subtasks: [...currentSubtasks, result.data.subtask],
    })
  }

  const handleUpdateSubtask = async (
    taskId: string,
    subtaskId: string,
    patch: { completed?: boolean; result?: 'pending' | 'pass' | 'fail' }
  ) => {
    const previous = tasks
    const task = tasks.find((item) => item.id === taskId)
    if (!task?.subtasks) return

    setTaskPatch(taskId, {
      subtasks: task.subtasks.map((subtask) =>
        subtask.id === subtaskId
          ? {
              ...subtask,
              ...patch,
              completed:
                typeof patch.completed === 'boolean'
                  ? patch.completed
                  : patch.result
                    ? patch.result !== 'pending'
                    : subtask.completed,
            }
          : subtask
      ),
    })

    const result = await executeMutation({
      action: 'updateSubtask',
      payload: {
        subtaskId,
        patch,
      },
    })

    if (!result.ok) {
      setTasks(previous)
      setSelectedTask(previous.find((item) => item.id === selectedTask?.id) ?? null)
      toast.error(result.message)
      return
    }

    const freshTask = previous.find((item) => item.id === taskId)
    setTaskPatch(taskId, {
      subtasks: (freshTask?.subtasks ?? []).map((subtask) =>
        subtask.id === subtaskId ? result.data.subtask : subtask
      ),
    })
  }

  const handleAddComment = async (taskId: string, content: string) => {
    const result = await executeMutation({
      action: 'addComment',
      payload: { taskId, content },
    })

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    const currentTask = tasks.find((task) => task.id === taskId)
    const currentComments = currentTask?.comments ?? []
    setTaskPatch(taskId, {
      comments: [...currentComments, result.data.comment],
    })
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid min-h-[220px] grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col justify-between gap-4 p-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={statusColors[currentProject.status]}>
                  {statusLabels[currentProject.status]}
                </Badge>
                <Badge variant="outline" className={priorityColors[currentProject.priority]}>
                  {priorityLabels[currentProject.priority]}
                </Badge>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                {currentProject.name}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {currentProject.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Inicio {formatDate(currentProject.startDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <EditProjectDialog
                  key={`${currentProject.id}-${currentProject.name}-${currentProject.status}-${currentProject.priority}-${currentProject.startDate}-${currentProject.dueDate}-${currentProject.image}-${currentProject.tags.join(',')}`}
                  project={currentProject}
                  onUpdated={(updatedProject) => setCurrentProject(updatedProject)}
                />
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
              src={currentProject.image}
              alt={`Portada de ${currentProject.name}`}
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
            <div className="text-2xl font-bold">{derivedProgress}%</div>
            <Progress value={derivedProgress} className="mt-2 h-2" />
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
            <div className="text-2xl font-bold">{formatDateShort(currentProject.dueDate)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(currentProject.dueDate, 'yyyy')}
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
            <Badge
              variant="outline"
              className={`text-sm ${priorityColors[currentProject.priority]}`}
            >
              {priorityLabels[currentProject.priority]}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="tasks">Tareas ({tasks.length})</TabsTrigger>
            <TabsTrigger value="roadmap">Hoja de ruta ({projectRoadmapItems.length})</TabsTrigger>
            <TabsTrigger value="resources">Recursos ({resources.length})</TabsTrigger>
            <TabsTrigger value="notes">Notas ({projectNotes.length})</TabsTrigger>
          </TabsList>
          <CreateTaskDialog
            projects={[currentProject]}
            defaultProjectId={currentProject.id}
            roadmapItems={projectRoadmapItems}
            triggerLabel="Nueva tarea"
            onCreated={(task) => {
              setTasks((prev) => {
                const nextTasks = [task, ...prev]
                syncProjectProgress(nextTasks)
                return nextTasks
              })
              setSelectedTask(task)
            }}
          />
        </div>

        <TabsContent value="tasks" className="mt-4">
          {tasks.length > 0 ? (
            <TaskTable
              tasks={tasks}
              showProject={false}
              onTaskClick={(task) => setSelectedTask(task)}
              onStatusChange={(taskId, status) => void handleStatusChange(taskId, status)}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">Aún no hay tareas</p>
                <CreateTaskDialog
                  projects={[currentProject]}
                  defaultProjectId={currentProject.id}
                  roadmapItems={projectRoadmapItems}
                  triggerLabel="Crear primera tarea"
                  onCreated={(task) => {
                    setTasks((prev) => {
                      const nextTasks = [task, ...prev]
                      syncProjectProgress(nextTasks)
                      return nextTasks
                    })
                    setSelectedTask(task)
                  }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="roadmap" className="mt-4">
          <ProjectRoadmapView
            project={currentProject}
            roadmapItems={projectRoadmapItems}
            tasks={tasks}
            onRoadmapItemsChange={setProjectRoadmapItems}
            onTasksChange={replaceTasks}
            onTaskCreated={(task) => {
              setTasks((prev) => {
                const nextTasks = [task, ...prev]
                syncProjectProgress(nextTasks)
                return nextTasks
              })
              setSelectedTask(task)
            }}
            onTaskOpen={setSelectedTask}
          />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <ProjectNotes notes={projectNotes} tasks={tasks} onAddNote={handleAddNote} />
        </TabsContent>

        <TabsContent value="resources" className="mt-4">
          <ProjectResourcesMap project={currentProject} resources={resources} />
        </TabsContent>
      </Tabs>

      <TaskDetailPanel
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onAddSubtask={handleAddSubtask}
        onUpdateSubtask={handleUpdateSubtask}
        onAddComment={handleAddComment}
        onAddNote={(taskId, content) => handleAddNote(content, taskId)}
      />
    </div>
  )
}

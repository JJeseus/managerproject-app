'use client'

import { useState } from 'react'
import { Kanban, List, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { executeMutation } from '@/lib/client/mutations'
import { type Priority, type Project, type Task, type TaskStatus } from '@/lib/data'
import { KanbanBoard } from './kanban-board'
import { TaskDetailPanel } from './task-detail-panel'
import { TaskTable } from './task-table'

interface TasksViewProps {
  initialTasks: Task[]
  projects: Project[]
}

export function TasksView({ initialTasks, projects }: TasksViewProps) {
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const projectsById = projects.reduce<Record<string, Project>>((acc, project) => {
    acc[project.id] = project
    return acc
  }, {})

  const setTaskPatch = (taskId: string, patch: Partial<Task>) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task))
    )
    setSelectedTask((prev) => (prev?.id === taskId ? { ...prev, ...patch } : prev))
  }

  const handleCreateTask = async () => {
    const title = window.prompt('Título de la tarea:')
    if (!title?.trim()) return

    const targetProjectId =
      projectFilter !== 'all' ? projectFilter : projects.find(Boolean)?.id

    if (!targetProjectId) {
      toast.error('No hay proyectos disponibles para crear una tarea.')
      return
    }

    setIsSaving(true)
    const result = await executeMutation({
      action: 'createTask',
      payload: {
        projectId: targetProjectId,
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

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const previous = tasks
    setTaskPatch(taskId, { status: newStatus })

    const result = await executeMutation({
      action: 'updateTaskStatus',
      payload: {
        taskId,
        status: newStatus,
      },
    })

    if (!result.ok) {
      setTasks(previous)
      setSelectedTask(previous.find((task) => task.id === selectedTask?.id) ?? null)
      toast.error(result.message)
    }
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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter
    return matchesSearch && matchesStatus && matchesPriority && matchesProject
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tareas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as TaskStatus | 'all')}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="todo">Por hacer</SelectItem>
              <SelectItem value="in-progress">En progreso</SelectItem>
              <SelectItem value="blocked">Bloqueadas</SelectItem>
              <SelectItem value="done">Hechas</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(value) => setPriorityFilter(value as Priority | 'all')}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Proyecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proyectos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => value && setView(value as 'list' | 'kanban')}
          >
            <ToggleGroupItem value="list" aria-label="Vista de lista">
              <List className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Vista kanban">
              <Kanban className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Button size="sm" className="gap-1" onClick={() => void handleCreateTask()} disabled={isSaving}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nueva tarea</span>
          </Button>
        </div>
      </div>

      {view === 'list' ? (
        <TaskTable
          tasks={filteredTasks}
          showProject
          projectsById={projectsById}
          onStatusChange={(taskId, status) => void handleStatusChange(taskId, status)}
          onTaskClick={handleTaskClick}
        />
      ) : (
        <KanbanBoard
          tasks={filteredTasks}
          projectsById={projectsById}
          onStatusChange={(taskId, status) => void handleStatusChange(taskId, status)}
          onTaskClick={handleTaskClick}
        />
      )}

      {filteredTasks.length === 0 && view === 'list' && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground">No se encontraron tareas</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => void handleCreateTask()}
            disabled={isSaving}
          >
            <Plus className="mr-2 size-4" />
            Crear tu primera tarea
          </Button>
        </div>
      )}

      <TaskDetailPanel
        task={selectedTask}
        projectsById={projectsById}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onAddSubtask={handleAddSubtask}
        onUpdateSubtask={handleUpdateSubtask}
        onAddComment={handleAddComment}
      />
    </div>
  )
}

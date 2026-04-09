'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Layers3,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { executeMutation } from '@/lib/client/mutations'
import { formatDate } from '@/lib/date'
import {
  priorityColors,
  priorityLabels,
  roadmapStatusColors,
  roadmapStatusLabels,
  taskStatusColors,
  taskStatusLabels,
  type Project,
  type RoadmapItem,
  type RoadmapStatus,
  type Task,
} from '@/lib/data'
import {
  getRoadmapProgress,
  groupTasksByRoadmapItem,
  normalizeRoadmapPositions,
  sortRoadmapItems,
} from '@/lib/projects/roadmap'

interface ProjectRoadmapViewProps {
  project: Project
  roadmapItems: RoadmapItem[]
  tasks: Task[]
  onRoadmapItemsChange: (items: RoadmapItem[]) => void
  onTasksChange: (tasks: Task[]) => void
  onTaskCreated: (task: Task) => void
  onTaskOpen?: (task: Task) => void
}

type RoadmapFormState = {
  title: string
  description: string
  status: RoadmapStatus
  startDate: string
  dueDate: string
}

const DEFAULT_FORM_STATE: RoadmapFormState = {
  title: '',
  description: '',
  status: 'planned',
  startDate: '',
  dueDate: '',
}

const ROADMAP_DIALOG_DESCRIPTION_ID = 'roadmap-dialog-description'
const ROADMAP_DETAIL_PANEL_ID = 'roadmap-detail-panel'

function formatRoadmapDateRange(item: RoadmapItem) {
  if (item.startDate && item.dueDate) {
    return `${formatDate(item.startDate)} - ${formatDate(item.dueDate)}`
  }

  if (item.dueDate) {
    return `Entrega ${formatDate(item.dueDate)}`
  }

  if (item.startDate) {
    return `Inicio ${formatDate(item.startDate)}`
  }

  return 'Sin fechas'
}

function formatTaskDueDate(task: Task) {
  return task.dueDate ? `Entrega ${formatDate(task.dueDate)}` : 'Sin fecha'
}

export function ProjectRoadmapView({
  project,
  roadmapItems,
  tasks,
  onRoadmapItemsChange,
  onTasksChange,
  onTaskCreated,
  onTaskOpen,
}: ProjectRoadmapViewProps) {
  const sortedItems = useMemo(() => sortRoadmapItems(roadmapItems), [roadmapItems])
  const tasksByRoadmapItem = useMemo(() => groupTasksByRoadmapItem(tasks), [tasks])
  const unassignedTasks = tasksByRoadmapItem.unassigned ?? []
  const [selectedRoadmapItemId, setSelectedRoadmapItemId] = useState<string | null>(
    sortedItems[0]?.id ?? null
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [formState, setFormState] = useState<RoadmapFormState>(DEFAULT_FORM_STATE)
  const [isSaving, setIsSaving] = useState(false)
  const [movingItemId, setMovingItemId] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null)
  const [updatingTaskStatusId, setUpdatingTaskStatusId] = useState<string | null>(null)

  useEffect(() => {
    if (sortedItems.length === 0) {
      setSelectedRoadmapItemId(null)
      return
    }

    if (!selectedRoadmapItemId || !sortedItems.some((item) => item.id === selectedRoadmapItemId)) {
      setSelectedRoadmapItemId(sortedItems[0]?.id ?? null)
    }
  }, [selectedRoadmapItemId, sortedItems])

  const selectedItem =
    sortedItems.find((item) => item.id === selectedRoadmapItemId) ?? sortedItems[0] ?? null
  const selectedItemTasks = selectedItem ? tasksByRoadmapItem[selectedItem.id] ?? [] : []

  const openCreateDialog = () => {
    setEditingItemId(null)
    setFormState(DEFAULT_FORM_STATE)
    setDialogOpen(true)
  }

  const openEditDialog = (item: RoadmapItem) => {
    setEditingItemId(item.id)
    setFormState({
      title: item.title,
      description: item.description,
      status: item.status,
      startDate: item.startDate ?? '',
      dueDate: item.dueDate ?? '',
    })
    setDialogOpen(true)
  }

  const handleDialogSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.title.trim()) {
      toast.error('Escribe un título para la fase.')
      return
    }

    setIsSaving(true)
    const result = editingItemId
      ? await executeMutation({
          action: 'updateRoadmapItem',
          payload: {
            itemId: editingItemId,
            patch: {
              title: formState.title.trim(),
              description: formState.description.trim(),
              status: formState.status,
              startDate: formState.startDate || null,
              dueDate: formState.dueDate || null,
            },
          },
        })
      : await executeMutation({
          action: 'addRoadmapItem',
          payload: {
            projectId: project.id,
            title: formState.title.trim(),
            description: formState.description.trim(),
            status: formState.status,
            startDate: formState.startDate || null,
            dueDate: formState.dueDate || null,
          },
        })
    setIsSaving(false)

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    if (result.data && 'item' in result.data) {
      const nextItems = sortRoadmapItems(
        editingItemId
          ? sortedItems.map((item) => (item.id === result.data.item.id ? result.data.item : item))
          : [...sortedItems, result.data.item]
      )
      onRoadmapItemsChange(nextItems)
      setSelectedRoadmapItemId(result.data.item.id)
    }

    setDialogOpen(false)
    setEditingItemId(null)
    setFormState(DEFAULT_FORM_STATE)
    toast.success(editingItemId ? 'Fase actualizada' : 'Fase creada')
  }

  const handleMoveItem = async (itemId: string, direction: 'up' | 'down') => {
    const currentIndex = sortedItems.findIndex((item) => item.id === itemId)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sortedItems.length) {
      return
    }

    const reorderedItems = [...sortedItems]
    const [item] = reorderedItems.splice(currentIndex, 1)
    reorderedItems.splice(targetIndex, 0, item)

    setMovingItemId(itemId)
    const result = await executeMutation({
      action: 'reorderRoadmapItems',
      payload: {
        projectId: project.id,
        orderedItemIds: reorderedItems.map((roadmapItem) => roadmapItem.id),
      },
    })
    setMovingItemId(null)

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    onRoadmapItemsChange(result.data.items)
  }

  const handleDeleteItem = async (item: RoadmapItem) => {
    setDeletingItemId(item.id)
    const result = await executeMutation({
      action: 'deleteRoadmapItem',
      payload: { itemId: item.id },
    })
    setDeletingItemId(null)

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    onRoadmapItemsChange(
      normalizeRoadmapPositions(sortedItems.filter((candidate) => candidate.id !== item.id))
    )
    onTasksChange(
      tasks.map((task) =>
        task.roadmapItemId === item.id ? { ...task, roadmapItemId: undefined } : task
      )
    )
    if (selectedRoadmapItemId === item.id) {
      const nextSelection = sortedItems.find((candidate) => candidate.id !== item.id)
      setSelectedRoadmapItemId(nextSelection?.id ?? null)
    }
    toast.success('Fase eliminada')
  }

  const handleTaskAssignment = async (task: Task, nextRoadmapItemId: string) => {
    setAssigningTaskId(task.id)
    const result =
      nextRoadmapItemId === 'unassigned'
        ? await executeMutation({
            action: 'unassignTaskFromRoadmapItem',
            payload: { taskId: task.id },
          })
        : await executeMutation({
            action: 'assignTaskToRoadmapItem',
            payload: {
              taskId: task.id,
              roadmapItemId: nextRoadmapItemId,
            },
          })
    setAssigningTaskId(null)

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    onTasksChange(tasks.map((candidate) => (candidate.id === task.id ? result.data.task : candidate)))
  }

  const handleTaskStatusChange = async (task: Task, nextStatus: Task['status']) => {
    const previousTasks = tasks
    onTasksChange(
      tasks.map((candidate) =>
        candidate.id === task.id ? { ...candidate, status: nextStatus } : candidate
      )
    )

    setUpdatingTaskStatusId(task.id)
    const result = await executeMutation({
      action: 'updateTaskStatus',
      payload: {
        taskId: task.id,
        status: nextStatus,
      },
    })
    setUpdatingTaskStatusId(null)

    if (!result.ok) {
      onTasksChange(previousTasks)
      toast.error(result.message)
      return
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Hoja de ruta</h2>
            <p className="text-sm text-muted-foreground">
              Organiza el proyecto por fases sin cambiar el cálculo global del avance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {sortedItems.length} {sortedItems.length === 1 ? 'fase' : 'fases'}
            </Badge>
            <Badge variant="outline">
              {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
            </Badge>
            <CreateTaskDialog
              projects={[project]}
              defaultProjectId={project.id}
              roadmapItems={sortedItems}
              defaultRoadmapItemId={selectedItem?.id}
              triggerLabel="Nueva tarea"
              onCreated={onTaskCreated}
            />
            <Button size="sm" className="gap-1" onClick={openCreateDialog}>
              <Plus className="size-4" />
              Nueva fase
            </Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            {sortedItems.length > 0 ? (
              sortedItems.map((item, index) => {
                const progress = getRoadmapProgress(item, tasks)
                const itemTasks = tasksByRoadmapItem[item.id] ?? []
                const isSelected = selectedItem?.id === item.id

                return (
                  <Card
                    key={item.id}
                    className={isSelected ? 'border-foreground/40 shadow-sm' : undefined}
                  >
                    <div className="flex items-start justify-between gap-3 px-6 pt-6">
                      <div className="min-w-0 flex-1" />
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => void handleMoveItem(item.id, 'up')}
                          disabled={index === 0 || movingItemId === item.id}
                        >
                          <ArrowUp className="size-4" />
                          <span className="sr-only">Subir fase</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => void handleMoveItem(item.id, 'down')}
                          disabled={index === sortedItems.length - 1 || movingItemId === item.id}
                        >
                          <ArrowDown className="size-4" />
                          <span className="sr-only">Bajar fase</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Editar fase</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => void handleDeleteItem(item)}
                          disabled={deletingItemId === item.id}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Eliminar fase</span>
                        </Button>
                      </div>
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      className="w-full rounded-[inherit] text-left outline-none transition hover:bg-muted/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() => setSelectedRoadmapItemId(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedRoadmapItemId(item.id)
                        }
                      }}
                      aria-pressed={isSelected}
                      aria-controls={ROADMAP_DETAIL_PANEL_ID}
                      aria-label={`Abrir fase ${index + 1}: ${item.title}. ${progress.totalTasks} tareas.`}
                    >
                      <CardHeader className="gap-3 pb-3 pt-4">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              Fase {index + 1}
                            </span>
                            <Badge
                              variant="outline"
                              className={roadmapStatusColors[item.status]}
                            >
                              {roadmapStatusLabels[item.status]}
                            </Badge>
                          </div>
                          <CardTitle className="text-base">{item.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        {item.description ? (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                        <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-xs text-muted-foreground">Progreso de la fase</div>
                              <div className="mt-1 text-lg font-semibold">{progress.progress}%</div>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              <div>{progress.completedTasks} completadas</div>
                              <div>{progress.totalTasks} totales</div>
                            </div>
                          </div>
                          <Progress
                            value={progress.progress}
                            aria-label={`Progreso de ${item.title}: ${progress.progress}%`}
                          />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground">Tareas</div>
                            <div className="mt-1 text-lg font-semibold">{progress.totalTasks}</div>
                          </div>
                          <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground">Fechas</div>
                            <div className="mt-1 text-sm font-medium">{formatRoadmapDateRange(item)}</div>
                          </div>
                        </div>
                        <div className="rounded-lg border border-dashed bg-muted/10 px-3 py-2 text-sm text-muted-foreground">
                          {itemTasks.length > 0
                            ? `Abre la fase para ver y reorganizar sus ${itemTasks.length} tareas.`
                            : 'Todavía no tiene tareas vinculadas.'}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                )
              })
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <Layers3 className="size-8 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="font-medium">Todavía no hay fases definidas.</p>
                    <p className="text-sm text-muted-foreground">
                      Crea la primera fase para estructurar las tareas del proyecto.
                    </p>
                  </div>
                  <Button size="sm" className="gap-1" onClick={openCreateDialog}>
                    <Plus className="size-4" />
                    Crear primera fase
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Sin fase</CardTitle>
                  <Badge variant="outline">{unassignedTasks.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {unassignedTasks.length > 0 ? (
                  <ScrollArea className="max-h-72 pr-3">
                    <ul className="space-y-3" role="list" aria-label="Tareas sin fase">
                      {unassignedTasks.map((task) => (
                        <TaskAssignmentRow
                          key={task.id}
                          task={task}
                          roadmapItems={sortedItems}
                          assigning={assigningTaskId === task.id}
                          statusUpdating={updatingTaskStatusId === task.id}
                          onAssign={handleTaskAssignment}
                          onStatusChange={handleTaskStatusChange}
                          onOpen={onTaskOpen}
                        />
                      ))}
                    </ul>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Todas las tareas actuales ya están asignadas a una fase.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit" id={ROADMAP_DETAIL_PANEL_ID}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selectedItem ? selectedItem.title : 'Detalle de fase'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedItem ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={roadmapStatusColors[selectedItem.status]}>
                      {roadmapStatusLabels[selectedItem.status]}
                    </Badge>
                    <Badge variant="outline">
                      {getRoadmapProgress(selectedItem, tasks).totalTasks} tareas
                    </Badge>
                  </div>

                  {selectedItem.description ? (
                    <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                  ) : null}

                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="size-3.5" />
                      Ventana
                    </div>
                    <div className="mt-2 text-sm font-medium">
                      {formatRoadmapDateRange(selectedItem)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium">Tareas vinculadas</h3>
                      <Badge variant="secondary">{selectedItemTasks.length}</Badge>
                    </div>
                    {selectedItemTasks.length > 0 ? (
                      <ScrollArea className="max-h-96 pr-3">
                        <ul className="space-y-3" role="list" aria-label="Tareas vinculadas">
                          {selectedItemTasks.map((task) => (
                            <TaskAssignmentRow
                              key={task.id}
                              task={task}
                              roadmapItems={sortedItems}
                              assigning={assigningTaskId === task.id}
                              statusUpdating={updatingTaskStatusId === task.id}
                              onAssign={handleTaskAssignment}
                              onStatusChange={handleTaskStatusChange}
                              onOpen={onTaskOpen}
                            />
                          ))}
                        </ul>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Esta fase todavía no tiene tareas asignadas.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Selecciona una fase para ver su detalle y reorganizar tareas.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingItemId(null)
            setFormState(DEFAULT_FORM_STATE)
          }
        }}
      >
        <DialogContent
          className="sm:max-w-xl"
          aria-describedby={ROADMAP_DIALOG_DESCRIPTION_ID}
        >
          <DialogHeader>
            <DialogTitle>{editingItemId ? 'Editar fase' : 'Nueva fase'}</DialogTitle>
            <DialogDescription id={ROADMAP_DIALOG_DESCRIPTION_ID}>
              Define el objetivo, estado y fechas de esta fase dentro del proyecto.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void handleDialogSubmit(event)}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="roadmap-title">
                Título
              </label>
              <Input
                id="roadmap-title"
                value={formState.title}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, title: event.target.value }))
                }
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="roadmap-description">
                Descripción
              </label>
              <Textarea
                id="roadmap-description"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
                className="min-h-24"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select
                  value={formState.status}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, status: value as RoadmapStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roadmapStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="roadmap-start-date">
                  Inicio
                </label>
                <Input
                  id="roadmap-start-date"
                  type="date"
                  value={formState.startDate}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="roadmap-due-date">
                  Entrega
                </label>
                <Input
                  id="roadmap-due-date"
                  type="date"
                  value={formState.dueDate}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, dueDate: event.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDialogOpen(false)
                  setEditingItemId(null)
                  setFormState(DEFAULT_FORM_STATE)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : editingItemId ? 'Guardar cambios' : 'Crear fase'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface TaskAssignmentRowProps {
  task: Task
  roadmapItems: RoadmapItem[]
  assigning: boolean
  statusUpdating: boolean
  onAssign: (task: Task, nextRoadmapItemId: string) => Promise<void>
  onStatusChange: (task: Task, nextStatus: Task['status']) => Promise<void>
  onOpen?: (task: Task) => void
}

function TaskAssignmentRow({
  task,
  roadmapItems,
  assigning,
  statusUpdating,
  onAssign,
  onStatusChange,
  onOpen,
}: TaskAssignmentRowProps) {
  const selectId = `roadmap-assignment-${task.id}`
  const interactionDisabled = assigning || statusUpdating

  return (
    <li className="rounded-xl border bg-background/80 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Checkbox
              checked={task.status === 'done'}
              disabled={interactionDisabled}
              onCheckedChange={(checked) => {
                void onStatusChange(task, checked ? 'done' : 'todo')
              }}
              aria-label={`Marcar ${task.title} como completada`}
            />
            <Badge variant="outline" className={taskStatusColors[task.status]}>
              {taskStatusLabels[task.status]}
            </Badge>
            <Badge variant="outline" className={priorityColors[task.priority]}>
              {priorityLabels[task.priority]}
            </Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              {formatTaskDueDate(task)}
            </span>
          </div>
          <button
            type="button"
            className={`min-w-0 text-left text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              task.status === 'done' ? 'text-muted-foreground line-through' : ''
            }`}
            onClick={() => onOpen?.(task)}
          >
            {task.title}
          </button>
          {task.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:w-56 sm:flex-none">
          <label className="text-xs font-medium text-muted-foreground" htmlFor={selectId}>
            Fase
          </label>
          <Select
            value={task.roadmapItemId ?? 'unassigned'}
            onValueChange={(value) => void onAssign(task, value)}
            disabled={assigning}
          >
            <SelectTrigger id={selectId} aria-label={`Asignar fase a ${task.title}`}>
              <SelectValue placeholder="Asignar fase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Sin fase</SelectItem>
              {roadmapItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </li>
  )
}

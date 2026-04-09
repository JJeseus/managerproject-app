'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { addDays } from 'date-fns'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { executeMutation } from '@/lib/client/mutations'
import { formatDateInputValue } from '@/lib/date'
import { roadmapStatusLabels, type Priority, type Project, type RoadmapItem, type Task } from '@/lib/data'

interface CreateTaskDialogProps {
  projects: Project[]
  defaultProjectId?: string
  roadmapItems?: RoadmapItem[]
  defaultRoadmapItemId?: string
  triggerLabel?: string
  onCreated?: (task: Task) => void
}

const CREATE_TASK_DESCRIPTION_ID = 'create-task-dialog-description'

export function CreateTaskDialog({
  projects,
  defaultProjectId,
  roadmapItems = [],
  defaultRoadmapItemId,
  triggerLabel = 'Nueva tarea',
  onCreated,
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? '')
  const [roadmapItemId, setRoadmapItemId] = useState(defaultRoadmapItemId ?? 'none')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState(formatDateInputValue(addDays(new Date(), 7)))
  const [tags, setTags] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setProjectId(defaultProjectId ?? projects[0]?.id ?? '')
      setRoadmapItemId(defaultRoadmapItemId ?? 'none')
    }
  }, [defaultProjectId, defaultRoadmapItemId, open, projects])

  const resetForm = () => {
    setProjectId(defaultProjectId ?? projects[0]?.id ?? '')
    setRoadmapItemId(defaultRoadmapItemId ?? 'none')
    setTitle('')
    setDescription('')
    setPriority('medium')
    setDueDate(formatDateInputValue(addDays(new Date(), 7)))
    setTags('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!projectId) {
      toast.error('Selecciona un proyecto.')
      return
    }

    if (!title.trim()) {
      toast.error('Escribe un título para la tarea.')
      return
    }

    setIsSaving(true)
    const result = await executeMutation({
      action: 'createTask',
      payload: {
        projectId,
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        roadmapItemId: roadmapItemId === 'none' ? null : roadmapItemId,
      },
    })
    setIsSaving(false)

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    toast.success('Tarea creada')
    onCreated?.(result.data.task)
    setOpen(false)
    resetForm()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1" disabled={projects.length === 0 && !defaultProjectId}>
          <Plus className="size-4" />
          <span>{triggerLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
        aria-describedby={CREATE_TASK_DESCRIPTION_ID}
      >
        <DialogHeader>
          <DialogTitle>Crear tarea</DialogTitle>
          <DialogDescription id={CREATE_TASK_DESCRIPTION_ID}>
            Registra una tarea con fecha, prioridad y proyecto asociado.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          {!defaultProjectId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Proyecto</label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {defaultProjectId && roadmapItems.length > 0 ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Fase</label>
              <Select value={roadmapItemId} onValueChange={setRoadmapItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una fase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin fase</SelectItem>
                  {roadmapItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title} · {roadmapStatusLabels[item.status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="task-title">
              Título
            </label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Revisar propuesta"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="task-description">
              Descripción
            </label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Agrega detalles, contexto o entregables."
              className="min-h-24"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridad</label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as Priority)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="task-due-date">
                Fecha de entrega
              </label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="task-tags">
              Etiquetas
            </label>
            <Input
              id="task-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="revisión, cliente, urgente"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Crear tarea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

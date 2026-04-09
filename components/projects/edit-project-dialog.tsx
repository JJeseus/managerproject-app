'use client'

import { useState, type FormEvent } from 'react'
import { Pencil } from 'lucide-react'
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
import { type Project, priorityLabels, statusLabels } from '@/lib/data'

interface EditProjectDialogProps {
  project: Project
  onUpdated?: (project: Project) => void
}

const EDIT_PROJECT_DESCRIPTION_ID = 'edit-project-dialog-description'

export function EditProjectDialog({ project, onUpdated }: EditProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [status, setStatus] = useState<Project['status']>(project.status)
  const [priority, setPriority] = useState<Project['priority']>(project.priority)
  const [startDate, setStartDate] = useState(project.startDate)
  const [dueDate, setDueDate] = useState(project.dueDate)
  const [tags, setTags] = useState(project.tags.join(', '))
  const [image, setImage] = useState(project.image)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!name.trim() || !description.trim()) {
      toast.error('Completa el nombre y la descripción.')
      return
    }

    setIsSaving(true)
    const result = await executeMutation({
      action: 'updateProject',
      payload: {
        projectId: project.id,
        patch: {
          name: name.trim(),
          description: description.trim(),
          status,
          priority,
          startDate,
          dueDate,
          image: image.trim(),
          tags: tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        },
      },
    })
    setIsSaving(false)

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    toast.success('Proyecto actualizado')
    setOpen(false)
    onUpdated?.(result.data.project)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Pencil className="size-4" />
          Editar proyecto
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        aria-describedby={EDIT_PROJECT_DESCRIPTION_ID}
      >
        <DialogHeader>
          <DialogTitle>Editar proyecto</DialogTitle>
          <DialogDescription id={EDIT_PROJECT_DESCRIPTION_ID}>
            Cambia la fase, fechas y datos generales del proyecto.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-project-name">
              Nombre
            </label>
            <Input
              id="edit-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-project-description">
              Descripción
            </label>
            <Textarea
              id="edit-project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-28"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fase / estado</label>
              <Select value={status} onValueChange={(value) => setStatus(value as Project['status'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Prioridad</label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as Project['priority'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-project-start-date">
                Fecha de inicio
              </label>
              <Input
                id="edit-project-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-project-due-date">
                Fecha de entrega
              </label>
              <Input
                id="edit-project-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-project-image">
              Imagen
            </label>
            <Input
              id="edit-project-image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="/placeholder.jpg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-project-tags">
              Etiquetas
            </label>
            <Input
              id="edit-project-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="web, urgente, cliente"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

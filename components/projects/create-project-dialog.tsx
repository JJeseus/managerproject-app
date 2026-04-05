'use client'

import { useState, type FormEvent } from 'react'
import { addDays } from 'date-fns'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
import {
  formatDateInputValue,
  formatDateShort,
} from '@/lib/date'
import { priorityLabels, statusLabels } from '@/lib/data'

const DEFAULT_DESCRIPTION = ''

export function CreateProjectDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION)
  const [status, setStatus] = useState<'planning' | 'active' | 'on-hold' | 'completed'>(
    'planning'
  )
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [startDate, setStartDate] = useState(formatDateInputValue())
  const [dueDate, setDueDate] = useState(formatDateInputValue(addDays(new Date(), 30)))
  const [tags, setTags] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const resetForm = () => {
    setName('')
    setDescription(DEFAULT_DESCRIPTION)
    setStatus('planning')
    setPriority('medium')
    setStartDate(formatDateInputValue())
    setDueDate(formatDateInputValue(addDays(new Date(), 30)))
    setTags('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!name.trim() || !description.trim()) {
      toast.error('Completa el nombre y la descripción.')
      return
    }

    setIsSaving(true)
    const result = await executeMutation({
      action: 'createProject',
      payload: {
        name: name.trim(),
        description: description.trim(),
        image: '/placeholder.jpg',
        status,
        priority,
        startDate,
        dueDate,
        progress: 0,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      },
    })
    setIsSaving(false)

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    toast.success('Proyecto creado')
    setOpen(false)
    resetForm()
    router.push(`/projects/${result.data.project.id}`)
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
        <Button size="sm" className="gap-1">
          <Plus className="size-4" />
          <span>Nuevo proyecto</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear proyecto</DialogTitle>
          <DialogDescription>
            Define el objetivo, fechas y estado inicial del nuevo proyecto.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="project-name">
              Nombre
            </label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lanzamiento de marketing"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="project-description">
              Descripción
            </label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el alcance y el objetivo del proyecto."
              className="min-h-28"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridad</label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as typeof priority)}
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="project-start-date">
                Fecha de inicio
              </label>
              <Input
                id="project-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="project-due-date">
                Fecha de entrega
              </label>
              <Input
                id="project-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="project-tags">
              Etiquetas
            </label>
            <Input
              id="project-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="web, urgente, cliente"
            />
            <p className="text-xs text-muted-foreground">
              Separadas por coma. Fechas actuales: inicio {formatDateShort(startDate)} y
              entrega {formatDateShort(dueDate)}.
            </p>
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
              {isSaving ? 'Guardando...' : 'Crear proyecto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

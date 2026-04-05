'use client'

import { useState } from 'react'
import { FileText, Link2, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDistanceToNowEs } from '@/lib/date'
import { type Note, type Task, taskStatusColors, taskStatusLabels } from '@/lib/data'

interface ProjectNotesProps {
  notes: Note[]
  tasks: Task[]
  onAddNote: (content: string, taskId?: string) => Promise<void>
}

export function ProjectNotes({
  notes,
  tasks,
  onAddNote,
}: ProjectNotesProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [linkedTaskId, setLinkedTaskId] = useState<string>('none')
  const [isSaving, setIsSaving] = useState(false)

  const handleAdd = async () => {
    if (!newContent.trim()) return
    setIsSaving(true)
    try {
      await onAddNote(newContent.trim(), linkedTaskId === 'none' ? undefined : linkedTaskId)
      setNewContent('')
      setLinkedTaskId('none')
      setIsAdding(false)
    } finally {
      setIsSaving(false)
    }
  }

  if (notes.length === 0 && !isAdding) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 rounded-full bg-muted p-3">
            <FileText className="size-6 text-muted-foreground" />
          </div>
          <p className="mb-4 text-muted-foreground">Aún no hay notas</p>
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 size-4" />
            Agregar primera nota
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {!isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 size-4" />
            Agregar nota
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-3 p-4">
            <Textarea
              placeholder="Escribe tu nota..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="min-h-[100px] resize-none bg-background"
              autoFocus
            />
            {tasks.length > 0 && (
              <div className="flex items-center gap-2">
                <Link2 className="size-4 shrink-0 text-muted-foreground" />
                <Select value={linkedTaskId} onValueChange={setLinkedTaskId}>
                  <SelectTrigger className="h-8 w-full max-w-xs text-sm">
                    <SelectValue placeholder="Vincular a una tarea (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin tarea vinculada</SelectItem>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false)
                  setNewContent('')
                  setLinkedTaskId('none')
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => void handleAdd()}
                disabled={!newContent.trim() || isSaving}
              >
                Guardar nota
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {notes.map((note) => {
          const linkedTask = note.taskId ? tasks.find((task) => task.id === note.taskId) : null
          return (
            <Card key={note.id} className="group">
              <CardContent className="p-4">
                {linkedTask && (
                  <div className="mb-2 flex items-center gap-1.5">
                    <Link2 className="size-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Vinculada a</span>
                    <Badge
                      variant="outline"
                      className={`py-0 text-xs ${taskStatusColors[linkedTask.status]}`}
                    >
                      {linkedTask.title}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`py-0 text-xs ${taskStatusColors[linkedTask.status]}`}
                    >
                      {taskStatusLabels[linkedTask.status]}
                    </Badge>
                  </div>
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {note.content}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNowEs(note.timestamp)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

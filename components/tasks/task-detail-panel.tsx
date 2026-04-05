'use client'

import { type ReactNode, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Circle,
  MessageSquare,
  Plus,
  Send,
  XCircle,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type Project,
  type SubtaskResult,
  type Task,
  getProjectById,
  priorityColors,
  priorityLabels,
  taskStatusColors,
  taskStatusLabels,
} from '@/lib/data'
import { formatDate, formatDateTime } from '@/lib/date'

interface TaskDetailPanelProps {
  task: Task | null
  projectsById?: Record<string, Project>
  open: boolean
  onClose: () => void
  onAddSubtask?: (taskId: string, title: string) => Promise<void>
  onUpdateSubtask?: (
    taskId: string,
    subtaskId: string,
    patch: { completed?: boolean; result?: SubtaskResult }
  ) => Promise<void>
  onAddComment?: (taskId: string, content: string) => Promise<void>
}

const resultIcons: Record<SubtaskResult, ReactNode> = {
  pending: <Circle className="size-4 text-muted-foreground" />,
  pass: <CheckCircle2 className="size-4 text-emerald-500" />,
  fail: <XCircle className="size-4 text-red-500" />,
}

export function TaskDetailPanel({
  task,
  projectsById,
  open,
  onClose,
  onAddSubtask,
  onUpdateSubtask,
  onAddComment,
}: TaskDetailPanelProps) {
  const [newSubtask, setNewSubtask] = useState('')
  const [newComment, setNewComment] = useState('')
  const [isSubmittingSubtask, setIsSubmittingSubtask] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [updatingSubtaskId, setUpdatingSubtaskId] = useState<string | null>(null)

  if (!task) return null

  const project = projectsById?.[task.projectId] ?? getProjectById(task.projectId)
  const subtasks = task.subtasks ?? []
  const comments = task.comments ?? []

  const completedSubtasks = subtasks.filter((st) => st.completed).length
  const passedSubtasks = subtasks.filter((st) => st.result === 'pass').length
  const failedSubtasks = subtasks.filter((st) => st.result === 'fail').length

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || !onAddSubtask) return
    setIsSubmittingSubtask(true)
    try {
      await onAddSubtask(task.id, newSubtask.trim())
      setNewSubtask('')
    } finally {
      setIsSubmittingSubtask(false)
    }
  }

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    if (!onUpdateSubtask) return
    setUpdatingSubtaskId(subtaskId)
    try {
      await onUpdateSubtask(task.id, subtaskId, { completed: !completed })
    } finally {
      setUpdatingSubtaskId(null)
    }
  }

  const handleSubtaskResult = async (
    subtaskId: string,
    result: SubtaskResult
  ) => {
    if (!onUpdateSubtask) return
    setUpdatingSubtaskId(subtaskId)
    try {
      await onUpdateSubtask(task.id, subtaskId, { result })
    } finally {
      setUpdatingSubtaskId(null)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !onAddComment) return
    setIsSubmittingComment(true)
    try {
      await onAddComment(task.id, newComment.trim())
      setNewComment('')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
        <SheetHeader className="border-b p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <SheetTitle className="text-lg font-semibold leading-tight">
                {task.title}
              </SheetTitle>
              {project && (
                <p className="text-sm text-muted-foreground">{project.name}</p>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={taskStatusColors[task.status]}>
              {taskStatusLabels[task.status]}
            </Badge>
            <Badge variant="outline" className={priorityColors[task.priority]}>
              {priorityLabels[task.priority]}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          </div>

          {task.description && (
            <p className="mt-3 text-sm text-muted-foreground">{task.description}</p>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  Subtareas
                  {subtasks.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({completedSubtasks}/{subtasks.length})
                    </span>
                  )}
                </h3>
                {subtasks.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    {passedSubtasks > 0 && (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <CheckCircle2 className="size-3" /> {passedSubtasks} bien
                      </span>
                    )}
                    {failedSubtasks > 0 && (
                      <span className="flex items-center gap-1 text-red-500">
                        <XCircle className="size-3" /> {failedSubtasks} error
                      </span>
                    )}
                  </div>
                )}
              </div>

              {subtasks.length > 0 ? (
                <div className="space-y-2">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-start gap-3 rounded-lg border bg-card p-3"
                    >
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() =>
                          handleToggleSubtask(subtask.id, subtask.completed)
                        }
                        className="mt-0.5"
                        disabled={updatingSubtaskId === subtask.id}
                      />
                      <div className="flex-1 space-y-1">
                        <p
                          className={`text-sm ${
                            subtask.completed
                              ? 'text-muted-foreground line-through'
                              : ''
                          }`}
                        >
                          {subtask.title}
                        </p>
                        {subtask.result === 'fail' && subtask.resultNote && (
                          <div className="mt-1 flex items-start gap-1.5 text-xs text-red-500">
                            <AlertCircle className="mt-0.5 size-3 shrink-0" />
                            <span>{subtask.resultNote}</span>
                          </div>
                        )}
                      </div>
                      <Select
                        value={subtask.result || 'pending'}
                        onValueChange={(value) =>
                          handleSubtaskResult(subtask.id, value as SubtaskResult)
                        }
                        disabled={updatingSubtaskId === subtask.id}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <span className="flex items-center gap-1.5">
                              {resultIcons.pending} Pendiente
                            </span>
                          </SelectItem>
                          <SelectItem value="pass">
                            <span className="flex items-center gap-1.5">
                              {resultIcons.pass} Bien
                            </span>
                          </SelectItem>
                          <SelectItem value="fail">
                            <span className="flex items-center gap-1.5">
                              {resultIcons.fail} Error
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Aún no hay subtareas
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Agregar subtarea..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleAddSubtask()}
                  className="h-9"
                />
                <Button
                  size="sm"
                  onClick={() => void handleAddSubtask()}
                  disabled={!newSubtask.trim() || isSubmittingSubtask}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="size-4" />
                Comentarios
                {comments.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({comments.length})
                  </span>
                )}
              </h3>

              {comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="space-y-1 rounded-lg border bg-card p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Aún no hay comentarios
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Textarea
                  placeholder="Escribe un comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>
              <Button
                size="sm"
                onClick={() => void handleAddComment()}
                disabled={!newComment.trim() || isSubmittingComment}
                className="w-full"
              >
                <Send className="mr-2 size-4" />
                Agregar comentario
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { mutationRequestSchema, type ApiResult } from '@/lib/db/contracts'
import {
  addComment,
  addNote,
  addSubtask,
  createTask,
  deleteTask,
  isMutationError,
  updateProject,
  updateSubtask,
  updateTask,
  updateTaskStatus,
} from '@/lib/db/mutations'
import { logError } from '@/lib/logger'

function errorResponse(
  status: number,
  errorCode: string,
  message: string
): NextResponse<ApiResult<never>> {
  return NextResponse.json(
    {
      ok: false,
      errorCode,
      message,
    },
    { status }
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = mutationRequestSchema.parse(body)

    switch (parsed.action) {
      case 'createTask':
        return NextResponse.json({ ok: true, data: await createTask(parsed.payload) })
      case 'updateTask':
        return NextResponse.json({ ok: true, data: await updateTask(parsed.payload) })
      case 'deleteTask':
        return NextResponse.json({ ok: true, data: await deleteTask(parsed.payload) })
      case 'updateTaskStatus':
        return NextResponse.json({
          ok: true,
          data: await updateTaskStatus(parsed.payload),
        })
      case 'addSubtask':
        return NextResponse.json({ ok: true, data: await addSubtask(parsed.payload) })
      case 'updateSubtask':
        return NextResponse.json({
          ok: true,
          data: await updateSubtask(parsed.payload),
        })
      case 'addComment':
        return NextResponse.json({ ok: true, data: await addComment(parsed.payload) })
      case 'addNote':
        return NextResponse.json({ ok: true, data: await addNote(parsed.payload) })
      case 'updateProject':
        return NextResponse.json({
          ok: true,
          data: await updateProject(parsed.payload),
        })
      default:
        return errorResponse(400, 'INVALID_ACTION', 'Acción no soportada.')
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(400, 'VALIDATION_ERROR', error.issues[0]?.message ?? 'Entrada inválida.')
    }

    if (isMutationError(error)) {
      return errorResponse(error.status, error.code, error.message)
    }

    logError('Error inesperado en mutaciones', error)
    return errorResponse(500, 'INTERNAL_ERROR', 'Error interno del servidor.')
  }
}

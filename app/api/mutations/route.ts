import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { mutationRequestSchema, type ApiResult } from '@/lib/db/contracts'
import {
  addComment,
  addNote,
  addRoadmapItem,
  addResource,
  addSubtask,
  assignTaskToRoadmapItem,
  createProject,
  createTask,
  deleteRoadmapItem,
  deleteTask,
  isMutationError,
  reorderRoadmapItems,
  unassignTaskFromRoadmapItem,
  updateProject,
  updateRoadmapItem,
  updateResource,
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
      case 'createProject':
        return NextResponse.json({ ok: true, data: await createProject(parsed.payload) })
      case 'createTask':
        return NextResponse.json({ ok: true, data: await createTask(parsed.payload) })
      case 'addRoadmapItem':
        return NextResponse.json({ ok: true, data: await addRoadmapItem(parsed.payload) })
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
      case 'assignTaskToRoadmapItem':
        return NextResponse.json({
          ok: true,
          data: await assignTaskToRoadmapItem(parsed.payload),
        })
      case 'addResource':
        return NextResponse.json({ ok: true, data: await addResource(parsed.payload) })
      case 'deleteRoadmapItem':
        return NextResponse.json({
          ok: true,
          data: await deleteRoadmapItem(parsed.payload),
        })
      case 'reorderRoadmapItems':
        return NextResponse.json({
          ok: true,
          data: await reorderRoadmapItems(parsed.payload),
        })
      case 'unassignTaskFromRoadmapItem':
        return NextResponse.json({
          ok: true,
          data: await unassignTaskFromRoadmapItem(parsed.payload),
        })
      case 'updateResource':
        return NextResponse.json({
          ok: true,
          data: await updateResource(parsed.payload),
        })
      case 'updateProject':
        return NextResponse.json({
          ok: true,
          data: await updateProject(parsed.payload),
        })
      case 'updateRoadmapItem':
        return NextResponse.json({
          ok: true,
          data: await updateRoadmapItem(parsed.payload),
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

import { NextResponse } from 'next/server'
import { getDashboardStats } from '@/lib/db/queries'
import { logError } from '@/lib/logger'

export async function GET() {
  try {
    const stats = await getDashboardStats()
    return NextResponse.json({
      ok: true,
      data: {
        activeProjects: stats.activeProjects,
        openTasks: stats.totalTasks - stats.completedTasks,
      },
    })
  } catch (error) {
    logError('No se pudieron cargar estadísticas del sidebar.', error)
    return NextResponse.json(
      {
        ok: false,
        message: 'No se pudieron cargar estadísticas.',
      },
      { status: 500 }
    )
  }
}

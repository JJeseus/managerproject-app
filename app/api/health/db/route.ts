import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import { logError } from '@/lib/logger'

export async function GET() {
  try {
    const db = getDb()
    await db.execute(sql`select 1`)

    return NextResponse.json({
      ok: true,
      status: 'up',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json(
        {
          ok: false,
          status: 'down',
          reason: 'DATABASE_URL no configurada',
        },
        { status: 503 }
      )
    }

    logError('Healthcheck de base de datos falló', error)
    return NextResponse.json(
      {
        ok: false,
        status: 'down',
      },
      { status: 503 }
    )
  }
}

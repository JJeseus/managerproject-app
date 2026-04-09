import { NextResponse } from 'next/server'
import { getProjectsWithCounts } from '@/lib/db/queries'

export async function GET() {
  const { projects } = await getProjectsWithCounts()

  return NextResponse.json({
    ok: true,
    data: {
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
      })),
    },
  })
}

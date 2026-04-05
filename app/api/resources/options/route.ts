import { NextResponse } from 'next/server'
import { getProjectsWithCounts, getResourcesQuery } from '@/lib/db/queries'

export async function GET() {
  const [{ projects }, resources] = await Promise.all([
    getProjectsWithCounts(),
    getResourcesQuery(200),
  ])

  return NextResponse.json({
    ok: true,
    data: {
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
      })),
      resources: resources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        projectId: resource.projectId,
      })),
    },
  })
}

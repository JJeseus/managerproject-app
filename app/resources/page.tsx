import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { ResourcesView } from '@/components/resources/resources-view'
import { getResourcesGraphQuery } from '@/lib/db/queries'
import { parseResourcesViewState } from '@/lib/resources/resources-view-state'

interface ResourcesPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const resourcesGraphResult = await getResourcesGraphQuery(100).then(
      (graph) => ({ ok: true as const, graph }),
      (error: unknown) => ({
        ok: false as const,
        error,
      })
    )

  return (
    <>
      <Header title="Recursos" breadcrumbs={[{ label: 'Recursos' }]} />
      {resourcesGraphResult.ok ? (
        <ResourcesView
          resources={resourcesGraphResult.graph.resources}
          projects={resourcesGraphResult.graph.projects}
          graphEdges={resourcesGraphResult.graph.edges}
          initialViewState={parseResourcesViewState(resolvedSearchParams)}
        />
      ) : (
        <div className="p-4 md:p-6">
          <Card className="border-dashed">
            <CardContent className="space-y-3 py-10 text-center">
              <h2 className="text-lg font-semibold">Falta crear la tabla de recursos</h2>
              <p className="text-sm text-muted-foreground">
                Ejecuta <code className="rounded bg-muted px-1.5 py-0.5">npm run db:migrate</code>{' '}
                contra la misma base de Neon que usa la app. Después recarga esta página.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

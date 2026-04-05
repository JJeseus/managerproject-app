import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { statusColors, statusLabels } from '@/lib/data'
import { getProgressProjects } from '@/lib/db/queries'

export async function ProgressOverview() {
  const projects = await getProgressProjects(5)

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">
          Avance de proyectos
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-8 gap-1" asChild>
          <Link href="/projects">
            Ver todos
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate group-hover:text-foreground/80 transition-colors">
                  {project.name}
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs ${statusColors[project.status]}`}
                >
                  {statusLabels[project.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={project.progress} className="h-2" />
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {project.progress}%
                </span>
              </div>
            </div>
          </Link>
        ))}
        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No hay proyectos activos
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/projects">Crear proyecto</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

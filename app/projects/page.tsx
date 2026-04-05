import { Header } from '@/components/layout/header'
import { ProjectList } from '@/components/projects/project-list'
import { getProjectsWithCounts } from '@/lib/db/queries'

export default async function ProjectsPage() {
  const { projects, taskCountsByProject } = await getProjectsWithCounts()

  return (
    <>
      <Header
        title="Proyectos"
        breadcrumbs={[{ label: 'Proyectos' }]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground">
            Administra y da seguimiento a todos tus proyectos
          </p>
        </div>

        <ProjectList projects={projects} taskCountsByProject={taskCountsByProject} />
      </div>
    </>
  )
}

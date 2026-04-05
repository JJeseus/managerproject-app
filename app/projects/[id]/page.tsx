import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ProjectDetail } from '@/components/projects/project-detail'
import { getProjectDetailById } from '@/lib/db/queries'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const projectData = await getProjectDetailById(id)

  if (!projectData) {
    notFound()
  }

  const { project, tasks, notes } = projectData

  return (
    <>
      <Header
        title={project.name}
        breadcrumbs={[
          { label: 'Proyectos', href: '/projects' },
          { label: project.name },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <ProjectDetail project={project} initialTasks={tasks} notes={notes} />
      </div>
    </>
  )
}

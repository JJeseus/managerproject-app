import { Header } from '@/components/layout/header'
import { TasksView } from '@/components/tasks/tasks-view'
import { getCalendarTasksAndProjects } from '@/lib/db/queries'

export default async function TasksPage() {
  const { tasks, projects } = await getCalendarTasksAndProjects()

  return (
    <>
      <Header title="Tareas" breadcrumbs={[{ label: 'Tareas' }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tareas</h1>
          <p className="text-muted-foreground">
            Administra y da seguimiento a todas tus tareas
          </p>
        </div>

        <TasksView initialTasks={tasks} projects={projects} />
      </div>
    </>
  )
}

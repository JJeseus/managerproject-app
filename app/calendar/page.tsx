import { Header } from '@/components/layout/header'
import { CalendarView } from '@/components/calendar/calendar-view'
import { getCalendarTasksAndProjects } from '@/lib/db/queries'

export default async function CalendarPage() {
  const { tasks, projects } = await getCalendarTasksAndProjects()

  return (
    <>
      <Header title="Calendario" breadcrumbs={[{ label: 'Calendario' }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendario</h1>
          <p className="text-muted-foreground">
            Consulta próximos vencimientos e hitos
          </p>
        </div>

        <CalendarView tasks={tasks} projects={projects} />
      </div>
    </>
  )
}

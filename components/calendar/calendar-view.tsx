'use client'

import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  type Project,
  type Task,
  taskStatusColors,
} from '@/lib/data'
import { formatDateShort } from '@/lib/date'

interface CalendarViewProps {
  tasks: Task[]
  projects: Project[]
}

export function CalendarView({ tasks, projects }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  )

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => isSameDay(new Date(task.dueDate), date))
  }

  const getProjectsForDate = (date: Date) => {
    return projects.filter((project) =>
      isSameDay(new Date(project.dueDate), date)
    )
  }

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []
  const selectedDateProjects = selectedDate
    ? getProjectsForDate(selectedDate)
    : []

  const upcomingDeadlines = useMemo(() => {
    const today = new Date()
    const upcoming = tasks
      .filter((task) => {
        const dueDate = new Date(task.dueDate)
        return task.status !== 'done' && dueDate >= today
      })
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      )
      .slice(0, 5)
    return upcoming
  }, [tasks])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
      {/* Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Hoy
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {days.map((day) => {
              const dayTasks = getTasksForDate(day)
              const dayProjects = getProjectsForDate(day)
              const hasItems = dayTasks.length > 0 || dayProjects.length > 0
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    min-h-[80px] p-2 text-left transition-colors bg-card
                    hover:bg-accent/50
                    ${!isSameMonth(day, currentMonth) ? 'text-muted-foreground/50' : ''}
                    ${isSelected ? 'bg-accent ring-2 ring-ring ring-inset' : ''}
                  `}
                >
                  <div
                    className={`
                      text-sm mb-1 w-6 h-6 flex items-center justify-center rounded-full
                      ${isToday(day) ? 'bg-foreground text-background font-medium' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </div>
                  {hasItems && (
                    <div className="flex flex-wrap gap-1">
                      {dayTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          className="w-1.5 h-1.5 rounded-full bg-blue-500"
                          title={task.title}
                        />
                      ))}
                      {dayProjects.slice(0, 2).map((project) => (
                        <div
                          key={project.id}
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                          title={project.name}
                        />
                      ))}
                      {dayTasks.length + dayProjects.length > 4 && (
                        <span className="text-xs text-muted-foreground">
                          +{dayTasks.length + dayProjects.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Tareas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Vence proyecto</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Selected Date */}
        {selectedDate && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {format(selectedDate, 'EEEE, d MMMM', { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {selectedDateProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Vence proyecto
                        </p>
                      </div>
                    </div>
                  ))}
                  {selectedDateTasks.map((task) => {
                    const project = projectsById.get(task.projectId)
                    return (
                      <div
                        key={task.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {project && (
                            <p className="text-xs text-muted-foreground">
                              {project.name}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {selectedDateTasks.length === 0 &&
                    selectedDateProjects.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Sin elementos programados
                      </p>
                    )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Próximos vencimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.map((task) => {
                const project = projectsById.get(task.projectId)
                return (
                  <div
                    key={task.id}
                    className="flex items-start justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {task.title}
                      </p>
                      {project && (
                        <p className="text-xs text-muted-foreground">
                          {project.name}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${taskStatusColors[task.status]}`}
                    >
                      {formatDateShort(task.dueDate)}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { LayoutGrid, List, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { ProjectCard } from './project-card'
import { ProjectTable } from './project-table'
import { type Project, type ProjectStatus } from '@/lib/data'

interface ProjectListProps {
  projects: Project[]
  taskCountsByProject: Record<
    string,
    {
      total: number
      completed: number
    }
  >
}

export function ProjectList({ projects, taskCountsByProject }: ProjectListProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proyectos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as ProjectStatus | 'all')
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="planning">Planeación</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="on-hold">En pausa</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as 'grid' | 'list')}
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="grid" aria-label="Vista de cuadrícula">
              <LayoutGrid className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Vista de lista">
              <List className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <CreateProjectDialog />
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              taskCount={taskCountsByProject[project.id]}
            />
          ))}
        </div>
      ) : (
        <ProjectTable
          projects={filteredProjects}
          taskCountsByProject={taskCountsByProject}
        />
      )}

      {filteredProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground">No se encontraron proyectos</p>
          <div className="mt-4">
            <CreateProjectDialog />
          </div>
        </div>
      )}
    </div>
  )
}

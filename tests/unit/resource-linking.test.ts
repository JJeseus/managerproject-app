import { describe, expect, it } from 'vitest'
import {
  attachResourceRelationships,
  buildResourceGraphEdges,
  extractBracketLinks,
  extractHashTags,
  mergeResourceTags,
  resolveResourceLinkDrafts,
} from '@/lib/resources/resource-linking'
import type { Project, Resource, ResourceLink } from '@/lib/data'

const projects: Project[] = [
  {
    id: 'proj-1',
    name: 'Rediseño del sitio web',
    description: '',
    image: '/placeholder.jpg',
    status: 'active',
    priority: 'medium',
    startDate: '2026-04-01',
    dueDate: '2026-04-30',
    progress: 0,
    tags: [],
  },
]

const resources: Resource[] = [
  {
    id: 'res-1',
    projectId: 'proj-1',
    title: 'Footer base en HTML',
    description: 'Usa [[Rediseño del sitio web]] y #html',
    type: 'code',
    language: 'html',
    format: 'html',
    content: 'Relacionado con [[Especificación de integración]] y #ui',
    sourceUrl: '',
    status: 'draft',
    tags: ['manual'],
    timestamp: '2026-04-05T00:00:00Z',
  },
  {
    id: 'res-2',
    projectId: 'proj-1',
    title: 'Especificación de integración',
    description: '',
    type: 'document',
    language: '',
    format: 'pdf',
    content: '',
    sourceUrl: '',
    status: 'ready',
    tags: [],
    timestamp: '2026-04-05T00:00:00Z',
  },
]

describe('resource linking', () => {
  it('extrae tags y links embebidos', () => {
    expect(extractBracketLinks('Hola [[Proyecto]] y [[Recurso]]')).toEqual(['Proyecto', 'Recurso'])
    expect(extractHashTags('Texto #html y #appsheet')).toEqual(['html', 'appsheet'])
  })

  it('mezcla tags manuales con tags del contenido sin duplicados', () => {
    expect(mergeResourceTags(['manual', 'HTML'], ['#html #ui'])).toEqual(['manual', 'html', 'ui'])
  })

  it('resuelve links a proyecto y recurso', () => {
    const result = resolveResourceLinkDrafts('res-1', [resources[0].description, resources[0].content], {
      projects,
      resources,
    })

    expect(result.unresolved).toEqual([])
    expect(result.drafts).toEqual([
      {
        targetType: 'project',
        targetId: 'proj-1',
        targetName: 'Rediseño del sitio web',
        label: 'Rediseño del sitio web',
      },
      {
        targetType: 'resource',
        targetId: 'res-2',
        targetName: 'Especificación de integración',
        label: 'Especificación de integración',
      },
    ])
  })

  it('deja menciones no resueltas sin romper el parser', () => {
    const result = resolveResourceLinkDrafts('res-1', ['[[No existe]]'], {
      projects,
      resources,
    })

    expect(result.drafts).toEqual([])
    expect(result.unresolved).toEqual(['No existe'])
  })

  it('construye relaciones y backlinks', () => {
    const links: ResourceLink[] = [
      {
        id: 'link-1',
        sourceResourceId: 'res-1',
        targetType: 'resource',
        targetId: 'res-2',
        targetName: 'Especificación de integración',
        label: 'Especificación de integración',
        createdAt: '2026-04-05T00:00:00Z',
      },
    ]

    const hydrated = attachResourceRelationships(resources, projects, links)
    const target = hydrated.find((resource) => resource.id === 'res-2')

    expect(target?.backlinks).toEqual([
      {
        id: 'link-1',
        sourceResourceId: 'res-1',
        sourceResourceTitle: 'Footer base en HTML',
        sourceProjectId: 'proj-1',
        sourceProjectName: 'Rediseño del sitio web',
        label: 'Especificación de integración',
        createdAt: '2026-04-05T00:00:00Z',
      },
    ])
  })

  it('genera aristas de grafo para proyecto principal y links explicitos', () => {
    const hydrated = [
      {
        ...resources[0],
        links: [
          {
            id: 'link-1',
            sourceResourceId: 'res-1',
            targetType: 'project' as const,
            targetId: 'proj-1',
            targetName: 'Rediseño del sitio web',
            label: 'Rediseño del sitio web',
            createdAt: '2026-04-05T00:00:00Z',
          },
        ],
      },
    ]

    expect(buildResourceGraphEdges(hydrated)).toEqual([
      {
        id: 'primary:res-1:proj-1',
        sourceType: 'project',
        sourceId: 'proj-1',
        targetType: 'resource',
        targetId: 'res-1',
        kind: 'primary-project',
      },
      {
        id: 'link-1',
        sourceType: 'resource',
        sourceId: 'res-1',
        targetType: 'project',
        targetId: 'proj-1',
        kind: 'explicit-project',
        label: 'Rediseño del sitio web',
      },
    ])
  })
})

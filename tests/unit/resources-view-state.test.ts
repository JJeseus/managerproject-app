import { describe, expect, it } from 'vitest'
import type { Resource } from '@/lib/data'
import {
  buildResourcesViewSearchParams,
  defaultResourcesViewState,
  filterAndSortResources,
  parseResourcesViewState,
} from '@/lib/resources/resources-view-state'

const resources: Resource[] = [
  {
    id: 'res-1',
    title: 'Especificación de integración',
    description: 'Documento base del proyecto',
    type: 'document',
    language: '',
    format: 'pdf',
    content: '',
    projectId: 'proj-1',
    sourceUrl: 'https://example.com/spec.pdf',
    status: 'ready',
    tags: ['cliente'],
    timestamp: '2026-04-06T10:00:00.000Z',
  },
  {
    id: 'res-2',
    title: 'SQL de reporte',
    description: 'Query principal',
    type: 'dataset',
    language: '',
    format: 'sql',
    content: 'select * from sales',
    projectId: 'proj-2',
    sourceUrl: '',
    status: 'draft',
    tags: ['sql', 'reportes'],
    timestamp: '2026-04-07T08:00:00.000Z',
  },
  {
    id: 'res-3',
    title: 'Footer base',
    description: 'Snippet HTML reutilizable',
    type: 'code',
    language: 'html',
    format: '',
    content: '<footer></footer>',
    projectId: 'proj-1',
    sourceUrl: '',
    status: 'applied',
    tags: ['frontend'],
    timestamp: '2026-04-05T08:00:00.000Z',
  },
]

describe('resources view state', () => {
  it('parsea y normaliza search params conocidos', () => {
    const state = parseResourcesViewState({
      view: 'map',
      q: ' sql ',
      type: 'dataset',
      status: 'draft',
      project: 'proj-2',
      sort: 'title',
      resource: 'res-2',
    })

    expect(state).toEqual({
      view: 'map',
      q: 'sql',
      type: 'dataset',
      status: 'draft',
      project: 'proj-2',
      sort: 'title',
      resource: 'res-2',
    })
  })

  it('ignora valores desconocidos y vuelve a defaults', () => {
    expect(
      parseResourcesViewState({
        view: 'grid',
        type: 'video',
        status: 'done',
        sort: 'priority',
      })
    ).toEqual(defaultResourcesViewState)
  })

  it('serializa solo diferencias respecto a defaults', () => {
    const params = buildResourcesViewSearchParams({
      ...defaultResourcesViewState,
      q: 'cliente',
      status: 'ready',
      resource: 'res-1',
    })

    expect(params.toString()).toBe('q=cliente&status=ready&resource=res-1')
  })

  it('filtra y ordena recursos por búsqueda, filtros y sort', () => {
    const result = filterAndSortResources(
      resources,
      {
        view: 'list',
        q: 'sql',
        type: 'all',
        status: 'all',
        project: 'all',
        sort: 'recent',
        resource: '',
      },
      {
        projectNamesById: {
          'proj-1': 'Proyecto web',
          'proj-2': 'Proyecto BI',
        },
      }
    )

    expect(result.map((resource) => resource.id)).toEqual(['res-2'])
  })

  it('ordena por estado usando el orden operativo definido', () => {
    const result = filterAndSortResources(resources, {
      view: 'list',
      q: '',
      type: 'all',
      status: 'all',
      project: 'all',
      sort: 'status',
      resource: '',
    })

    expect(result.map((resource) => resource.id)).toEqual(['res-2', 'res-1', 'res-3'])
  })
})

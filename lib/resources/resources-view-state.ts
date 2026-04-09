import type { Resource, ResourceStatus, ResourceType } from '@/lib/data'
import { resourceStatusOrder, resourceTypeOrder } from '@/lib/resources/resource-presentation'

export type ResourceListSort = 'recent' | 'title' | 'status' | 'type'
export type ResourcesViewMode = 'list' | 'map'

export interface ResourcesViewState {
  view: ResourcesViewMode
  q: string
  type: ResourceType | 'all'
  status: ResourceStatus | 'all'
  project: string
  sort: ResourceListSort
  resource: string
}

export interface FilterAndSortOptions {
  projectNamesById?: Record<string, string>
}

export const defaultResourcesViewState: ResourcesViewState = {
  view: 'list',
  q: '',
  type: 'all',
  status: 'all',
  project: 'all',
  sort: 'recent',
  resource: '',
}

function getSearchParamValue(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
  key: keyof ResourcesViewState
) {
  if (input instanceof URLSearchParams) {
    return input.get(key)
  }

  const value = input[key]
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function isResourceType(value: string): value is ResourceType {
  return value === 'code'
    || value === 'document'
    || value === 'spreadsheet'
    || value === 'dataset'
    || value === 'link'
    || value === 'image'
    || value === 'other'
}

function isResourceStatus(value: string): value is ResourceStatus {
  return value === 'draft'
    || value === 'ready'
    || value === 'applied'
    || value === 'archived'
}

function isViewMode(value: string): value is ResourcesViewMode {
  return value === 'list' || value === 'map'
}

function isSort(value: string): value is ResourceListSort {
  return value === 'recent' || value === 'title' || value === 'status' || value === 'type'
}

export function parseResourcesViewState(
  input?: URLSearchParams | Record<string, string | string[] | undefined>
) {
  if (!input) {
    return defaultResourcesViewState
  }

  const viewValue = getSearchParamValue(input, 'view')
  const typeValue = getSearchParamValue(input, 'type')
  const statusValue = getSearchParamValue(input, 'status')
  const sortValue = getSearchParamValue(input, 'sort')

  return {
    view: viewValue && isViewMode(viewValue) ? viewValue : defaultResourcesViewState.view,
    q: getSearchParamValue(input, 'q')?.trim() ?? defaultResourcesViewState.q,
    type:
      typeValue === 'all'
        ? 'all'
        : typeValue && isResourceType(typeValue)
          ? typeValue
          : defaultResourcesViewState.type,
    status:
      statusValue === 'all'
        ? 'all'
        : statusValue && isResourceStatus(statusValue)
          ? statusValue
          : defaultResourcesViewState.status,
    project: getSearchParamValue(input, 'project')?.trim() || defaultResourcesViewState.project,
    sort: sortValue && isSort(sortValue) ? sortValue : defaultResourcesViewState.sort,
    resource: getSearchParamValue(input, 'resource')?.trim() || defaultResourcesViewState.resource,
  }
}

export function buildResourcesViewSearchParams(state: ResourcesViewState) {
  const params = new URLSearchParams()

  if (state.view !== defaultResourcesViewState.view) {
    params.set('view', state.view)
  }

  if (state.q) {
    params.set('q', state.q)
  }

  if (state.type !== defaultResourcesViewState.type) {
    params.set('type', state.type)
  }

  if (state.status !== defaultResourcesViewState.status) {
    params.set('status', state.status)
  }

  if (state.project !== defaultResourcesViewState.project) {
    params.set('project', state.project)
  }

  if (state.sort !== defaultResourcesViewState.sort) {
    params.set('sort', state.sort)
  }

  if (state.resource) {
    params.set('resource', state.resource)
  }

  return params
}

function getResourceSearchHaystack(resource: Resource, projectName?: string) {
  return [
    resource.title,
    resource.description,
    resource.content,
    resource.sourceUrl,
    resource.format,
    resource.language,
    projectName,
    ...(resource.tags ?? []),
    ...(resource.links?.map((link) => link.targetName) ?? []),
    ...(resource.backlinks?.map((backlink) => backlink.sourceResourceTitle) ?? []),
    ...(resource.unresolvedLinks ?? []),
  ]
    .join(' ')
    .toLowerCase()
}

export function filterAndSortResources(
  resources: Resource[],
  state: ResourcesViewState,
  options: FilterAndSortOptions = {}
) {
  const query = state.q.trim().toLowerCase()

  const filtered = resources.filter((resource) => {
    if (state.type !== 'all' && resource.type !== state.type) {
      return false
    }

    if (state.status !== 'all' && resource.status !== state.status) {
      return false
    }

    if (state.project !== 'all' && (resource.projectId ?? 'none') !== state.project) {
      return false
    }

    if (!query) {
      return true
    }

    const projectName = resource.projectId
      ? options.projectNamesById?.[resource.projectId]
      : undefined

    return getResourceSearchHaystack(resource, projectName).includes(query)
  })

  return filtered.toSorted((left, right) => {
    switch (state.sort) {
      case 'title':
        return left.title.localeCompare(right.title, 'es', { sensitivity: 'base' })
      case 'status':
        return resourceStatusOrder[left.status] - resourceStatusOrder[right.status]
          || right.timestamp.localeCompare(left.timestamp)
      case 'type':
        return resourceTypeOrder.indexOf(left.type) - resourceTypeOrder.indexOf(right.type)
          || left.title.localeCompare(right.title, 'es', { sensitivity: 'base' })
      case 'recent':
      default:
        return right.timestamp.localeCompare(left.timestamp)
    }
  })
}

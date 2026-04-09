import type {
  Project,
  Resource,
  ResourceBacklink,
  ResourceGraphEdge,
  ResourceLink,
  ResourceLinkTargetType,
} from '@/lib/data'

export interface ResourceLinkDraft {
  targetType: ResourceLinkTargetType
  targetId: string
  targetName: string
  label: string
}

interface LinkableContext {
  projects: Project[]
  resources: Resource[]
}

const bracketLinkPattern = /\[\[([^[\]]+)\]\]/g
const hashtagPattern = /(^|[\s(])#([a-zA-Z0-9_-]+)/g

export function normalizeReferenceLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

export function extractBracketLinks(value: string) {
  const matches = Array.from(value.matchAll(bracketLinkPattern))
  return matches.map((match) => match[1].trim()).filter(Boolean)
}

export function extractHashTags(value: string) {
  const matches = Array.from(value.matchAll(hashtagPattern))
  return matches.map((match) => match[2].trim().toLowerCase()).filter(Boolean)
}

export function mergeResourceTags(explicitTags: string[], textValues: string[]) {
  return Array.from(
    new Set(
      [...explicitTags, ...textValues.flatMap((value) => extractHashTags(value))]
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  )
}

export function resolveResourceLinkDrafts(
  sourceResourceId: string | undefined,
  values: Array<string | undefined>,
  context: LinkableContext
) {
  const labels = values.flatMap((value) => extractBracketLinks(value ?? ''))
  const unresolved = new Set<string>()
  const drafts: ResourceLinkDraft[] = []

  const projectsByName = context.projects.reduce<Record<string, Project[]>>((acc, project) => {
    const key = normalizeReferenceLabel(project.name)
    acc[key] = [...(acc[key] ?? []), project]
    return acc
  }, {})

  const resourcesByTitle = context.resources.reduce<Record<string, Resource[]>>((acc, resource) => {
    const key = normalizeReferenceLabel(resource.title)
    acc[key] = [...(acc[key] ?? []), resource]
    return acc
  }, {})

  for (const label of labels) {
    const normalized = normalizeReferenceLabel(label)
    const projectMatches = projectsByName[normalized] ?? []
    const resourceMatches = (resourcesByTitle[normalized] ?? []).filter(
      (resource) => resource.id !== sourceResourceId
    )

    if (projectMatches.length === 1) {
      const project = projectMatches[0]
      drafts.push({
        targetType: 'project',
        targetId: project.id,
        targetName: project.name,
        label,
      })
      continue
    }

    if (projectMatches.length > 1) {
      unresolved.add(label)
      continue
    }

    if (resourceMatches.length === 1) {
      const resource = resourceMatches[0]
      drafts.push({
        targetType: 'resource',
        targetId: resource.id,
        targetName: resource.title,
        label,
      })
      continue
    }

    unresolved.add(label)
  }

  const dedupedDrafts = Array.from(
    new Map(
      drafts.map((draft) => [`${draft.targetType}:${draft.targetId}:${normalizeReferenceLabel(draft.label)}`, draft])
    ).values()
  )

  return {
    drafts: dedupedDrafts,
    unresolved: Array.from(unresolved),
  }
}

export function attachResourceRelationships(
  resources: Resource[],
  projects: Project[],
  links: ResourceLink[]
) {
  const projectById = Object.fromEntries(projects.map((project) => [project.id, project]))
  const resourceById = Object.fromEntries(resources.map((resource) => [resource.id, resource]))

  const outgoingByResourceId = links.reduce<Record<string, ResourceLink[]>>((acc, link) => {
    acc[link.sourceResourceId] = [...(acc[link.sourceResourceId] ?? []), link]
    return acc
  }, {})

  const backlinksByResourceId = links.reduce<Record<string, ResourceBacklink[]>>((acc, link) => {
    if (link.targetType !== 'resource') {
      return acc
    }

    const sourceResource = resourceById[link.sourceResourceId]
    acc[link.targetId] = [
      ...(acc[link.targetId] ?? []),
      {
        id: link.id,
        sourceResourceId: link.sourceResourceId,
        sourceResourceTitle: sourceResource?.title ?? 'Recurso',
        sourceProjectId: sourceResource?.projectId,
        sourceProjectName: sourceResource?.projectId
          ? projectById[sourceResource.projectId]?.name
          : undefined,
        label: link.label,
        createdAt: link.createdAt,
      },
    ]
    return acc
  }, {})

  return resources.map((resource) => ({
    ...resource,
    links: outgoingByResourceId[resource.id] ?? [],
    backlinks: backlinksByResourceId[resource.id] ?? [],
  }))
}

export function buildResourceGraphEdges(resources: Resource[]): ResourceGraphEdge[] {
  const edges: ResourceGraphEdge[] = []

  for (const resource of resources) {
    if (resource.projectId) {
      edges.push({
        id: `primary:${resource.id}:${resource.projectId}`,
        sourceType: 'project',
        sourceId: resource.projectId,
        targetType: 'resource',
        targetId: resource.id,
        kind: 'primary-project',
      })
    }

    for (const link of resource.links ?? []) {
      edges.push({
        id: link.id,
        sourceType: 'resource',
        sourceId: resource.id,
        targetType: link.targetType,
        targetId: link.targetId,
        kind: link.targetType === 'project' ? 'explicit-project' : 'explicit-resource',
        label: link.label,
      })
    }
  }

  return edges
}

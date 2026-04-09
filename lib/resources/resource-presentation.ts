import type { ResourceStatus, ResourceType } from '@/lib/data'

export const resourceTypeLabels: Record<ResourceType, string> = {
  code: 'Código',
  document: 'Documento',
  spreadsheet: 'Hoja de cálculo',
  dataset: 'Datos',
  link: 'Enlace',
  image: 'Imagen',
  other: 'Otro',
}

export const resourceStatusLabels: Record<ResourceStatus, string> = {
  draft: 'Borrador',
  ready: 'Listo',
  applied: 'Aplicado',
  archived: 'Archivado',
}

export const resourceStatusOrder: Record<ResourceStatus, number> = {
  draft: 0,
  ready: 1,
  applied: 2,
  archived: 3,
}

export const resourceTypeOrder: ResourceType[] = [
  'document',
  'spreadsheet',
  'dataset',
  'code',
  'link',
  'image',
  'other',
]

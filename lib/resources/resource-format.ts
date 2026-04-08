import type { ResourceType } from '@/lib/data'

export interface ResourceSourceSuggestion {
  type: Exclude<ResourceType, 'code'>
  format: string
}

function getPathname(url: URL) {
  return url.pathname.toLowerCase()
}

function getHostname(url: URL) {
  return url.hostname.replace(/^www\./, '').toLowerCase()
}

export function detectResourceSourceSuggestion(
  sourceUrl: string | null | undefined
): ResourceSourceSuggestion | null {
  if (!sourceUrl?.trim()) {
    return null
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(sourceUrl)
  } catch {
    return null
  }

  const hostname = getHostname(parsedUrl)
  const pathname = getPathname(parsedUrl)

  if (hostname === 'docs.google.com') {
    if (pathname.startsWith('/document/')) {
      return { type: 'document', format: 'google-doc' }
    }
    if (pathname.startsWith('/spreadsheets/')) {
      return { type: 'spreadsheet', format: 'google-sheet' }
    }
  }

  if (hostname === 'drive.google.com') {
    return { type: 'link', format: 'google-drive' }
  }

  if (hostname === 'figma.com') {
    return { type: 'link', format: 'figma' }
  }

  if (hostname === 'notion.so' || hostname.endsWith('.notion.site')) {
    return { type: 'link', format: 'notion' }
  }

  if (hostname === 'loom.com') {
    return { type: 'link', format: 'loom' }
  }

  if (pathname.endsWith('.pdf')) {
    return { type: 'document', format: 'pdf' }
  }

  if (pathname.endsWith('.docx')) {
    return { type: 'document', format: 'docx' }
  }

  if (pathname.endsWith('.xlsx')) {
    return { type: 'spreadsheet', format: 'xlsx' }
  }

  if (pathname.endsWith('.csv')) {
    return { type: 'dataset', format: 'csv' }
  }

  if (pathname.endsWith('.json')) {
    return { type: 'dataset', format: 'json' }
  }

  if (pathname.endsWith('.png')) {
    return { type: 'image', format: 'png' }
  }

  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) {
    return { type: 'image', format: 'jpg' }
  }

  if (pathname.endsWith('.svg')) {
    return { type: 'image', format: 'svg' }
  }

  if (pathname.endsWith('.webp')) {
    return { type: 'image', format: 'webp' }
  }

  return { type: 'link', format: 'website' }
}

export function detectResourceFormatForType(
  sourceUrl: string | null | undefined,
  resourceType: Exclude<ResourceType, 'code'>
) {
  const suggestion = detectResourceSourceSuggestion(sourceUrl)

  if (!suggestion) {
    return null
  }

  return suggestion.type === resourceType ? suggestion.format : null
}

export function isValidAbsoluteUrl(value: string) {
  if (!value.trim()) {
    return true
  }

  try {
    const parsedUrl = new URL(value)
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

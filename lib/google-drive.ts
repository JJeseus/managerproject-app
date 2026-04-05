const GOOGLE_DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com'])

type GoogleDrivePreviewKind = 'file' | 'document' | 'spreadsheet' | 'presentation'

export interface GoogleDrivePreview {
  fileId: string
  kind: GoogleDrivePreviewKind
  previewUrl: string
}

function normalizePath(pathname: string) {
  return pathname.replace(/\/+/g, '/')
}

function appendResourceKey(previewUrl: URL, sourceUrl: URL) {
  const resourceKey = sourceUrl.searchParams.get('resourcekey')
  if (resourceKey) {
    previewUrl.searchParams.set('resourcekey', resourceKey)
  }
}

export function getGoogleDrivePreview(sourceUrl: string | null | undefined): GoogleDrivePreview | null {
  if (!sourceUrl) return null

  let parsedUrl: URL

  try {
    parsedUrl = new URL(sourceUrl)
  } catch {
    return null
  }

  if (!GOOGLE_DRIVE_HOSTS.has(parsedUrl.hostname)) {
    return null
  }

  const pathname = normalizePath(parsedUrl.pathname)
  const fileIdFromQuery = parsedUrl.searchParams.get('id')

  const matchers: Array<{
    kind: GoogleDrivePreviewKind
    pattern: RegExp
    baseUrl: string
  }> = [
    {
      kind: 'document',
      pattern: /^\/document\/d\/([a-zA-Z0-9_-]+)/,
      baseUrl: 'https://docs.google.com/document/d',
    },
    {
      kind: 'spreadsheet',
      pattern: /^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
      baseUrl: 'https://docs.google.com/spreadsheets/d',
    },
    {
      kind: 'presentation',
      pattern: /^\/presentation\/d\/([a-zA-Z0-9_-]+)/,
      baseUrl: 'https://docs.google.com/presentation/d',
    },
    {
      kind: 'file',
      pattern: /^\/file\/d\/([a-zA-Z0-9_-]+)/,
      baseUrl: 'https://drive.google.com/file/d',
    },
  ]

  for (const matcher of matchers) {
    const match = pathname.match(matcher.pattern)
    if (!match) continue

    const fileId = match[1]
    const previewUrl = new URL(`${matcher.baseUrl}/${fileId}/preview`)
    appendResourceKey(previewUrl, parsedUrl)

    return {
      fileId,
      kind: matcher.kind,
      previewUrl: previewUrl.toString(),
    }
  }

  if (parsedUrl.hostname === 'drive.google.com' && fileIdFromQuery) {
    const previewUrl = new URL(`https://drive.google.com/file/d/${fileIdFromQuery}/preview`)
    appendResourceKey(previewUrl, parsedUrl)

    return {
      fileId: fileIdFromQuery,
      kind: 'file',
      previewUrl: previewUrl.toString(),
    }
  }

  return null
}

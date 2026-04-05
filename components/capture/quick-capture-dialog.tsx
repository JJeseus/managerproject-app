'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import prettier from 'prettier/standalone'
import babelPlugin from 'prettier/plugins/babel'
import estreePlugin from 'prettier/plugins/estree'
import htmlPlugin from 'prettier/plugins/html'
import markdownPlugin from 'prettier/plugins/markdown'
import typescriptPlugin from 'prettier/plugins/typescript'
import cssPlugin from 'prettier/plugins/postcss'
import yamlPlugin from 'prettier/plugins/yaml'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CodePreview } from '@/components/resources/code-preview'
import { executeMutation } from '@/lib/client/mutations'
import { type Project, type Resource, type ResourceStatus, type ResourceType } from '@/lib/data'

type ProjectOption = Pick<Project, 'id' | 'name' | 'status'>
type ResourceOption = Pick<Resource, 'id' | 'title' | 'projectId'>
type LinkableOption =
  | { id: string; name: string; entityType: 'project' }
  | { id: string; name: string; entityType: 'resource' }
type LinkField = 'description' | 'content'

type TriggerVariant = ComponentProps<typeof Button>['variant']
type TriggerSize = ComponentProps<typeof Button>['size']

interface QuickCaptureDialogProps {
  buttonLabel?: string
  resource?: Resource
  triggerVariant?: TriggerVariant
  triggerSize?: TriggerSize
  triggerIcon?: ReactNode
}

type SupportedCodeLanguage =
  | 'html'
  | 'css'
  | 'javascript'
  | 'typescript'
  | 'json'
  | 'yaml'
  | 'markdown'
  | 'xml'
  | 'sql'
  | 'r'
  | 'appscript'
  | 'appsheet'
  | 'shell'

const defaultCodeLanguages: SupportedCodeLanguage[] = [
  'html',
  'css',
  'javascript',
  'typescript',
  'json',
  'yaml',
  'markdown',
  'xml',
  'sql',
  'r',
  'appscript',
  'appsheet',
  'shell',
]

const codeLanguageLabels: Record<SupportedCodeLanguage, string> = {
  html: 'HTML',
  css: 'CSS',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  json: 'JSON',
  yaml: 'YAML',
  markdown: 'Markdown',
  xml: 'XML',
  sql: 'SQL',
  r: 'R',
  appscript: 'App Script',
  appsheet: 'AppSheet',
  shell: 'Shell',
}

const addCustomLanguageValue = '__add_custom_language__'

const resourceFormatOptions: Record<Exclude<ResourceType, 'code'>, Array<{ value: string; label: string }>> = {
  document: [
    { value: 'pdf', label: 'PDF' },
    { value: 'google-doc', label: 'Google Docs' },
    { value: 'docx', label: 'Word (.docx)' },
    { value: 'presentation', label: 'Presentación' },
    { value: 'manual', label: 'Manual' },
    { value: 'spec', label: 'Especificación' },
  ],
  spreadsheet: [
    { value: 'google-sheet', label: 'Google Sheets' },
    { value: 'xlsx', label: 'Excel (.xlsx)' },
    { value: 'csv', label: 'CSV' },
  ],
  dataset: [
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' },
    { value: 'sql', label: 'SQL dump' },
    { value: 'parquet', label: 'Parquet' },
  ],
  link: [
    { value: 'google-drive', label: 'Google Drive' },
    { value: 'figma', label: 'Figma' },
    { value: 'notion', label: 'Notion' },
    { value: 'website', label: 'Sitio web' },
    { value: 'loom', label: 'Loom' },
  ],
  image: [
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'svg', label: 'SVG' },
    { value: 'webp', label: 'WEBP' },
  ],
  other: [
    { value: 'reference', label: 'Referencia' },
    { value: 'attachment', label: 'Adjunto' },
    { value: 'note', label: 'Nota' },
  ],
}

const resourceFormatFieldLabels: Record<Exclude<ResourceType, 'code'>, string> = {
  document: 'Tipo de documento',
  spreadsheet: 'Tipo de hoja',
  dataset: 'Formato de datos',
  link: 'Tipo de enlace',
  image: 'Formato de imagen',
  other: 'Clasificación',
}

function getDefaultFormatForType(type: Exclude<ResourceType, 'code'>) {
  return resourceFormatOptions[type][0]?.value ?? ''
}

function buildResourceForm(resource?: Resource) {
  const isCode = resource?.type === 'code'
  const language = resource?.language?.trim() || 'html'
  const nonCodeType = resource?.type && resource.type !== 'code' ? resource.type : null
  const format =
    nonCodeType
      ? resource?.format?.trim() || getDefaultFormatForType(nonCodeType)
      : ''

  return {
    resourceProjectId: resource?.projectId ?? 'none',
    resourceTitle: resource?.title ?? '',
    resourceDescription: resource?.description ?? '',
    resourceType: resource?.type ?? 'code',
    languageChoice: isCode ? language : 'html',
    resourceLanguage: isCode ? language : 'html',
    availableLanguages: isCode && !defaultCodeLanguages.includes(language as SupportedCodeLanguage)
      ? [...defaultCodeLanguages, language]
      : defaultCodeLanguages,
    newLanguage: '',
    resourceFormat: format,
    resourceSourceUrl: resource?.type && resource.type !== 'code' ? resource.sourceUrl : '',
    resourceContent: resource?.content ?? '',
    resourceStatus: resource?.status ?? 'draft',
    resourceTags: resource?.tags?.join(', ') ?? '',
  }
}

const resourceTypeLabels: Record<ResourceType, string> = {
  code: 'Código',
  document: 'Documento',
  spreadsheet: 'Hoja de cálculo',
  dataset: 'Datos',
  link: 'Enlace',
  image: 'Imagen',
  other: 'Otro',
}

const resourceStatusLabels: Record<ResourceStatus, string> = {
  draft: 'Borrador',
  ready: 'Listo',
  applied: 'Aplicado',
  archived: 'Archivado',
}

function isSupportedCodeLanguage(language: string): language is SupportedCodeLanguage {
  return defaultCodeLanguages.includes(language as SupportedCodeLanguage)
}

function getPrettierParser(language: string): string | null {
  if (!isSupportedCodeLanguage(language)) {
    return null
  }

  switch (language) {
    case 'html':
    case 'xml':
      return 'html'
    case 'css':
      return 'css'
    case 'javascript':
    case 'appscript':
      return 'babel'
    case 'typescript':
      return 'typescript'
    case 'json':
      return 'json'
    case 'yaml':
      return 'yaml'
    case 'markdown':
      return 'markdown'
    case 'sql':
    case 'r':
    case 'appsheet':
    case 'shell':
      return null
  }
}

async function formatCodeContent(content: string, language: string): Promise<string> {
  const parser = getPrettierParser(language)

  if (!parser) {
    return content.trim()
  }

  try {
    return await prettier.format(content, {
      parser,
      plugins: [
        babelPlugin,
        estreePlugin,
        htmlPlugin,
        markdownPlugin,
        typescriptPlugin,
        cssPlugin,
        yamlPlugin,
      ],
      semi: true,
      singleQuote: true,
    })
  } catch {
    return content.trim()
  }
}

export function QuickCaptureDialog({
  buttonLabel = 'Nuevo recurso',
  resource,
  triggerVariant = 'default',
  triggerSize = 'sm',
  triggerIcon,
}: QuickCaptureDialogProps) {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [resourceOptions, setResourceOptions] = useState<ResourceOption[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [linkAutocomplete, setLinkAutocomplete] = useState<{
    field: LinkField
    start: number
    end: number
    query: string
  } | null>(null)
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null)
  const contentRef = useRef<HTMLTextAreaElement | null>(null)
  const router = useRouter()

  const initialForm = buildResourceForm(resource)
  const [resourceProjectId, setResourceProjectId] = useState(initialForm.resourceProjectId)
  const [resourceTitle, setResourceTitle] = useState(initialForm.resourceTitle)
  const [resourceDescription, setResourceDescription] = useState(initialForm.resourceDescription)
  const [resourceType, setResourceType] = useState<ResourceType>(initialForm.resourceType)
  const [languageChoice, setLanguageChoice] = useState(initialForm.languageChoice)
  const [resourceLanguage, setResourceLanguage] = useState(initialForm.resourceLanguage)
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(initialForm.availableLanguages)
  const [newLanguage, setNewLanguage] = useState(initialForm.newLanguage)
  const [resourceFormat, setResourceFormat] = useState(initialForm.resourceFormat)
  const [resourceSourceUrl, setResourceSourceUrl] = useState(initialForm.resourceSourceUrl)
  const [resourceContent, setResourceContent] = useState(initialForm.resourceContent)
  const [resourceStatus, setResourceStatus] = useState<ResourceStatus>(initialForm.resourceStatus)
  const [resourceTags, setResourceTags] = useState(initialForm.resourceTags)
  const [resourceSaving, setResourceSaving] = useState(false)

  const isCodeResource = resourceType === 'code'

  const applyForm = (nextResource?: Resource) => {
    const nextForm = buildResourceForm(nextResource)
    setResourceProjectId(nextForm.resourceProjectId)
    setResourceTitle(nextForm.resourceTitle)
    setResourceDescription(nextForm.resourceDescription)
    setResourceType(nextForm.resourceType)
    setLanguageChoice(nextForm.languageChoice)
    setResourceLanguage(nextForm.resourceLanguage)
    setAvailableLanguages(nextForm.availableLanguages)
    setNewLanguage(nextForm.newLanguage)
    setResourceFormat(nextForm.resourceFormat)
    setResourceSourceUrl(nextForm.resourceSourceUrl)
    setResourceContent(nextForm.resourceContent)
    setResourceStatus(nextForm.resourceStatus)
    setResourceTags(nextForm.resourceTags)
  }

  const resetForm = () => {
    applyForm(resource)
  }

  const loadProjects = useCallback(async () => {
    try {
      setLoadingProjects(true)
      const response = await fetch('/api/resources/options', { method: 'GET' })
      const payload = (await response.json()) as
        | { ok: true; data: { projects: ProjectOption[]; resources: ResourceOption[] } }
        | { ok: false }

      if (payload.ok) {
        setProjects(payload.data.projects)
        setResourceOptions(payload.data.resources)
        setResourceProjectId((current) =>
          current === 'none' && !resource?.projectId
            ? payload.data.projects[0]?.id || 'none'
            : current
        )
      }
    } catch {
      // Si falla, el usuario todavía puede crear recursos sin proyecto.
    } finally {
      setLoadingProjects(false)
    }
  }, [resource?.projectId])

  const addCustomLanguage = async () => {
    const normalized = newLanguage.trim().toLowerCase()

    if (!normalized) return

    if (availableLanguages.includes(normalized)) {
      setLanguageChoice(normalized)
      setResourceLanguage(normalized)
      setNewLanguage('')
      if (resourceContent.trim()) {
        setResourceContent(await formatCodeContent(resourceContent, normalized))
      }
      return
    }

    setAvailableLanguages((prev) => [...prev, normalized])
    setLanguageChoice(normalized)
    setResourceLanguage(normalized)
    setNewLanguage('')
    if (resourceContent.trim()) {
      setResourceContent(await formatCodeContent(resourceContent, normalized))
    }
  }

  const handleLanguageChange = async (value: string) => {
    if (value === addCustomLanguageValue) {
      setLanguageChoice(addCustomLanguageValue)
      setNewLanguage('')
      return
    }

    setLanguageChoice(value)
    setResourceLanguage(value)

    if (!isCodeResource || !resourceContent.trim()) {
      return
    }

    const formatted = await formatCodeContent(resourceContent, value)
    setResourceContent(formatted)
  }

  useEffect(() => {
    if (!open) return

    applyForm(resource)
    void loadProjects()
  }, [open, resource, loadProjects])

  useEffect(() => {
    if (resourceType === 'code') {
      return
    }

    const nextDefault = getDefaultFormatForType(resourceType)
    const currentIsValid = resourceFormatOptions[resourceType].some(
      (option) => option.value === resourceFormat
    )

    if (!currentIsValid) {
      setResourceFormat(nextDefault)
    }
  }, [resourceFormat, resourceType])

  const linkableOptions: LinkableOption[] = [
    ...projects.map((project) => ({
      id: project.id,
      name: project.name,
      entityType: 'project' as const,
    })),
    ...resourceOptions
      .filter((option) => option.id !== resource?.id)
      .map((option) => ({
        id: option.id,
        name: option.title,
        entityType: 'resource' as const,
      })),
  ]

  const suggestionOptions = linkAutocomplete
    ? linkableOptions
        .filter((option) =>
          option.name.toLowerCase().includes(linkAutocomplete.query.trim().toLowerCase())
        )
        .slice(0, 6)
    : []

  const updateLinkAutocomplete = (
    field: LinkField,
    value: string,
    caret: number | null | undefined
  ) => {
    if (typeof caret !== 'number') {
      setLinkAutocomplete(null)
      return
    }

    const beforeCaret = value.slice(0, caret)
    const start = beforeCaret.lastIndexOf('[[')
    const lastClose = beforeCaret.lastIndexOf(']]')

    if (start === -1 || lastClose > start) {
      setLinkAutocomplete(null)
      return
    }

    const query = beforeCaret.slice(start + 2)
    if (query.includes('\n')) {
      setLinkAutocomplete(null)
      return
    }

    setLinkAutocomplete({
      field,
      start,
      end: caret,
      query,
    })
  }

  const insertLinkOption = (option: LinkableOption) => {
    if (!linkAutocomplete) return

    const nextToken = `[[${option.name}]]`
    const nextStart = linkAutocomplete.start
    const nextEnd = linkAutocomplete.end

    if (linkAutocomplete.field === 'description') {
      const nextValue = `${resourceDescription.slice(0, nextStart)}${nextToken}${resourceDescription.slice(nextEnd)}`
      setResourceDescription(nextValue)
      setLinkAutocomplete(null)
      requestAnimationFrame(() => {
        const node = descriptionRef.current
        if (!node) return
        const cursor = nextStart + nextToken.length
        node.focus()
        node.setSelectionRange(cursor, cursor)
      })
      return
    }

    const nextValue = `${resourceContent.slice(0, nextStart)}${nextToken}${resourceContent.slice(nextEnd)}`
    setResourceContent(nextValue)
    setLinkAutocomplete(null)
    requestAnimationFrame(() => {
      const node = contentRef.current
      if (!node) return
      const cursor = nextStart + nextToken.length
      node.focus()
      node.setSelectionRange(cursor, cursor)
    })
  }

  const handleResourceSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!resourceTitle.trim()) {
      toast.error('Escribe un título para el recurso.')
      return
    }

    const formattedContent = isCodeResource
      ? await formatCodeContent(resourceContent, resourceLanguage)
      : resourceContent.trim()

    setResourceSaving(true)
    try {
      const payload = {
        title: resourceTitle.trim(),
        description: resourceDescription.trim(),
        type: resourceType,
        language: isCodeResource ? resourceLanguage : '',
        format: isCodeResource ? '' : resourceFormat.trim(),
        content: formattedContent,
        sourceUrl: isCodeResource ? '' : resourceSourceUrl.trim(),
        status: resourceStatus,
        tags: resourceTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        projectId: resourceProjectId === 'none' ? null : resourceProjectId,
      }

      const result = resource
        ? await executeMutation({
            action: 'updateResource',
            payload: {
              resourceId: resource.id,
              patch: payload,
            },
          })
        : await executeMutation({
            action: 'addResource',
            payload,
          })

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(resource ? 'Recurso actualizado' : 'Recurso guardado')
      router.refresh()
      if (resource) {
        applyForm(result.data.resource)
      } else {
        resetForm()
      }
    } finally {
      setResourceSaving(false)
    }
  }

  const handleContentPaste = async (event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!isCodeResource) return

    event.preventDefault()
    const pastedText = event.clipboardData.getData('text/plain')
    const textarea = event.currentTarget
    const start = textarea.selectionStart ?? resourceContent.length
    const end = textarea.selectionEnd ?? resourceContent.length
    const nextValue = `${resourceContent.slice(0, start)}${pastedText}${resourceContent.slice(end)}`

    const formatted = await formatCodeContent(nextValue, resourceLanguage)
    setResourceContent(formatted)
  }

  const handleContentBlur = async () => {
    if (!isCodeResource || !resourceContent.trim()) return

    const formatted = await formatCodeContent(resourceContent, resourceLanguage)
    setResourceContent(formatted)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className="h-8 gap-1">
          {triggerIcon ?? <Plus className="size-4" />}
          <span className="hidden sm:inline">{buttonLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{resource ? 'Editar recurso' : 'Nuevo recurso'}</DialogTitle>
          <DialogDescription>
            {resource
              ? 'Ajusta metadatos, contenido y vínculo del recurso.'
              : 'Guarda código, documentos, datos o enlaces vinculados a un proyecto.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={(e) => void handleResourceSubmit(e)}>
          <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Datos base</h4>
              <p className="text-xs text-muted-foreground">
                Define el recurso, su proyecto principal y la categoría correcta.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium" htmlFor="resource-title">
                  Título
                </label>
                <Input
                  id="resource-title"
                  value={resourceTitle}
                  onChange={(event) => setResourceTitle(event.target.value)}
                  placeholder={isCodeResource ? 'Snippet de footer' : 'Especificación de pagos'}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Proyecto vinculado</label>
                <Select
                  value={resourceProjectId}
                  onValueChange={setResourceProjectId}
                  disabled={loadingProjects}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proyecto</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select
                  value={resourceStatus}
                  onValueChange={(value) => setResourceStatus(value as ResourceStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(resourceStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={resourceType}
                  onValueChange={(value) => setResourceType(value as ResourceType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(resourceTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isCodeResource ? (
            <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Configuración técnica</h4>
                <p className="text-xs text-muted-foreground">
                  Selecciona el lenguaje y pega el contenido para obtener vista previa y formato.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Lenguaje</label>
                <div className="space-y-2">
                  <Select
                    value={languageChoice}
                    onValueChange={(value) => void handleLanguageChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Lenguaje" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages.map((language) => (
                        <SelectItem key={language} value={language}>
                          {codeLanguageLabels[language as SupportedCodeLanguage] ?? language}
                        </SelectItem>
                      ))}
                      <SelectItem value={addCustomLanguageValue}>Agregar nuevo lenguaje</SelectItem>
                    </SelectContent>
                  </Select>
                  {languageChoice === addCustomLanguageValue ? (
                    <div className="flex gap-2">
                      <Input
                        value={newLanguage}
                        onChange={(event) => setNewLanguage(event.target.value)}
                        placeholder="Escribe un lenguaje nuevo"
                        className="h-10"
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            void addCustomLanguage()
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={() => void addCustomLanguage()}>
                        Añadir
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Fuente del recurso</h4>
                <p className="text-xs text-muted-foreground">
                  Usa listas controladas para clasificar documentos y enlaces frecuentes como Google Drive.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {resourceFormatFieldLabels[resourceType]}
                  </label>
                  <Select value={resourceFormat} onValueChange={setResourceFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder={resourceFormatFieldLabels[resourceType]} />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceFormatOptions[resourceType].map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="resource-url">
                    Enlace o referencia
                  </label>
                  <Input
                    id="resource-url"
                    value={resourceSourceUrl}
                    onChange={(event) => setResourceSourceUrl(event.target.value)}
                    placeholder={
                      resourceType === 'link' || resourceFormat === 'google-drive' || resourceFormat === 'google-doc' || resourceFormat === 'google-sheet'
                        ? 'https://drive.google.com/...'
                        : 'https://...'
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Contexto y enlaces</h4>
              <p className="text-xs text-muted-foreground">
                Describe el recurso y enlaza entidades con <code className="rounded bg-background px-1 py-0.5">[[...]]</code>. Usa <code className="rounded bg-background px-1 py-0.5">#tag</code> para etiquetas.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="resource-description">
                Descripción
              </label>
              <Textarea
                ref={descriptionRef}
                id="resource-description"
                value={resourceDescription}
                onChange={(event) => {
                  setResourceDescription(event.target.value)
                  updateLinkAutocomplete('description', event.target.value, event.target.selectionStart)
                }}
                onClick={(event) =>
                  updateLinkAutocomplete('description', event.currentTarget.value, event.currentTarget.selectionStart)
                }
                onKeyUp={(event) =>
                  updateLinkAutocomplete('description', event.currentTarget.value, event.currentTarget.selectionStart)
                }
                placeholder="Qué contiene, para qué sirve y cuándo usarlo."
                className="min-h-24"
              />
              {linkAutocomplete?.field === 'description' && suggestionOptions.length > 0 ? (
                <div className="rounded-xl border bg-card p-2">
                  <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Sugerencias de enlace
                  </div>
                  <div className="space-y-1">
                    {suggestionOptions.map((option) => (
                      <button
                        key={`${option.entityType}:${option.id}`}
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                        onClick={() => insertLinkOption(option)}
                      >
                        <span>{option.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.entityType === 'project' ? 'Proyecto' : 'Recurso'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">
                {isCodeResource ? 'Código fuente' : 'Contenido o resumen'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {isCodeResource
                  ? 'Pega el snippet y usa el formatter cuando haga falta.'
                  : 'Añade el texto relevante o una nota breve del documento.'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="resource-content">
                Contenido o referencia
              </label>
              <Textarea
                ref={contentRef}
                id="resource-content"
                value={resourceContent}
                onChange={(event) => {
                  setResourceContent(event.target.value)
                  updateLinkAutocomplete('content', event.target.value, event.target.selectionStart)
                }}
                onPaste={handleContentPaste}
                onBlur={() => void handleContentBlur()}
                onClick={(event) =>
                  updateLinkAutocomplete('content', event.currentTarget.value, event.currentTarget.selectionStart)
                }
                onKeyUp={(event) =>
                  updateLinkAutocomplete('content', event.currentTarget.value, event.currentTarget.selectionStart)
                }
                placeholder={
                  isCodeResource
                    ? 'Pega aquí el código. Se formateará automáticamente.'
                    : 'Pega aquí el texto, datos o resumen del recurso.'
                }
                className={isCodeResource ? 'min-h-44 font-mono text-sm' : 'min-h-36'}
              />
              {linkAutocomplete?.field === 'content' && suggestionOptions.length > 0 ? (
                <div className="rounded-xl border bg-card p-2">
                  <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Sugerencias de enlace
                  </div>
                  <div className="space-y-1">
                    {suggestionOptions.map((option) => (
                      <button
                        key={`${option.entityType}:${option.id}`}
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                        onClick={() => insertLinkOption(option)}
                      >
                        <span>{option.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.entityType === 'project' ? 'Proyecto' : 'Recurso'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {isCodeResource && (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleContentBlur()}
                    >
                      Formatear código
                    </Button>
                  </div>
                  {resourceContent.trim() ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Vista previa con colores
                      </p>
                      <CodePreview code={resourceContent} language={resourceLanguage} className="max-h-64" />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Etiquetas</h4>
              <p className="text-xs text-muted-foreground">
                Puedes seguir escribiéndolas manualmente; también se extraen desde <code className="rounded bg-background px-1 py-0.5">#tag</code>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="resource-tags">
                Etiquetas
              </label>
              <Input
                id="resource-tags"
                value={resourceTags}
                onChange={(event) => setResourceTags(event.target.value)}
                placeholder="frontend, pdf, cliente"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={resourceSaving}>
              {resourceSaving ? 'Guardando...' : 'Guardar recurso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

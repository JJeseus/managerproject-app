import { describe, expect, it } from 'vitest'
import {
  detectResourceFormatForType,
  detectResourceSourceSuggestion,
  isValidAbsoluteUrl,
} from '@/lib/resources/resource-format'

describe('resource format detection', () => {
  it('detecta Google Docs y Google Sheets', () => {
    expect(
      detectResourceSourceSuggestion('https://docs.google.com/document/d/abc123/edit')
    ).toEqual({
      type: 'document',
      format: 'google-doc',
    })

    expect(
      detectResourceSourceSuggestion('https://docs.google.com/spreadsheets/d/abc123/edit')
    ).toEqual({
      type: 'spreadsheet',
      format: 'google-sheet',
    })
  })

  it('detecta formatos por extensión cuando la URL es directa', () => {
    expect(
      detectResourceSourceSuggestion('https://example.com/manual/proceso.pdf')
    ).toEqual({
      type: 'document',
      format: 'pdf',
    })

    expect(
      detectResourceSourceSuggestion('https://example.com/data/export.csv')
    ).toEqual({
      type: 'dataset',
      format: 'csv',
    })
  })

  it('solo aplica formato automático cuando coincide con el tipo actual', () => {
    expect(
      detectResourceFormatForType(
        'https://docs.google.com/spreadsheets/d/abc123/edit',
        'spreadsheet'
      )
    ).toBe('google-sheet')

    expect(
      detectResourceFormatForType(
        'https://docs.google.com/spreadsheets/d/abc123/edit',
        'document'
      )
    ).toBeNull()
  })

  it('valida URLs absolutas http y https', () => {
    expect(isValidAbsoluteUrl('https://example.com')).toBe(true)
    expect(isValidAbsoluteUrl('http://example.com')).toBe(true)
    expect(isValidAbsoluteUrl('nota interna')).toBe(false)
    expect(isValidAbsoluteUrl('ftp://example.com')).toBe(false)
  })
})

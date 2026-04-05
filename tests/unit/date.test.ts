import { describe, expect, it } from 'vitest'
import { formatDate, formatDistanceToNowEs } from '@/lib/date'

describe('date helpers', () => {
  it('formatea fechas en español', () => {
    expect(formatDate('2026-04-05')).toContain('abr')
  })

  it('formatea distancia relativa en español', () => {
    const value = formatDistanceToNowEs(new Date(Date.now() - 60_000))
    expect(value).toMatch(/hace|minuto/)
  })
})

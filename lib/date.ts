import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(value: Date | string, pattern = 'd MMM yyyy') {
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, pattern, { locale: es })
}

export function formatDateShort(value: Date | string) {
  return formatDate(value, 'd MMM')
}

export function formatDateTime(value: Date | string) {
  return formatDate(value, 'd MMM yyyy, h:mm a')
}

export function formatDistanceToNowEs(value: Date | string) {
  const date = typeof value === 'string' ? parseISO(value) : value
  return formatDistanceToNow(date, { addSuffix: true, locale: es })
}

export function formatDateInputValue(value = new Date()) {
  return format(value, 'yyyy-MM-dd')
}

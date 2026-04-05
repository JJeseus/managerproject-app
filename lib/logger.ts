type LogLevel = 'info' | 'warn' | 'error'

interface LogPayload {
  message: string
  context?: Record<string, unknown>
  error?: unknown
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return error
}

function write(level: LogLevel, payload: LogPayload) {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    message: payload.message,
    context: payload.context,
    error: payload.error ? serializeError(payload.error) : undefined,
  }

  const line = JSON.stringify(entry)

  if (level === 'error') {
    console.error(line)
    return
  }

  if (level === 'warn') {
    console.warn(line)
    return
  }

  console.info(line)
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  write('info', { message, context })
}

export function logWarn(message: string, context?: Record<string, unknown>) {
  write('warn', { message, context })
}

export function logError(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
) {
  write('error', { message, error, context })
}

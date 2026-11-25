export type TaskQr = {
  pendingToken: string
  userId: number
  projectId: number
  compositionId?: number
  endpoint: string
}

const parseId = (value: unknown): number | null => {
  const n = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value
  return typeof n === 'number' && Number.isSafeInteger(n) && n > 0 ? n : null
}

/** A server path under /tasks/ (no host, no `..`, no query) */
const isTaskPath = (path: string) => /^(?:\/[A-Za-z0-9_-]+)*\/tasks(?:\/[A-Za-z0-9_-]+)+$/.test(path)

export function parseTaskQr(raw: string): TaskQr | null {
  let data: unknown

  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }

  if (!data || typeof data !== 'object') return null
  const fields = data as Record<string, unknown>

  const userId = parseId(fields.user_id)
  const projectId = parseId(fields.project_id)
  const compositionId = parseId(fields.composition_id)
  const pendingToken = typeof fields.task_token === 'string' ? fields.task_token.trim() : ''
  const endpoint = typeof fields.endpoint === 'string' ? fields.endpoint : ''

  if (!pendingToken || !userId || !projectId || !isTaskPath(endpoint)) return null

  if (fields.composition_id != null && !compositionId) return null

  return {
    pendingToken,
    userId,
    projectId,
    ...(compositionId && { compositionId }),
    endpoint,
  }
}

export function taskEndpointUrl(serverUrl: string, endpoint: string): string | null {
  const origin = /^https?:\/\/[^/?#\s]+/i.exec(serverUrl)?.[0]

  if (!origin || !isTaskPath(endpoint)) return null
  return `${origin}${endpoint}`
}

import { HttpError, TaskTokenRejectedError } from './errors'
import { fetchWithTimeout } from './fetchWithTimeout'

/**
 * Plain ids the task_token carries; TaxonWorks requires them, unchanged, in every request.
 * `compositionId` only for tasks that bind their tokens to a composition.
 */
export type TaskIds = { userId: number; projectId: number; compositionId?: number }

export type ActivatedToken = { token: string; expiresAt: number }

export type TaskTokenClientOptions = {
  /** Absolute URL of the task's token endpoint, e.g. https://tw.example/tasks/…/capture */
  endpointUrl: string
  ids: TaskIds
  fetchImpl?: typeof fetch
}

/**
 * Client for a TaxonWorks Task that accepts a task_token (not `/api/v1`): the token goes in the
 * `X-Task-Token` header only, and the ids it carries are sent as plain params.
 * On device the global `fetch` is `expo/fetch`, which accepts expo-file-system `File`s in FormData.
 */
export class TaskTokenClient {
  private readonly fetchImpl: typeof fetch

  constructor(private readonly options: TaskTokenClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  /** Swaps the single-use token read from the QR code for the session token (once only) */
  async activate(pendingToken: string): Promise<ActivatedToken> {
    const body = await this.post<{ task_token?: string; expires_at?: string }>(pendingToken, {})
    const expiresAt = body.expires_at ? Date.parse(body.expires_at) : NaN
    if (!body.task_token || Number.isNaN(expiresAt))
      throw new HttpError(200, 'TaxonWorks did not return a session token')
    return { token: body.task_token, expiresAt }
  }

  /**
   * POSTs to the task's endpoint with the session token. The ids are added to the body: as JSON
   * fields to a plain object, or as form fields to a FormData (files).
   */
  async post<T>(
    token: string,
    body: FormData | Record<string, unknown>,
    { timeoutMs }: { timeoutMs?: number } = {},
  ): Promise<T> {
    const { userId, projectId, compositionId } = this.options.ids
    const ids = {
      user_id: userId,
      project_id: projectId,
      ...(compositionId != null && { composition_id: compositionId }),
    }
    const headers = new Headers({ Accept: 'application/json', 'X-Task-Token': token })

    let payload: BodyInit
    if (body instanceof FormData) {
      Object.entries(ids).forEach(([key, value]) => body.append(key, String(value)))
      payload = body
    } else {
      headers.set('Content-Type', 'application/json')
      payload = JSON.stringify({ ...ids, ...body })
    }

    const response = await fetchWithTimeout(
      this.fetchImpl,
      this.options.endpointUrl,
      { method: 'POST', body: payload, headers },
      timeoutMs,
    )

    if (response.ok) return (await response.json()) as T

    const message = (await errorMessage(response)) || response.statusText || 'no error details'
    if (response.status === 401 || response.status === 429)
      throw new TaskTokenRejectedError(response.status, message)
    throw new HttpError(response.status, message)
  }
}

/** TaxonWorks answers failures with `{ errors: [...] }` */
async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { errors?: unknown }
    return Array.isArray(body.errors) ? body.errors.filter((e) => typeof e === 'string').join('; ') : ''
  } catch {
    return ''
  }
}

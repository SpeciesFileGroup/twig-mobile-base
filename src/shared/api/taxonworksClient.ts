import { HttpError } from './errors'
import { fetchWithTimeout } from './fetchWithTimeout'

export type TaxonWorksClientOptions = {
  serverUrl: string
  token?: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

/**
 * Minimal client for the TaxonWorks API (`/api/v1`).
 * Authentication follows the server: `Authorization: Token token=<user token>`.
 */
export class TaxonWorksClient {
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch

  constructor(private readonly options: TaxonWorksClientOptions) {
    this.baseUrl = `${options.serverUrl}/api/v1`
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  async ping(): Promise<boolean> {
    const body = await this.request<{ pong?: boolean }>('/ping')
    return body.pong === true
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers)

    headers.set('Accept', 'application/json')

    if (this.options.token) headers.set('Authorization', `Token token=${this.options.token}`)

    const response = await fetchWithTimeout(
      this.fetchImpl,
      `${this.baseUrl}${path}`,
      { ...init, headers },
      this.options.timeoutMs,
    )

    if (!response.ok) throw new HttpError(response.status, `${response.status} ${response.statusText}`.trim())

    return (await response.json()) as T
  }
}

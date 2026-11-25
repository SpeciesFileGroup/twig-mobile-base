import { messageOf } from '@/shared/utils/errors'

import { NetworkError } from './errors'

export const DEFAULT_TIMEOUT_MS = 15_000

export async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal })
  } catch (e) {
    throw new NetworkError(messageOf(e, 'Network request failed'))
  } finally {
    clearTimeout(timer)
  }
}

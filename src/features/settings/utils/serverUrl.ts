/**
 * Turns the home server address into the instance root that the API clients build their paths on:
 * adds https:// when there is no scheme and drops trailing slashes.
 * Returns null when it is not a usable http(s) URL.
 */
export function normalizeServerUrl(input: string): string | null {
  let value = input.trim()
  if (!value) return null
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = `https://${value}`

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (!url.hostname || /\s/.test(url.hostname)) return null

  const path = url.pathname.replace(/\/+$/, '')
  return `${url.protocol}//${url.host}${path}`
}

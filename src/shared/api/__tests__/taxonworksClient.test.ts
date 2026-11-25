import { HttpError, NetworkError } from '../errors'
import { TaxonWorksClient } from '../taxonworksClient'

const json = (body: unknown, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  )

describe('TaxonWorksClient', () => {
  it('pings /api/v1/ping and sends the token header', async () => {
    const fetchImpl = jest.fn((_url: string, _init?: RequestInit) => json({ pong: true }))
    const client = new TaxonWorksClient({
      serverUrl: 'https://tw.example',
      token: 'abc',
      fetchImpl: fetchImpl as never,
    })

    await expect(client.ping()).resolves.toBe(true)
    const [url, init] = fetchImpl.mock.calls[0]!
    expect(url).toBe('https://tw.example/api/v1/ping')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Token token=abc')
  })

  it('maps HTTP errors and network failures', async () => {
    const http = new TaxonWorksClient({
      serverUrl: 'https://tw.example',
      fetchImpl: (() => json({}, 404)) as never,
    })
    await expect(http.ping()).rejects.toBeInstanceOf(HttpError)

    const offline = new TaxonWorksClient({
      serverUrl: 'https://tw.example',
      fetchImpl: (() => Promise.reject(new TypeError('Network request failed'))) as never,
    })
    await expect(offline.ping()).rejects.toBeInstanceOf(NetworkError)
  })
})

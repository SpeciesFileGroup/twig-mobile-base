import { HttpError, NetworkError, TaskTokenRejectedError } from '../errors'
import { TaskTokenClient } from '../taskTokenClient'

const URL = 'https://tw.example/tasks/example/mobile_task/capture'
const ids = { userId: 1, projectId: 2, compositionId: 3 }

const json = (body: unknown, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  )

const client = (fetchImpl: jest.Mock) =>
  new TaskTokenClient({ endpointUrl: URL, ids, fetchImpl: fetchImpl as never })

describe('TaskTokenClient', () => {
  it('activates the QR token with the header and the plain ids', async () => {
    const fetchImpl = jest.fn((_url: string, _init?: RequestInit) =>
      json({ task_token: 'active', expires_at: '2026-11-23T22:00:00Z' }),
    )
    await expect(client(fetchImpl).activate('pending')).resolves.toEqual({
      token: 'active',
      expiresAt: Date.parse('2026-11-23T22:00:00Z'),
    })

    const [url, init] = fetchImpl.mock.calls[0]!
    expect(url).toBe(URL)
    expect(init?.method).toBe('POST')
    expect(new Headers(init?.headers).get('X-Task-Token')).toBe('pending')
    expect(JSON.parse(init?.body as string)).toEqual({ user_id: 1, project_id: 2, composition_id: 3 })
  })

  it('reports a refused or throttled token', async () => {
    const refused = client(jest.fn(() => json({ errors: ['task_token already activated'] }, 401)))
    await expect(refused.activate('pending')).rejects.toMatchObject({
      name: 'TaskTokenRejectedError',
      status: 401,
      message: 'task_token already activated',
    })
    const throttled = client(jest.fn(() => json({ errors: ['too many requests'] }, 429)))
    await expect(throttled.activate('pending')).rejects.toBeInstanceOf(TaskTokenRejectedError)
  })

  it('rejects an activation without a token', async () => {
    await expect(client(jest.fn(() => json({}))).activate('pending')).rejects.toBeInstanceOf(HttpError)
  })

  it('adds the ids to a JSON body', async () => {
    const fetchImpl = jest.fn((_url: string, _init?: RequestInit) => json({ ok: true }))
    await expect(client(fetchImpl).post('active', { note: 'x' })).resolves.toEqual({ ok: true })

    const init = fetchImpl.mock.calls[0]![1]!
    expect(new Headers(init.headers).get('X-Task-Token')).toBe('active')
    expect(JSON.parse(init.body as string)).toEqual({
      user_id: 1,
      project_id: 2,
      composition_id: 3,
      note: 'x',
    })
  })

  it('sends no composition_id when the task has none', async () => {
    const fetchImpl = jest.fn((_url: string, _init?: RequestInit) => json({ ok: true }))
    const noComposition = new TaskTokenClient({
      endpointUrl: URL,
      ids: { userId: 1, projectId: 2 },
      fetchImpl: fetchImpl as never,
    })
    await noComposition.post('active', {})
    expect(JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string)).toEqual({ user_id: 1, project_id: 2 })

    const form = new FormData()
    await noComposition.post('active', form)
    expect(form.has('composition_id')).toBe(false)
  })

  it('passes on validation errors and network failures', async () => {
    const invalid = client(
      jest.fn(() => json({ errors: ['catalog_number requires a namespace setting'] }, 422)),
    )
    await expect(invalid.post('t', {})).rejects.toMatchObject({
      name: 'HttpError',
      status: 422,
      message: 'catalog_number requires a namespace setting',
    })
    const offline = client(jest.fn(() => Promise.reject(new TypeError('Network request failed'))))
    await expect(offline.activate('t')).rejects.toBeInstanceOf(NetworkError)
  })
})

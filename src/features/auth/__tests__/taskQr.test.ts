import { parseTaskQr, taskEndpointUrl } from '../utils/taskQr'

const ENDPOINT = '/tasks/example/mobile_task/capture'
const qr = (patch: Record<string, unknown> = {}) =>
  JSON.stringify({
    task_token: 'pending-token',
    user_id: 1,
    project_id: 2,
    composition_id: 3,
    endpoint: ENDPOINT,
    expires_at: '2026-11-23T20:00:00Z',
    ...patch,
  })

describe('parseTaskQr', () => {
  it('reads the code shown by a TaxonWorks task', () => {
    expect(parseTaskQr(qr())).toEqual({
      pendingToken: 'pending-token',
      userId: 1,
      projectId: 2,
      compositionId: 3,
      endpoint: ENDPOINT,
    })
  })

  it('accepts numeric string ids', () => {
    expect(parseTaskQr(qr({ user_id: '1' }))?.userId).toBe(1)
  })

  it('ignores other codes', () => {
    expect(parseTaskQr('CO-000123')).toBeNull()
    expect(parseTaskQr('https://example.org')).toBeNull()
    expect(parseTaskQr('[1,2]')).toBeNull()
    expect(parseTaskQr('null')).toBeNull()
  })

  it('rejects missing or invalid fields', () => {
    expect(parseTaskQr(qr({ task_token: '' }))).toBeNull()
    expect(parseTaskQr(qr({ user_id: 0 }))).toBeNull()
    expect(parseTaskQr(qr({ project_id: 1.5 }))).toBeNull()
    expect(parseTaskQr(qr({ composition_id: 'x' }))).toBeNull()
  })

  it('reads a code without a composition', () => {
    const parsed = parseTaskQr(qr({ composition_id: undefined }))
    expect(parsed).toMatchObject({ userId: 1, projectId: 2 })
    expect(parsed).not.toHaveProperty('compositionId')
  })

  it('only accepts a server path under /tasks', () => {
    expect(parseTaskQr(qr({ endpoint: 'https://evil.example/tasks/x' }))).toBeNull()
    expect(parseTaskQr(qr({ endpoint: '//evil.example/tasks/x' }))).toBeNull()
    expect(parseTaskQr(qr({ endpoint: '/tasks/../api/v1/x' }))).toBeNull()
    expect(parseTaskQr(qr({ endpoint: '/tasks/x?y=1' }))).toBeNull()
    expect(parseTaskQr(qr({ endpoint: '/projects/1' }))).toBeNull()
  })
})

describe('taskEndpointUrl', () => {
  it('joins the path to the home server origin', () => {
    expect(taskEndpointUrl('https://tw.example', ENDPOINT)).toBe(`https://tw.example${ENDPOINT}`)
    expect(taskEndpointUrl('http://192.168.0.2:3000', ENDPOINT)).toBe(`http://192.168.0.2:3000${ENDPOINT}`)
  })

  it('uses the origin: Rails paths already include a sub-path', () => {
    expect(taskEndpointUrl('https://tw.example/tw', `/tw${ENDPOINT}`)).toBe(
      `https://tw.example/tw${ENDPOINT}`,
    )
  })

  it('rejects anything that is not a task path', () => {
    expect(taskEndpointUrl('https://tw.example', '//evil.example/tasks/x')).toBeNull()
  })
})

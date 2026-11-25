import { normalizeServerUrl } from '../utils/serverUrl'

describe('normalizeServerUrl', () => {
  it.each([
    ['sfg.taxonworks.org', 'https://sfg.taxonworks.org'],
    ['  https://sfg.taxonworks.org/  ', 'https://sfg.taxonworks.org'],
    ['http://192.168.0.10:3000', 'http://192.168.0.10:3000'],
    ['https://example.org/taxonworks/', 'https://example.org/taxonworks'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeServerUrl(input)).toBe(expected)
  })

  it.each(['', '   ', 'ftp://example.org', 'https://'])('rejects %j', (input) => {
    expect(normalizeServerUrl(input)).toBeNull()
  })
})

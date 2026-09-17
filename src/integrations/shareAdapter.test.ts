import { afterEach, describe, expect, it } from 'vitest'
import { getShareAdapter, registerShareAdapter, type ShareAdapter } from './shareAdapter'

afterEach(() => {
  registerShareAdapter(undefined)
})

describe('shareAdapter registry', () => {
  it('has no adapter registered by default', () => {
    expect(getShareAdapter()).toBeUndefined()
  })

  it('returns a registered adapter', async () => {
    const adapter: ShareAdapter = {
      name: 'TestService',
      share: async () => ({ url: 'https://example.com/shared/1' }),
    }
    registerShareAdapter(adapter)
    expect(getShareAdapter()).toBe(adapter)
    await expect(getShareAdapter()?.share({ title: 't', format: 'text', content: 'c' })).resolves.toEqual({
      url: 'https://example.com/shared/1',
    })
  })

  it('unregisters by passing undefined', () => {
    registerShareAdapter({ name: 'X', share: async () => ({ url: '' }) })
    registerShareAdapter(undefined)
    expect(getShareAdapter()).toBeUndefined()
  })
})

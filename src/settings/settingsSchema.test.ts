import { describe, expect, it } from 'vitest'
import { appSettingsSchema, DEFAULT_SETTINGS } from './settingsSchema'

describe('appSettingsSchema', () => {
  it('fills in defaults for an empty object', () => {
    const result = appSettingsSchema.parse({})
    expect(result).toEqual(DEFAULT_SETTINGS)
  })

  it('accepts a fully specified valid settings object', () => {
    const result = appSettingsSchema.safeParse({
      theme: 'dark',
      fontSize: 18,
      lineHeight: 1.8,
      editorWidth: 'wide',
      wordWrap: false,
      lineNumbers: true,
      spellcheck: false,
      smartQuotes: false,
      sidebarVisible: false,
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid theme', () => {
    expect(appSettingsSchema.safeParse({ theme: 'purple' }).success).toBe(false)
  })

  it('rejects a font size outside the allowed range', () => {
    expect(appSettingsSchema.safeParse({ fontSize: 5 }).success).toBe(false)
    expect(appSettingsSchema.safeParse({ fontSize: 100 }).success).toBe(false)
  })

  it('rejects an invalid editor width', () => {
    expect(appSettingsSchema.safeParse({ editorWidth: 'huge' }).success).toBe(false)
  })

  it('rejects wrong types for boolean fields', () => {
    expect(appSettingsSchema.safeParse({ wordWrap: 'yes' }).success).toBe(false)
  })
})

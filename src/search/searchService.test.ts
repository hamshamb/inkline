import { describe, expect, it, beforeEach } from 'vitest'
import { createTestDb, type InklineDB } from '../db/schema'
import { DocumentService } from '../services/documentService'
import { SearchService } from './searchService'

let db: InklineDB
let documents: DocumentService
let search: SearchService

beforeEach(() => {
  db = createTestDb(`search-${Math.random()}`)
  documents = new DocumentService(db)
  search = new SearchService(documents)
})

describe('SearchService.search', () => {
  it('returns nothing for an empty query', async () => {
    await documents.create('plaintext')
    expect(await search.search('')).toEqual([])
    expect(await search.search('   ')).toEqual([])
  })

  it('matches on title', async () => {
    const doc = await documents.create('plaintext')
    await documents.rename(doc.id, 'Quarterly Report')
    const results = await search.search('quarterly')
    expect(results.map((r) => r.document.id)).toContain(doc.id)
    expect(results[0]?.matchedIn).toBe('title')
  })

  it('matches on content and builds an excerpt', async () => {
    const doc = await documents.create('plaintext')
    await documents.saveContent(doc.id, 'some intro text mentioning the word pineapple in context')
    const results = await search.search('pineapple')
    expect(results).toHaveLength(1)
    expect(results[0]?.excerpt.toLowerCase()).toContain('pineapple')
  })

  it('matches on tags', async () => {
    const doc = await documents.create('plaintext')
    await documents.setTags(doc.id, ['project-x'])
    const results = await search.search('project-x')
    expect(results[0]?.matchedIn).toBe('tags')
  })

  it('excludes trashed documents', async () => {
    const doc = await documents.create('plaintext')
    await documents.saveContent(doc.id, 'findable content')
    await documents.moveToTrash(doc.id)
    expect(await search.search('findable')).toEqual([])
  })

  it('excludes archived documents by default but can include them', async () => {
    const doc = await documents.create('plaintext')
    await documents.saveContent(doc.id, 'archived findable content')
    await documents.setArchived(doc.id, true)
    expect(await search.search('archived findable')).toEqual([])
    const withArchived = await search.search('archived findable', { includeArchived: true })
    expect(withArchived).toHaveLength(1)
  })

  it('is case-insensitive', async () => {
    const doc = await documents.create('plaintext')
    await documents.rename(doc.id, 'CamelCase Title')
    expect((await search.search('camelcase')).map((r) => r.document.id)).toContain(doc.id)
  })

  it('extracts plain text from rich documents for matching', async () => {
    const doc = await documents.create('rich')
    await documents.saveContent(doc.id, {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a rich needle in a haystack' }] }],
    })
    const results = await search.search('needle')
    expect(results[0]?.document.id).toBe(doc.id)
  })
})

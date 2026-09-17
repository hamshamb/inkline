import { describe, expect, it, beforeEach } from 'vitest'
import { createTestDb, type InklineDB } from '../db/schema'
import { DocumentService } from '../services/documentService'
import { ImportService, MAX_IMPORT_FILE_SIZE_BYTES } from './importService'

let db: InklineDB
let documents: DocumentService
let importService: ImportService

beforeEach(() => {
  db = createTestDb(`import-${Math.random()}`)
  documents = new DocumentService(db)
  importService = new ImportService(documents)
})

function makeFile(name: string, content: string): File {
  return new File([content], name, { type: 'text/plain' })
}

describe('ImportService.importFile', () => {
  it('imports a .txt file as a plaintext document', async () => {
    const result = await importService.importFile(makeFile('notes.txt', 'hello from a text file'))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.document.type).toBe('plaintext')
      expect(result.document.content).toBe('hello from a text file')
      expect(result.document.title).toBe('notes')
    }
  })

  it('imports a .md file as a markdown document', async () => {
    const result = await importService.importFile(makeFile('README.md', '# Hello\n\nBody text'))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.document.type).toBe('markdown')
      expect(result.document.content).toBe('# Hello\n\nBody text')
      expect(result.document.title).toBe('README')
    }
  })

  it('rejects unsupported file extensions', async () => {
    const result = await importService.importFile(makeFile('image.png', 'binary'))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/unsupported/i)
  })

  it('rejects files larger than the size limit', async () => {
    const big = new File([new Uint8Array(MAX_IMPORT_FILE_SIZE_BYTES + 1)], 'big.txt', { type: 'text/plain' })
    const result = await importService.importFile(big)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/too large/i)
  })

  it('never overwrites an existing document — always creates a new one', async () => {
    await importService.importFile(makeFile('notes.txt', 'first version'))
    const countBefore = (await documents.listActive()).length
    await importService.importFile(makeFile('notes.txt', 'second version'))
    const countAfter = (await documents.listActive()).length
    expect(countAfter).toBe(countBefore + 1)
  })

  it('imports multiple files via importFiles', async () => {
    const results = await importService.importFiles([makeFile('a.txt', 'A'), makeFile('b.md', '# B')])
    expect(results.every((r) => r.ok)).toBe(true)
    expect(await documents.listActive()).toHaveLength(2)
  })
})

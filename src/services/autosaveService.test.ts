import { describe, expect, it, beforeEach } from 'vitest'
import { createTestDb, type InklineDB } from '../db/schema'
import { DocumentService } from './documentService'
import { VersionService } from './versionService'
import { AutosaveController, type SaveStatus } from './autosaveService'

let db: InklineDB
let documents: DocumentService
let versions: VersionService

beforeEach(() => {
  db = createTestDb(`autosave-${Math.random()}`)
  documents = new DocumentService(db)
  versions = new VersionService(db, documents)
})

// A short real debounce interval keeps these tests fast without mocking
// global timers, which would conflict with fake-indexeddb's own internal
// scheduling (see versionService.test.ts for the same tradeoff).
const DEBOUNCE_MS = 20

function makeController(onStatusChange: (status: SaveStatus, error?: Error) => void) {
  return new AutosaveController(onStatusChange, DEBOUNCE_MS, documents, versions)
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('AutosaveController debouncing', () => {
  it('does not save before the debounce interval elapses', async () => {
    const doc = await documents.create('plaintext')
    const statuses: SaveStatus[] = []
    const autosave = makeController((s) => statuses.push(s))

    autosave.schedule(doc.id, 'typing…')
    await wait(DEBOUNCE_MS / 2)
    expect(statuses).toEqual([])
  })

  it('collapses rapid successive edits into a single save', async () => {
    const doc = await documents.create('plaintext')
    const statuses: SaveStatus[] = []
    const autosave = makeController((s) => statuses.push(s))

    for (let i = 0; i < 10; i++) {
      autosave.schedule(doc.id, `content ${i}`)
      await wait(DEBOUNCE_MS / 4) // faster than the debounce interval
    }
    await autosave.flush()

    const saved = await documents.get(doc.id)
    expect(saved?.content).toBe('content 9')
    expect(statuses.filter((s) => s === 'saving')).toHaveLength(1)
  })

  it('flush() immediately persists pending content and resolves once done', async () => {
    const doc = await documents.create('plaintext')
    const statuses: SaveStatus[] = []
    const autosave = makeController((s) => statuses.push(s))

    autosave.schedule(doc.id, 'final content')
    await autosave.flush()

    const saved = await documents.get(doc.id)
    expect(saved?.content).toBe('final content')
    expect(statuses).toEqual(['saving', 'saved'])
  })

  it('flush() with nothing pending is a no-op', async () => {
    const statuses: SaveStatus[] = []
    const autosave = makeController((s) => statuses.push(s))
    await autosave.flush()
    expect(statuses).toEqual([])
  })

  it('reports an error status when the save fails', async () => {
    const statuses: SaveStatus[] = []
    const autosave = makeController((s) => statuses.push(s))
    // Scheduling a save for a document that doesn't exist forces saveContent to throw.
    autosave.schedule('missing-document-id', 'x')
    await autosave.flush()
    expect(statuses).toEqual(['saving', 'error'])
  })

  it('hasPendingWork reflects scheduled and in-flight saves', async () => {
    const doc = await documents.create('plaintext')
    const autosave = makeController(() => {})
    expect(autosave.hasPendingWork()).toBe(false)
    autosave.schedule(doc.id, 'x')
    expect(autosave.hasPendingWork()).toBe(true)
    await autosave.flush()
    expect(autosave.hasPendingWork()).toBe(false)
  })

  it('cancel() drops pending work without saving', async () => {
    const doc = await documents.create('plaintext')
    const autosave = makeController(() => {})
    autosave.schedule(doc.id, 'should not be saved')
    autosave.cancel()
    await autosave.flush()
    const saved = await documents.get(doc.id)
    expect(saved?.content).toBe('')
  })

  it('waiting past the debounce interval saves without an explicit flush', async () => {
    const doc = await documents.create('plaintext')
    const statuses: SaveStatus[] = []
    const autosave = makeController((s) => statuses.push(s))
    autosave.schedule(doc.id, 'auto-saved after debounce')
    await wait(DEBOUNCE_MS * 3)
    expect(statuses).toEqual(['saving', 'saved'])
    expect((await documents.get(doc.id))?.content).toBe('auto-saved after debounce')
  })
})

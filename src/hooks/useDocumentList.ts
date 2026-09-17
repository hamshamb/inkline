import { useMemo } from 'react'
import { useLiveQuery } from './useLiveQuery'
import { documentService } from '../services/documentService'
import { bucketFor, type DateBucket } from '../utils/date'
import type { DocumentRecord } from '../types/document'

export interface DocumentSection {
  label: DateBucket
  documents: DocumentRecord[]
}

const SECTION_ORDER: DateBucket[] = ['Pinned', 'Today', 'Yesterday', 'Previous 7 days', 'Older']

function groupDocuments(documents: DocumentRecord[]): DocumentSection[] {
  const buckets = new Map<DateBucket, DocumentRecord[]>()
  for (const label of SECTION_ORDER) buckets.set(label, [])

  const sorted = [...documents].sort((a, b) => b.updatedAt - a.updatedAt)
  for (const doc of sorted) {
    const label = doc.pinned ? 'Pinned' : bucketFor(doc.updatedAt)
    buckets.get(label)?.push(doc)
  }

  return SECTION_ORDER.map((label) => ({ label, documents: buckets.get(label) ?? [] })).filter(
    (section) => section.documents.length > 0,
  )
}

/** Live-updating list of active (non-archived, non-trashed) documents, grouped for the sidebar. */
export function useDocumentSections(): { sections: DocumentSection[]; loading: boolean } {
  const documents = useLiveQuery(() => documentService.listActive(), [], undefined as DocumentRecord[] | undefined)
  const sections = useMemo(() => groupDocuments(documents ?? []), [documents])
  return { sections, loading: documents === undefined }
}

export function useArchivedDocuments(): DocumentRecord[] {
  return useLiveQuery(() => documentService.listArchived(), [], [] as DocumentRecord[])
}

export function useTrashedDocuments(): DocumentRecord[] {
  return useLiveQuery(() => documentService.listTrashed(), [], [] as DocumentRecord[])
}

export function useDocument(id: string | undefined): DocumentRecord | undefined {
  return useLiveQuery(
    () => (id ? documentService.get(id) : Promise.resolve(undefined)),
    [id],
    undefined as DocumentRecord | undefined,
  )
}

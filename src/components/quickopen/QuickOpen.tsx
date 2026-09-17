import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog } from '../common/Dialog'
import { searchService } from '../../search/searchService'
import { documentService } from '../../services/documentService'
import { DocumentTypeIcon } from '../sidebar/DocumentTypeIcon'
import type { DocumentRecord } from '../../types/document'

export interface QuickOpenProps {
  open: boolean
  onClose: () => void
  onOpenDocument: (id: string) => void
}

interface Row {
  document: DocumentRecord
  excerpt?: string
}

export function QuickOpen({ open, onClose, onOpenDocument }: QuickOpenProps) {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActiveIndex(0)
    documentService.listActive().then((docs) => {
      const recent = [...docs].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt).slice(0, 20)
      setRows(recent.map((document) => ({ document })))
    })
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (query.trim() === '') {
      documentService.listActive().then((docs) => {
        const recent = [...docs].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt).slice(0, 20)
        setRows(recent.map((document) => ({ document })))
      })
      return
    }
    let cancelled = false
    searchService.search(query).then((results) => {
      if (!cancelled) {
        setRows(results.map((r) => ({ document: r.document, excerpt: r.excerpt })))
        setActiveIndex(0)
      }
    })
    return () => {
      cancelled = true
    }
  }, [query, open])

  const items = useMemo(() => rows, [rows])

  function openRow(row: Row | undefined) {
    if (!row) return
    onOpenDocument(row.document.id)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Quick open" widthClassName="max-w-xl" variant="launcher" align="raised">
      <div
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex((i) => Math.min(i + 1, items.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex((i) => Math.max(i - 1, 0))
          } else if (e.key === 'Enter') {
            e.preventDefault()
            openRow(items[activeIndex])
          }
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents by title or content…"
          className="mb-1 w-full border-b border-[var(--color-border)] bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-[var(--color-muted)]"
        />
        <div role="listbox" className="max-h-80 overflow-y-auto py-1">
          {items.length === 0 && <p className="px-2.5 py-6 text-center text-sm text-[var(--color-muted)]">No matching documents</p>}
          {items.map((row, i) => (
            <button
              key={row.document.id}
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => openRow(row)}
              className={`flex w-full flex-col gap-0.5 rounded-md px-2.5 py-2 text-left ${
                i === activeIndex ? 'bg-[var(--color-accent)] text-[var(--color-accent-text)]' : 'hover:bg-[var(--color-hover)]'
              }`}
            >
              <span className="flex items-center gap-2 text-sm">
                <DocumentTypeIcon type={row.document.type} className={i === activeIndex ? 'text-white' : 'text-[var(--color-muted)]'} />
                {row.document.title}
              </span>
              {row.excerpt && (
                <span className={`truncate text-xs ${i === activeIndex ? 'text-white/80' : 'text-[var(--color-muted)]'}`}>{row.excerpt}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  )
}

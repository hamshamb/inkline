import { forwardRef, useEffect, useState } from 'react'
import { Pin, Tag as TagIcon, X } from 'lucide-react'
import type { DocumentRecord } from '../../types/document'
import { documentService } from '../../services/documentService'

export interface DocumentTitleBarProps {
  document: DocumentRecord
  focusMode: boolean
}

export const DocumentTitleBar = forwardRef<HTMLInputElement, DocumentTitleBarProps>(function DocumentTitleBar(
  { document, focusMode },
  ref,
) {
  const [title, setTitle] = useState(document.title)
  const [showTagInput, setShowTagInput] = useState(false)
  const [tagDraft, setTagDraft] = useState('')

  useEffect(() => setTitle(document.title), [document.id, document.title])

  function commitTitle() {
    if (title.trim() !== document.title) {
      void documentService.rename(document.id, title)
    } else if (title.trim() === '') {
      setTitle(document.title)
    }
  }

  function addTag() {
    const value = tagDraft.trim()
    if (value && !document.tags.includes(value)) {
      void documentService.setTags(document.id, [...document.tags, value])
    }
    setTagDraft('')
    setShowTagInput(false)
  }

  function removeTag(tag: string) {
    void documentService.setTags(
      document.id,
      document.tags.filter((t) => t !== tag),
    )
  }

  if (focusMode) return null

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 pt-6 sm:px-10">
      <input
        ref={ref}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
        aria-label="Document title"
        placeholder="Untitled"
        className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tracking-tight text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
      />
      {document.pinned && <Pin size={16} className="shrink-0 fill-current text-[var(--color-accent)]" aria-label="Pinned" />}
      <div className="flex flex-wrap items-center gap-1.5">
        {document.tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded border border-[var(--color-border)] px-1.5 py-0.5 text-xs text-[var(--color-secondary)]"
          >
            {tag}
            <button type="button" aria-label={`Remove tag ${tag}`} onClick={() => removeTag(tag)} className="hover:text-[var(--color-text)]">
              <X size={10} aria-hidden />
            </button>
          </span>
        ))}
        {showTagInput ? (
          <input
            autoFocus
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onBlur={addTag}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
              if (e.key === 'Escape') {
                setTagDraft('')
                setShowTagInput(false)
              }
            }}
            placeholder="tag name"
            className="w-20 rounded border border-[var(--color-border)] bg-transparent px-1.5 py-0.5 text-xs outline-none focus:border-[var(--color-accent)]"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowTagInput(true)}
            aria-label="Add tag"
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[var(--color-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-secondary)]"
          >
            <TagIcon size={11} aria-hidden />
            Tag
          </button>
        )}
      </div>
    </div>
  )
})

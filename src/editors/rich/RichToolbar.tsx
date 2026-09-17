import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Code2,
  Link2,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Highlighter,
  Undo2,
  Redo2,
  Unlink,
  type LucideIcon,
} from 'lucide-react'
import { isSafeUrl } from '../../utils/safeLinks'
import { useOutsideClickRef } from '../../hooks/useOutsideClickRef'

function ToolbarButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: LucideIcon
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150 disabled:opacity-30 ${
        active ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]'
      }`}
    >
      <Icon size={15} aria-hidden />
    </button>
  )
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px shrink-0 self-center bg-[var(--color-border)]" />
}

const HIGHLIGHT_COLORS = ['#facc15', '#4ade80', '#60a5fa', '#f472b6']
const TEXT_COLORS = ['#f4f4f5', '#e5484d', '#e5a84b', '#40c98b', '#60a5fa']

function LinkControl({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const ref = useOutsideClickRef<HTMLDivElement>(() => setOpen(false))

  const active = editor.isActive('link')

  return (
    <div ref={ref} className="relative">
      <ToolbarButton
        icon={Link2}
        label="Link"
        active={active}
        onClick={() => {
          const existing = editor.getAttributes('link').href as string | undefined
          setUrl(existing ?? '')
          setOpen((v) => !v)
        }}
      />
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 flex w-64 items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] p-1.5 shadow-xl">
          <input
            autoFocus
            type="text"
            value={url}
            placeholder="https://example.com"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (url.trim() && isSafeUrl(url.trim())) {
                  editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
                }
                setOpen(false)
              }
              if (e.key === 'Escape') setOpen(false)
            }}
            className="min-w-0 flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
          {active && (
            <button
              type="button"
              aria-label="Remove link"
              onClick={() => {
                editor.chain().focus().unsetLink().run()
                setOpen(false)
              }}
              className="rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-hover)]"
            >
              <Unlink size={14} aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function SwatchPopover({
  icon: Icon,
  label,
  colors,
  onPick,
  onClear,
}: {
  icon: LucideIcon
  label: string
  colors: string[]
  onPick: (color: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClickRef<HTMLDivElement>(() => setOpen(false))
  return (
    <div ref={ref} className="relative">
      <ToolbarButton icon={Icon} label={label} onClick={() => setOpen((v) => !v)} />
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] p-2 shadow-xl">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Set color ${color}`}
              onClick={() => {
                onPick(color)
                setOpen(false)
              }}
              style={{ background: color }}
              className="h-5 w-5 rounded-full border border-black/10"
            />
          ))}
          <button
            type="button"
            aria-label="Clear color"
            onClick={() => {
              onClear()
              setOpen(false)
            }}
            className="ml-1 rounded p-1 text-xs text-[var(--color-muted)] hover:bg-[var(--color-hover)]"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

export function RichToolbar({ editor }: { editor: Editor }) {
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-0.5 border-b border-[var(--color-border)] bg-[var(--color-chrome)] px-2 py-1"
    >
      <ToolbarButton icon={Undo2} label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} />
      <ToolbarButton icon={Redo2} label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} />
      <Divider />
      <ToolbarButton icon={Heading1} label="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
      <ToolbarButton icon={Heading2} label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton icon={Heading3} label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
      <Divider />
      <ToolbarButton icon={Bold} label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton icon={Italic} label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarButton icon={Underline} label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
      <ToolbarButton icon={Strikethrough} label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
      <ToolbarButton icon={Code} label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} />
      <Divider />
      <ToolbarButton icon={List} label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton icon={ListOrdered} label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <ToolbarButton icon={ListChecks} label="Checklist" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} />
      <ToolbarButton icon={Quote} label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      <ToolbarButton icon={Code2} label="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
      <Divider />
      <ToolbarButton icon={AlignLeft} label="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} />
      <ToolbarButton icon={AlignCenter} label="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} />
      <ToolbarButton icon={AlignRight} label="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} />
      <Divider />
      <SwatchPopover
        icon={Palette}
        label="Text color"
        colors={TEXT_COLORS}
        onPick={(color) => editor.chain().focus().setColor(color).run()}
        onClear={() => editor.chain().focus().unsetColor().run()}
      />
      <SwatchPopover
        icon={Highlighter}
        label="Highlight"
        colors={HIGHLIGHT_COLORS}
        onPick={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
        onClear={() => editor.chain().focus().unsetHighlight().run()}
      />
      <LinkControl editor={editor} />
      <ToolbarButton icon={Minus} label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
    </div>
  )
}

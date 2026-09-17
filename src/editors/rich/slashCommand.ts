import { Extension, type Editor, type Range } from '@tiptap/core'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Minus,
  type LucideIcon,
} from 'lucide-react'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

export interface SlashCommandItem {
  title: string
  icon: LucideIcon
  run: (editor: Editor, range: Range) => void
}

export const SLASH_COMMAND_ITEMS: SlashCommandItem[] = [
  {
    title: 'Heading 1',
    icon: Heading1,
    run: (editor, range) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    icon: Heading2,
    run: (editor, range) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    icon: Heading3,
    run: (editor, range) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    title: 'Bullet list',
    icon: List,
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Numbered list',
    icon: ListOrdered,
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'Checklist',
    icon: ListChecks,
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: 'Quote',
    icon: Quote,
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Code block',
    icon: Code,
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Divider',
    icon: Minus,
    run: (editor, range) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
]

function filterItems(query: string): SlashCommandItem[] {
  const q = query.toLowerCase().trim()
  if (q === '') return SLASH_COMMAND_ITEMS
  return SLASH_COMMAND_ITEMS.filter((item) => item.title.toLowerCase().includes(q))
}

interface MenuHandle {
  el: HTMLDivElement
  root: Root
  destroy: () => void
}

function renderMenu(props: {
  items: SlashCommandItem[]
  selectedIndex: number
  onSelect: (item: SlashCommandItem) => void
}) {
  return createElement(
    'div',
    {
      className:
        'w-56 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] py-1 shadow-lg',
      role: 'listbox',
    },
    props.items.length === 0
      ? createElement('div', { className: 'px-3 py-2 text-sm text-[var(--color-muted)]' }, 'No matching blocks')
      : props.items.map((item, index) =>
          createElement(
            'button',
            {
              key: item.title,
              type: 'button',
              role: 'option',
              'aria-selected': index === props.selectedIndex,
              className: `flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                index === props.selectedIndex
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-hover)]'
              }`,
              onMouseDown: (e: MouseEvent) => {
                e.preventDefault()
                props.onSelect(item)
              },
            },
            createElement(item.icon, { size: 16, 'aria-hidden': true }),
            item.title,
          ),
        ),
  )
}

const suggestionConfig: Omit<SuggestionOptions<SlashCommandItem>, 'editor'> = {
  char: '/',
  startOfLine: false,
  items: ({ query }) => filterItems(query),
  command: ({ editor, range, props }) => {
    props.run(editor, range)
  },
  render: () => {
    let handle: MenuHandle | undefined
    let currentItems: SlashCommandItem[] = []
    let selectedIndex = 0
    let onSelect: (item: SlashCommandItem) => void = () => {}

    const update = () => {
      if (!handle) return
      handle.root.render(renderMenu({ items: currentItems, selectedIndex, onSelect }))
    }

    return {
      onStart: (props) => {
        const el = document.createElement('div')
        el.style.position = 'absolute'
        el.style.zIndex = '50'
        document.body.appendChild(el)
        const root = createRoot(el)
        handle = { el, root, destroy: () => { root.unmount(); el.remove() } }

        currentItems = props.items
        selectedIndex = 0
        onSelect = (item) => props.command(item)
        update()
        positionMenu(el, props.clientRect ?? null)
      },
      onUpdate: (props) => {
        currentItems = props.items
        selectedIndex = 0
        update()
        if (handle) positionMenu(handle.el, props.clientRect ?? null)
      },
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') {
          handle?.destroy()
          handle = undefined
          return true
        }
        if (props.event.key === 'ArrowDown') {
          selectedIndex = (selectedIndex + 1) % Math.max(currentItems.length, 1)
          update()
          return true
        }
        if (props.event.key === 'ArrowUp') {
          selectedIndex = (selectedIndex - 1 + Math.max(currentItems.length, 1)) % Math.max(currentItems.length, 1)
          update()
          return true
        }
        if (props.event.key === 'Enter') {
          const item = currentItems[selectedIndex]
          if (item) onSelect(item)
          return true
        }
        return false
      },
      onExit: () => {
        handle?.destroy()
        handle = undefined
      },
    }
  },
}

function positionMenu(el: HTMLDivElement, clientRect: (() => DOMRect | null) | null) {
  const rect = clientRect?.()
  if (!rect) return
  el.style.left = `${rect.left + window.scrollX}px`
  el.style.top = `${rect.bottom + window.scrollY + 4}px`
}

export const slashCommand = Extension.create({
  name: 'slashCommand',
  addOptions() {
    return { suggestion: suggestionConfig }
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

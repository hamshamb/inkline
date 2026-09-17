import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import type { AnyExtension } from '@tiptap/core'
import { isSafeUrl } from '../../utils/safeLinks'
import { slashCommand } from './slashCommand'

/**
 * The full set of node/mark types produced by this extension list is
 * mirrored exactly by `src/documents/richSchema.ts`. If you add or remove
 * an extension here, update that schema too. (Typography only rewrites
 * plain text via input rules — e.g. straight quotes to curly quotes — so
 * it doesn't add any new node/mark type to the schema.)
 */
export function createRichExtensions(opts: { placeholder?: string; smartQuotes?: boolean } = {}): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        protocols: ['http', 'https', 'mailto', 'tel'],
        validate: (url) => isSafeUrl(url),
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      },
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({ placeholder: opts.placeholder ?? 'Start writing…' }),
    CharacterCount,
    slashCommand,
    ...(opts.smartQuotes === false ? [] : [Typography]),
  ]
}

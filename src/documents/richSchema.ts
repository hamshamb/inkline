import { z } from 'zod'
import { isSafeUrl } from '../utils/safeLinks'
import type { RichMark, RichNode } from '../types/document'

/**
 * Zod schema for the canonical rich-document representation.
 *
 * This is intentionally a *closed* schema: only the node/mark types that
 * `src/editors/rich/extensions.ts` actually registers are accepted. Anything
 * else (including raw HTML strings, unknown node types, or unexpected
 * attributes) is rejected. This is what lets us safely generate HTML/export
 * from stored content later without treating it as untrusted arbitrary HTML.
 */

const markSchema: z.ZodType<RichMark> = z.union([
  z.object({ type: z.literal('bold') }),
  z.object({ type: z.literal('italic') }),
  z.object({ type: z.literal('underline') }),
  z.object({ type: z.literal('strike') }),
  z.object({ type: z.literal('code') }),
  z.object({
    type: z.literal('link'),
    attrs: z.object({
      href: z.string().refine(isSafeUrl, 'Unsafe URL scheme'),
      target: z.string().nullable().optional(),
      rel: z.string().nullable().optional(),
      class: z.string().nullable().optional(),
    }),
  }),
  z.object({
    type: z.literal('textStyle'),
    attrs: z.object({ color: z.string().nullable().optional() }),
  }),
  z.object({
    type: z.literal('highlight'),
    attrs: z.object({ color: z.string().nullable().optional() }),
  }),
])

const baseAttrs = z.record(z.string(), z.unknown()).optional()

const textAlignAttr = z.object({ textAlign: z.string().nullable().optional() }).partial()

const richNodeSchema: z.ZodType<RichNode> = z.lazy(() =>
  z.union([
    z.object({
      type: z.literal('doc'),
      content: z.array(richNodeSchema),
    }),
    z.object({
      type: z.literal('paragraph'),
      attrs: textAlignAttr.optional(),
      content: z.array(richNodeSchema).optional(),
    }),
    z.object({
      type: z.literal('heading'),
      attrs: z.object({ level: z.union([z.literal(1), z.literal(2), z.literal(3)]) }).and(textAlignAttr),
      content: z.array(richNodeSchema).optional(),
    }),
    z.object({
      type: z.literal('text'),
      text: z.string().min(1),
      marks: z.array(markSchema).optional(),
    }),
    z.object({
      type: z.literal('bulletList'),
      content: z.array(richNodeSchema),
    }),
    z.object({
      type: z.literal('orderedList'),
      attrs: z.object({ start: z.number().int().optional() }).optional(),
      content: z.array(richNodeSchema),
    }),
    z.object({
      type: z.literal('listItem'),
      content: z.array(richNodeSchema),
    }),
    z.object({
      type: z.literal('taskList'),
      content: z.array(richNodeSchema),
    }),
    z.object({
      type: z.literal('taskItem'),
      attrs: z.object({ checked: z.boolean().optional() }).optional(),
      content: z.array(richNodeSchema).optional(),
    }),
    z.object({
      type: z.literal('blockquote'),
      content: z.array(richNodeSchema),
    }),
    z.object({
      type: z.literal('codeBlock'),
      attrs: z.object({ language: z.string().nullable().optional() }).optional(),
      content: z.array(richNodeSchema).optional(),
    }),
    z.object({
      type: z.literal('horizontalRule'),
      attrs: baseAttrs,
    }),
    z.object({
      type: z.literal('hardBreak'),
    }),
  ]),
)

export const richDocSchema = z.object({
  type: z.literal('doc'),
  content: z.array(richNodeSchema),
})

export function validateRichContent(content: unknown) {
  return richDocSchema.safeParse(content)
}

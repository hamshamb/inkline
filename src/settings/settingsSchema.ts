import { z } from 'zod'

export const themeSchema = z.enum(['system', 'light', 'dark'])
export type ThemePreference = z.infer<typeof themeSchema>

export const editorWidthSchema = z.enum(['narrow', 'medium', 'wide', 'full'])
export type EditorWidth = z.infer<typeof editorWidthSchema>

export const appSettingsSchema = z.object({
  theme: themeSchema.default('system'),
  fontSize: z.number().min(12).max(24).default(16),
  lineHeight: z.number().min(1.2).max(2.2).default(1.65),
  editorWidth: editorWidthSchema.default('medium'),
  wordWrap: z.boolean().default(true),
  lineNumbers: z.boolean().default(false),
  spellcheck: z.boolean().default(true),
  smartQuotes: z.boolean().default(true),
  sidebarVisible: z.boolean().default(true),
})

export type AppSettings = z.infer<typeof appSettingsSchema>

export const DEFAULT_SETTINGS: AppSettings = appSettingsSchema.parse({})

export const SETTINGS_KEY = 'app-settings'

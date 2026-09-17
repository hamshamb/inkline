export interface TextStats {
  words: number
  characters: number
  /** Estimated reading time in minutes, rounded up, minimum 1 for non-empty text. */
  readingTimeMinutes: number
}

const WORDS_PER_MINUTE = 200

export function computeTextStats(plainText: string): TextStats {
  const trimmed = plainText.trim()
  const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length
  const characters = plainText.length
  const readingTimeMinutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
  return { words, characters, readingTimeMinutes }
}

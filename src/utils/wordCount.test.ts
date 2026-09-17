import { describe, expect, it } from 'vitest'
import { computeTextStats } from './wordCount'

describe('computeTextStats', () => {
  it('returns zeros for empty text', () => {
    expect(computeTextStats('')).toEqual({ words: 0, characters: 0, readingTimeMinutes: 0 })
  })

  it('returns zeros for whitespace-only text but keeps character count', () => {
    const stats = computeTextStats('   \n\t  ')
    expect(stats.words).toBe(0)
    expect(stats.characters).toBe(7)
  })

  it('counts words split on whitespace', () => {
    const stats = computeTextStats('hello there, world')
    expect(stats.words).toBe(3)
    expect(stats.characters).toBe(18)
  })

  it('counts multiple whitespace/newlines as a single separator', () => {
    const stats = computeTextStats('one\n\ntwo   three')
    expect(stats.words).toBe(3)
  })

  it('estimates at least 1 minute reading time for any non-empty text', () => {
    expect(computeTextStats('just a few words').readingTimeMinutes).toBe(1)
  })

  it('scales reading time with word count at 200 wpm', () => {
    const words = Array.from({ length: 450 }, () => 'word').join(' ')
    expect(computeTextStats(words).readingTimeMinutes).toBe(3)
  })
})

import { describe, expect, it } from 'vitest'
import { similarity } from './ai'

describe('similarity', () => {
  it('ignores spaces and punctuation', () => {
    expect(similarity('နေကောင်း လား။', 'နေကောင်းလား')).toBe(1)
  })
  it('scores near misses between 0 and 1', () => {
    const s = similarity('နေကောင်းပါတယ်', 'နေကောင်းလား')
    expect(s).toBeGreaterThan(0.3)
    expect(s).toBeLessThan(1)
  })
  it('handles empty input', () => {
    expect(similarity('', 'ရေ')).toBe(0)
  })
})

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

import { cleanReply } from './ai'
describe('cleanReply', () => {
  it('coerces odd shapes into renderable strings', () => {
    const r = cleanReply({ reply: { my: 'ရေ', rom: null, en: { text: 'water' } }, suggestions: 'x', end: 'yes' })
    expect(r.reply).toEqual({ my: 'ရေ', rom: '', en: '{"text":"water"}' })
    expect(r.suggestions).toEqual([])
    expect(r.end).toBe(false)
    expect(r.better).toEqual({ my: '', rom: '', en: '' })
    expect(r.learner).toEqual({ my: '', rom: '', en: '' })
  })
  it('rejects an empty reply', () => {
    expect(() => cleanReply({})).toThrow()
  })
})

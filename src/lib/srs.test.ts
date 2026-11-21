import { describe, expect, it } from 'vitest'
import { newCard, Rating, review, isDue, formatInterval } from './srs'

describe('srs', () => {
  it('round-trips cards through JSON storage', async () => {
    const now = new Date('2026-11-21T10:00:00Z')
    const c = await newCard(now)
    expect(isDue(c, now)).toBe(true)
    const stored = JSON.parse(JSON.stringify(c))
    const r = await review(stored, Rating.Good, 'x__recog', now)
    expect(typeof r.card.dueAt).toBe('string')
    expect(new Date(r.card.dueAt).getTime()).toBeGreaterThan(now.getTime())
    const again = await review(JSON.parse(JSON.stringify(r.card)), Rating.Again, 'x__recog', new Date(r.card.dueAt))
    expect(again.log.key).toBe('x__recog')
  })
  it('formats intervals', () => {
    const now = new Date(0)
    expect(formatInterval(new Date(5 * 60000), now)).toBe('5m')
    expect(formatInterval(new Date(3 * 864e5), now)).toBe('3d')
  })
})

import { describe, expect, it } from 'vitest'
import { mergeStates } from './merge'
import { emptyState, type AppState } from './store'
import type { StoredCard } from './srs'

const card = (reviewed: string | null, reps: number): StoredCard =>
  ({ dueAt: '2027-01-01T00:00:00.000Z', lastReviewAt: reviewed, state: 2, reps, lapses: 0, stability: 3 }) as StoredCard

const st = (over: Partial<AppState>): AppState => ({ ...emptyState(), ...over })

describe('mergeStates', () => {
  it('keeps the more recently reviewed card and unions the rest', () => {
    const local = st({ cards: { a: card('2026-11-20T00:00:00Z', 3), b: card(null, 0) }, updatedAt: '2026-11-20T00:00:00Z' })
    const remote = st({ cards: { a: card('2026-11-21T00:00:00Z', 4), c: card('2026-11-01T00:00:00Z', 1) }, updatedAt: '2026-11-21T00:00:00Z' })
    const m = mergeStates(local, remote)
    expect(Object.keys(m.cards).sort()).toEqual(['a', 'b', 'c'])
    expect(m.cards.a.reps).toBe(4)
  })
  it('takes settings from the newer copy, unions custom items and keeps earliest introduction', () => {
    const local = st({
      settings: { ...emptyState().settings, newPerDay: 5 },
      updatedAt: '2026-11-22T00:00:00Z',
      introduced: { x: '2026-11-10T00:00:00Z' },
      custom: [{ id: 'u.1', strand: 'speak', unit: 0, my: 'ရေ', rom: 'yèi', en: 'water' }],
    })
    const remote = st({
      settings: { ...emptyState().settings, newPerDay: 12 },
      updatedAt: '2026-11-21T00:00:00Z',
      introduced: { x: '2026-11-09T00:00:00Z', y: '2026-11-11T00:00:00Z' },
      custom: [{ id: 'u.2', strand: 'speak', unit: 0, my: 'ထမင်း', rom: 'htə-mín', en: 'rice' }],
    })
    const m = mergeStates(local, remote)
    expect(m.settings.newPerDay).toBe(5)
    expect(m.custom.map((c) => c.id).sort()).toEqual(['u.1', 'u.2'])
    expect(m.introduced).toEqual({ x: '2026-11-09T00:00:00Z', y: '2026-11-11T00:00:00Z' })
  })
  it('dedupes tone trials', () => {
    const t = { t: '2026-11-21T00:00:00Z', set: 't.ka', asked: 0, chose: 1 }
    expect(mergeStates(st({ toneLog: [t] }), st({ toneLog: [t] })).toneLog).toHaveLength(1)
  })
})

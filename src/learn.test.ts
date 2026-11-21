import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { lessonById, LESSONS } from './content'
import { completeLesson, lessonExercises, nextLesson, reviewPlan } from './learn'
import { emptyState } from './lib/store'

describe('course', () => {
  it('builds a varied practice for a phrase lesson', () => {
    const s = emptyState()
    const { exercises } = lessonExercises(lessonById('m1.l1')!, s)
    const kinds = new Set(exercises.map((e) => e.kind))
    for (const k of ['choose-meaning', 'match', 'choose-burmese', 'tiles', 'say']) expect(kinds).toContain(k)
  })
  it('turns a finished lesson into scheduled cards and moves on', async () => {
    const s = emptyState()
    const l = lessonById('m1.l1')!
    expect(nextLesson(s)?.id).toBe(LESSONS[0].id)
    const apply = await completeLesson(l, s, new Map([['s.hello', 'wrong']]), [], 0.8)
    const after = apply(s)
    expect(Object.keys(after.cards).length).toBe(4)
    expect(after.introduced['s.hello']).toBeTruthy()
    expect(nextLesson(after)?.id).toBe('m1.l2')
    // The missed item comes back within minutes; the others in days.
    const due = (id: string) => new Date(after.cards[`${id}__recog`].dueAt).getTime() - Date.now()
    expect(due('s.hello')).toBeLessThan(15 * 60 * 1000)
    expect(due('s.thank-you')).toBeGreaterThan(24 * 3600 * 1000)
    expect(reviewPlan(after).exercises.length).toBe(0)
  })
})

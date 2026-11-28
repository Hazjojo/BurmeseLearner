import { describe, expect, it } from 'vitest'
import { addActivity, computeStreak, dayKey } from './streak'
import { emptyState, type AppState } from './store'

const withDays = (days: Record<string, number>, goal: AppState['settings']['dailyGoal'] = 'any'): AppState => {
  const s = emptyState()
  s.settings.dailyGoal = goal
  for (const [d, answers] of Object.entries(days)) s.activity[d] = { answers, seconds: answers * 30, lessons: 0, dueLeft: 0 }
  return s
}

describe('streak', () => {
  it('counts consecutive goal days and waits for today', () => {
    const r = computeStreak(withDays({ '2026-11-25': 5, '2026-11-26': 3, '2026-11-27': 2 }), '2026-11-28')
    expect(r.streak).toBe(3)
    expect(r.todayDone).toBe(false)
  })
  it('breaks after a missed day without freezes', () => {
    expect(computeStreak(withDays({ '2026-11-24': 5, '2026-11-26': 3 }), '2026-11-27').streak).toBe(1)
  })
  it('earns a freeze every 7 days that covers one missed day', () => {
    const days: Record<string, number> = {}
    for (let i = 1; i <= 7; i++) days[`2026-11-0${i}`] = 5
    days['2026-11-09'] = 5 // 8th missed, covered
    const r = computeStreak(withDays(days), '2026-11-10')
    expect(r.marks['2026-11-08']).toBe('frozen')
    expect(r.streak).toBe(8)
    expect(r.freezes).toBe(0)
  })
  it('respects a minutes goal', () => {
    expect(computeStreak(withDays({ '2026-11-27': 10 }, 'min10'), '2026-11-28').streak).toBe(0) // 5 minutes only
    expect(computeStreak(withDays({ '2026-11-27': 25 }, 'min10'), '2026-11-28').streak).toBe(1)
  })
  it('adds activity to today', () => {
    const s = addActivity(addActivity(emptyState(), { answers: 1, seconds: 20 }), { answers: 2, seconds: 30, lessons: 1 })
    expect(s.activity[dayKey()]).toMatchObject({ answers: 3, seconds: 50, lessons: 1 })
  })
})

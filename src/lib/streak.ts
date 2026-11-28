import type { AppState, DayActivity } from './store'

export type Goal = 'any' | 'lesson' | 'min10' | 'min20'
export const GOALS: { id: Goal; label: string; detail: string }[] = [
  { id: 'any', label: 'Show up', detail: 'Any practice counts' },
  { id: 'lesson', label: 'Reviews + 1 lesson', detail: 'Clear what’s due and do one lesson' },
  { id: 'min10', label: '10 minutes', detail: 'About 10 minutes of practice' },
  { id: 'min20', label: '20 minutes', detail: 'About 20 minutes of practice' },
]

/** Local calendar date, YYYY-MM-DD. */
export const dayKey = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return z.toISOString().slice(0, 10)
}
const addDays = (key: string, n: number) => {
  const d = new Date(`${key}T12:00:00`)
  d.setDate(d.getDate() + n)
  return dayKey(d)
}

/** 0–1 progress towards the daily goal. `dueLeft` = reviews still due (for the 'lesson' goal, only meaningful for today). */
export function goalProgress(a: DayActivity | undefined, goal: Goal, dueLeft = 0): number {
  if (!a) return 0
  const answers = a.answers ?? 0
  const mins = (a.seconds ?? 0) / 60
  switch (goal) {
    case 'any':
      return answers > 0 ? 1 : 0
    case 'lesson':
      return ((a.lessons ?? 0) > 0 ? 0.6 : 0) + (dueLeft === 0 && answers > 0 ? 0.4 : Math.min(0.39, answers / 50))
    case 'min10':
      return Math.min(1, mins / 10)
    case 'min20':
      return Math.min(1, mins / 20)
  }
}
const met = (a: DayActivity | undefined, goal: Goal) => goalProgress(a, goal, a?.dueLeft ?? 0) >= 0.999

export type DayMark = 'done' | 'frozen' | 'missed' | 'today' | 'none'

/**
 * Walk the calendar from the first active day to today. A day that meets the goal extends the streak;
 * every 7 such days earns a freeze (max 2), which automatically covers a missed day instead of breaking it.
 */
export function computeStreak(s: AppState, today = dayKey()) {
  const goal = (s.settings.dailyGoal ?? 'any') as Goal
  const days = Object.keys(s.activity ?? {}).sort()
  const marks: Record<string, DayMark> = {}
  let streak = 0
  let best = 0
  let freezes = 0
  let sinceFreeze = 0
  if (days.length) {
    for (let d = days[0]; d <= today; d = addDays(d, 1)) {
      const a = s.activity[d]
      if (met(a, goal)) {
        streak++
        sinceFreeze++
        marks[d] = 'done'
        if (sinceFreeze >= 7) {
          freezes = Math.min(2, freezes + 1)
          sinceFreeze = 0
        }
      } else if (d === today) {
        marks[d] = 'today'
      } else if (freezes > 0 && streak > 0) {
        freezes--
        marks[d] = 'frozen'
      } else {
        streak = 0
        sinceFreeze = 0
        marks[d] = a ? 'missed' : 'none'
      }
      best = Math.max(best, streak)
    }
  }
  return { streak, best, freezes, marks, todayDone: marks[today] === 'done', goal }
}

/** Last n days (oldest first) with their marks, for the week strip / calendar. */
export function recentDays(marks: Record<string, DayMark>, n: number, today = dayKey()) {
  return Array.from({ length: n }, (_, i) => {
    const d = addDays(today, i - n + 1)
    return { day: d, mark: (marks[d] ?? (d === today ? 'today' : 'none')) as DayMark }
  })
}

/** Add activity to today's record. */
export function addActivity(s: AppState, add: Partial<DayActivity>, today = dayKey()): AppState {
  const cur = s.activity?.[today] ?? {}
  const next: DayActivity = {
    answers: (cur.answers ?? 0) + (add.answers ?? 0),
    lessons: (cur.lessons ?? 0) + (add.lessons ?? 0),
    seconds: Math.min(24 * 3600, (cur.seconds ?? 0) + (add.seconds ?? 0)),
    dueLeft: add.dueLeft ?? cur.dueLeft,
  }
  return { ...s, activity: { ...(s.activity ?? {}), [today]: next } }
}

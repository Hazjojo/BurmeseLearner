import type { DayActivity } from './store'

/** Lightweight study-time tracking: every answer counts, with the time since the previous one (capped). */
let hook: ((add: Partial<DayActivity>) => void) | null = null
let last = 0
export const setActivityHook = (f: typeof hook) => (hook = f)

export function tick(answers = 1, lessons = 0) {
  const now = Date.now()
  const gap = now - last
  const seconds = last && gap < 120_000 ? gap / 1000 : 12
  last = now
  hook?.({ answers, lessons, seconds: Math.round(seconds) })
}

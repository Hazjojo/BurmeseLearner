import { DefaultScheduler, Rating, type Grade } from 'ts-fsrs'

// Card/revlog shapes as stored (JSON-safe: dates as ISO strings).
export type StoredCard = Record<string, unknown> & { dueAt: string; state: number; reps: number; lapses: number; stability: number }
export type StoredLog = Record<string, unknown> & { key: string; rating: number; reviewTime: string }

export { Rating }
export type { Grade }

const DATE_FIELDS = ['dueAt', 'lastReviewAt', 'reviewTime']

function toJSONSafe<T extends object>(o: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(o)) out[k] = v instanceof Date ? v.toISOString() : v
  return out
}
function revive(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...o }
  for (const k of DATE_FIELDS) if (typeof out[k] === 'string') out[k] = new Date(out[k] as string)
  return out
}

type Scheduler = Awaited<ReturnType<typeof DefaultScheduler>>
let schedulerPromise: Promise<Scheduler> | null = null
let currentRetention = 0.9

/** FSRS-7 pinned explicitly so a library upgrade can't silently change the model. */
export function getScheduler(desiredRetention = 0.9): Promise<Scheduler> {
  if (!schedulerPromise || desiredRetention !== currentRetention) {
    currentRetention = desiredRetention
    schedulerPromise = DefaultScheduler({ version: 'FSRS-7', desiredRetention, enableFuzz: true })
  }
  return schedulerPromise
}

export async function newCard(now = new Date()): Promise<StoredCard> {
  const s = await getScheduler(currentRetention)
  return toJSONSafe(s.newCard({ now })) as StoredCard
}

export async function review(card: StoredCard, grade: Grade, key: string, now = new Date()) {
  const s = await getScheduler(currentRetention)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = s.review({ card: revive(card) as any, grade, now })
  return {
    card: toJSONSafe(r.card) as StoredCard,
    log: { ...toJSONSafe(r.revlog), key } as StoredLog,
  }
}

/** Next due time for each grade, for labelling the buttons. */
export async function previewDue(card: StoredCard, now = new Date()): Promise<Record<number, Date>> {
  const s = await getScheduler(currentRetention)
  const out: Record<number, Date> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of s.preview({ card: revive(card) as any, now })) out[p.grade] = new Date(p.card.dueAt as unknown as string)
  return out
}

export function formatInterval(due: Date, now = new Date()): string {
  const mins = Math.max(1, Math.round((due.getTime() - now.getTime()) / 60000))
  if (mins < 60) return `${mins}m`
  const hrs = mins / 60
  if (hrs < 24) return `${Math.round(hrs)}h`
  const days = hrs / 24
  if (days < 31) return `${Math.round(days)}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(1)}y`
}

export const isDue = (c: StoredCard, now = new Date()) => new Date(c.dueAt).getTime() <= now.getTime()
/** "Known receptively": graduated to review state with at least two successful reviews. */
export const isEstablished = (c: StoredCard | undefined) => !!c && c.state === 2 && c.reps >= 2

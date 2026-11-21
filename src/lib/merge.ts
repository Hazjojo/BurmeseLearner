import type { AppState } from './store'
import type { StoredCard } from './srs'

const reviewedAt = (c: StoredCard) => (typeof c.lastReviewAt === 'string' ? Date.parse(c.lastReviewAt) : 0)

/** The more recently reviewed copy of a card wins; ties go to the one with more reviews. */
export function newerCard(a: StoredCard | undefined, b: StoredCard | undefined): StoredCard | undefined {
  if (!a) return b
  if (!b) return a
  const ta = reviewedAt(a)
  const tb = reviewedAt(b)
  if (ta !== tb) return ta > tb ? a : b
  return (b.reps ?? 0) > (a.reps ?? 0) ? b : a
}

/**
 * Merge two copies of the app state (this device and the cloud).
 * Review data is never lost: cards take the newer copy, everything list-like is unioned.
 * Settings and per-item notes follow whichever copy changed last.
 */
export function mergeStates(local: AppState, remote: AppState): AppState {
  const localNewer = Date.parse(local.updatedAt) >= Date.parse(remote.updatedAt)
  const [older, newer] = localNewer ? [remote, local] : [local, remote]

  const cards: AppState['cards'] = {}
  for (const k of new Set([...Object.keys(local.cards), ...Object.keys(remote.cards)])) cards[k] = newerCard(local.cards[k], remote.cards[k])!

  const introduced: AppState['introduced'] = { ...remote.introduced }
  for (const [k, d] of Object.entries(local.introduced)) if (!introduced[k] || d < introduced[k]) introduced[k] = d

  const custom = [...newer.custom]
  for (const c of older.custom) if (!custom.some((x) => x.id === c.id)) custom.push(c)

  const seen = new Set<string>()
  const toneLog = [...remote.toneLog, ...local.toneLog]
    .filter((t) => {
      const id = `${t.t}|${t.set}|${t.asked}|${t.chose}`
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
    .sort((a, b) => a.t.localeCompare(b.t))
    .slice(-5000)

  return {
    version: 1,
    settings: { ...older.settings, ...newer.settings },
    cards,
    introduced,
    meta: { ...older.meta, ...newer.meta },
    custom,
    toneLog,
    updatedAt: newer.updatedAt,
  }
}

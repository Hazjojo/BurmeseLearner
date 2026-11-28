import { type Track, cardKey, DRILLS, getItem, LESSONS, lessonItems, learningOrder, parseKey, romTokens, toneSetById, type Item, type Lesson } from './content'
import { shuffle, type Exercise, type Outcome } from './exercises'
import { clipsFor } from './lib/speech'
import { isDue, isEstablished, newCard, Rating, review, type Grade, type StoredCard } from './lib/srs'
import { appendLog, type AppState } from './lib/store'

export const gradeFor = (o: Outcome): Grade => (o === 'right' ? Rating.Good : o === 'hinted' ? Rating.Hard : Rating.Again) as Grade
const audible = (i: Item) => clipsFor(i.my).length > 0
const multiWord = (i: Item) => romTokens(i.rom).length >= 2

/** The first lesson not yet completed, in course order. */
export const nextLesson = (s: AppState, track: Track = 'speak') => LESSONS.find((l) => l.track === track && !s.lessons[l.id])

/** Items the learner has met (used as distractor pool and for drills). */
export const knownItems = (s: AppState): Item[] =>
  learningOrder('both', s.custom).filter((i) => s.introduced[i.id])

/** Pattern drills for a lesson, using verbs already met (or being met now). */
function lessonDrills(lesson: Lesson, s: AppState, nowMeeting: Set<string>): Item[] {
  if (!lesson.drills?.length) return []
  const known = (id: string) => s.introduced[id] || nowMeeting.has(id)
  return shuffle(DRILLS.filter((d) => lesson.drills!.includes(d.drill!.pattern) && known(d.drill!.verb))).slice(0, 4)
}

/** Exercises for a lesson: recognise, match, choose, build, say. Easy to hard. */
export function lessonExercises(lesson: Lesson, s: AppState): { exercises: Exercise[]; drills: Item[] } {
  const kind = lesson.kind ?? 'phrases'
  if (kind === 'tones') {
    const out: Exercise[] = []
    for (const id of lesson.toneSets ?? []) {
      const set = toneSetById(id)
      if (!set) continue
      const playable = set.options.map((_, i) => i).filter((i) => clipsFor(set.options[i].my).length)
      if (playable.length < 2) continue
      for (let k = 0; k < 3; k++) out.push({ kind: 'tone', set, asked: playable[Math.floor(Math.random() * playable.length)] })
    }
    return { exercises: shuffle(out), drills: [] }
  }
  const items = lessonItems(lesson, s.settings.speaker)
  if (kind === 'script') return { exercises: scriptExercises(items), drills: [] }
  const meeting = new Set(items.map((i) => i.id))
  const drills = lessonDrills(lesson, s, meeting)
  const ex: Exercise[] = []
  ex.push(...items.map((item) => ({ kind: 'choose-meaning' as const, item, listen: audible(item) })))
  if (items.length >= 3) ex.push({ kind: 'match', items: shuffle(items).slice(0, 5) })
  ex.push(...shuffle(items).map((item) => ({ kind: 'choose-burmese' as const, item })))
  ex.push(...shuffle(items.filter(multiWord)).map((item) => ({ kind: 'tiles' as const, item })))
  ex.push(...drills.map((item) => ({ kind: 'tiles' as const, item })))
  ex.push(...shuffle(items).slice(0, 2).map((item) => ({ kind: 'say' as const, item })))
  return { exercises: ex, drills }
}

/**
 * Script lessons: trace each new letter, then hear → pick the letter, see → pick the sound, match,
 * and finally draw a couple from memory. Reading lessons (real words) sound out and read for meaning.
 */
function scriptExercises(items: Item[]): Exercise[] {
  const letters = items.filter((i) => i.strand === 'script')
  const words = items.filter((i) => i.strand !== 'script')
  const ex: Exercise[] = []
  ex.push(...letters.filter((i) => i.row).map((item) => ({ kind: 'draw' as const, item, trace: true })))
  ex.push(...shuffle(letters).map((item) => ({ kind: 'hear-glyph' as const, item })))
  ex.push(...shuffle(letters).map((item) => ({ kind: 'glyph' as const, item })))
  if (letters.length >= 3) ex.push({ kind: 'match', items: shuffle(letters).slice(0, 5) })
  ex.push(...shuffle(letters).slice(0, 2).map((item) => ({ kind: 'draw' as const, item, trace: false })))
  ex.push(...words.map((item) => ({ kind: 'glyph' as const, item })))
  ex.push(...shuffle(words).map((item) => ({ kind: 'choose-meaning' as const, item, listen: false })))
  return ex
}

/** Fold lesson results into the state: items become cards scheduled by how well they went. */
export async function completeLesson(
  lesson: Lesson,
  s: AppState,
  results: Map<string, Outcome>,
  drills: Item[],
  score: number,
): Promise<(st: AppState) => AppState> {
  const now = new Date()
  const cards: Record<string, StoredCard> = {}
  const introduced: Record<string, string> = {}
  const worst = (id: string): Outcome | undefined => results.get(id)
  const items = lessonItems(lesson, s.settings.speaker)
  for (const item of items) {
    const type = item.strand === 'script' ? 'glyph' : 'recog'
    const key = cardKey(item.id, type)
    const existing = s.cards[key]
    const o = worst(item.id) ?? 'right'
    const r = await review(existing ?? (await newCard(now)), gradeFor(o), key, now)
    cards[key] = r.card
    await appendLog(r.log)
    if (!s.introduced[item.id]) introduced[item.id] = now.toISOString()
  }
  for (const d of drills) {
    const key = cardKey(d.id, 'prod')
    const o = worst(d.id)
    if (!o) continue
    const r = await review(s.cards[key] ?? (await newCard(now)), gradeFor(o), key, now)
    cards[key] = r.card
    await appendLog(r.log)
  }
  return (st) => ({
    ...st,
    cards: { ...st.cards, ...cards },
    introduced: { ...introduced, ...st.introduced },
    lessons: { ...st.lessons, [lesson.id]: { at: now.toISOString(), score } },
  })
}

/** Production / drill cards that have become available but haven't been started yet. */
export function unlockable(s: AppState): string[] {
  const out: string[] = []
  const est = (id: string) => isEstablished(s.cards[cardKey(id, 'recog')])
  for (const item of knownItems(s)) {
    if (item.strand !== 'speak') continue
    const k = cardKey(item.id, 'prod')
    if (!s.cards[k] && est(item.id)) out.push(k)
  }
  for (const d of DRILLS) {
    const k = cardKey(d.id, 'prod')
    if (!s.cards[k] && est(d.drill!.from) && est(d.drill!.verb)) out.push(k)
  }
  return out
}

export function dueKeys(s: AppState, now = new Date()): string[] {
  return Object.entries(s.cards)
    .filter(([k, c]) => isDue(c, now) && getItem(parseKey(k).itemId, s.custom))
    .sort((a, b) => a[1].dueAt.localeCompare(b[1].dueAt))
    .map(([k]) => k)
}

/** Choose an exercise format for a card: easier formats while it's young, recall/production once it's established. */
export function exerciseForCard(key: string, s: AppState): Exercise | null {
  const { itemId, type } = parseKey(key)
  const item = getItem(itemId, s.custom)
  if (!item) return null
  const c = s.cards[key]
  const young = !c || (c.stability ?? 0) < 7
  const r = Math.random()
  if (type === 'glyph') {
    // Script cards rotate between reading, listening and (once known) drawing from memory.
    if (young) return r < 0.5 ? { kind: 'glyph', item } : { kind: 'hear-glyph', item }
    return r < 0.35 ? { kind: 'glyph', item } : r < 0.7 ? { kind: 'hear-glyph', item } : { kind: 'draw', item, trace: false }
  }
  if (type === 'recog') {
    if (young) return { kind: 'choose-meaning', item, listen: audible(item) && r < 0.6 }
    return r < 0.5 && audible(item) ? { kind: 'choose-meaning', item, listen: true } : { kind: 'recall', item }
  }
  // prod
  if (item.drill) return { kind: 'tiles', item }
  if (young) return multiWord(item) ? { kind: 'tiles', item } : { kind: 'choose-burmese', item }
  return r < 0.6 ? { kind: 'say', item } : multiWord(item) ? { kind: 'tiles', item } : { kind: 'say', item }
}

export interface ReviewPlan {
  exercises: Exercise[]
  keyOf: Map<Exercise, string>
}

export function reviewPlan(s: AppState, max = 40): ReviewPlan {
  const keys = [...dueKeys(s), ...unlockable(s).slice(0, 8)].slice(0, max)
  const keyOf = new Map<Exercise, string>()
  const exercises: Exercise[] = []
  for (const k of keys) {
    const ex = exerciseForCard(k, s)
    if (!ex) continue
    keyOf.set(ex, k)
    exercises.push(ex)
  }
  return { exercises: shuffle(exercises), keyOf }
}

export async function gradeCard(key: string, o: Outcome, s: AppState) {
  const r = await review(s.cards[key] ?? (await newCard()), gradeFor(o), key)
  await appendLog(r.log)
  return r.card
}

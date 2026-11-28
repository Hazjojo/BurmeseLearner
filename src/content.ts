import speaking from '../content/speaking.json'
import script from '../content/script.json'
import tones from '../content/tones.json'
import patterns from '../content/patterns.json'
import verbForms from '../content/verbforms.json'
import course from '../content/course.json'

export type Strand = 'speak' | 'script'

export interface Item {
  id: string
  strand: Strand
  unit: number
  my: string
  rom: string
  en: string
  lit?: string
  note?: string
  speaker?: 'm' | 'f'
  /** Script letters: row of the sound grid (k/s/t/p, or x = outside the grid) and column. */
  row?: string
  col?: string
  /** A simple picture for the phrase. */
  emoji?: string
  /** Set for pattern drills generated from a pattern × verb. */
  drill?: { pattern: string; from: string; verb: string }
  /** Set for items I added myself. */
  custom?: boolean
}

export interface ToneSet {
  id: string
  contrast: string
  options: { my: string; rom: string; en?: string }[]
}

interface Pattern {
  id: string
  from: string
  my: string
  rom: [string, string]
  en: string
  note?: string
}

/** Card types. recog: Burmese → meaning. prod: English → say it. glyph: script → sound. */
export type CardType = 'recog' | 'prod' | 'glyph'

export const BASE_ITEMS: Item[] = [
  ...(speaking as Omit<Item, 'strand'>[]).map((i) => ({ ...i, strand: 'speak' as const })),
  ...(script as Omit<Item, 'strand'>[]).map((i) => ({ ...i, strand: 'script' as const })),
]
const BASE_BY_ID = new Map(BASE_ITEMS.map((i) => [i.id, i]))
export const TONE_SETS = tones as ToneSet[]
export const PATTERNS = patterns as Pattern[]

/** Pattern drills: every pattern × every verb, e.g. "I want to drink" → သောက်ချင်တယ်. */
export const DRILLS: Item[] = PATTERNS.flatMap((pat) =>
  Object.entries(verbForms as Record<string, { base: string; past: string }>).map(([verbId, forms]) => {
    const v = BASE_BY_ID.get(verbId)!
    const checked = v.rom.endsWith('ʔ')
    return {
      id: `g.${pat.id}.${verbId}`,
      strand: 'speak' as const,
      unit: 100,
      my: pat.my.replace('{v}', v.my),
      rom: pat.rom[checked ? 1 : 0].replace('{v}', v.rom),
      en: pat.en.replace('{base}', forms.base).replace('{past}', forms.past),
      note: pat.note,
      emoji: v.emoji,
      drill: { pattern: pat.id, from: pat.from, verb: verbId },
    }
  }),
)
const DRILL_BY_ID = new Map(DRILLS.map((i) => [i.id, i]))

export function getItem(id: string, custom: Item[] = []): Item | undefined {
  return BASE_BY_ID.get(id) ?? DRILL_BY_ID.get(id) ?? custom.find((c) => c.id === id)
}

export const cardKey = (itemId: string, type: CardType) => `${itemId}__${type}`
export const parseKey = (key: string) => {
  const [itemId, type] = key.split('__') as [string, CardType]
  return { itemId, type }
}
export const firstCardType = (item: Item): CardType => (item.strand === 'script' ? 'glyph' : 'recog')

/**
 * Items in learning order. My own items come first (they're from real life);
 * course units interleave strands so script is a small daily dose.
 */
export function learningOrder(speaker: 'm' | 'f' | 'both', custom: Item[] = []): Item[] {
  const ok = (i: Item) => speaker === 'both' || !i.speaker || i.speaker === speaker
  const speak = BASE_ITEMS.filter((i) => i.strand === 'speak' && ok(i))
  const scr = BASE_ITEMS.filter((i) => i.strand === 'script')
  const out: Item[] = [...custom]
  let s = 0
  for (let i = 0; i < speak.length; i++) {
    out.push(speak[i])
    if (i % 3 === 2 && s < scr.length) out.push(scr[s++])
  }
  return out.concat(scr.slice(s))
}

// ---------------- Course structure ----------------

export interface Lesson {
  id: string
  title: string
  kind?: 'phrases' | 'tones' | 'script'
  intro: string[]
  items?: string[]
  toneSets?: string[]
  drills?: string[]
}
export interface Module {
  id: string
  title: string
  summary: string
  icon: string
  color: string
  lessons: Lesson[]
}
export type Track = 'speak' | 'script'
const courseJson = course as { modules: Module[]; scriptModules: Module[] }
/** Speaking course modules. */
export const MODULES = courseJson.modules
/** The separate script (alphabet) track, learned in parallel. */
export const SCRIPT_MODULES = courseJson.scriptModules
export const modulesOf = (t: Track) => (t === 'script' ? SCRIPT_MODULES : MODULES)
export type PlacedLesson = Lesson & { module: Module; track: Track }
export const LESSONS: PlacedLesson[] = [
  ...MODULES.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m, track: 'speak' as const }))),
  ...SCRIPT_MODULES.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m, track: 'script' as const }))),
]
export const lessonsOf = (t: Track) => LESSONS.filter((l) => l.track === t)
export const lessonById = (id: string) => LESSONS.find((l) => l.id === id)
export const lessonKind = (l: Lesson) => l.kind ?? 'phrases'

/** Lesson items, filtered by which form of "I" the learner uses. */
export function lessonItems(l: Lesson, speaker: 'm' | 'f' | 'both'): Item[] {
  return (l.items ?? [])
    .map((id) => getItem(id)!)
    .filter((i) => i && (speaker === 'both' || !i.speaker || i.speaker === speaker))
}
export const toneSetById = (id: string) => TONE_SETS.find((s) => s.id === id)

/** Romanization split into word tiles (space-separated groups). */
export const romTokens = (rom: string) => rom.split(/\s+/).filter((t) => t && t !== '___')

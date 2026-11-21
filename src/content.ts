import speaking from '../content/speaking.json'
import script from '../content/script.json'
import tones from '../content/tones.json'

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
}

export interface ToneSet {
  id: string
  contrast: string
  options: { my: string; rom: string; en?: string }[]
}

/** Card types. recog: Burmese → meaning. prod: English → say it. glyph: script → sound. */
export type CardType = 'recog' | 'prod' | 'glyph'

export const ITEMS: Item[] = [
  ...(speaking as Omit<Item, 'strand'>[]).map((i) => ({ ...i, strand: 'speak' as const })),
  ...(script as Omit<Item, 'strand'>[]).map((i) => ({ ...i, strand: 'script' as const })),
]
export const ITEM_BY_ID = new Map(ITEMS.map((i) => [i.id, i]))
export const TONE_SETS = tones as ToneSet[]

export const cardKey = (itemId: string, type: CardType) => `${itemId}__${type}`
export const parseKey = (key: string) => {
  const [itemId, type] = key.split('__') as [string, CardType]
  return { itemId, type }
}
export const firstCardType = (item: Item): CardType => (item.strand === 'script' ? 'glyph' : 'recog')

/** Items in learning order: units interleave strands so script is a small daily dose. */
export function learningOrder(speaker: 'm' | 'f' | 'both'): Item[] {
  const ok = (i: Item) => speaker === 'both' || !i.speaker || i.speaker === speaker
  const speak = ITEMS.filter((i) => i.strand === 'speak' && ok(i))
  const scr = ITEMS.filter((i) => i.strand === 'script')
  // Roughly 1 script item for every 3 speaking items.
  const out: Item[] = []
  let s = 0
  for (let i = 0; i < speak.length; i++) {
    out.push(speak[i])
    if (i % 3 === 2 && s < scr.length) out.push(scr[s++])
  }
  return out.concat(scr.slice(s))
}

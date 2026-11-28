// Client side of the speaking features (server: functions/src/index.ts). Available when signed in on the Firebase-hosted app.
import type { Sync } from './sync'
import { toWav16kBase64 } from './wav'

let sync: Sync | null = null
export const setAISync = (s: Sync | null) => (sync = s)
export const aiAvailable = () => !!sync?.user

export interface Line {
  my: string
  rom: string
  en: string
}
export interface AIReply {
  reply: Line
  /** The learner's last message as the AI understood it (Burmese, romanization, English). */
  learner: Line
  /** What speech recognition heard, if the turn was spoken. */
  heardText: string | null
  feedback: string
  better: Line
  suggestions: Line[]
  end: boolean
  audio: string | null
}

export interface Heard {
  text: string
  rom: string
  en: string
}
/** Speech → Burmese text, with romanization and meaning. */
export async function transcribe(recording: Blob): Promise<Heard> {
  if (!sync) throw new Error('Sign in to use speech checking.')
  const r = await sync.call<Partial<Heard>>('transcribe', { wav: await toWav16kBase64(recording), romanize: true })
  return { text: r.text ?? '', rom: typeof r.rom === 'string' ? r.rom : '', en: typeof r.en === 'string' ? r.en : '' }
}

/** Wake the server functions up ahead of time so the first real request is quick. */
export function warmUp() {
  if (!sync) return
  sync.call('transcribe', { warm: true }).catch(() => {})
  sync.call('converse', { warm: true }).catch(() => {})
}

/** One conversation turn. Pass a recording to have it transcribed and answered in a single trip. Resolves to null if nothing was heard. */
export async function converse(
  input: {
    scenario: { title: string; setup: string; role: string; voice?: number }
    history: { who: 'ai' | 'me'; my: string; en?: string }[]
    known: string[]
    speaker: 'm' | 'f' | 'both'
  },
  recording?: Blob,
): Promise<AIReply | null> {
  if (!sync) throw new Error('Sign in to use conversation practice.')
  const payload = recording ? { ...input, wav: await toWav16kBase64(recording) } : input
  const raw = await sync.call<Record<string, unknown>>('converse', payload)
  if (raw?.heardNothing) return null
  return cleanReply(raw)
}

const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v))
const line = (v: unknown): Line => {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  return { my: str(o.my), rom: str(o.rom), en: str(o.en) }
}
/** The AI's JSON can be slightly off-shape; make every field safe to render. */
export function cleanReply(raw: unknown): AIReply {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const reply = line(r.reply)
  if (!reply.my) throw new Error('The AI sent an empty reply. Please try again.')
  return {
    reply,
    learner: line(r.learner),
    heardText: typeof r.heardText === 'string' ? r.heardText : null,
    feedback: str(r.feedback),
    better: line(r.better),
    suggestions: Array.isArray(r.suggestions) ? r.suggestions.map(line).filter((l) => l.my) : [],
    end: r.end === true,
    audio: typeof r.audio === 'string' ? r.audio : null,
  }
}

export async function speakText(text: string, voice = 0): Promise<Blob> {
  if (!sync) throw new Error('Sign in first.')
  const r = await sync.call<{ audio: string }>('speak', { text, voice })
  return base64ToBlob(r.audio, 'audio/mpeg')
}

export function base64ToBlob(b64: string, type: string): Blob {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type })
}

/** Compare a recognised Burmese transcript with the target, ignoring spaces and punctuation. 0–1. */
export function similarity(heard: string, target: string): number {
  const norm = (s: string) => s.normalize('NFC').replace(/[\s၊။​.,!?။၊]/g, '').replace(/_{2,}/g, '')
  const a = norm(heard)
  const b = norm(target)
  if (!a || !b) return 0
  const d: number[] = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]
    d[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = d[j]
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return 1 - d[b.length] / Math.max(a.length, b.length)
}

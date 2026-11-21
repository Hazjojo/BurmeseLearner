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
  heard: string
  feedback: string
  better: Line
  suggestions: Line[]
  end: boolean
  audio: string | null
}

export async function transcribe(recording: Blob): Promise<string> {
  if (!sync) throw new Error('Sign in to use speech checking.')
  const r = await sync.call<{ text: string }>('transcribe', { wav: await toWav16kBase64(recording) })
  return r.text
}

export function converse(input: {
  scenario: { title: string; setup: string; role: string; voice?: number }
  history: { who: 'ai' | 'me'; my: string; en?: string }[]
  known: string[]
  speaker: 'm' | 'f' | 'both'
}): Promise<AIReply> {
  if (!sync) throw new Error('Sign in to use conversation practice.')
  return sync.call<AIReply>('converse', input)
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

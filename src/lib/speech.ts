import manifest from '../../content/audio.json'
import { playBlob } from './audio'
import { getRecording } from './store'

/** Text → generated TTS clip files (one per voice), produced by scripts/gen-audio.mjs. */
const CLIPS = manifest as Record<string, string[]>
const base = import.meta.env.BASE_URL

/** Burmese text as spoken (blank slots like ___ are left out). */
export const speakable = (my: string) => my.replace(/_{2,}/g, ' ').replace(/\s+/g, ' ').trim()

export function clipsFor(my: string): string[] {
  return (CLIPS[speakable(my)] ?? []).map((f) => `${base}audio/${f}`)
}

let voiceCache: SpeechSynthesisVoice | null | undefined
function burmeseVoice(): SpeechSynthesisVoice | null {
  if (voiceCache !== undefined) return voiceCache
  if (typeof speechSynthesis === 'undefined') return (voiceCache = null)
  voiceCache = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('my')) ?? null
  return voiceCache
}

/** Can we produce audio for this text at all? */
export function hasAudio(my: string, itemId?: string, recorded?: Set<string>): boolean {
  return clipsFor(my).length > 0 || (!!itemId && !!recorded?.has(itemId)) || !!burmeseVoice()
}

const blobCache = new Map<string, Promise<Blob>>()
const fetchClip = (url: string) => {
  if (!blobCache.has(url)) blobCache.set(url, fetch(url).then((r) => (r.ok ? r.blob() : Promise.reject(new Error(r.statusText)))))
  return blobCache.get(url)!
}

/**
 * Speak Burmese text. Priority: my own recording for the item (quick-added phrases),
 * then a generated clip (voice = index, or random for variety), then the device's Burmese voice if it has one.
 */
export async function say(my: string, opts: { itemId?: string; voice?: number; rate?: number } = {}): Promise<boolean> {
  const rate = opts.rate ?? 1
  if (opts.itemId) {
    const rec = await getRecording(opts.itemId)
    if (rec) {
      await playBlob(rec, rate)
      return true
    }
  }
  const clips = clipsFor(my)
  if (clips.length) {
    const url = clips[opts.voice !== undefined ? opts.voice % clips.length : Math.floor(Math.random() * clips.length)]
    try {
      await playBlob(await fetchClip(url), rate)
      return true
    } catch {
      /* fall through */
    }
  }
  const v = burmeseVoice()
  if (v) {
    const u = new SpeechSynthesisUtterance(speakable(my))
    u.voice = v
    u.lang = v.lang
    u.rate = rate
    speechSynthesis.cancel()
    speechSynthesis.speak(u)
    return true
  }
  return false
}

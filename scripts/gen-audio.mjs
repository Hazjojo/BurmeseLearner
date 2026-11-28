// Generates Burmese audio for every phrase, drill and sound set with a TTS service.
// Clips go to public/audio/, and content/audio.json maps text → [voice 1 clip, voice 2 clip].
// Incremental: only text without a clip is sent to the service.
//
// ElevenLabs (default): ELEVENLABS_API_KEY=... [ELEVEN_VOICES=id1,id2] [ELEVEN_MODEL=eleven_v3] node scripts/gen-audio.mjs
// Azure:                TTS_PROVIDER=azure AZURE_SPEECH_REGION=uksouth AZURE_SPEECH_KEY=... node scripts/gen-audio.mjs
// (In the cloud dev session keys are injected by the network proxy; any placeholder works.)
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const provider = process.env.TTS_PROVIDER ?? 'elevenlabs'
const region = process.env.AZURE_SPEECH_REGION
const key = process.env.AZURE_SPEECH_KEY // unset: the dev-session proxy injects it
const elevenKey = process.env.ELEVENLABS_API_KEY ?? 'injected-by-proxy'
const elevenModel = process.env.ELEVEN_MODEL ?? 'eleven_v3'
if (provider === 'azure' && !region) {
  console.error('Set AZURE_SPEECH_REGION (e.g. uksouth)')
  process.exit(1)
}
const eleven = (path, init = {}) =>
  fetch(`https://api.elevenlabs.io${path}`, { ...init, headers: { 'xi-api-key': elevenKey, ...(init.headers ?? {}) } })

async function pickVoices() {
  if (provider === 'azure') return ['my-MM-NilarNeural', 'my-MM-ThihaNeural']
  if (process.env.ELEVEN_VOICES) return process.env.ELEVEN_VOICES.split(',')
  // Default: one female and one male premade voice (two voices help ear training).
  const res = await eleven('/v1/voices')
  if (!res.ok) throw new Error(`voices: ${res.status} ${await res.text()}`)
  const voices = (await res.json()).voices.filter((v) => v.category === 'premade')
  const by = (g) => voices.find((v) => v.labels?.gender === g)
  const chosen = [by('female'), by('male')].filter(Boolean)
  console.log('Voices:', chosen.map((v) => `${v.name} (${v.voice_id})`).join(', '))
  return chosen.map((v) => v.voice_id)
}
const VOICES = await pickVoices()
const root = new URL('..', import.meta.url)
const load = (f) => JSON.parse(readFileSync(new URL(`content/${f}`, root), 'utf8'))
const outDir = new URL('public/audio/', root)
mkdirSync(outDir, { recursive: true })
const manifestPath = new URL('content/audio.json', root)
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}

const speakable = (my) => my.replace(/_{2,}/g, ' ').replace(/\s+/g, ' ').trim()

// Collect every Burmese string the app can play.
const texts = new Set()
for (const f of ['speaking.json', 'script.json']) for (const e of load(f)) texts.add(speakable(e.my))
for (const set of load('tones.json')) for (const o of set.options) texts.add(speakable(o.my))
for (const r of load('rare-letters.json')) texts.add(speakable(r.my))
for (const d of load('dialogues.json')) for (const l of d.lines) texts.add(speakable(l.my))
const speaking = load('speaking.json')
const verbs = load('verbforms.json')
for (const pat of load('patterns.json')) for (const vid of Object.keys(verbs)) texts.add(speakable(pat.my.replace('{v}', speaking.find((e) => e.id === vid).my)))

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
async function tts(text, voice) {
  if (provider === 'elevenlabs') {
    const res = await eleven(`/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: elevenModel, language_code: 'my' }),
    })
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
    return Buffer.from(await res.arrayBuffer())
  }
  // Slightly slower than default: clearer for a learner.
  const ssml = `<speak version="1.0" xml:lang="my-MM"><voice name="${voice}"><prosody rate="-10%">${esc(text)}</prosody></voice></speak>`
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      ...(key ? { 'Ocp-Apim-Subscription-Key': key } : {}),
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'burmeselearner-audio',
    },
    body: ssml,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`)
  return Buffer.from(await res.arrayBuffer())
}

let made = 0
let chars = 0
for (const text of texts) {
  if (!text) continue
  const files = manifest[text] ?? []
  for (let v = 0; v < VOICES.length; v++) {
    const name = `${createHash('sha1').update(`${provider}|${VOICES[v]}|${elevenModel}|${text}`).digest('hex').slice(0, 12)}.mp3`
    if (files[v] === name && existsSync(new URL(name, outDir))) continue
    writeFileSync(new URL(name, outDir), await tts(text, VOICES[v]))
    files[v] = name
    made++
    chars += text.length
  }
  manifest[text] = files
}
writeFileSync(manifestPath, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 1) + '\n')
console.log(`Audio: ${made} new clips (${chars} characters), ${Object.keys(manifest).length} texts in manifest.`)

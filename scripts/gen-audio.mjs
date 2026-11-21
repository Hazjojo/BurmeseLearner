// Generates Burmese audio for every phrase, drill and sound set with Azure neural TTS.
// Clips go to public/audio/, and content/audio.json maps text → [female clip, male clip].
// Incremental: only text without a clip is sent to Azure.
//
// Usage: AZURE_SPEECH_REGION=uksouth AZURE_SPEECH_KEY=... node scripts/gen-audio.mjs
// (In the cloud dev session the key is injected by the network proxy; any placeholder works.)
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const region = process.env.AZURE_SPEECH_REGION
const key = process.env.AZURE_SPEECH_KEY ?? 'injected-by-proxy'
if (!region) {
  console.error('Set AZURE_SPEECH_REGION (e.g. uksouth)')
  process.exit(1)
}
const VOICES = ['my-MM-NilarNeural', 'my-MM-ThihaNeural']
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
const speaking = load('speaking.json')
const verbs = load('verbforms.json')
for (const pat of load('patterns.json')) for (const vid of Object.keys(verbs)) texts.add(speakable(pat.my.replace('{v}', speaking.find((e) => e.id === vid).my)))

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
async function tts(text, voice) {
  // Slightly slower than default: clearer for a learner.
  const ssml = `<speak version="1.0" xml:lang="my-MM"><voice name="${voice}"><prosody rate="-10%">${esc(text)}</prosody></voice></speak>`
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
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
    const name = `${createHash('sha1').update(`${VOICES[v]}|${text}`).digest('hex').slice(0, 12)}.mp3`
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

// Server side of the speaking features. Keeps the Azure key out of the browser and calls Gemini on the
// project's own Google Cloud (no extra API key). Only the app's owner can use it (first signed-in caller).
import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { defineSecret } from 'firebase-functions/params'
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https'
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai'
import { buildPrompt, ROM_SCHEME, type ConverseInput } from './prompt.js'

initializeApp()
const db = getFirestore()
const AZURE_KEY = defineSecret('AZURE_SPEECH_KEY')
const AZURE_REGION = process.env.AZURE_SPEECH_REGION ?? 'uksouth'
const REGION = 'europe-west2'
const DAILY_LIMIT = 400
const MODELS = (process.env.GEMINI_MODELS ?? 'gemini-3.8-flash,gemini-2.5-flash').split(',')

/** Signed-in owner only (the first account to call claims the app), with a daily cap against runaway costs. */
async function guard(req: CallableRequest): Promise<string> {
  const uid = req.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.')
  const ownerRef = db.doc('config/owner')
  const owner = await db.runTransaction(async (t) => {
    const snap = await t.get(ownerRef)
    if (!snap.exists) t.set(ownerRef, { uid, claimedAt: FieldValue.serverTimestamp() })
    return snap.exists ? (snap.data()!.uid as string) : uid
  })
  if (owner !== uid) throw new HttpsError('permission-denied', 'This app is private.')
  const day = new Date().toISOString().slice(0, 10)
  const usage = db.doc(`usage/${uid}_${day}`)
  const n = await db.runTransaction(async (t) => {
    const c = ((await t.get(usage)).data()?.calls as number | undefined) ?? 0
    t.set(usage, { calls: c + 1 }, { merge: true })
    return c + 1
  })
  if (n > DAILY_LIMIT) throw new HttpsError('resource-exhausted', 'Daily speaking limit reached. Try again tomorrow.')
  return uid
}

/** Burmese speech → text with Azure (16 kHz mono WAV, base64). */
async function recognise(wavBase64: string): Promise<{ text: string; confidence: number | null }> {
  const res = await fetch(
    `https://${AZURE_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=my-MM&format=detailed`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY.value(),
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        Accept: 'application/json',
      },
      body: Buffer.from(wavBase64, 'base64'),
    },
  )
  if (!res.ok) throw new HttpsError('internal', `Speech recognition failed (${res.status})`)
  const j = (await res.json()) as { RecognitionStatus: string; DisplayText?: string; NBest?: { Confidence: number; Display: string }[] }
  if (j.RecognitionStatus !== 'Success') return { text: '', confidence: null }
  return { text: j.NBest?.[0]?.Display ?? j.DisplayText ?? '', confidence: j.NBest?.[0]?.Confidence ?? null }
}

/** Burmese text → speech (mp3, base64). */
async function synthesise(text: string, voice: string): Promise<string> {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const res = await fetch(`https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_KEY.value(),
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'burmeselearner',
    },
    body: `<speak version="1.0" xml:lang="my-MM"><voice name="${voice}"><prosody rate="-10%">${esc}</prosody></voice></speak>`,
  })
  if (!res.ok) throw new HttpsError('internal', `Speech synthesis failed (${res.status})`)
  return Buffer.from(await res.arrayBuffer()).toString('base64')
}

const ROM_SCHEMA_OBJ = {
  type: Type.OBJECT,
  properties: { rom: { type: Type.STRING }, en: { type: Type.STRING } },
  required: ['rom', 'en'],
}
/** Romanize recognised Burmese (and give its meaning) so the learner can read what was heard. */
async function romanize(text: string): Promise<{ rom: string; en: string }> {
  if (!text) return { rom: '', en: '' }
  try {
    return await generate(
      `Romanize colloquial Burmese for a learner and give a short English meaning.\n${ROM_SCHEME}`,
      `Burmese: ${text}\nReturn JSON {rom, en}.`,
      ROM_SCHEMA_OBJ,
    )
  } catch {
    return { rom: '', en: '' }
  }
}

export const transcribe = onCall({ region: REGION, secrets: [AZURE_KEY], timeoutSeconds: 30, memory: '256MiB' }, async (req) => {
  const data = (req.data ?? {}) as { wav?: string; warm?: boolean; romanize?: boolean }
  if (data.warm) return { ok: true } // wakes the server up before it's needed
  await guard(req)
  if (typeof data.wav !== 'string' || data.wav.length > 3_000_000) throw new HttpsError('invalid-argument', 'Recording missing or too long.')
  const heard = await recognise(data.wav)
  return data.romanize ? { ...heard, ...(await romanize(heard.text)) } : heard
})

export const speak = onCall({ region: REGION, secrets: [AZURE_KEY], timeoutSeconds: 30, memory: '256MiB' }, async (req) => {
  await guard(req)
  const { text, voice } = (req.data ?? {}) as { text?: string; voice?: number }
  if (typeof text !== 'string' || !text.trim() || text.length > 300) throw new HttpsError('invalid-argument', 'Text missing or too long.')
  return { audio: await synthesise(text, voice === 1 ? 'my-MM-ThihaNeural' : 'my-MM-NilarNeural') }
})

const REPLY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    reply: {
      type: Type.OBJECT,
      properties: { my: { type: Type.STRING }, rom: { type: Type.STRING }, en: { type: Type.STRING } },
      required: ['my', 'rom', 'en'],
    },
    learner: {
      type: Type.OBJECT,
      description: "The learner's last message as you understood it: Burmese (cleaned up, as they most likely meant it), romanization, English meaning. Empty strings if there is no learner message yet.",
      properties: { my: { type: Type.STRING }, rom: { type: Type.STRING }, en: { type: Type.STRING } },
      required: ['my', 'rom', 'en'],
    },
    feedback: { type: Type.STRING, description: 'Short English tip on the learner’s last message, or empty.' },
    better: {
      type: Type.OBJECT,
      description: 'A more natural way to say what the learner meant, if their Burmese was off; otherwise empty strings.',
      properties: { my: { type: Type.STRING }, rom: { type: Type.STRING }, en: { type: Type.STRING } },
      required: ['my', 'rom', 'en'],
    },
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { my: { type: Type.STRING }, rom: { type: Type.STRING }, en: { type: Type.STRING } },
        required: ['my', 'rom', 'en'],
      },
    },
    end: { type: Type.BOOLEAN },
  },
  required: ['reply', 'learner', 'feedback', 'better', 'suggestions', 'end'],
}

let ai: GoogleGenAI | null = null
async function generate(system: string, prompt: string, schema: object = REPLY_SCHEMA) {
  ai ??= new GoogleGenAI({ enterprise: true, project: process.env.GCLOUD_PROJECT, location: 'global' })
  let lastErr: unknown
  for (const model of MODELS) {
    try {
      const config = { systemInstruction: system, responseMimeType: 'application/json', responseSchema: schema, temperature: 0.6 }
      // Minimal "thinking" keeps replies fast enough to feel like a conversation.
      const res = await ai.models
        .generateContent({ model, contents: prompt, config: { ...config, thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } } })
        .catch((e) => {
          if (/thinking/i.test(String(e))) return ai!.models.generateContent({ model, contents: prompt, config })
          throw e
        })
      return JSON.parse(res.text ?? '{}')
    } catch (e) {
      lastErr = e
      if (!/not.?found|404|unsupported|not supported/i.test(String(e))) break
    }
  }
  throw new HttpsError('internal', `AI reply failed: ${lastErr instanceof Error ? lastErr.message : lastErr}`)
}

/**
 * One conversation turn in a single round trip: (learner audio → text) → AI reply → reply audio.
 * Send `wav` with the learner's recording, or put a typed message as the last history entry.
 */
export const converse = onCall({ region: REGION, secrets: [AZURE_KEY], timeoutSeconds: 60, memory: '512MiB' }, async (req) => {
  if ((req.data as { warm?: boolean })?.warm) return { ok: true }
  await guard(req)
  const input = req.data as ConverseInput & { wav?: string }
  if (!input?.scenario?.setup || !Array.isArray(input.history) || input.history.length > 60) throw new HttpsError('invalid-argument', 'Bad conversation.')
  let heardText: string | null = null
  if (typeof input.wav === 'string') {
    if (input.wav.length > 3_000_000) throw new HttpsError('invalid-argument', 'Recording too long.')
    const heard = await recognise(input.wav)
    if (!heard.text) return { heardNothing: true }
    heardText = heard.text
    input.history = [...input.history, { who: 'me', my: heard.text }]
  }
  const { system, prompt } = buildPrompt(input)
  const out = await generate(system, prompt)
  const audio = out?.reply?.my ? await synthesise(out.reply.my, input.scenario.voice === 1 ? 'my-MM-ThihaNeural' : 'my-MM-NilarNeural') : null
  return { ...out, audio, heardText }
})

// ---------------- Daily reminders ----------------
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getMessaging } from 'firebase-admin/messaging'

/** Local date "YYYY-MM-DD" and minutes since midnight in a time zone. */
function localNow(tz: string, now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) }
}

/** Every 15 minutes: nudge anyone whose reminder time has come and who hasn't practised yet today. */
export const sendReminders = onSchedule({ schedule: 'every 15 minutes', region: REGION, timeoutSeconds: 120 }, async () => {
  const snap = await db.collection('reminders').where('enabled', '==', true).get()
  for (const d of snap.docs) {
    const r = d.data() as { time?: string; tz?: string; token?: string; lastSent?: string }
    if (!r.time || !r.token) continue
    const tz = r.tz || 'Europe/London'
    const { date, minutes } = localNow(tz)
    const [h, m] = r.time.split(':').map(Number)
    const due = h * 60 + m
    if (minutes < due || minutes >= due + 30 || r.lastSent === date) continue
    const user = await db.doc(`users/${d.id}`).get()
    const today = (user.data()?.activity ?? {})[date] as { answers?: number } | undefined
    const practised = (today?.answers ?? 0) > 0
    await d.ref.set({ lastSent: date }, { merge: true })
    if (practised) continue
    try {
      await getMessaging().send({
        token: r.token,
        webpush: {
          notification: { title: 'Time for Burmese 🔥', body: 'A few minutes today keeps your streak going.', icon: '/icon-192.png' },
          fcmOptions: { link: '/' },
        },
      })
    } catch (e) {
      // Expired or revoked token: stop trying until the reminder is set again.
      if (/registration-token-not-registered|invalid-registration-token|invalid-argument/i.test(String(e))) await d.ref.set({ enabled: false }, { merge: true })
    }
  }
})

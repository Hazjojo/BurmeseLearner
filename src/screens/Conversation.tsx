import { useEffect, useRef, useState } from 'react'
import { aiAvailable, base64ToBlob, converse, speakText, warmUp, type AIReply, type Line } from '../lib/ai'
import { openMic, playBlob, recordFrom, type Recorder } from '../lib/audio'
import type { AppState } from '../lib/store'
import type { Sync } from '../lib/sync'
import { knownItems } from '../learn'
import { Mm, Rom } from '../components'

interface Scenario {
  id: string
  title: string
  blurb: string
  role: string
  setup: string
  voice: number
}

const SCENARIOS: Scenario[] = [
  {
    id: 'meet',
    title: 'Meeting someone new',
    blurb: 'Hello, names, where you’re from',
    role: 'Su, a friendly young woman',
    setup: 'You meet the learner for the first time at a friend’s party. Greet them and ask simple questions: their name, where they’re from, whether they speak Burmese.',
    voice: 0,
  },
  {
    id: 'dinner',
    title: 'Dinner with the family',
    blurb: 'Food, drink, “it’s delicious”',
    role: 'U Aung, a kind older man hosting dinner',
    setup: 'The learner is a guest at your family’s home for dinner. Welcome them, offer food and water, ask if they have eaten and whether they like the food.',
    voice: 1,
  },
  {
    id: 'going',
    title: 'Where are you going?',
    blurb: 'Plans, wanting, going',
    role: 'Thura, a neighbour',
    setup: 'You bump into the learner on the street. Ask where they are going, what they will do, and invite them to come and eat or drink something.',
    voice: 1,
  },
  {
    id: 'free',
    title: 'Easy chat',
    blurb: 'A relaxed chat about your day',
    role: 'Su, a patient friend',
    setup: 'A relaxed, very simple chat about the learner’s day, food, family and learning Burmese.',
    voice: 0,
  },
]

interface Turn {
  who: 'ai' | 'me'
  my: string
  rom?: string
  en?: string
  audio?: Blob
  reply?: AIReply
  /** my turn waiting for the server */
  pending?: boolean
}

export function Conversation({ state, sync, onExit }: { state: AppState; sync: Sync | null; onExit: () => void }) {
  const [scenario, setScenario] = useState<Scenario | null>(null)
  if (!sync || !aiAvailable()) {
    return (
      <div className="screen">
        <button className="btn small ghost" onClick={onExit}>
          ← Practice
        </button>
        <h2>Talk with a partner</h2>
        <p className="muted">Speaking practice runs on the app's server, so it needs you signed in on the Firebase version of the app (Settings → Cloud sync).</p>
      </div>
    )
  }
  if (!scenario) {
    return (
      <div className="screen">
        <button className="btn small ghost" onClick={onExit}>
          ← Practice
        </button>
        <h2>Talk with a partner</h2>
        <p className="muted small">
          Pick a situation. Your partner speaks first. Reply out loud using the 🎙 button (or type). They'll keep it simple and use words you know.
        </p>
        {SCENARIOS.map((s) => (
          <button key={s.id} className="hero review" onClick={() => setScenario(s)}>
            <span className="hero-title">{s.title}</span>
            <span className="small">{s.blurb}</span>
          </button>
        ))}
        <p className="muted small">Your partner is an AI. Its Burmese is good but not perfect, so treat it as practice, not as the final word.</p>
      </div>
    )
  }
  return <Chat key={scenario.id} scenario={scenario} state={state} onBack={() => setScenario(null)} />
}

type MicMode = 'idle' | 'holding' | 'tapped'

function Chat({ scenario, state, onBack }: { scenario: Scenario; state: AppState; onBack: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [thinking, setThinking] = useState(false)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')
  const [mode, setMode] = useState<MicMode>('idle')
  const [secs, setSecs] = useState(0)
  const [typed, setTyped] = useState('')
  const [showEn, setShowEn] = useState<Set<number>>(new Set())
  const [showHelp, setShowHelp] = useState(false)
  const stream = useRef<MediaStream | null>(null)
  const rec = useRef<Recorder | null>(null)
  const t0 = useRef(0)
  const bottom = useRef<HTMLDivElement>(null)
  const turnsRef = useRef<Turn[]>([])
  turnsRef.current = turns
  const known = useRef(knownItems(state).map((i) => `${i.my} — ${i.en}`))

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, thinking])

  // Open the mic once for the whole conversation, so pressing the button records instantly.
  useEffect(() => {
    warmUp()
    openMic()
      .then((s) => (stream.current = s))
      .catch(() => setErr('Microphone not available. Allow microphone access in your browser settings, or type instead.'))
    ask(null)
    return () => {
      rec.current?.cancel()
      stream.current?.getTracks().forEach((t) => t.stop())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode === 'idle') return
    setSecs(0)
    const id = setInterval(() => setSecs(Math.floor((Date.now() - t0.current) / 1000)), 250)
    return () => clearInterval(id)
  }, [mode])

  const historyOf = (ts: Turn[]) => ts.filter((t) => !t.pending && t.my).map((t) => ({ who: t.who, my: t.my, en: t.who === 'ai' ? t.en : undefined }))

  /** One turn: optional recording (or typed text) in, AI reply out. */
  async function ask(recording: Blob | null, typedText?: string) {
    setErr('')
    setNote('')
    setShowHelp(false)
    const before = turnsRef.current
    const base = typedText ? [...before, { who: 'me' as const, my: typedText }] : before
    if (recording) setTurns([...base, { who: 'me', my: '', pending: true }])
    else setTurns(base)
    setThinking(true)
    try {
      const r = await converse({ scenario, history: historyOf(base), known: known.current, speaker: state.settings.speaker }, recording ?? undefined)
      if (!r) {
        setTurns(base)
        setNote("I didn't catch that. Hold the button and speak a little slower, close to the phone.")
        return
      }
      const audio = r.audio ? base64ToBlob(r.audio, 'audio/mpeg') : undefined
      const mine: Turn[] = recording
        ? [{ who: 'me', my: r.learner.my || r.heardText || '', rom: r.learner.rom, en: r.learner.en }]
        : typedText
          ? [{ who: 'me', my: typedText, rom: r.learner.rom, en: r.learner.en }]
          : []
      setTurns([...before, ...mine, { who: 'ai', my: r.reply.my, rom: r.reply.rom, en: r.reply.en, audio, reply: r }])
      if (audio) playBlob(audio)
    } catch (e) {
      setTurns(base.filter((t) => !t.pending))
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setThinking(false)
    }
  }

  // Press and hold to talk; or tap once to start and tap again to send.
  const startRec = () => {
    if (!stream.current || thinking) return
    rec.current = recordFrom(stream.current)
    t0.current = Date.now()
    navigator.vibrate?.(15)
  }
  const finishRec = async () => {
    const r = rec.current
    rec.current = null
    setMode('idle')
    if (!r) return
    const held = Date.now() - t0.current
    const blob = await r.stop()
    navigator.vibrate?.(10)
    if (held < 500) {
      setNote('That was very short. Hold the button while you speak.')
      return
    }
    ask(blob)
  }
  const onDown = (e: React.PointerEvent) => {
    e.preventDefault()
    if (mode === 'tapped') return void finishRec()
    if (mode !== 'idle') return
    startRec()
    if (rec.current) setMode('holding')
  }
  const onUp = () => {
    if (mode !== 'holding') return
    if (Date.now() - t0.current < 350) setMode('tapped') // quick tap: keep recording until the next tap
    else finishRec()
  }

  const last = turns[turns.length - 1]
  const lastReply = last?.who === 'ai' ? last.reply : undefined
  const ended = !!lastReply?.end
  const recording = mode !== 'idle'

  return (
    <div className="screen chat-screen">
      <div className="runner-top">
        <button className="btn small ghost" onClick={onBack}>
          ←
        </button>
        <span className="grow small">{scenario.title}</span>
      </div>
      <div className="chat">
        {turns.map((t, i) => {
          const fb = turns[i + 1]?.reply // the AI's comment on this turn arrives with its next reply
          if (t.who === 'me')
            return (
              <div key={i} className={`bubble right ${t.pending ? 'pending' : ''}`}>
                {t.pending ? (
                  <span className="dots">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <>
                    <Mm text={t.my} size="sm" />
                    {t.rom && <Rom rom={t.rom} />}
                    {t.en && <span className="small muted">“{t.en}”</span>}
                    {fb?.feedback && <span className="note small">💡 {fb.feedback}</span>}
                    {fb?.better?.my && <LineView line={fb.better} label="Try:" />}
                  </>
                )}
              </div>
            )
          return (
            <div key={i} className="bubble left">
              <Mm text={t.my} size="sm" />
              {state.settings.showRom && t.rom && <Rom rom={t.rom} />}
              <span className="row gap-sm">
                {t.audio && (
                  <>
                    <button className="btn icon" onClick={() => playBlob(t.audio!)} aria-label="Play">
                      🔊
                    </button>
                    <button className="btn icon" onClick={() => playBlob(t.audio!, 0.7)} aria-label="Play slowly">
                      🐢
                    </button>
                  </>
                )}
                <button className="btn small ghost" onClick={() => setShowEn(new Set([...showEn, i]))}>
                  {showEn.has(i) ? t.en : 'English?'}
                </button>
              </span>
            </div>
          )
        })}
        {thinking && !turns.some((t) => t.pending) && (
          <div className="bubble left">
            <span className="dots">
              <i />
              <i />
              <i />
            </span>
          </div>
        )}
        <div ref={bottom} />
      </div>

      {err && <p className="error small">{err}</p>}
      {note && <p className="small note">{note}</p>}

      {ended ? (
        <div className="actions">
          <p className="center-content">Conversation finished 🎉</p>
          <button className="btn primary wide" onClick={onBack}>
            Another situation
          </button>
        </div>
      ) : (
        <div className="actions talk-bar">
          {showHelp && lastReply && lastReply.suggestions.length > 0 && (
            <div className="suggestions">
              {lastReply.suggestions.map((s, k) => (
                <LineView key={k} line={s} />
              ))}
            </div>
          )}
          <div className="talk-row">
            <button className="btn small ghost" disabled={!lastReply?.suggestions.length} onClick={() => setShowHelp(!showHelp)}>
              💡 Ideas
            </button>
            <button
              className={`talk-btn ${recording ? 'recording' : ''}`}
              disabled={thinking || !stream.current}
              onPointerDown={onDown}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onContextMenu={(e) => e.preventDefault()}
              aria-label={recording ? 'Recording: release or tap to send' : 'Hold to talk'}
            >
              {recording ? '■' : '🎙'}
            </button>
            <span className="talk-hint small muted">
              {thinking ? 'Thinking…' : mode === 'holding' ? `Recording ${secs}s · release to send` : mode === 'tapped' ? `Recording ${secs}s · tap to send` : 'Hold to talk'}
            </span>
          </div>
          <div className="row gap-sm">
            <input
              type="text"
              placeholder="or type (Burmese or English)"
              value={typed}
              disabled={thinking || recording}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && typed.trim() && (ask(null, typed.trim()), setTyped(''))}
            />
            {typed.trim() && (
              <button className="btn primary" disabled={thinking} onClick={() => (ask(null, typed.trim()), setTyped(''))}>
                Send
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** A Burmese line with romanization, English, and play-on-demand (generated on the server). */
function LineView({ line, label }: { line: Line; label?: string }) {
  const [audio, setAudio] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)
  const play = async () => {
    if (audio) return playBlob(audio)
    setLoading(true)
    try {
      const b = await speakText(line.my)
      setAudio(b)
      playBlob(b)
    } finally {
      setLoading(false)
    }
  }
  return (
    <button className="line-view" onClick={play}>
      {label && <span className="small muted">{label} </span>}
      <Mm text={line.my} size="sm" /> {line.rom && <Rom rom={line.rom} />} <span className="small muted">{line.en}</span> <span className="small">{loading ? '…' : '🔊'}</span>
    </button>
  )
}

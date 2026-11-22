import { useEffect, useRef, useState } from 'react'
import { aiAvailable, base64ToBlob, converse, speakText, transcribe, type AIReply, type Line } from '../lib/ai'
import { playBlob, startRecording, type Recorder } from '../lib/audio'
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

function Chat({ scenario, state, onBack }: { scenario: Scenario; state: AppState; onBack: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [busy, setBusy] = useState<'thinking' | 'listening' | null>(null)
  const [err, setErr] = useState('')
  const [rec, setRec] = useState<Recorder | null>(null)
  const [heard, setHeard] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [showEn, setShowEn] = useState<Set<number>>(new Set())
  const bottom = useRef<HTMLDivElement>(null)
  const known = useRef(knownItems(state).map((i) => `${i.my} — ${i.en}`))

  useEffect(() => {
    // Braces matter: newer browsers return a Promise from scrollIntoView, and React would treat it as a cleanup function.
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, heard, busy])
  useEffect(() => {
    send(null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function send(mine: string | null) {
    setErr('')
    const history: Turn[] = mine ? [...turns, { who: 'me', my: mine }] : turns
    setTurns(history)
    setHeard(null)
    setTyped('')
    setBusy('thinking')
    try {
      const r = await converse({
        scenario,
        history: history.map((t) => ({ who: t.who, my: t.my, en: t.who === 'ai' ? t.en : undefined })),
        known: known.current,
        speaker: state.settings.speaker,
      })
      const audio = r.audio ? base64ToBlob(r.audio, 'audio/mpeg') : undefined
      setTurns([...history, { who: 'ai', my: r.reply.my, rom: r.reply.rom, en: r.reply.en, audio, reply: r }])
      if (audio) playBlob(audio)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  async function toggleMic() {
    setErr('')
    if (rec) {
      const blob = await rec.stop()
      setRec(null)
      setBusy('listening')
      try {
        const text = await transcribe(blob)
        setHeard(text || '')
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e))
      } finally {
        setBusy(null)
      }
    } else {
      try {
        setHeard(null)
        setRec(await startRecording())
      } catch {
        setErr('Microphone not available. Check the browser permission.')
      }
    }
  }

  const last = turns[turns.length - 1]
  const lastReply = last?.who === 'ai' ? last.reply : undefined
  const ended = !!lastReply?.end

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
          const fb = turns[i + 1]?.reply // the AI's comment on this learner turn comes with its next reply
          return t.who === 'ai' ? (
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
          ) : (
            <div key={i} className="bubble right">
              <Mm text={t.my} size="sm" />
              {fb?.heard && <span className="small muted">Understood as: “{fb.heard}”</span>}
              {fb?.feedback && <span className="note small">💡 {fb.feedback}</span>}
              {fb?.better?.my && <LineView line={fb.better} label="Try:" />}
            </div>
          )
        })}
        {busy && <div className="bubble left muted">{busy === 'thinking' ? '…' : 'Listening to you…'}</div>}
        <div ref={bottom} />
      </div>

      {err && <p className="error small">{err}</p>}

      {ended ? (
        <div className="actions">
          <p className="center-content">Conversation finished 🎉</p>
          <button className="btn primary wide" onClick={onBack}>
            Another situation
          </button>
        </div>
      ) : (
        <div className="actions chat-input">
          {lastReply && lastReply.suggestions?.length > 0 && heard === null && !rec && (
            <div className="suggestions">
              <span className="small muted">You could say:</span>
              {lastReply.suggestions.map((s, k) => (
                <LineView key={k} line={s} />
              ))}
            </div>
          )}
          {heard !== null ? (
            <div className="heard">
              {heard ? (
                <>
                  <span className="small muted">I heard:</span>
                  <Mm text={heard} size="sm" />
                  <div className="row gap-sm">
                    <button className="btn" onClick={() => setHeard(null)}>
                      Try again
                    </button>
                    <button className="btn primary wide" onClick={() => send(heard)}>
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="small">I didn't catch that. Try again a little slower, close to the mic.</span>
                  <button className="btn" onClick={() => setHeard(null)}>
                    OK
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="row gap-sm">
              <input
                type="text"
                placeholder="or type (Burmese or English)"
                value={typed}
                disabled={!!busy || !!rec}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && typed.trim() && send(typed.trim())}
              />
              {typed.trim() ? (
                <button className="btn primary" disabled={!!busy} onClick={() => send(typed.trim())}>
                  Send
                </button>
              ) : (
                <button className={`btn mic ${rec ? 'recording' : ''}`} disabled={!!busy} onClick={toggleMic} aria-label={rec ? 'Stop' : 'Speak'}>
                  {rec ? '■' : '🎙'}
                </button>
              )}
            </div>
          )}
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

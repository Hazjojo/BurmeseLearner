import { useRef, useState } from 'react'
import dialoguesJson from '../../content/dialogues.json'
import { lessonById } from '../content'
import { say } from '../lib/speech'
import { tick } from '../lib/activity'
import type { AppState } from '../lib/store'
import { Mm, Rom } from '../components'
import { Tones } from './Tones'
import { Conversation } from './Conversation'
import { Writing } from './Writing'
import { Phrasebook } from './Other'
import { AlphabetChart } from './Learn'
import type { Sync } from '../lib/sync'

type Update = (fn: (s: AppState) => AppState) => void

export interface Dialogue {
  id: string
  title: string
  after: string
  speakers: Record<string, { name: string; voice: number }>
  lines: { s: string; my: string; rom: string; en: string }[]
  questions: { q: string; options: string[]; answer: number }[]
}
export const DIALOGUES = dialoguesJson as Dialogue[]

/** Practice hub: listening, ear training, speaking with AI. */
export function Practice({ state, update, sync, onAdd }: { state: AppState; update: Update; sync: Sync | null; onAdd: () => void }) {
  const [view, setView] = useState<'menu' | 'listen' | 'ear' | 'speak' | 'write' | 'chart' | 'phrases'>('menu')
  const [dialogue, setDialogue] = useState<Dialogue | null>(null)
  if (dialogue) return <DialoguePlayer d={dialogue} state={state} update={update} onExit={() => setDialogue(null)} />
  if (view === 'ear')
    return (
      <>
        <BackBar onBack={() => setView('menu')} />
        <Tones state={state} update={update} />
      </>
    )
  if (view === 'phrases')
    return (
      <>
        <BackBar onBack={() => setView('menu')} />
        <Phrasebook state={state} update={update} onAdd={onAdd} />
      </>
    )
  if (view === 'write') return <Writing state={state} update={update} onExit={() => setView('menu')} />
  if (view === 'chart') return <AlphabetChart state={state} onBack={() => setView('menu')} />
  if (view === 'speak') return <Conversation state={state} sync={sync} update={update} onExit={() => setView('menu')} />
  if (view === 'listen')
    return (
      <div className="screen">
        <BackBar onBack={() => setView('menu')} inline />
        <h2>Listening</h2>
        <p className="muted small">Short conversations using words from your lessons. Listen first without the text, then check.</p>
        <ul className="lesson-list flat">
          {DIALOGUES.map((d) => {
            const ready = !!state.lessons[d.after]
            const done = state.lessons[d.id]
            return (
              <li key={d.id}>
                <button className="lesson-row" onClick={() => setDialogue(d)}>
                  <span className={`dot ${done ? 'done' : ''}`}>{done ? '✓' : ''}</span>
                  <span className="grow">
                    {d.title}
                    <span className="small muted block">{ready ? `${d.lines.length} lines` : `Best after “${lessonById(d.after)?.title}”`}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )
  return (
    <div className="screen">
      <h2>Practice</h2>
      <button className="hero review" onClick={() => setView('phrases')}>
        <span className="hero-icon">📖</span>
        <span className="hero-body">
          <span className="hero-title">Phrasebook</span>
          <span className="small">Everything you've learned, by topic, plus your own phrases</span>
        </span>
      </button>
      <h3>Reading & writing</h3>
      <button className="hero review" onClick={() => setView('write')}>
        <span className="hero-icon">✍️</span>
        <span className="hero-body">
          <span className="hero-title">Writing practice</span>
          <span className="small">Write letters and words with your finger</span>
        </span>
      </button>
      <button className="hero review" onClick={() => setView('chart')}>
        <span className="hero-icon">🔤</span>
        <span className="hero-body">
          <span className="hero-title">Alphabet & patterns</span>
          <span className="small">The sound grid, every letter, and the memory tricks</span>
        </span>
      </button>
      <h3>Listening & speaking</h3>
      <button className="hero review" onClick={() => setView('listen')}>
        <span className="hero-icon">🎧</span>
        <span className="hero-body">
          <span className="hero-title">Dialogues</span>
          <span className="small">Real conversations at slow and normal speed</span>
        </span>
      </button>
      <button className="hero review" onClick={() => setView('ear')}>
        <span className="hero-icon">👂</span>
        <span className="hero-body">
          <span className="hero-title">Tones & sounds</span>
          <span className="small">Hear the difference, focusing on what you miss</span>
        </span>
      </button>
      <button className="hero lesson-hero" onClick={() => setView('speak')}>
        <span className="hero-icon">🗣</span>
        <span className="hero-body">
          <span className="hero-title">Talk with a partner</span>
          <span className="small">Speak Burmese in everyday situations; an AI partner replies out loud</span>
        </span>
      </button>
    </div>
  )
}

function BackBar({ onBack, inline }: { onBack: () => void; inline?: boolean }) {
  return (
    <div className={inline ? '' : 'screen pb0'}>
      <button className="btn small ghost" onClick={onBack}>
        ← Practice
      </button>
    </div>
  )
}

export function DialoguePlayer({ d, update, onExit }: { d: Dialogue; state: AppState; update: Update; onExit: () => void }) {
  const [showText, setShowText] = useState(false)
  const [showEn, setShowEn] = useState(false)
  const [slow, setSlow] = useState(true)
  const [playing, setPlaying] = useState<number | null>(null)
  const stop = useRef(false)
  const [step, setStep] = useState<'listen' | 'quiz' | 'done'>('listen')
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [right, setRight] = useState(0)

  const playLine = (i: number) => {
    const l = d.lines[i]
    setPlaying(i)
    return say(l.my, { voice: d.speakers[l.s].voice, rate: slow ? 0.75 : 1 }).finally(() => setPlaying(null))
  }
  const playAll = async () => {
    stop.current = false
    for (let i = 0; i < d.lines.length && !stop.current; i++) {
      await playLine(i)
      await new Promise((r) => setTimeout(r, 450))
    }
  }

  if (step === 'quiz') {
    const q = d.questions[qi]
    const next = () => {
      if (qi + 1 < d.questions.length) {
        setQi(qi + 1)
        setPicked(null)
      } else {
        update((s) => ({ ...s, lessons: { ...s.lessons, [d.id]: { at: new Date().toISOString(), score: (right + 0) / d.questions.length } } }))
        setStep('done')
      }
    }
    return (
      <div className="screen">
        <div className="runner-top">
          <button className="btn small ghost" onClick={onExit}>
            ✕
          </button>
          <span className="grow" />
          <span className="small muted">
            Question {qi + 1} / {d.questions.length}
          </span>
        </div>
        <div className="prompt">
          <div className="en big">{q.q}</div>
          <button className="btn small" onClick={playAll}>
            🔊 Replay the dialogue
          </button>
        </div>
        <div className="options">
          {q.options.map((o, i) => (
            <button
              key={i}
              className={`btn option ${picked === null ? '' : i === q.answer ? 'correct' : i === picked ? 'wrong' : 'dim'}`}
              disabled={picked !== null}
              onClick={() => {
                tick()
                setPicked(i)
                if (i === q.answer) setRight((r) => r + 1)
              }}
            >
              {o}
            </button>
          ))}
        </div>
        {picked !== null && (
          <div className="actions">
            <button className="btn primary wide" onClick={next}>
              Continue
            </button>
          </div>
        )}
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="screen center-content done-screen">
        <div className="big-emoji">🎧</div>
        <h2>Nice listening</h2>
        <p>
          {right} / {d.questions.length} questions right
        </p>
        <button className="btn primary wide big" onClick={onExit}>
          Done
        </button>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="runner-top">
        <button className="btn small ghost" onClick={() => ((stop.current = true), onExit())}>
          ✕
        </button>
        <span className="grow" />
        <span className="small muted">{d.title}</span>
      </div>
      <p className="muted small">Listen a couple of times before showing the text. How much can you follow?</p>
      <div className="row gap-sm wrap">
        <button className="btn primary" onClick={playAll}>
          ▶ Play all
        </button>
        <button className="btn" onClick={() => setSlow(!slow)}>
          {slow ? '🐢 Slow' : '🐇 Normal'}
        </button>
        <button className="btn" onClick={() => setShowText(!showText)}>
          {showText ? 'Hide text' : 'Show text'}
        </button>
        {showText && (
          <button className="btn" onClick={() => setShowEn(!showEn)}>
            {showEn ? 'Hide English' : 'English'}
          </button>
        )}
      </div>
      <div className="chat">
        {d.lines.map((l, i) => (
          <button key={i} className={`bubble ${l.s === 'A' ? 'left' : 'right'} ${playing === i ? 'playing' : ''}`} onClick={() => playLine(i)}>
            <span className="small muted">{d.speakers[l.s].name}</span>
            {showText ? (
              <>
                <Mm text={l.my} size="sm" />
                <Rom rom={l.rom} />
                {showEn && <span className="small">{l.en}</span>}
              </>
            ) : (
              <span className="muted">🔊 ···</span>
            )}
          </button>
        ))}
      </div>
      <div className="actions">
        <button className="btn primary wide big" onClick={() => ((stop.current = true), setStep('quiz'))}>
          Check my understanding
        </button>
      </div>
    </div>
  )
}

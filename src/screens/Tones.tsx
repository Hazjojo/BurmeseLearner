import { useMemo, useState } from 'react'
import { TONE_SETS, type ToneSet } from '../content'
import { ExerciseView, type Exercise } from '../exercises'
import { clipsFor } from '../lib/speech'
import { tick } from '../lib/activity'
import type { AppState, ToneTrial } from '../lib/store'
import { Mm } from '../components'

type Update = (fn: (s: AppState) => AppState) => void

/** Smoothed accuracy over the most recent trials of a set. */
export function setAccuracy(log: ToneTrial[], setId: string, window = 20) {
  const recent = log.filter((t) => t.set === setId).slice(-window)
  const correct = recent.filter((t) => t.asked === t.chose).length
  return { n: recent.length, correct, acc: (correct + 1) / (recent.length + 2) }
}

const playable = (s: ToneSet) => s.options.map((_, i) => i).filter((i) => clipsFor(s.options[i].my).length)

function pick(sets: ToneSet[], log: ToneTrial[], last?: string): Exercise | null {
  const usable = sets.filter((s) => playable(s).length >= 2)
  if (!usable.length) return null
  // Adaptive: contrasts I get wrong come up more often.
  const w = usable.map((s) => (s.id === last && usable.length > 1 ? 0.3 : 1) * (1 + 4 * (1 - setAccuracy(log, s.id).acc)))
  let r = Math.random() * w.reduce((a, b) => a + b, 0)
  let set = usable[0]
  for (let i = 0; i < usable.length; i++) if ((r -= w[i]) <= 0) { set = usable[i]; break }
  const opts = playable(set)
  return { kind: 'tone', set, asked: opts[Math.floor(Math.random() * opts.length)] }
}

/** Endless ear training on tones and tricky sounds. */
export function Tones({ state, update }: { state: AppState; update: Update }) {
  const contrasts = useMemo(() => [...new Set(TONE_SETS.map((s) => s.contrast))], [])
  const [focus, setFocus] = useState('all')
  const sets = focus === 'all' ? TONE_SETS : TONE_SETS.filter((s) => s.contrast === focus)
  const [n, setN] = useState(0)
  const [session, setSession] = useState({ n: 0, ok: 0 })
  const ex = useMemo(() => pick(sets, state.toneLog), [n, focus]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ex) {
    return (
      <div className="screen">
        <h2>Ear training</h2>
        <p className="muted">The audio for the tone and sound sets hasn't been generated yet. This fills in once the voice audio is set up.</p>
      </div>
    )
  }
  return (
    <div className="screen">
      <div className="row between">
        <h2>Ear training</h2>
        <span className="small muted">{session.n ? `${session.ok}/${session.n} this session` : ''}</span>
      </div>
      <select value={focus} onChange={(e) => (setFocus(e.target.value), setN((x) => x + 1))}>
        <option value="all">All sounds (focuses on what you miss)</option>
        {contrasts.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <ExerciseView
        key={n}
        ex={ex}
        pool={[]}
        showRom
        onDone={(o) => {
          tick()
          if (ex.kind === 'tone') {
            const t = { t: new Date().toISOString(), set: ex.set.id, asked: ex.asked, chose: o === 'wrong' ? -1 : ex.asked }
            update((s) => ({ ...s, toneLog: [...s.toneLog, t].slice(-5000) }))
            setSession((s) => ({ n: s.n + 1, ok: s.ok + (o === 'wrong' ? 0 : 1) }))
          }
          setN((x) => x + 1)
        }}
      />
      <h3>How you're doing</h3>
      <ul className="list compact">
        {TONE_SETS.filter((s) => state.toneLog.some((t) => t.set === s.id)).map((s) => {
          const a = setAccuracy(state.toneLog, s.id, 30)
          return (
            <li key={s.id}>
              <span>
                <Mm text={s.options.map((o) => o.my).join(' · ')} size="sm" /> <span className="small muted">{s.contrast}</span>
              </span>
              <span className="small">
                {a.correct}/{a.n}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

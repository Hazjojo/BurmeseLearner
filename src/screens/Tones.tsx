import { useCallback, useEffect, useMemo, useState } from 'react'
import { TONE_SETS, type ToneSet } from '../content'
import { getRecording, recordedIds, type AppState, type ToneTrial } from '../lib/store'
import { playBlob } from '../lib/audio'
import { Mm, Rom } from '../components'

type Update = (fn: (s: AppState) => AppState) => void

export const toneRecId = (setId: string, opt: number, take: number) => `tone:${setId}:${opt}:${take}`

/** Recorded takes per set option: setId → option index → take ids. */
export function toneTakes(recorded: Set<string>): Map<string, Map<number, string[]>> {
  const out = new Map<string, Map<number, string[]>>()
  for (const id of recorded) {
    if (!id.startsWith('tone:')) continue
    const [, setId, opt] = id.split(':')
    const bySet = out.get(setId) ?? new Map<number, string[]>()
    bySet.set(+opt, [...(bySet.get(+opt) ?? []), id])
    out.set(setId, bySet)
  }
  return out
}

/** Smoothed accuracy over the most recent trials of a set. */
export function setAccuracy(log: ToneTrial[], setId: string, window = 20) {
  const recent = log.filter((t) => t.set === setId).slice(-window)
  const correct = recent.filter((t) => t.asked === t.chose).length
  return { n: recent.length, acc: (correct + 1) / (recent.length + 2) }
}

interface Trial {
  set: ToneSet
  asked: number
  take: string
  choices: number[]
}

function pickTrial(sets: ToneSet[], takes: Map<string, Map<number, string[]>>, log: ToneTrial[], last?: string): Trial | null {
  const usable = sets.filter((s) => (takes.get(s.id)?.size ?? 0) >= 2)
  if (!usable.length) return null
  // Adaptive: contrasts I get wrong come up more often.
  const weights = usable.map((s) => (s.id === last && usable.length > 1 ? 0.3 : 1) * (1 + 4 * (1 - setAccuracy(log, s.id).acc)))
  let r = Math.random() * weights.reduce((a, b) => a + b, 0)
  let set = usable[0]
  for (let i = 0; i < usable.length; i++) if ((r -= weights[i]) <= 0) { set = usable[i]; break }
  const byOpt = takes.get(set.id)!
  const choices = [...byOpt.keys()].sort((a, b) => a - b)
  const asked = choices[Math.floor(Math.random() * choices.length)]
  const opts = byOpt.get(asked)!
  return { set, asked, take: opts[Math.floor(Math.random() * opts.length)], choices }
}

export function Tones({ state, update }: { state: AppState; update: Update }) {
  const [takes, setTakes] = useState<Map<string, Map<number, string[]>> | null>(null)
  const [focus, setFocus] = useState('all')
  const [trial, setTrial] = useState<Trial | null>(null)
  const [chose, setChose] = useState<number | null>(null)
  const [session, setSession] = useState({ n: 0, ok: 0 })

  useEffect(() => {
    recordedIds().then((r) => setTakes(toneTakes(r)))
  }, [])
  const contrasts = useMemo(() => [...new Set(TONE_SETS.map((s) => s.contrast))], [])
  const sets = focus === 'all' ? TONE_SETS : TONE_SETS.filter((s) => s.contrast === focus)

  const play = useCallback(async (id: string) => {
    const b = await getRecording(id)
    if (b) await playBlob(b)
  }, [])

  const next = useCallback(() => {
    if (!takes) return
    const t = pickTrial(sets, takes, state.toneLog, trial?.set.id)
    setTrial(t)
    setChose(null)
    if (t) play(t.take)
  }, [takes, sets, state.toneLog, trial, play])

  useEffect(() => {
    if (takes && !trial) next()
  }, [takes, focus]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!takes) return null
  if (!trial) {
    return (
      <div className="screen">
        <h2>Tone & sound trainer</h2>
        <p>
          This needs native recordings of the tone sets. Hand your phone to your partner: <b>Partner → Tones</b>. Each set needs at least two of its
          options recorded. More voices make it work better.
        </p>
      </div>
    )
  }

  const answer = (i: number) => {
    if (chose !== null) return
    setChose(i)
    setSession((s) => ({ n: s.n + 1, ok: s.ok + (i === trial.asked ? 1 : 0) }))
    update((s) => ({ ...s, toneLog: [...s.toneLog, { t: new Date().toISOString(), set: trial.set.id, asked: trial.asked, chose: i }].slice(-5000) }))
  }
  const right = chose === trial.asked

  return (
    <div className="screen">
      <div className="row between">
        <h2>Which did you hear?</h2>
        <span className="small muted">{session.n ? `${session.ok}/${session.n}` : ''}</span>
      </div>
      <label className="field">
        <select value={focus} onChange={(e) => (setFocus(e.target.value), setTrial(null))}>
          <option value="all">All contrasts (adaptive)</option>
          {contrasts.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <div className="card center-content">
        <button className="btn big" onClick={() => play(trial.take)}>
          ▶ Play again
        </button>
        <div className="muted small">{trial.set.contrast}</div>
        <div className="choices">
          {trial.choices.map((i) => {
            const o = trial.set.options[i]
            const cls = chose === null ? '' : i === trial.asked ? 'correct' : i === chose ? 'wrong' : ''
            return (
              <button key={i} className={`btn choice ${cls}`} onClick={() => answer(i)}>
                <Mm text={o.my} size="md" />
                <Rom rom={o.rom} />
                {o.en && <span className="small muted">{o.en}</span>}
              </button>
            )
          })}
        </div>
        {chose !== null && (
          <div className="stack">
            <div className={right ? 'ok' : 'error'}>{right ? '✓ Right' : '✗ Not quite. Compare them:'}</div>
            {!right && (
              <div className="row gap-sm wrap">
                <button className="btn small" onClick={() => play(trial.take)}>
                  ▶ What you heard ({trial.set.options[trial.asked].rom})
                </button>
                <button
                  className="btn small"
                  onClick={() => {
                    const alt = takes.get(trial.set.id)?.get(chose!)
                    if (alt?.length) play(alt[0])
                  }}
                >
                  ▶ What you chose ({trial.set.options[chose].rom})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="actions">
        <button className="btn primary wide" disabled={chose === null} onClick={next}>
          Next
        </button>
      </div>
    </div>
  )
}

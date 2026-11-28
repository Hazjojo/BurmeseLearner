import { useState } from 'react'
import { LESSONS } from '../content'
import { dueKeys, nextLesson, unlockable } from '../learn'
import { computeStreak } from '../lib/streak'
import type { AppState } from '../lib/store'
import { LessonView, ReviewView } from './Learn'
import { Writing } from './Writing'

type Update = (fn: (s: AppState) => AppState) => void
type Step = { kind: 'review' } | { kind: 'lesson'; id: string } | { kind: 'write' }

const label = (s: Step) =>
  s.kind === 'review'
    ? { icon: '🔁', title: 'Review', sub: 'What’s due today' }
    : s.kind === 'write'
      ? { icon: '✍️', title: 'Writing warm-down', sub: '5 quick letters or words' }
      : (() => {
          const l = LESSONS.find((x) => x.id === s.id)!
          return { icon: l.track === 'script' ? '🔤' : l.module.icon, title: l.title, sub: `${l.track === 'script' ? 'Script' : 'Speaking'} · ${l.module.title}` }
        })()

/** One tap, about 15 minutes: reviews, the next speaking lesson, the next script lesson, then a little writing. */
export function TodaySession({ state, update, onExit }: { state: AppState; update: Update; onExit: () => void }) {
  const [steps] = useState<Step[]>(() => {
    const out: Step[] = []
    if (dueKeys(state).length + Math.min(8, unlockable(state).length) > 0) out.push({ kind: 'review' })
    const sp = nextLesson(state, 'speak')
    const sc = nextLesson(state, 'script')
    if (sp) out.push({ kind: 'lesson', id: sp.id })
    if (sc) out.push({ kind: 'lesson', id: sc.id })
    out.push({ kind: 'write' })
    return out
  })
  const [done, setDone] = useState(0)
  const [active, setActive] = useState(false)
  const step = steps[done]
  const finishStep = () => {
    setActive(false)
    setDone((d) => d + 1)
  }

  if (active && step) {
    if (step.kind === 'review') return <ReviewView state={state} update={update} onExit={finishStep} />
    if (step.kind === 'lesson') return <LessonView key={step.id} lessonId={step.id} state={state} update={update} onExit={finishStep} />
    return <Writing state={state} update={update} onExit={finishStep} quick={5} />
  }

  const st = computeStreak(state)
  const allDone = done >= steps.length
  return (
    <div className="screen today">
      <button className="btn small ghost" onClick={onExit}>
        ✕ Close
      </button>
      <h2>{allDone ? 'Session complete 🎉' : "Today's session"}</h2>
      <p className="muted small">
        {allDone ? `🔥 ${st.streak}-day streak${st.todayDone ? ', today counted' : ''}. See you tomorrow!` : 'About 15 minutes. You can stop after any step; progress is saved.'}
      </p>
      <ol className="steps">
        {steps.map((s, i) => {
          const l = label(s)
          const cls = i < done ? 'done' : i === done ? 'current' : ''
          return (
            <li key={i} className={`step ${cls}`}>
              <span className="step-icon">{i < done ? '✓' : l.icon}</span>
              <span className="grow">
                <b>{l.title}</b>
                <span className="small muted block">{l.sub}</span>
              </span>
            </li>
          )
        })}
      </ol>
      <div className="actions">
        {allDone ? (
          <button className="btn primary wide big" onClick={onExit}>
            Done
          </button>
        ) : (
          <div className="row gap-sm">
            {done > 0 && (
              <button className="btn" onClick={() => setDone(done + 1)}>
                Skip
              </button>
            )}
            <button className="btn primary wide big" onClick={() => setActive(true)}>
              {done === 0 ? 'Start' : 'Next step'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

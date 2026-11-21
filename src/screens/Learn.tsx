import { useMemo, useRef, useState } from 'react'
import { lessonItems, lessonKind, LESSONS, MODULES, toneSetById, type Item, type Lesson } from '../content'
import { exItem, Runner, type Exercise, type Outcome } from '../exercises'
import { completeLesson, dueKeys, gradeCard, knownItems, lessonExercises, nextLesson, reviewPlan, unlockable } from '../learn'
import { clipsFor, say } from '../lib/speech'
import type { AppState } from '../lib/store'
import { Mm, PlayButton, Rom, ToneLegend } from '../components'

type Update = (fn: (s: AppState) => AppState) => void

// ---------------- Home ----------------

export function Home({ state, banner, onLesson, onReview, onCourse }: {
  state: AppState
  banner?: React.ReactNode
  onLesson: (id: string) => void
  onReview: () => void
  onCourse: () => void
}) {
  const due = dueKeys(state).length + Math.min(8, unlockable(state).length)
  const next = nextLesson(state)
  const done = LESSONS.filter((l) => state.lessons[l.id]).length
  const phrases = knownItems(state).filter((i) => i.strand === 'speak').length
  return (
    <div className="screen">
      <h1>
        <Mm text="မင်္ဂလာပါ" size="md" />
      </h1>
      {banner}
      {due > 0 && (
        <button className="hero review" onClick={onReview}>
          <span className="hero-kicker">Review</span>
          <span className="hero-title">{due} to practise</span>
          <span className="small">About {Math.max(1, Math.round((due * 12) / 60))} min · keeps what you've learned fresh</span>
        </button>
      )}
      {next ? (
        <button className="hero" onClick={() => onLesson(next.id)}>
          <span className="hero-kicker">{done ? 'Continue' : 'Start here'} · {next.module.title}</span>
          <span className="hero-title">{next.title}</span>
          <span className="small">{lessonBlurb(next)}</span>
        </button>
      ) : (
        <div className="hero done">
          <span className="hero-title">Course complete 🎉</span>
          <span className="small">More modules are on the way. Keep reviewing.</span>
        </div>
      )}
      <div className="tiles">
        <div className="tile">
          <b>
            {done}/{LESSONS.length}
          </b>
          <span>lessons done</span>
        </div>
        <div className="tile">
          <b>{phrases}</b>
          <span>words & phrases learned</span>
        </div>
      </div>
      <button className="btn wide" onClick={onCourse}>
        See all modules
      </button>
    </div>
  )
}

const lessonBlurb = (l: Lesson) => {
  const k = lessonKind(l)
  if (k === 'tones') return `Listening practice · ${l.toneSets?.length ?? 0} sound sets`
  if (k === 'script') return `Script · ${l.items?.length ?? 0} letters`
  return `${l.items?.length ?? 0} phrases${l.drills?.length ? ' + sentence building' : ''}`
}

// ---------------- Course map ----------------

export function Course({ state, onLesson }: { state: AppState; onLesson: (id: string) => void }) {
  const next = nextLesson(state)
  return (
    <div className="screen">
      <h2>Course</h2>
      {MODULES.map((m, mi) => {
        const doneCount = m.lessons.filter((l) => state.lessons[l.id]).length
        return (
          <section key={m.id} className="module">
            <div className="module-head">
              <span className="module-num">{mi + 1}</span>
              <div>
                <div className="module-title">{m.title}</div>
                <div className="small muted">
                  {m.summary} · {doneCount}/{m.lessons.length}
                </div>
              </div>
            </div>
            <ul className="lesson-list">
              {m.lessons.map((l) => {
                const rec = state.lessons[l.id]
                return (
                  <li key={l.id}>
                    <button className={`lesson-row ${next?.id === l.id ? 'next' : ''}`} onClick={() => onLesson(l.id)}>
                      <span className={`dot ${rec ? 'done' : ''}`}>{rec ? '✓' : ''}</span>
                      <span className="grow">
                        {l.title}
                        <span className="small muted block">{lessonBlurb(l)}</span>
                      </span>
                      {rec && <span className="small muted">{Math.round(rec.score * 100)}%</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

// ---------------- Lesson ----------------

export function LessonView({ lessonId, state, update, onExit }: { lessonId: string; state: AppState; update: Update; onExit: () => void }) {
  const lesson = LESSONS.find((l) => l.id === lessonId)!
  const kind = lessonKind(lesson)
  const items = useMemo(() => lessonItems(lesson, state.settings.speaker), [lesson, state.settings.speaker])
  const [step, setStep] = useState<'intro' | 'teach' | 'practice' | 'done'>('intro')
  const [ti, setTi] = useState(0)
  const plan = useMemo(() => lessonExercises(lesson, state), []) // eslint-disable-line react-hooks/exhaustive-deps
  const results = useRef(new Map<string, Outcome>())
  const toneLog = useRef<AppState['toneLog']>([])
  const [score, setScore] = useState<{ right: number; total: number } | null>(null)
  const pool = useMemo(() => {
    const k = knownItems(state)
    const ids = new Set(k.map((i) => i.id))
    return [...k, ...items.filter((i) => !ids.has(i.id)), ...plan.drills]
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const record = (ex: Exercise, o: Outcome) => {
    const worse = (a?: Outcome, b?: Outcome) => (a === 'wrong' || b === 'wrong' ? 'wrong' : a === 'hinted' || b === 'hinted' ? 'hinted' : 'right')
    if (ex.kind === 'tone') {
      toneLog.current.push({ t: new Date().toISOString(), set: ex.set.id, asked: ex.asked, chose: o === 'wrong' ? -1 : ex.asked })
      return
    }
    const it = exItem(ex)
    if (it) results.current.set(it.id, worse(results.current.get(it.id), o) as Outcome)
  }

  const finish = async (stats: { right: number; total: number }) => {
    setScore(stats)
    const s = stats.total ? stats.right / stats.total : 1
    const apply = await completeLesson(lesson, state, results.current, plan.drills, s)
    const tl = toneLog.current
    update((st) => ({ ...apply(st), toneLog: [...st.toneLog, ...tl].slice(-5000) }))
    setStep('done')
  }

  if (step === 'intro') {
    return (
      <div className="screen lesson">
        <TopBar onExit={onExit} label={lesson.title} />
        <div className="kicker">{LESSONS.find((l) => l.id === lessonId)!.module.title}</div>
        <h2>{lesson.title}</h2>
        {lesson.intro.map((p, i) => (
          <p key={i} className="lesson-text">
            {p}
          </p>
        ))}
        {kind === 'tones' && <ToneLegend />}
        <div className="actions">
          <button className="btn primary wide big" onClick={() => setStep(kind === 'tones' ? 'teach' : items.length ? 'teach' : 'practice')}>
            {kind === 'tones' ? 'Listen to the examples' : `Learn ${items.length} new ${kind === 'script' ? 'letters' : 'phrases'}`}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'teach' && kind === 'tones') {
    const sets = (lesson.toneSets ?? []).map(toneSetById).filter(Boolean)
    const anyAudio = sets.some((s) => s!.options.some((o) => clipsFor(o.my).length))
    return (
      <div className="screen lesson">
        <TopBar onExit={onExit} label={lesson.title} />
        <h3>Listen and compare</h3>
        {!anyAudio && <p className="note">Audio for these sounds hasn't been generated yet, so the listening practice will be skipped for now.</p>}
        {sets.map((set) => (
          <div key={set!.id} className="card compact">
            <div className="small muted">{set!.contrast}</div>
            <div className="options">
              {set!.options.map((o, i) => (
                <button key={i} className="btn option" onClick={() => say(o.my, { voice: i })}>
                  <span className="stack tight center-content">
                    <Mm text={o.my} size="md" />
                    <Rom rom={o.rom} />
                    {o.en && <span className="small muted">{o.en}</span>}
                    <span className="small">🔊</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="actions">
          <button className="btn primary wide big" onClick={() => (plan.exercises.length ? setStep('practice') : finish({ right: 0, total: 0 }))}>
            {plan.exercises.length ? 'Practise' : 'Finish lesson'}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'teach') {
    const item = items[ti]
    return (
      <div className="screen lesson">
        <TopBar onExit={onExit} label={`New ${ti + 1} / ${items.length}`} progress={(ti + 1) / (items.length + 1)} />
        <div className="teach card">
          <Mm text={item.my} size={kind === 'script' ? 'xl' : 'lg'} />
          {item.rom && <Rom rom={item.rom} />}
          <PlayButton key={item.id} my={item.my} itemId={item.id} autoPlay />
          <div className="en big">{item.en}</div>
          {item.lit && <div className="muted small">literally: {item.lit}</div>}
          {item.note && <div className="note">{item.note}</div>}
        </div>
        <div className="actions row gap-sm">
          {ti > 0 && (
            <button className="btn" onClick={() => setTi(ti - 1)}>
              ←
            </button>
          )}
          <button className="btn primary wide big" onClick={() => (ti + 1 < items.length ? setTi(ti + 1) : setStep('practice'))}>
            {ti + 1 < items.length ? 'Next' : "Let's practise"}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'practice') {
    return (
      <Runner
        exercises={plan.exercises}
        pool={pool}
        showRom={state.settings.showRom}
        onResult={record}
        onFinish={finish}
        onExit={onExit}
      />
    )
  }

  const pct = score && score.total ? Math.round((score.right / score.total) * 100) : 100
  const next = nextLesson({ ...state, lessons: { ...state.lessons, [lesson.id]: { at: '', score: 0 } } })
  return (
    <div className="screen center-content done-screen">
      <div className="big-emoji">{pct >= 90 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div>
      <h2>Lesson complete</h2>
      {score && score.total > 0 && (
        <p>
          {score.right} / {score.total} right first time ({pct}%)
        </p>
      )}
      {kind !== 'tones' && <p className="muted small">These now come back in your reviews just before you'd forget them.</p>}
      <div className="stack wide-stack">
        <button className="btn primary wide big" onClick={onExit}>
          Done
        </button>
        {next && <span className="small muted">Next up: {next.title}</span>}
      </div>
    </div>
  )
}

function TopBar({ onExit, label, progress }: { onExit: () => void; label: string; progress?: number }) {
  return (
    <div className="runner-top">
      <button className="btn small ghost" onClick={onExit} aria-label="Quit">
        ✕
      </button>
      {progress !== undefined ? (
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      ) : (
        <span className="grow" />
      )}
      <span className="small muted">{label}</span>
    </div>
  )
}

// ---------------- Review ----------------

export function ReviewView({ state, update, onExit }: { state: AppState; update: Update; onExit: () => void }) {
  const plan = useMemo(() => reviewPlan(state), []) // eslint-disable-line react-hooks/exhaustive-deps
  const latest = useRef(state)
  latest.current = state
  const pool = useMemo(() => knownItems(state), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [done, setDone] = useState<{ right: number; total: number } | null>(null)

  if (!plan.exercises.length) {
    return (
      <div className="screen center-content done-screen">
        <h2>Nothing to review</h2>
        <p className="muted">Do a lesson and its phrases will start coming back here.</p>
        <button className="btn primary" onClick={onExit}>
          Back
        </button>
      </div>
    )
  }
  if (done) {
    return (
      <div className="screen center-content done-screen">
        <div className="big-emoji">✅</div>
        <h2>Review done</h2>
        <p>
          {done.right} / {done.total} right first time
        </p>
        <button className="btn primary wide big" onClick={onExit}>
          Done
        </button>
      </div>
    )
  }
  return (
    <Runner
      exercises={plan.exercises}
      pool={pool}
      showRom={state.settings.showRom}
      title="Review"
      onResult={async (ex, o) => {
        const key = plan.keyOf.get(ex)
        if (!key) return
        const card = await gradeCard(key, o, latest.current)
        update((s) => ({ ...s, cards: { ...s.cards, [key]: card } }))
      }}
      onFinish={setDone}
      onExit={onExit}
    />
  )
}

export type { Item }

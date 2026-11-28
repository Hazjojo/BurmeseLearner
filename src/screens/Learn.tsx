import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { lessonItems, lessonKind, LESSONS, MODULES, toneSetById, type Item, type Lesson, type Module } from '../content'
import { exItem, Pic, Runner, type Exercise, type Outcome, type RunnerSnapshot } from '../exercises'
import { completeLesson, dueKeys, gradeCard, knownItems, lessonExercises, nextLesson, reviewPlan, unlockable } from '../learn'
import { clipsFor, say } from '../lib/speech'
import type { AppState, LessonDraft } from '../lib/store'
import { Mm, PlayButton, Rom, ToneLegend } from '../components'
import { DIALOGUES, type Dialogue } from './Practice'

type Update = (fn: (s: AppState) => AppState) => void
const modStyle = (m: Module) => ({ '--mod': m.color }) as CSSProperties
const kindIcon = (l: Lesson, m: Module) => (lessonKind(l) === 'tones' ? '👂' : lessonKind(l) === 'script' ? '✍️' : m.icon)

const lessonBlurb = (l: Lesson) => {
  const k = lessonKind(l)
  if (k === 'tones') return `Listening · ${l.toneSets?.length ?? 0} sound sets`
  if (k === 'script') return `Script · ${l.items?.length ?? 0} letters`
  return `${l.items?.length ?? 0} phrases${l.drills?.length ? ' + sentence building' : ''}`
}

// ---------------- Home ----------------

export function Home({ state, banner, onLesson, onReview, onCourse }: {
  state: AppState
  banner?: React.ReactNode
  onLesson: (id: string) => void
  onReview: () => void
  onCourse: () => void
}) {
  const due = dueKeys(state).length + Math.min(8, unlockable(state).length)
  const draftId = Object.entries(state.drafts ?? {}).sort((a, b) => b[1].at.localeCompare(a[1].at))[0]?.[0]
  const resume = draftId ? LESSONS.find((l) => l.id === draftId) : undefined
  const next = resume ?? nextLesson(state)
  const done = LESSONS.filter((l) => state.lessons[l.id]).length
  const phrases = knownItems(state).filter((i) => i.strand === 'speak').length
  const pct = Math.round((done / LESSONS.length) * 100)
  return (
    <div className="screen">
      <header className="home-head">
        <div>
          <Mm text="မင်္ဂလာပါ" size="md" />
          <div className="small muted">mìn-gə-là-bà · Ready to learn?</div>
        </div>
        <div className="ring" style={{ '--pct': `${pct}%` } as CSSProperties} title={`${pct}% of the course`}>
          <span>{pct}%</span>
        </div>
      </header>
      {banner}
      {next ? (
        <button className="hero lesson-hero" style={modStyle(next.module)} onClick={() => onLesson(next.id)}>
          <span className="hero-icon">{kindIcon(next, next.module)}</span>
          <span className="hero-body">
            <span className="hero-kicker">{resume ? 'Resume' : done ? 'Continue' : 'Start here'} · {next.module.title}</span>
            <span className="hero-title">{next.title}</span>
            <span className="small">{resume ? 'Pick up where you left off' : lessonBlurb(next)}</span>
          </span>
        </button>
      ) : (
        <div className="hero done">
          <span className="hero-title">Course complete 🎉</span>
          <span className="small">Keep reviewing and practising.</span>
        </div>
      )}
      {due > 0 && (
        <button className="hero review" onClick={onReview}>
          <span className="hero-icon">🔁</span>
          <span className="hero-body">
            <span className="hero-kicker">Review</span>
            <span className="hero-title">{due} to practise</span>
            <span className="small">About {Math.max(1, Math.round((due * 12) / 60))} min · keeps it fresh</span>
          </span>
        </button>
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
          <span>words & phrases</span>
        </div>
      </div>
      <button className="btn wide" onClick={onCourse}>
        🗺️ Open the course map
      </button>
    </div>
  )
}

// ---------------- Course map ----------------

type Node = { kind: 'lesson'; lesson: Lesson } | { kind: 'dialogue'; d: Dialogue }
const ROW = 118
const W = 320
const OFF = [0, 72, 104, 72, 0, -72, -104, -72]

export function Course({ state, onLesson, onDialogue }: { state: AppState; onLesson: (id: string) => void; onDialogue: (d: Dialogue) => void }) {
  const next = nextLesson(state)
  const currentRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' })
  }, [])
  let step = 0 // keeps the zigzag continuous across modules
  return (
    <div className="screen map-screen">
      <h2>Course map</h2>
      {MODULES.map((m, mi) => {
        const nodes: Node[] = m.lessons.flatMap((l) => [{ kind: 'lesson' as const, lesson: l }, ...DIALOGUES.filter((d) => d.after === l.id).map((d) => ({ kind: 'dialogue' as const, d }))])
        const pts = nodes.map((_, i) => ({ x: W / 2 + OFF[(step + i) % OFF.length], y: i * ROW + 48 }))
        step += nodes.length
        const path = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `C${pts[i - 1].x},${pts[i - 1].y + ROW / 2} ${p.x},${p.y - ROW / 2} ${p.x},${p.y}`)).join(' ')
        const doneCount = m.lessons.filter((l) => state.lessons[l.id]).length
        return (
          <section key={m.id} className="map-module" style={modStyle(m)}>
            <div className="map-banner">
              <span className="map-banner-icon">{m.icon}</span>
              <div className="grow">
                <div className="small banner-kicker">Module {mi + 1}</div>
                <div className="module-title">{m.title}</div>
                <div className="small">{m.summary}</div>
              </div>
              <span className="small banner-count">
                {doneCount}/{m.lessons.length}
              </span>
            </div>
            <div className="map-path" style={{ height: nodes.length * ROW, width: W }}>
              <svg width={W} height={nodes.length * ROW} aria-hidden="true">
                <path d={path} className="map-line" />
              </svg>
              {nodes.map((n, i) => {
                const p = pts[i]
                if (n.kind === 'dialogue') {
                  const done = !!state.lessons[n.d.id]
                  return (
                    <div key={n.d.id} className="map-node-wrap" style={{ left: p.x, top: p.y }}>
                      <button className={`map-node small-node ${done ? 'done' : ''}`} onClick={() => onDialogue(n.d)} aria-label={n.d.title}>
                        🎧
                      </button>
                      <span className="map-label">
                        {n.d.title}
                        <span className="muted block">Listening</span>
                      </span>
                    </div>
                  )
                }
                const l = n.lesson
                const done = state.lessons[l.id]
                const draft = state.drafts?.[l.id]
                const current = next?.id === l.id
                return (
                  <div key={l.id} className="map-node-wrap" style={{ left: p.x, top: p.y }}>
                    {(current || draft) && <span className="map-flag">{draft ? 'RESUME' : 'START'}</span>}
                    <button
                      ref={current ? currentRef : undefined}
                      className={`map-node ${done ? 'done' : ''} ${current ? 'current' : ''} ${draft ? 'draft' : ''}`}
                      onClick={() => onLesson(l.id)}
                      aria-label={l.title}
                    >
                      {done ? '★' : kindIcon(l, m)}
                    </button>
                    <span className="map-label">
                      {l.title}
                      {done && <span className="muted block">{Math.round(done.score * 100)}%</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
      <div className="map-end">🏁 More modules coming</div>
    </div>
  )
}

// ---------------- Lesson ----------------

export function LessonView({ lessonId, state, update, onExit }: { lessonId: string; state: AppState; update: Update; onExit: () => void }) {
  const lesson = LESSONS.find((l) => l.id === lessonId)!
  const kind = lessonKind(lesson)
  const items = useMemo(() => lessonItems(lesson, state.settings.speaker), [lesson, state.settings.speaker])
  const draft = useRef<LessonDraft | undefined>(state.drafts?.[lessonId]).current
  const [step, setStep] = useState<'intro' | 'teach' | 'practice' | 'done'>(draft?.step ?? 'intro')
  const [ti, setTi] = useState(draft?.ti ?? 0)
  const plan = useMemo(() => (draft ? { exercises: draft.exercises, drills: draft.drills } : lessonExercises(lesson, state)), []) // eslint-disable-line react-hooks/exhaustive-deps
  const results = useRef(new Map<string, Outcome>(Object.entries(draft?.results ?? {})))
  const toneLog = useRef<AppState['toneLog']>(draft?.toneLog ?? [])
  const runnerSnap = useRef<RunnerSnapshot | undefined>(draft?.runner)
  const [score, setScore] = useState<{ right: number; total: number } | null>(null)
  const pool = useMemo(() => {
    const k = knownItems(state)
    const ids = new Set(k.map((i) => i.id))
    return [...k, ...items.filter((i) => !ids.has(i.id)), ...plan.drills]
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /** Save where I am, so leaving the lesson doesn't lose progress. */
  const saveDraft = (s: 'teach' | 'practice', t: number) => {
    const d: LessonDraft = {
      at: new Date().toISOString(),
      step: s,
      ti: t,
      exercises: plan.exercises,
      drills: plan.drills,
      results: Object.fromEntries(results.current),
      toneLog: toneLog.current,
      runner: runnerSnap.current,
    }
    update((st) => ({ ...st, drafts: { ...st.drafts, [lessonId]: JSON.parse(JSON.stringify(d)) } }))
  }
  useEffect(() => {
    if (step === 'teach' || step === 'practice') saveDraft(step, ti)
  }, [step, ti]) // eslint-disable-line react-hooks/exhaustive-deps

  const record = (ex: Exercise, o: Outcome) => {
    const worse = (a?: Outcome, b?: Outcome): Outcome => (a === 'wrong' || b === 'wrong' ? 'wrong' : a === 'hinted' || b === 'hinted' ? 'hinted' : 'right')
    if (ex.kind === 'tone') {
      toneLog.current.push({ t: new Date().toISOString(), set: ex.set.id, asked: ex.asked, chose: o === 'wrong' ? -1 : ex.asked })
      return
    }
    const it = exItem(ex)
    if (it) results.current.set(it.id, worse(results.current.get(it.id), o))
  }

  const finish = async (stats: { right: number; total: number }) => {
    setScore(stats)
    const s = stats.total ? stats.right / stats.total : 1
    const apply = await completeLesson(lesson, state, results.current, plan.drills, s)
    const tl = toneLog.current
    update((st) => {
      const drafts = { ...st.drafts }
      delete drafts[lessonId]
      return { ...apply(st), drafts, toneLog: [...st.toneLog, ...tl].slice(-5000) }
    })
    setStep('done')
  }

  const startOver = () => {
    update((st) => {
      const drafts = { ...st.drafts }
      delete drafts[lessonId]
      return { ...st, drafts }
    })
    onExit()
  }

  const m = LESSONS.find((l) => l.id === lessonId)!.module
  if (step === 'intro') {
    return (
      <div className="screen lesson" style={modStyle(m)}>
        <TopBar onExit={onExit} label={lesson.title} />
        <div className="lesson-hero-pic">{kindIcon(lesson, m)}</div>
        <div className="kicker">{m.title}</div>
        <h2>{lesson.title}</h2>
        {lesson.intro.map((p, i) => (
          <p key={i} className="lesson-text">
            {p}
          </p>
        ))}
        {kind === 'tones' && <ToneLegend />}
        {kind !== 'tones' && items.some((i) => i.emoji) && (
          <div className="preview-pics">
            {items.map((i) => (
              <Pic key={i.id} item={i} size="sm" />
            ))}
          </div>
        )}
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
      <div className="screen lesson" style={modStyle(m)}>
        <TopBar onExit={onExit} label={lesson.title} />
        <h3>Listen and compare</h3>
        {!anyAudio && <p className="note">Audio for these sounds isn't available, so the listening practice will be skipped.</p>}
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
    const item = items[Math.min(ti, items.length - 1)]
    return (
      <div className="screen lesson" style={modStyle(m)}>
        <TopBar onExit={onExit} label={`New ${ti + 1} / ${items.length}`} progress={(ti + 1) / (items.length + 1)} />
        <div className="teach card" key={item.id}>
          {item.emoji && <Pic item={item} size="lg" />}
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
        {draft && (
          <button className="btn small ghost restart" onClick={startOver}>
            Start this lesson over
          </button>
        )}
      </div>
    )
  }

  if (step === 'practice') {
    return (
      <Runner
        exercises={plan.exercises}
        pool={pool}
        showRom={state.settings.showRom}
        initial={draft?.runner}
        onResult={record}
        onProgress={(snap) => {
          runnerSnap.current = snap
          saveDraft('practice', ti)
        }}
        onFinish={finish}
        onExit={onExit}
      />
    )
  }

  const pct = score && score.total ? Math.round((score.right / score.total) * 100) : 100
  const after = nextLesson({ ...state, lessons: { ...state.lessons, [lesson.id]: { at: '', score: 0 } } })
  return (
    <div className="screen center-content done-screen" style={modStyle(m)}>
      <Confetti />
      <div className="big-emoji">{pct >= 90 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div>
      <h2>Lesson complete</h2>
      {score && score.total > 0 && (
        <div className="score-ring" style={{ '--pct': `${pct}%` } as CSSProperties}>
          <span>{pct}%</span>
        </div>
      )}
      {score && score.total > 0 && (
        <p>
          {score.right} / {score.total} right first time
        </p>
      )}
      {kind !== 'tones' && <p className="muted small">These now come back in your reviews just before you'd forget them.</p>}
      <div className="stack wide-stack">
        <button className="btn primary wide big" onClick={onExit}>
          Continue
        </button>
        {after && <span className="small muted">Next up: {after.title}</span>}
      </div>
    </div>
  )
}

function Confetti() {
  const bits = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ i, left: Math.random() * 100, delay: Math.random() * 0.8, e: ['🎉', '⭐', '✨', '🎊'][i % 4] })), [])
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b) => (
        <span key={b.i} style={{ left: `${b.left}%`, animationDelay: `${b.delay}s` }}>
          {b.e}
        </span>
      ))}
    </div>
  )
}

function TopBar({ onExit, label, progress }: { onExit: () => void; label: string; progress?: number }) {
  return (
    <div className="runner-top">
      <button className="btn small ghost" onClick={onExit} aria-label="Leave (progress is saved)">
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
        <div className="big-emoji">🌱</div>
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
        <Confetti />
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

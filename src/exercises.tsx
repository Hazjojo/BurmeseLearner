import { useEffect, useMemo, useRef, useState } from 'react'
import { romTokens, type Item, type ToneSet } from './content'
import { say, clipsFor } from './lib/speech'
import { Mm, Rom } from './components'
import { aiAvailable, similarity, transcribe } from './lib/ai'
import { playBlob, startRecording, type Recorder } from './lib/audio'

export type Outcome = 'right' | 'hinted' | 'wrong'

export type Exercise =
  | { kind: 'choose-meaning'; item: Item; listen: boolean }
  | { kind: 'choose-burmese'; item: Item }
  | { kind: 'tiles'; item: Item }
  | { kind: 'match'; items: Item[] }
  | { kind: 'say'; item: Item }
  | { kind: 'recall'; item: Item }
  | { kind: 'tone'; set: ToneSet; asked: number }
  | { kind: 'glyph'; item: Item }
  | { kind: 'hear-glyph'; item: Item }
  | { kind: 'draw'; item: Item; trace: boolean }

export const exItem = (ex: Exercise): Item | undefined => ('item' in ex ? ex.item : undefined)

const shuffle = <T,>(xs: T[]): T[] => {
  const a = xs.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Up to n distractor items from the pool: same strand, different meaning and text. */
function distractors(item: Item, pool: Item[], n: number): Item[] {
  const seen = new Set([item.en, item.my])
  const out: Item[] = []
  for (const p of shuffle(pool)) {
    if (p.id === item.id || p.strand !== item.strand || seen.has(p.en) || seen.has(p.my)) continue
    seen.add(p.en)
    seen.add(p.my)
    out.push(p)
    if (out.length >= n) break
  }
  return out
}

interface ExProps<E extends Exercise> {
  ex: E
  pool: Item[]
  showRom: boolean
  onDone: (o: Outcome) => void
}

/** Bottom bar after answering: verdict, the right answer, Continue. */
function Feedback({ outcome, children, onContinue }: { outcome: Outcome; children?: React.ReactNode; onContinue: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <div className={`feedback ${outcome === 'wrong' ? 'bad' : 'good'}`}>
      <div className="feedback-title">{outcome === 'wrong' ? 'Not quite' : outcome === 'hinted' ? 'Got there ✓' : 'Correct ✓'}</div>
      {children}
      <button ref={ref} className="btn primary wide" onClick={onContinue}>
        Continue
      </button>
    </div>
  )
}

/** The phrase's picture (emoji in a soft circle). */
export function Pic({ item, size = 'md' }: { item?: { emoji?: string }; size?: 'sm' | 'md' | 'lg' }) {
  return item?.emoji ? <span className={`pic pic-${size}`} aria-hidden="true">{item.emoji}</span> : null
}

function Answer({ item, showRom = true }: { item: Item; showRom?: boolean }) {
  return (
    <div className="answer">
      <Pic item={item} size="sm" />
      <Mm text={item.my} size="md" />
      {showRom && item.rom && <Rom rom={item.rom} />}
      <div className="small">{item.en}</div>
    </div>
  )
}

function PlayBig({ my, itemId, autoPlay = true }: { my: string; itemId?: string; autoPlay?: boolean }) {
  useEffect(() => {
    if (autoPlay) say(my, { itemId })
  }, [my, itemId, autoPlay])
  return (
    <span className="row gap-sm">
      <button className="btn play" onClick={() => say(my, { itemId })} aria-label="Play">
        🔊
      </button>
      <button className="btn icon" onClick={() => say(my, { itemId, rate: 0.7 })} aria-label="Play slowly">
        🐢
      </button>
    </span>
  )
}

/** Multiple choice with an optional 50/50 hint. */
function Choice<T>({
  options,
  correct,
  render,
  onAnswer,
  answered,
  hinted,
}: {
  options: T[]
  correct: T
  render: (o: T) => React.ReactNode
  onAnswer: (o: T) => void
  answered: T | null
  hinted: Set<T>
}) {
  return (
    <div className="options">
      {options.map((o, i) => {
        const state = answered === null ? '' : o === correct ? 'correct' : o === answered ? 'wrong' : 'dim'
        return (
          <button key={i} className={`btn option ${state}`} disabled={answered !== null || hinted.has(o)} onClick={() => onAnswer(o)}>
            {render(o)}
          </button>
        )
      })}
    </div>
  )
}

function useChoice<T>(correct: T, wrong: T[], onDone: (o: Outcome) => void) {
  const options = useMemo(() => shuffle([correct, ...wrong]), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [answered, setAnswered] = useState<T | null>(null)
  const [hinted, setHinted] = useState<Set<T>>(new Set())
  const outcome: Outcome | null = answered === null ? null : answered !== correct ? 'wrong' : hinted.size ? 'hinted' : 'right'
  const hint = () => setHinted(new Set(shuffle(wrong).slice(0, Math.max(1, wrong.length - 1))))
  return { options, answered, setAnswered, hinted, hint, outcome, done: () => outcome && onDone(outcome) }
}

function ChooseMeaning({ ex, pool, showRom, onDone }: ExProps<Extract<Exercise, { kind: 'choose-meaning' }>>) {
  const { item } = ex
  const wrong = useMemo(() => distractors(item, pool, 3), [item, pool])
  const c = useChoice<Item>(item, wrong, onDone)
  const [showText, setShowText] = useState(!ex.listen)
  useEffect(() => {
    if (c.answered !== null) setShowText(true)
  }, [c.answered])
  return (
    <>
      <div className="prompt">
        <div className="muted small">{ex.listen ? 'What did you hear?' : 'What does this mean?'}</div>
        {ex.listen && <PlayBig my={item.my} itemId={item.id} />}
        {showText ? (
          <>
            <Mm text={item.my} size="lg" />
            {showRom && item.rom && <Rom rom={item.rom} />}
          </>
        ) : (
          <button className="btn small ghost" onClick={() => setShowText(true)}>
            Show text
          </button>
        )}
      </div>
      <Choice
        options={c.options}
        correct={item}
        render={(o) => (
          <span className="opt-pic">
            <Pic item={o} size="sm" />
            {o.en}
          </span>
        )}
        onAnswer={c.setAnswered}
        answered={c.answered}
        hinted={c.hinted}
      />
      <Footer outcome={c.outcome} onHint={c.answered === null && !c.hinted.size ? c.hint : undefined} onContinue={c.done}>
        {c.outcome === 'wrong' && <Answer item={item} showRom={showRom} />}
      </Footer>
    </>
  )
}

function ChooseBurmese({ ex, pool, showRom, onDone }: ExProps<Extract<Exercise, { kind: 'choose-burmese' }>>) {
  const { item } = ex
  const wrong = useMemo(() => distractors(item, pool, 3), [item, pool])
  const c = useChoice<Item>(item, wrong, onDone)
  useEffect(() => {
    if (c.answered) say(item.my, { itemId: item.id })
  }, [c.answered, item])
  return (
    <>
      <div className="prompt">
        <div className="muted small">How do you say…</div>
        <Pic item={item} size="lg" />
        <div className="en big">{item.en}</div>
      </div>
      <Choice
        options={c.options}
        correct={item}
        render={(o) => (
          <span className="stack tight center-content">
            <Mm text={o.my} size="sm" />
            {showRom && o.rom && <Rom rom={o.rom} />}
          </span>
        )}
        onAnswer={c.setAnswered}
        answered={c.answered}
        hinted={c.hinted}
      />
      <Footer outcome={c.outcome} onHint={c.answered === null && !c.hinted.size ? c.hint : undefined} onContinue={c.done} />
    </>
  )
}

/** Build the Burmese sentence from word tiles (romanization tiles, with the script shown once checked). */
function Tiles({ ex, pool, onDone }: ExProps<Extract<Exercise, { kind: 'tiles' }>>) {
  const { item } = ex
  const answer = useMemo(() => romTokens(item.rom), [item])
  const bank = useMemo(() => {
    const extra = shuffle(pool.filter((p) => p.id !== item.id && p.strand === 'speak').flatMap((p) => romTokens(p.rom)))
      .filter((t) => !answer.includes(t))
      .filter((t, i, a) => a.indexOf(t) === i)
      .slice(0, Math.min(3, Math.max(2, answer.length - 1)))
    return shuffle([...answer, ...extra]).map((text, id) => ({ id, text }))
  }, [item, pool, answer])
  const [picked, setPicked] = useState<number[]>([])
  const [checked, setChecked] = useState<Outcome | null>(null)
  const [hinted, setHinted] = useState(false)
  const built = picked.map((i) => bank[i].text)
  const check = () => {
    const ok = built.join(' ') === answer.join(' ')
    setChecked(ok ? (hinted ? 'hinted' : 'right') : 'wrong')
    say(item.my, { itemId: item.id })
  }
  const hint = () => {
    // Place the next correct tile.
    const nextIdx = built.findIndex((t, i) => t !== answer[i])
    const keep = nextIdx === -1 ? picked : picked.slice(0, nextIdx)
    const want = answer[keep.length]
    const tile = bank.find((b) => b.text === want && !keep.includes(b.id))
    if (tile) setPicked([...keep, tile.id])
    setHinted(true)
  }
  return (
    <>
      <div className="prompt">
        <div className="muted small">Build it in Burmese</div>
        <Pic item={item} size="lg" />
        <div className="en big">{item.en}</div>
      </div>
      <div className="tile-answer">
        {picked.map((i) => (
          <button key={i} className="btn tile" disabled={!!checked} onClick={() => setPicked(picked.filter((x) => x !== i))}>
            <Rom rom={bank[i].text} />
          </button>
        ))}
        {!picked.length && <span className="muted small">Tap the words in order</span>}
      </div>
      <div className="tile-bank">
        {bank.map((b) => (
          <button key={b.id} className="btn tile" disabled={picked.includes(b.id) || !!checked} onClick={() => setPicked([...picked, b.id])}>
            <Rom rom={b.text} />
          </button>
        ))}
      </div>
      {checked ? (
        <Feedback outcome={checked} onContinue={() => onDone(checked)}>
          <Answer item={item} />
        </Feedback>
      ) : (
        <div className="actions row gap-sm">
          {!hinted && (
            <button className="btn" onClick={hint}>
              Hint
            </button>
          )}
          <button className="btn primary wide" disabled={!picked.length} onClick={check}>
            Check
          </button>
        </div>
      )}
    </>
  )
}

/** Tap a Burmese phrase, then its meaning. */
function Match({ ex, showRom, onDone }: ExProps<Extract<Exercise, { kind: 'match' }>>) {
  const left = useMemo(() => shuffle(ex.items), [ex])
  const right = useMemo(() => shuffle(ex.items), [ex])
  const [sel, setSel] = useState<string | null>(null)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [bad, setBad] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const finished = done.size === ex.items.length
  const pickRight = (id: string) => {
    if (!sel) return
    if (id === sel) {
      setDone(new Set([...done, id]))
      setSel(null)
    } else {
      setMistakes((m) => m + 1)
      setBad(id)
      setTimeout(() => setBad(null), 400)
    }
  }
  return (
    <>
      <div className="prompt">
        <div className="muted small">Match the pairs</div>
      </div>
      <div className="match">
        <div className="col">
          {left.map((i) => (
            <button
              key={i.id}
              className={`btn option ${done.has(i.id) ? 'matched' : sel === i.id ? 'selected' : ''}`}
              disabled={done.has(i.id)}
              onClick={() => {
                setSel(i.id)
                say(i.my, { itemId: i.id })
              }}
            >
              <span className="stack tight center-content">
                <Mm text={i.my} size={i.strand === 'script' ? 'md' : 'sm'} />
                {showRom && i.strand !== 'script' && i.rom && <Rom rom={i.rom} />}
              </span>
            </button>
          ))}
        </div>
        <div className="col">
          {right.map((i) => (
            <button key={i.id} className={`btn option ${done.has(i.id) ? 'matched' : bad === i.id ? 'wrong' : ''}`} disabled={done.has(i.id)} onClick={() => pickRight(i.id)}>
              <span className="opt-pic">
                <Pic item={i} size="sm" />
                {i.en}
              </span>
            </button>
          ))}
        </div>
      </div>
      {finished && <Feedback outcome={mistakes ? 'hinted' : 'right'} onContinue={() => onDone(mistakes > 1 ? 'hinted' : 'right')} />}
    </>
  )
}

/** Say it aloud. When signed in, speech recognition checks it; otherwise compare and judge yourself. */
function Say({ ex, showRom, onDone }: ExProps<Extract<Exercise, { kind: 'say' }>>) {
  const { item } = ex
  const [revealed, setRevealed] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [rec, setRec] = useState<Recorder | null>(null)
  const [checking, setChecking] = useState(false)
  const [heard, setHeard] = useState<{ text: string; rom: string; score: number } | null>(null)
  const mine = useRef<Blob | null>(null)
  const canCheck = aiAvailable()
  useEffect(() => {
    if (revealed) say(item.my, { itemId: item.id })
  }, [revealed, item])

  const toggle = async () => {
    if (rec) {
      const blob = await rec.stop()
      setRec(null)
      mine.current = blob
      if (!canCheck) return
      setChecking(true)
      try {
        const h = await transcribe(blob)
        const score = similarity(h.text, item.my)
        // If it matches the target, show the course's own romanization; otherwise the generated one.
        setHeard({ text: h.text, rom: score >= 0.85 ? item.rom : h.rom, score })
        setRevealed(true)
      } catch {
        setHeard({ text: '', rom: '', score: 0 })
      } finally {
        setChecking(false)
      }
    } else {
      try {
        setHeard(null)
        setRec(await startRecording())
      } catch {
        /* mic denied */
      }
    }
  }
  const verdict: Outcome | null = heard ? (heard.score >= 0.85 ? 'right' : heard.score >= 0.55 ? 'hinted' : 'wrong') : null

  return (
    <>
      <div className="prompt">
        <div className="muted small">Say it out loud in Burmese</div>
        <Pic item={item} size="lg" />
        <div className="en big">{item.en}</div>
        <div className="row gap-sm wrap">
          <button className={`btn mic ${rec ? 'recording' : ''}`} onClick={toggle} disabled={checking || !!outcome} aria-label={rec ? 'Stop' : 'Record'}>
            {rec ? '■' : '🎙'}
          </button>
          <span className="small muted">{rec ? 'Recording… tap to stop' : checking ? 'Listening…' : canCheck ? 'Tap, say it, tap again' : 'Record yourself to compare'}</span>
          {mine.current && !rec && (
            <button className="btn small" onClick={() => playBlob(mine.current!)}>
              ▶ Me
            </button>
          )}
        </div>
        {heard && (
          <div className={`heard-result ${verdict}`}>
            {heard.text ? (
              <>
                <span className="small">I heard:</span> <Mm text={heard.text} size="sm" />
                {heard.rom && <Rom rom={heard.rom} />}
                <div className="small">
                  {verdict === 'right' ? 'That matches ✓' : verdict === 'hinted' ? 'Close: compare with the answer' : "That doesn't match yet"}
                  <span className="muted"> (tones can't be checked: listen and compare)</span>
                </div>
              </>
            ) : (
              <span className="small">I didn't catch that. Try again, a little slower.</span>
            )}
          </div>
        )}
        {revealed && <Answer item={item} showRom={showRom || true} />}
        {revealed && <PlayBig my={item.my} itemId={item.id} autoPlay={false} />}
      </div>
      {outcome ? (
        <Feedback outcome={outcome} onContinue={() => onDone(outcome)} />
      ) : !revealed ? (
        <div className="actions">
          <button className="btn primary wide" onClick={() => setRevealed(true)}>
            Show answer
          </button>
        </div>
      ) : heard?.text && verdict ? (
        <div className="actions row gap-sm">
          {verdict !== 'right' && (
            <button className="btn wide" onClick={() => setOutcome('right')}>
              I said it right
            </button>
          )}
          <button className="btn primary wide" onClick={() => setOutcome(verdict)}>
            Continue
          </button>
        </div>
      ) : (
        <div className="actions row gap-sm">
          <button className="btn wide" onClick={() => setOutcome('wrong')}>
            Not quite
          </button>
          <button className="btn primary wide" onClick={() => setOutcome('right')}>
            I said it
          </button>
        </div>
      )}
    </>
  )
}

/** See or hear it, recall the meaning, then check. */
function Recall({ ex, showRom, onDone }: ExProps<Extract<Exercise, { kind: 'recall' }>>) {
  const { item } = ex
  const [revealed, setRevealed] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  return (
    <>
      <div className="prompt">
        <div className="muted small">What does it mean? Answer in your head, then check.</div>
        <PlayBig my={item.my} itemId={item.id} />
        <Mm text={item.my} size="lg" />
        {showRom && item.rom && <Rom rom={item.rom} />}
        {revealed && (
          <div className="row gap-sm">
            <Pic item={item} />
            <div className="en big">{item.en}</div>
          </div>
        )}
        {revealed && item.note && <div className="note">{item.note}</div>}
      </div>
      {outcome ? (
        <Feedback outcome={outcome} onContinue={() => onDone(outcome)} />
      ) : !revealed ? (
        <div className="actions">
          <button className="btn primary wide" onClick={() => setRevealed(true)}>
            Show meaning
          </button>
        </div>
      ) : (
        <div className="actions row gap-sm">
          <button className="btn wide" onClick={() => setOutcome('wrong')}>
            Didn't know
          </button>
          <button className="btn primary wide" onClick={() => setOutcome('right')}>
            Knew it
          </button>
        </div>
      )}
    </>
  )
}

function Tone({ ex, onDone }: ExProps<Extract<Exercise, { kind: 'tone' }>>) {
  const { set, asked } = ex
  const voice = useMemo(() => Math.floor(Math.random() * 2), [])
  const target = set.options[asked]
  const play = (i: number) => say(set.options[i].my, { voice })
  useEffect(() => {
    play(asked)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const choices = useMemo(() => set.options.map((_, i) => i).filter((i) => clipsFor(set.options[i].my).length || i === asked), [set, asked])
  const c = useChoice(asked, choices.filter((i) => i !== asked), onDone)
  return (
    <>
      <div className="prompt">
        <div className="muted small">Which one did you hear?</div>
        <button className="btn play big" onClick={() => play(asked)}>
          🔊 Play again
        </button>
        <div className="muted small">{set.contrast}</div>
      </div>
      <div className="options">
        {set.options.map((o, i) =>
          choices.includes(i) ? (
            <button
              key={i}
              className={`btn option ${c.answered === null ? '' : i === asked ? 'correct' : i === c.answered ? 'wrong' : 'dim'}`}
              disabled={c.answered !== null}
              onClick={() => c.setAnswered(i)}
            >
              <span className="stack tight center-content">
                <Mm text={o.my} size="md" />
                <Rom rom={o.rom} />
                {o.en && <span className="small muted">{o.en}</span>}
              </span>
            </button>
          ) : null,
        )}
      </div>
      <Footer outcome={c.outcome} onContinue={c.done}>
        {c.outcome === 'wrong' && (
          <div className="row gap-sm wrap">
            <button className="btn small" onClick={() => play(asked)}>
              🔊 What you heard: {target.rom}
            </button>
            <button className="btn small" onClick={() => play(c.answered!)}>
              🔊 What you picked: {set.options[c.answered!].rom}
            </button>
          </div>
        )}
      </Footer>
    </>
  )
}

function Glyph({ ex, pool, onDone }: ExProps<Extract<Exercise, { kind: 'glyph' }>>) {
  const { item } = ex
  const wrong = useMemo(() => distractors(item, pool, 3).map((d) => d.rom), [item, pool])
  const c = useChoice(item.rom, wrong, onDone)
  useEffect(() => {
    if (c.answered !== null) say(item.my, { itemId: item.id })
  }, [c.answered, item])
  return (
    <>
      <div className="prompt">
        <div className="muted small">How does this sound?</div>
        <Mm text={item.my} size="xl" />
      </div>
      <Choice options={c.options} correct={item.rom} render={(o) => <Rom rom={o} />} onAnswer={c.setAnswered} answered={c.answered} hinted={c.hinted} />
      <Footer outcome={c.outcome} onHint={c.answered === null && !c.hinted.size ? c.hint : undefined} onContinue={c.done}>
        {c.answered !== null && <div className="small">{item.en}</div>}
      </Footer>
    </>
  )
}

/** Hear a sound, pick the letter. */
function HearGlyph({ ex, pool, onDone }: ExProps<Extract<Exercise, { kind: 'hear-glyph' }>>) {
  const { item } = ex
  const wrong = useMemo(() => distractors(item, pool, 3), [item, pool])
  const c = useChoice<Item>(item, wrong, onDone)
  return (
    <>
      <div className="prompt">
        <div className="muted small">Which one says this?</div>
        <PlayBig my={item.my} itemId={item.id} />
      </div>
      <Choice
        options={c.options}
        correct={item}
        render={(o) => (
          <span className="stack tight center-content">
            <Mm text={o.my} size="lg" />
            {c.answered !== null && <Rom rom={o.rom} />}
          </span>
        )}
        onAnswer={c.setAnswered}
        answered={c.answered}
        hinted={c.hinted}
      />
      <Footer outcome={c.outcome} onHint={c.answered === null && !c.hinted.size ? c.hint : undefined} onContinue={c.done}>
        {c.answered !== null && <div className="small">{item.note}</div>}
      </Footer>
    </>
  )
}

/** Draw a letter with your finger (traced or from memory), then compare with the answer and mark yourself. */
function Draw({ ex, onDone }: ExProps<Extract<Exercise, { kind: 'draw' }>>) {
  const { item, trace } = ex
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [inked, setInked] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  useEffect(() => {
    say(item.my, { itemId: item.id })
    const c = canvas.current!
    const dpr = window.devicePixelRatio || 1
    const size = c.clientWidth
    c.width = size * dpr
    c.height = size * dpr
    const ctx = c.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = Math.max(8, size / 28)
    ctx.strokeStyle = getComputedStyle(c).color
  }, [item])
  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top] as const
  }
  const down = (e: React.PointerEvent) => {
    if (revealed) return
    canvas.current!.setPointerCapture(e.pointerId)
    drawing.current = true
    const ctx = canvas.current!.getContext('2d')!
    const [x, y] = pos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 0.1, y + 0.1)
    ctx.stroke()
    setInked(true)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = canvas.current!.getContext('2d')!
    const [x, y] = pos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }
  const up = () => (drawing.current = false)
  const clear = () => {
    const c = canvas.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    setInked(false)
  }
  return (
    <>
      <div className="prompt">
        <div className="muted small">{trace ? 'Trace the letter with your finger' : 'Draw it from memory'}</div>
        <div className="row gap-sm">
          <Rom rom={item.rom} />
          <span className="small muted">{item.en}</span>
          <button className="btn icon" onClick={() => say(item.my, { itemId: item.id })} aria-label="Play">
            🔊
          </button>
        </div>
      </div>
      <div className={`drawpad ${trace ? 'trace' : ''} ${revealed ? 'revealed' : ''}`}>
        {(trace || revealed) && (
          <span className="drawpad-glyph mm" lang="my" aria-hidden="true">
            {item.my}
          </span>
        )}
        <canvas ref={canvas} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} />
      </div>
      {revealed && !outcome && <p className="small muted center-text">{trace ? 'How close was your tracing?' : 'The answer is shown over your drawing. Did you get the shape right?'}</p>}
      {outcome ? (
        <Feedback outcome={outcome} onContinue={() => onDone(outcome)}>
          {item.note && <div className="small">{item.note}</div>}
        </Feedback>
      ) : !revealed ? (
        <div className="actions row gap-sm">
          <button className="btn" onClick={clear} disabled={!inked}>
            Clear
          </button>
          <button className="btn primary wide" onClick={() => setRevealed(true)} disabled={!inked}>
            Check
          </button>
        </div>
      ) : (
        <div className="actions row gap-sm">
          <button className="btn wide" onClick={() => setOutcome('wrong')}>
            Not quite
          </button>
          <button className="btn primary wide" onClick={() => setOutcome('right')}>
            I got it
          </button>
        </div>
      )}
    </>
  )
}

/** Shared footer: Hint before answering, feedback after. */
function Footer({ outcome, onHint, onContinue, children }: { outcome: Outcome | null; onHint?: () => void; onContinue: () => void; children?: React.ReactNode }) {
  if (outcome)
    return (
      <Feedback outcome={outcome} onContinue={onContinue}>
        {children}
      </Feedback>
    )
  return <div className="actions">{onHint && <button className="btn small ghost" onClick={onHint}>💡 Hint (remove some options)</button>}</div>
}

export function ExerciseView(props: ExProps<Exercise>) {
  const { ex } = props
  switch (ex.kind) {
    case 'choose-meaning':
      return <ChooseMeaning {...props} ex={ex} />
    case 'choose-burmese':
      return <ChooseBurmese {...props} ex={ex} />
    case 'tiles':
      return <Tiles {...props} ex={ex} />
    case 'match':
      return <Match {...props} ex={ex} />
    case 'say':
      return <Say {...props} ex={ex} />
    case 'recall':
      return <Recall {...props} ex={ex} />
    case 'tone':
      return <Tone {...props} ex={ex} />
    case 'glyph':
      return <Glyph {...props} ex={ex} />
    case 'hear-glyph':
      return <HearGlyph {...props} ex={ex} />
    case 'draw':
      return <Draw {...props} ex={ex} />
  }
}

/**
 * Runs a list of exercises. Anything answered wrong comes back once more later in the run.
 * onResult fires for each exercise's first attempt (used to schedule reviews as you go).
 */
export interface RunnerSnapshot {
  queue: { ex: Exercise; retry: boolean }[]
  pos: number
  stats: { right: number; total: number }
}

export function Runner({
  exercises,
  pool,
  showRom,
  title,
  onResult,
  onFinish,
  onExit,
  initial,
  onProgress,
}: {
  exercises: Exercise[]
  pool: Item[]
  showRom: boolean
  title?: string
  onResult?: (ex: Exercise, o: Outcome) => void
  onFinish: (stats: { right: number; total: number }) => void
  onExit: () => void
  /** Resume a saved run. */
  initial?: RunnerSnapshot
  /** Called after every answer, so the run can be saved and resumed later. */
  onProgress?: (snap: RunnerSnapshot) => void
}) {
  const [queue, setQueue] = useState<RunnerSnapshot['queue']>(() => initial?.queue ?? exercises.map((ex) => ({ ex, retry: false })))
  const [pos, setPos] = useState(initial?.pos ?? 0)
  const [stats, setStats] = useState(initial?.stats ?? { right: 0, total: 0 })
  useEffect(() => {
    if (pos > 0) onProgress?.({ queue, pos, stats })
  }, [pos]) // eslint-disable-line react-hooks/exhaustive-deps
  const cur = queue[pos]
  useEffect(() => {
    if (!cur) onFinish(stats)
  }, [cur]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!cur) return null
  const firstPass = exercises.length
  const done = (o: Outcome) => {
    if (!cur.retry) {
      onResult?.(cur.ex, o)
      setStats((s) => ({ right: s.right + (o === 'wrong' ? 0 : 1), total: s.total + 1 }))
    }
    if (o === 'wrong' && !cur.retry && cur.ex.kind !== 'match' && cur.ex.kind !== 'tone') {
      setQueue((q) => {
        const copy = q.slice()
        copy.splice(Math.min(copy.length, pos + 3), 0, { ex: cur.ex, retry: true })
        return copy
      })
    }
    setPos((p) => p + 1)
  }
  return (
    <div className="screen runner">
      <div className="runner-top">
        <button className="btn small ghost" onClick={onExit} aria-label="Quit">
          ✕
        </button>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${Math.round((Math.min(pos, firstPass) / Math.max(1, firstPass)) * 100)}%` }} />
        </div>
        {title && <span className="small muted">{title}</span>}
      </div>
      {cur.retry && <div className="small muted">Let's try that one again</div>}
      <ExerciseView key={pos} ex={cur.ex} pool={pool} showRom={showRom} onDone={done} />
    </div>
  )
}

export { shuffle }

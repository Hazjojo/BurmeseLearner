import { useMemo, useRef, useState } from 'react'
import { BASE_ITEMS, cardKey, type Item } from '../content'
import { Runner, shuffle, type Exercise } from '../exercises'
import { gradeCard } from '../learn'
import type { AppState } from '../lib/store'
import { Mm } from '../components'

type Update = (fn: (s: AppState) => AppState) => void
type Kind = 'letters' | 'syllables' | 'words'
type Mode = 'trace' | 'memory' | 'mix'

const glyphCount = (my: string) => [...my].filter((ch) => /[က-ဪဿ-၏]/.test(ch)).length

/** All writable items of a kind. Words = short phrases from the speaking course. */
function pool(kind: Kind): Item[] {
  if (kind === 'letters') return BASE_ITEMS.filter((i) => i.strand === 'script' && i.row)
  if (kind === 'syllables') return BASE_ITEMS.filter((i) => i.strand === 'script' && !i.row)
  return BASE_ITEMS.filter((i) => i.strand === 'speak' && !i.my.includes('_') && glyphCount(i.my) <= 6 && !i.my.includes(' '))
}

/** Free writing practice: letters, vowel/tone syllables or whole words, traced or from memory. */
export function Writing({ state, update, onExit, quick }: { state: AppState; update: Update; onExit: () => void; quick?: number }) {
  const [kind, setKind] = useState<Kind>('letters')
  const [onlyLearned, setOnlyLearned] = useState(true)
  const [mode, setMode] = useState<Mode>('mix')
  // Quick mode (Today's session): a short mixed round of learned letters (or words), started straight away.
  const [round, setRound] = useState<Exercise[] | null>(() => {
    if (!quick) return null
    const letters = pool('letters').filter((i) => state.introduced[i.id])
    const src = letters.length >= 3 ? letters : pool('words').filter((i) => state.introduced[i.id])
    const use = src.length ? src : pool('letters').slice(0, 5)
    return shuffle(use)
      .slice(0, quick)
      .map((item, i) => ({ kind: 'draw' as const, item, trace: i % 2 === 0 }))
  })
  const [done, setDone] = useState<{ right: number; total: number } | null>(null)
  const latest = useRef(state)
  latest.current = state

  const all = useMemo(() => pool(kind), [kind])
  const learned = all.filter((i) => state.introduced[i.id])
  const items = onlyLearned && learned.length ? learned : all

  const start = () => {
    const picked = shuffle(items).slice(0, 10)
    setDone(null)
    setRound(picked.map((item, i) => ({ kind: 'draw' as const, item, trace: mode === 'trace' || (mode === 'mix' && i % 2 === 0) })))
  }

  if (round && !done) {
    return (
      <Runner
        key={round.map((e) => ('item' in e ? e.item.id : '')).join()}
        exercises={round}
        pool={items}
        showRom
        title="Writing"
        onResult={async (ex, o) => {
          // Writing a learned letter from memory also counts as a review of it.
          if (ex.kind !== 'draw' || ex.trace || ex.item.strand !== 'script') return
          const key = cardKey(ex.item.id, 'glyph')
          if (!latest.current.cards[key]) return
          const card = await gradeCard(key, o, latest.current)
          update((s) => ({ ...s, cards: { ...s.cards, [key]: card } }))
        }}
        onFinish={(d) => (quick ? onExit() : setDone(d))}
        onExit={() => (quick ? onExit() : setRound(null))}
      />
    )
  }

  if (round && done) {
    return (
      <div className="screen center-content done-screen">
        <div className="big-emoji">✍️</div>
        <h2>Nice writing</h2>
        <p>
          {done.right} / {done.total} marked right
        </p>
        <div className="stack wide-stack">
          <button className="btn primary wide big" onClick={start}>
            Another 10
          </button>
          <button className="btn wide" onClick={() => setRound(null)}>
            Change settings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <button className="btn small ghost" onClick={onExit}>
        ← Practice
      </button>
      <h2>Writing practice</h2>
      <p className="muted small">Write with your finger. Trace to learn the shape, write from memory to test yourself, then compare with the answer and mark yourself.</p>

      <div className="field">
        <span>What to write</span>
        <div className="seg big-seg">
          {(
            [
              ['letters', '🔤 Letters'],
              ['syllables', '🎵 Vowels & tones'],
              ['words', '📝 Words'],
            ] as const
          ).map(([k, label]) => (
            <button key={k} className={kind === k ? 'active' : ''} onClick={() => setKind(k)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>How</span>
        <div className="seg big-seg">
          {(
            [
              ['trace', 'Trace'],
              ['mix', 'Mix'],
              ['memory', 'From memory'],
            ] as const
          ).map(([m, label]) => (
            <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <label className="row gap-sm">
        <input type="checkbox" checked={onlyLearned} onChange={(e) => setOnlyLearned(e.target.checked)} /> Only what I've learned
        <span className="small muted">({learned.length ? `${learned.length} of ${all.length}` : `none yet, using all ${all.length}`})</span>
      </label>
      <div className="preview-glyphs">
        {items.slice(0, 40).map((i) => (
          <Mm key={i.id} text={i.my} size="sm" />
        ))}
        {items.length > 40 && <span className="muted small">+{items.length - 40} more</span>}
      </div>
      <div className="actions">
        <button className="btn primary wide big" onClick={start}>
          Start writing (10)
        </button>
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { cardKey, DRILLS, firstCardType, getItem, learningOrder, parseKey, type Item } from '../content'
import { isDue, isEstablished, newCard, Rating, review, type Grade, type StoredCard } from '../lib/srs'
import { appendLog, type AppState } from '../lib/store'
import { splitRom } from '../lib/checks.js'
import { Mm, PlayButton, RecordCompare, Rom } from '../components'

type Entry = { kind: 'meet'; itemId: string } | { kind: 'card'; key: string }
type Update = (fn: (s: AppState) => AppState) => void

const todayStr = () => new Date().toISOString().slice(0, 10)

export function introducedToday(state: AppState) {
  const t = todayStr()
  return Object.values(state.introduced).filter((d) => d.slice(0, 10) === t).length
}

/** Production / drill cards that have become available but haven't been started yet. */
export function unlockable(state: AppState): string[] {
  const out: string[] = []
  const est = (id: string) => isEstablished(state.cards[cardKey(id, 'recog')])
  for (const item of learningOrder(state.settings.speaker, state.custom)) {
    if (item.strand !== 'speak') continue
    const k = cardKey(item.id, 'prod')
    if (!state.cards[k] && est(item.id)) out.push(k)
  }
  for (const d of DRILLS) {
    const k = cardKey(d.id, 'prod')
    if (!state.cards[k] && est(d.drill!.from) && est(d.drill!.verb)) out.push(k)
  }
  return out
}

export function buildQueue(state: AppState, now = new Date()): Entry[] {
  const due = Object.entries(state.cards)
    .filter(([, c]) => isDue(c, now))
    .sort((a, b) => a[1].dueAt.localeCompare(b[1].dueAt))
    .map(([key]) => ({ kind: 'card' as const, key }))
  const unlock = unlockable(state)
    .slice(0, state.settings.newPerDay)
    .map((key) => ({ kind: 'card' as const, key }))
  const budget = Math.max(0, state.settings.newPerDay - introducedToday(state))
  const fresh = learningOrder(state.settings.speaker, state.custom)
    .filter((i) => !state.introduced[i.id])
    .slice(0, budget)
    .map((i) => ({ kind: 'meet' as const, itemId: i.id }))
  return [...due, ...unlock, ...fresh]
}

export function Session({ state, update, onExit }: { state: AppState; update: Update; onExit: () => void }) {
  const initial = useMemo(() => buildQueue(state), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [queue, setQueue] = useState<Entry[]>(initial)
  const [pos, setPos] = useState(0)
  const [done, setDone] = useState(0)

  const entry = queue[pos]
  const advance = (insert?: { entry: Entry; after: number }) => {
    if (insert)
      setQueue((q) => {
        const copy = q.slice()
        copy.splice(Math.min(copy.length, pos + 1 + insert.after), 0, insert.entry)
        return copy
      })
    setPos((p) => p + 1)
  }

  return (
    <div className="session">
      <button className="btn small exit" onClick={onExit} aria-label="End session">
        ✕
      </button>
      {!entry ? (
        <div className="screen center">
          <h2>Done for now</h2>
          <p className="muted">{done ? `${done} reviews this session.` : 'Nothing due right now.'}</p>
          <button className="btn primary" onClick={onExit}>
            Back
          </button>
        </div>
      ) : entry.kind === 'meet' ? (
        <MeetView
          key={entry.itemId}
          item={getItem(entry.itemId, state.custom)!}
          pos={pos}
          total={queue.length}
          onMet={async (item) => {
            const key = cardKey(item.id, firstCardType(item))
            const card = await newCard()
            update((s) => ({ ...s, cards: { ...s.cards, [key]: card }, introduced: { ...s.introduced, [item.id]: new Date().toISOString() } }))
            advance({ entry: { kind: 'card', key }, after: 2 })
          }}
        />
      ) : (
        <CardView
          key={entry.key + pos}
          entryKey={entry.key}
          state={state}
          pos={pos}
          total={queue.length}
          onGrade={async (grade) => {
            const card = state.cards[entry.key] ?? (await newCard())
            const r = await review(card, grade, entry.key)
            update((s) => ({ ...s, cards: { ...s.cards, [entry.key]: r.card } }))
            await appendLog(r.log)
            setDone((d) => d + 1)
            const soon = new Date(r.card.dueAt).getTime() - Date.now() < 20 * 60 * 1000
            advance(soon ? { entry, after: 3 } : undefined)
          }}
        />
      )}
    </div>
  )
}

function Progress({ pos, total, label }: { pos: number; total: number; label?: string }) {
  return (
    <div className="progress">
      <div className="bar" style={{ width: `${Math.round((pos / Math.max(1, total)) * 100)}%` }} />
      <span className="small muted">
        {label ? `${label} · ` : ''}
        {pos + 1} / {total}
      </span>
    </div>
  )
}

function MeetView({ item, pos, total, onMet }: { item: Item; pos: number; total: number; onMet: (i: Item) => void }) {
  return (
    <div className="screen">
      <Progress pos={pos} total={total} label="New" />
      <div className="card">
        <ItemFull item={item} showRom autoPlay />
      </div>
      <div className="actions">
        <button className="btn primary wide" onClick={() => onMet(item)}>
          Got it
        </button>
      </div>
    </div>
  )
}

export function ItemFull({ item, showRom, autoPlay }: { item: Item; showRom: boolean; autoPlay?: boolean }) {
  return (
    <div className="stack">
      <Mm text={item.my} size={item.strand === 'script' ? 'xl' : 'lg'} />
      {showRom && item.rom && <Rom rom={item.rom} />}
      {!item.drill && <PlayButton itemId={item.id} autoPlay={autoPlay} />}
      <div className="en">{item.en}</div>
      {item.lit && <div className="muted small">literally: {item.lit}</div>}
      {item.note && <div className="note">{item.note}</div>}
    </div>
  )
}

/** A nudge before the answer (prompts beat simply being told: Lyster & Saito). */
function hintFor(item: Item, type: string): string {
  if (type === 'recog') return item.lit ? `literally: ${item.lit}` : item.en.split(/\s+/).map((w) => w[0] + '…').join(' ')
  if (type === 'prod') {
    const syl = splitRom(item.rom).filter((p) => p.tone)
    return syl.length ? `${syl.length} syllable${syl.length > 1 ? 's' : ''}, starts “${syl[0].text}…”` : 'no hint'
  }
  return item.note ?? 'no hint'
}

/** Romanization fades once the item is well known; it's still one tap away. */
const romFaded = (card: StoredCard | undefined) => !!card && card.reps >= 3 && card.lapses === 0

function CardView({ entryKey, state, pos, total, onGrade }: { entryKey: string; state: AppState; pos: number; total: number; onGrade: (g: Grade) => void }) {
  const { itemId, type } = parseKey(entryKey)
  const item = getItem(itemId, state.custom)
  const [revealed, setRevealed] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [forceRom, setForceRom] = useState(false)
  const card = state.cards[entryKey]
  if (!item) return null // content removed since the card was created

  const s = state.settings
  const romOnFront = s.showRom && (!s.fadeRom || !romFaded(card) || forceRom)
  const prompt = type === 'recog' ? 'What does it mean?' : type === 'prod' ? 'Say it in Burmese, out loud' : 'How does it sound?'
  const label = item.drill ? 'Pattern drill' : type === 'prod' ? 'Speak' : type === 'glyph' ? 'Script' : 'Listen & read'

  return (
    <div className="screen">
      <Progress pos={pos} total={total} label={label} />
      <div className="card">
        <div className="muted small">{prompt}</div>
        {!revealed ? (
          <div className="stack">
            {type === 'prod' ? (
              <>
                <div className="en big">{item.en}</div>
                {item.drill && <div className="muted small">Use the pattern with a verb you know.</div>}
                {!item.drill && <RecordCompare itemId={item.id} />}
              </>
            ) : type === 'recog' ? (
              <>
                <Mm text={item.my} size="lg" />
                {romOnFront ? (
                  item.rom && <Rom rom={item.rom} />
                ) : (
                  <button className="btn small" onClick={() => setForceRom(true)}>
                    Show romanization
                  </button>
                )}
                <PlayButton itemId={item.id} autoPlay />
              </>
            ) : (
              <Mm text={item.my} size="xl" />
            )}
            {hint && <div className="note">💡 {hint}</div>}
          </div>
        ) : (
          <>
            <ItemFull item={item} showRom autoPlay={type !== 'recog'} />
            {type === 'prod' && !item.drill && <RecordCompare itemId={item.id} />}
          </>
        )}
      </div>
      <div className="actions">
        {!revealed ? (
          <div className="row gap-sm">
            {!hint && (
              <button className="btn" onClick={() => setHint(hintFor(item, type))}>
                Hint
              </button>
            )}
            <button className="btn primary wide" onClick={() => setRevealed(true)}>
              Show answer
            </button>
          </div>
        ) : (
          <div className="grades">
            {(
              [
                [Rating.Again, 'Again', 'again'],
                [Rating.Hard, 'Hard', 'hard'],
                [Rating.Good, 'Good', 'good'],
                [Rating.Easy, 'Easy', 'easy'],
              ] as const
            ).map(([g, lbl, cls]) => (
              <button key={g} className={`btn grade ${cls}`} disabled={!!hint && g === Rating.Easy} onClick={() => onGrade(g as Grade)}>
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

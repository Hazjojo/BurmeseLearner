import { useEffect, useMemo, useState } from 'react'
import { cardKey, firstCardType, ITEM_BY_ID, learningOrder, parseKey, type Item } from '../content'
import { formatInterval, isDue, isEstablished, newCard, previewDue, Rating, review, type Grade } from '../lib/srs'
import { appendLog, type AppState } from '../lib/store'
import { Mm, PlayButton, RecordCompare, Rom } from '../components'

type Entry = { kind: 'meet'; itemId: string } | { kind: 'card'; key: string }

const todayStr = () => new Date().toISOString().slice(0, 10)

export function introducedToday(state: AppState) {
  const t = todayStr()
  return Object.values(state.introduced).filter((d) => d.slice(0, 10) === t).length
}

export function buildQueue(state: AppState, now = new Date()): Entry[] {
  const due = Object.entries(state.cards)
    .filter(([, c]) => isDue(c, now))
    .sort((a, b) => a[1].dueAt.localeCompare(b[1].dueAt))
    .map(([key]) => ({ kind: 'card' as const, key }))

  // Unlock production cards (English → say it) once the meaning is established.
  const unlock: Entry[] = []
  for (const item of learningOrder(state.settings.speaker)) {
    if (item.strand !== 'speak') continue
    const prodKey = cardKey(item.id, 'prod')
    if (!state.cards[prodKey] && isEstablished(state.cards[cardKey(item.id, 'recog')])) unlock.push({ kind: 'card', key: prodKey })
    if (unlock.length >= state.settings.newPerDay) break
  }

  const budget = Math.max(0, state.settings.newPerDay - introducedToday(state))
  const fresh = learningOrder(state.settings.speaker)
    .filter((i) => !state.introduced[i.id])
    .slice(0, budget)
    .map((i) => ({ kind: 'meet' as const, itemId: i.id }))

  return [...due, ...unlock, ...fresh]
}

export function Session({ state, update, onExit }: { state: AppState; update: (fn: (s: AppState) => AppState) => void; onExit: () => void }) {
  const initial = useMemo(() => buildQueue(state), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [queue, setQueue] = useState<Entry[]>(initial)
  const [pos, setPos] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)

  const entry = queue[pos]
  if (!entry) {
    return (
      <div className="screen center">
        <h2>Done for now</h2>
        <p className="muted">{done ? `${done} reviews this session.` : 'Nothing due right now.'}</p>
        <button className="btn primary" onClick={onExit}>
          Back
        </button>
      </div>
    )
  }

  const advance = (insert?: { entry: Entry; after: number }) => {
    setQueue((q) => {
      if (!insert) return q
      const copy = q.slice()
      copy.splice(Math.min(copy.length, pos + 1 + insert.after), 0, insert.entry)
      return copy
    })
    setRevealed(false)
    setPos((p) => p + 1)
  }

  if (entry.kind === 'meet') {
    const item = ITEM_BY_ID.get(entry.itemId)!
    const meet = async () => {
      const type = firstCardType(item)
      const key = cardKey(item.id, type)
      const card = await newCard()
      update((s) => ({ ...s, cards: { ...s.cards, [key]: card }, introduced: { ...s.introduced, [item.id]: new Date().toISOString() } }))
      advance({ entry: { kind: 'card', key }, after: 2 })
    }
    return (
      <div className="screen">
        <Progress pos={pos} total={queue.length} label="New" />
        <div className="card">
          <ItemFull item={item} showRom autoPlay />
        </div>
        <div className="actions">
          <button className="btn primary wide" onClick={meet}>
            Got it
          </button>
        </div>
      </div>
    )
  }

  return <CardView key={entry.key + pos} entryKey={entry.key} state={state} pos={pos} total={queue.length} revealed={revealed} setRevealed={setRevealed}
    onGrade={async (grade) => {
      const card = state.cards[entry.key] ?? (await newCard())
      const r = await review(card, grade, entry.key)
      update((s) => ({ ...s, cards: { ...s.cards, [entry.key]: r.card } }))
      await appendLog(r.log)
      setDone((d) => d + 1)
      const soon = new Date(r.card.dueAt).getTime() - Date.now() < 20 * 60 * 1000
      advance(soon ? { entry, after: 3 } : undefined)
    }} />
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

function ItemFull({ item, showRom, autoPlay }: { item: Item; showRom: boolean; autoPlay?: boolean }) {
  return (
    <div className="stack">
      <Mm text={item.my} size={item.strand === 'script' ? 'xl' : 'lg'} />
      {showRom && <Rom rom={item.rom} />}
      <PlayButton itemId={item.id} autoPlay={autoPlay} />
      <div className="en">{item.en}</div>
      {item.lit && <div className="muted small">literally: {item.lit}</div>}
      {item.note && <div className="note">{item.note}</div>}
    </div>
  )
}

function CardView({ entryKey, state, pos, total, revealed, setRevealed, onGrade }: {
  entryKey: string; state: AppState; pos: number; total: number; revealed: boolean; setRevealed: (b: boolean) => void; onGrade: (g: Grade) => void
}) {
  const { itemId, type } = parseKey(entryKey)
  const item = ITEM_BY_ID.get(itemId)
  const [preview, setPreview] = useState<Record<number, Date>>({})
  const card = state.cards[entryKey]
  useEffect(() => {
    if (revealed) (card ? Promise.resolve(card) : newCard()).then((c) => previewDue(c)).then(setPreview)
  }, [revealed, card])
  if (!item) return null // content removed since card was created

  const showRom = state.settings.showRom
  const prompt =
    type === 'recog' ? 'What does it mean?' : type === 'prod' ? 'Say it in Burmese — out loud' : 'How does it sound?'

  return (
    <div className="screen">
      <Progress pos={pos} total={total} label={type === 'prod' ? 'Speak' : type === 'glyph' ? 'Script' : 'Listen & read'} />
      <div className="card">
        <div className="muted small">{prompt}</div>
        {!revealed ? (
          <div className="stack">
            {type === 'prod' ? (
              <>
                <div className="en big">{item.en}</div>
                <RecordCompare itemId={item.id} />
              </>
            ) : type === 'recog' ? (
              <>
                <Mm text={item.my} size="lg" />
                {showRom && <Rom rom={item.rom} />}
                <PlayButton itemId={item.id} autoPlay />
              </>
            ) : (
              <Mm text={item.my} size="xl" />
            )}
          </div>
        ) : (
          <>
            <ItemFull item={item} showRom={showRom || type !== 'recog'} autoPlay={type !== 'recog'} />
            {type === 'prod' && <RecordCompare itemId={item.id} />}
          </>
        )}
      </div>
      <div className="actions">
        {!revealed ? (
          <button className="btn primary wide" onClick={() => setRevealed(true)}>
            Show answer
          </button>
        ) : (
          <div className="grades">
            {([
              [Rating.Again, 'Again', 'again'],
              [Rating.Hard, 'Hard', 'hard'],
              [Rating.Good, 'Good', 'good'],
              [Rating.Easy, 'Easy', 'easy'],
            ] as const).map(([g, label, cls]) => (
              <button key={g} className={`btn grade ${cls}`} onClick={() => onGrade(g as Grade)}>
                {label}
                <span className="small">{preview[g] ? formatInterval(preview[g]) : ''}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

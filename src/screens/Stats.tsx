import { useEffect, useState } from 'react'
import { BASE_ITEMS } from '../content'
import { knownItems } from '../learn'
import { computeStreak, dayKey, recentDays, type DayMark } from '../lib/streak'
import { loadLogs, type AppState } from '../lib/store'

const markIcon: Record<DayMark, string> = { done: '🔥', frozen: '❄️', missed: '·', today: '○', none: '·' }

/** Seven-day strip used on Home. */
export function WeekStrip({ state }: { state: AppState }) {
  const { marks } = computeStreak(state)
  const days = recentDays(marks, 7)
  return (
    <div className="week-strip" aria-label="Last 7 days">
      {days.map(({ day, mark }) => (
        <span key={day} className={`week-day ${mark}`} title={`${day}: ${mark}`}>
          <span className="small muted">{new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
          <span className="week-mark">{markIcon[mark]}</span>
        </span>
      ))}
    </div>
  )
}

export function Stats({ state, onBack }: { state: AppState; onBack: () => void }) {
  const st = computeStreak(state)
  const [retention, setRetention] = useState<string>('—')
  useEffect(() => {
    loadLogs().then((logs) => {
      const since = Date.now() - 30 * 864e5
      const rel = logs.filter((l) => l.state === 2 && new Date(l.reviewTime).getTime() > since)
      setRetention(rel.length >= 10 ? `${Math.round((rel.filter((l) => l.rating > 1).length / rel.length) * 100)}%` : '—')
    })
  }, [])

  // Minutes per week, last 8 weeks.
  const today = dayKey()
  const weeks = Array.from({ length: 8 }, (_, w) => {
    let secs = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(`${today}T12:00:00`)
      d.setDate(d.getDate() - ((7 - w) * 7 + i)) // week 7 = the last 7 days
      secs += state.activity?.[dayKey(d)]?.seconds ?? 0
    }
    return Math.round(secs / 60)
  })
  const maxW = Math.max(10, ...weeks)
  const cal = recentDays(st.marks, 84)
  const minsOn = (d: string) => Math.round((state.activity?.[d]?.seconds ?? 0) / 60)
  const daysStudied = Object.values(state.activity ?? {}).filter((a) => (a.answers ?? 0) > 0).length
  const phrases = knownItems(state).filter((i) => i.strand === 'speak').length
  const letters = BASE_ITEMS.filter((i) => i.row && state.introduced[i.id]).length
  const allLetters = BASE_ITEMS.filter((i) => i.row).length
  const cards = Object.values(state.cards)
  const mature = cards.filter((c) => c.state === 2 && (c.stability ?? 0) >= 21).length
  const young = cards.filter((c) => c.state === 2 && (c.stability ?? 0) < 21).length
  const learning = cards.length - mature - young
  const tl = state.toneLog.slice(-100)
  const toneAcc = tl.length ? `${Math.round((tl.filter((t) => t.asked === t.chose).length / tl.length) * 100)}%` : '—'

  return (
    <div className="screen">
      <button className="btn small ghost" onClick={onBack}>
        ← Home
      </button>
      <h2>Your progress</h2>
      <div className="tiles">
        <div className="tile">
          <b>🔥 {st.streak}</b>
          <span>day streak · best {st.best}</span>
        </div>
        <div className="tile">
          <b>❄️ {st.freezes}</b>
          <span>streak freezes (earn 1 per 7 days, max 2)</span>
        </div>
        <div className="tile">
          <b>{phrases}</b>
          <span>words & phrases learned</span>
        </div>
        <div className="tile">
          <b>
            {letters}/{allLetters}
          </b>
          <span>letters learned</span>
        </div>
        <div className="tile">
          <b>{retention}</b>
          <span>remembered in reviews (30 days)</span>
        </div>
        <div className="tile">
          <b>{toneAcc}</b>
          <span>tones & sounds heard right (last 100)</span>
        </div>
      </div>

      <h3>Minutes per week</h3>
      <div className="bars">
        {weeks.map((m, i) => (
          <div key={i} className="bar-col">
            <span className="small">{m || ''}</span>
            <span className="bar" style={{ height: `${Math.max(3, (m / maxW) * 100)}%` }} />
            <span className="small muted">{i === 7 ? 'now' : `-${7 - i}w`}</span>
          </div>
        ))}
      </div>

      <h3>Last 12 weeks</h3>
      <div className="heatmap">
        {cal.map(({ day, mark }) => {
          const m = minsOn(day)
          const practised = (state.activity?.[day]?.answers ?? 0) > 0
          const lvl = mark === 'frozen' ? 'frozen' : !practised ? 'l0' : m < 5 ? 'l1' : m < 15 ? 'l2' : 'l3'
          return <span key={day} className={`heat ${lvl} ${day === today ? 'is-today' : ''}`} title={`${day}: ${m} min${mark === 'frozen' ? ' (freeze used)' : ''}`} />
        })}
      </div>
      <p className="small muted">
        {daysStudied} {daysStudied === 1 ? 'day' : 'days'} studied so far.
      </p>

      <h3>Review cards</h3>
      <div className="stack-bar">
        <span className="seg-learning" style={{ flex: learning || 0.001 }} />
        <span className="seg-young" style={{ flex: young || 0.001 }} />
        <span className="seg-mature" style={{ flex: mature || 0.001 }} />
      </div>
      <p className="small muted">
        {learning} learning · {young} getting there · {mature} well known (remembered for 3+ weeks)
      </p>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { ITEMS, learningOrder, type Item } from '../content'
import { isEstablished } from '../lib/srs'
import { deleteRecording, exportBackup, importBackup, loadLogs, recordedIds, type AppState, type Settings as S } from '../lib/store'
import { Mm, PlayButton, RecordSlot, Rom, ToneLegend } from '../components'
import { buildQueue, introducedToday } from './Session'

type Update = (fn: (s: AppState) => AppState) => void

export function Today({ state, onStart }: { state: AppState; onStart: () => void }) {
  const queue = useMemo(() => buildQueue(state), [state])
  const dueCount = queue.filter((e) => e.kind === 'card').length
  const newCount = queue.filter((e) => e.kind === 'meet').length
  const order = learningOrder(state.settings.speaker)
  const met = order.filter((i) => state.introduced[i.id]).length
  const known = Object.values(state.cards).filter(isEstablished).length
  const [retention, setRetention] = useState<string>('—')
  useEffect(() => {
    // True retention: share of reviews of graduated cards (state 2) in the last 30 days not rated Again.
    loadLogs().then((logs) => {
      const since = Date.now() - 30 * 864e5
      const rel = logs.filter((l) => l.state === 2 && new Date(l.reviewTime).getTime() > since)
      if (rel.length >= 10) setRetention(`${Math.round((rel.filter((l) => l.rating > 1).length / rel.length) * 100)}%`)
    })
  }, [state])

  return (
    <div className="screen">
      <h1>
        <Mm text="မင်္ဂလာပါ" size="md" />
      </h1>
      <div className="tiles">
        <div className="tile">
          <b>{dueCount}</b>
          <span>due</span>
        </div>
        <div className="tile">
          <b>{newCount}</b>
          <span>new today</span>
        </div>
        <div className="tile">
          <b>{known}</b>
          <span>cards known</span>
        </div>
        <div className="tile">
          <b>{retention}</b>
          <span>retention (30d)</span>
        </div>
      </div>
      <button className="btn primary wide big" onClick={onStart} disabled={!dueCount && !newCount}>
        {dueCount || newCount ? 'Start' : 'All done for today'}
      </button>
      <p className="muted small">
        Met {met} of {order.length} items · {introducedToday(state)} new today (limit {state.settings.newPerDay}). No streaks: study as much or as little
        as you like.
      </p>
      <ToneLegend />
    </div>
  )
}

export function Browse({ state }: { state: AppState }) {
  const [recorded, setRecorded] = useState<Set<string>>(new Set())
  const [v, setV] = useState(0)
  useEffect(() => {
    recordedIds().then(setRecorded)
  }, [v])
  const units = new Map<string, Item[]>()
  for (const i of ITEMS) {
    const k = `${i.strand === 'script' ? 'Script' : 'Speaking'} · unit ${i.unit}`
    units.set(k, [...(units.get(k) ?? []), i])
  }
  return (
    <div className="screen">
      <h2>All items</h2>
      <p className="muted small">
        {ITEMS.length} items · {recorded.size} with native audio · {Object.values(state.meta).filter((m) => m.checked).length} checked
      </p>
      {[...units].map(([name, items]) => (
        <section key={name}>
          <h3>{name}</h3>
          <ul className="list">
            {items.map((i) => (
              <li key={i.id}>
                <div className="stack tight">
                  <span className="row gap-sm">
                    <Mm text={i.my} size="sm" />
                    {state.meta[i.id]?.checked && <span title="checked by partner">✓</span>}
                    {state.introduced[i.id] && <span className="pill">met</span>}
                  </span>
                  <Rom rom={i.rom} />
                  <span className="small">{i.en}</span>
                </div>
                <PlayButton itemId={i.id} version={v} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      {recorded.size === 0 && <p className="muted small">Record audio in Partner mode.</p>}
    </div>
  )
}

/** Hand the phone to a native speaker: record audio, mark items correct, leave notes. */
export function Partner({ state, update }: { state: AppState; update: Update }) {
  const [onlyTodo, setOnlyTodo] = useState(true)
  const [recorded, setRecorded] = useState<Set<string>>(new Set())
  const [v, setV] = useState(0)
  useEffect(() => {
    recordedIds().then(setRecorded)
  }, [v])
  const all = learningOrder('both')
  // Freeze the to-do list when it's opened, so ticking an item doesn't make the current one jump away.
  const [frozen, setFrozen] = useState<string[] | null>(null)
  useEffect(() => {
    recordedIds().then((rec) => setFrozen(all.filter((i) => !onlyTodo || !rec.has(i.id) || !state.meta[i.id]?.checked).map((i) => i.id)))
  }, [onlyTodo]) // eslint-disable-line react-hooks/exhaustive-deps
  const list = (frozen ?? []).map((id) => all.find((i) => i.id === id)!).filter(Boolean)
  const [idx, setIdx] = useState(0)
  if (!frozen) return null
  const item = list[Math.min(idx, list.length - 1)]
  if (!item) {
    return (
      <div className="screen center">
        <h2>Everything is recorded and checked 🎉</h2>
        <button className="btn" onClick={() => setOnlyTodo(false)}>
          Show all
        </button>
      </div>
    )
  }
  const meta = state.meta[item.id] ?? {}
  const setMeta = (m: typeof meta) => update((s) => ({ ...s, meta: { ...s.meta, [item.id]: { ...s.meta[item.id], ...m } } }))
  return (
    <div className="screen">
      <div className="row between">
        <h2>Partner mode</h2>
        <label className="small row gap-sm">
          <input type="checkbox" checked={onlyTodo} onChange={(e) => (setOnlyTodo(e.target.checked), setIdx(0))} /> to-do only
        </label>
      </div>
      <p className="muted small">
        Please read this naturally, as you'd say it in Yangon. Fix anything that sounds wrong. ({Math.min(idx, list.length - 1) + 1}/{list.length})
      </p>
      <div className="card">
        <div className="stack">
          <Mm text={item.my} size="xl" />
          <Rom rom={item.rom} />
          <div className="en">{item.en}</div>
          {item.speaker && <div className="muted small">({item.speaker === 'm' ? 'said by a man' : 'said by a woman'})</div>}
          <div className="row gap-sm wrap">
            <RecordSlot itemId={item.id} onSaved={() => setV((x) => x + 1)} />
            <PlayButton itemId={item.id} version={v} />
            {recorded.has(item.id) && (
              <button className="btn small" onClick={() => deleteRecording(item.id).then(() => setV((x) => x + 1))}>
                Delete
              </button>
            )}
          </div>
          <label className="row gap-sm">
            <input type="checkbox" checked={!!meta.checked} onChange={(e) => setMeta({ checked: e.target.checked })} /> Burmese &amp; romanization look right
          </label>
          <textarea placeholder="Corrections or notes (e.g. 'we'd usually say …')" value={meta.note ?? ''} onChange={(e) => setMeta({ note: e.target.value })} />
        </div>
      </div>
      <div className="actions row gap-sm">
        <button className="btn" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
          ← Back
        </button>
        <button className="btn primary wide" onClick={() => setIdx((i) => Math.min(i + 1, list.length - 1))}>
          Next →
        </button>
      </div>
    </div>
  )
}

export function Settings({ state, update }: { state: AppState; update: Update }) {
  const set = <K extends keyof S>(k: K, v: S[K]) => update((s) => ({ ...s, settings: { ...s.settings, [k]: v } }))
  const [msg, setMsg] = useState('')
  const doExport = async () => {
    const blob = await exportBackup()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `burmeselearner-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }
  const doImport = async (f?: File) => {
    if (!f) return
    try {
      await importBackup(f)
      setMsg('Imported. Reloading…')
      setTimeout(() => location.reload(), 600)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Import failed')
    }
  }
  const s = state.settings
  return (
    <div className="screen">
      <h2>Settings</h2>
      <label className="field">
        <span>I speak as</span>
        <select value={s.speaker} onChange={(e) => set('speaker', e.target.value as S['speaker'])}>
          <option value="m">a man (ကျွန်တော်)</option>
          <option value="f">a woman (ကျွန်မ)</option>
          <option value="both">show both</option>
        </select>
      </label>
      <label className="field">
        <span>New items per day: {s.newPerDay}</span>
        <input type="range" min={0} max={30} value={s.newPerDay} onChange={(e) => set('newPerDay', +e.target.value)} />
      </label>
      <label className="field">
        <span>Target retention: {Math.round(s.desiredRetention * 100)}%</span>
        <input type="range" min={80} max={95} value={Math.round(s.desiredRetention * 100)} onChange={(e) => set('desiredRetention', +e.target.value / 100)} />
        <span className="muted small">Higher = more reviews. 90% is a good default.</span>
      </label>
      <label className="row gap-sm">
        <input type="checkbox" checked={s.showRom} onChange={(e) => set('showRom', e.target.checked)} /> Show romanization on the question side
      </label>
      <h3>Backup</h3>
      <p className="muted small">Progress and recordings live on this device. Export a backup now and then (cloud sync is coming).</p>
      <div className="row gap-sm wrap">
        <button className="btn" onClick={doExport}>
          Export backup
        </button>
        <label className="btn">
          Import backup
          <input type="file" accept="application/json" hidden onChange={(e) => doImport(e.target.files?.[0])} />
        </label>
      </div>
      {msg && <p className="small">{msg}</p>}
      <h3>Install on your phone</h3>
      <p className="muted small">Android (Chrome): menu ⋮ → Add to Home screen. iPhone (Safari): Share → Add to Home Screen. It then works offline.</p>
    </div>
  )
}

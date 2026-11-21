import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { BASE_ITEMS, getItem, learningOrder, parseKey, TONE_SETS, type Item } from '../content'
import { isEstablished } from '../lib/srs'
import { deleteRecording, exportBackup, importBackup, loadLogs, recordedIds, type AppState, type Settings as S } from '../lib/store'
import { Mm, PlayButton, RecordSlot, Rom, ToneLegend } from '../components'
import { buildQueue, introducedToday } from './Session'
import { toneRecId, toneTakes } from './Tones'

type Update = (fn: (s: AppState) => AppState) => void

export function Today({ state, onStart, onAdd, banner }: { state: AppState; onStart: () => void; onAdd: () => void; banner?: ReactNode }) {
  const queue = useMemo(() => buildQueue(state), [state])
  const dueCount = queue.filter((e) => e.kind === 'card').length
  const newCount = queue.filter((e) => e.kind === 'meet').length
  const order = learningOrder(state.settings.speaker, state.custom)
  const met = order.filter((i) => state.introduced[i.id]).length
  const cards = Object.entries(state.cards)
  const known = cards.filter(([, c]) => isEstablished(c)).length
  const speaking = cards.filter(([k, c]) => parseKey(k).type === 'prod' && isEstablished(c)).length
  const [retention, setRetention] = useState<string>('—')
  useEffect(() => {
    // True retention: share of reviews of graduated cards (state 2) in the last 30 days not rated Again.
    loadLogs().then((logs) => {
      const since = Date.now() - 30 * 864e5
      const rel = logs.filter((l) => l.state === 2 && new Date(l.reviewTime).getTime() > since)
      setRetention(rel.length >= 10 ? `${Math.round((rel.filter((l) => l.rating > 1).length / rel.length) * 100)}%` : '—')
    })
  }, [state])

  const tl = state.toneLog
  const toneAcc = (xs: typeof tl) => (xs.length ? `${Math.round((xs.filter((t) => t.asked === t.chose).length / xs.length) * 100)}%` : '—')
  const missed = cards
    .filter(([, c]) => c.lapses > 0)
    .sort((a, b) => b[1].lapses - a[1].lapses)
    .slice(0, 5)
    .map(([k, c]) => ({ item: getItem(parseKey(k).itemId, state.custom), type: parseKey(k).type, lapses: c.lapses }))
    .filter((x) => x.item)

  return (
    <div className="screen">
      <h1>
        <Mm text="မင်္ဂလာပါ" size="md" />
      </h1>
      {banner}
      <div className="tiles">
        <div className="tile">
          <b>{dueCount}</b>
          <span>due</span>
        </div>
        <div className="tile">
          <b>{newCount}</b>
          <span>new today</span>
        </div>
      </div>
      <div className="row gap-sm">
        <button className="btn primary wide big" onClick={onStart} disabled={!dueCount && !newCount}>
          {dueCount || newCount ? 'Start' : 'All done for today'}
        </button>
        <button className="btn big" onClick={onAdd} aria-label="Add a phrase">
          ＋
        </button>
      </div>
      <p className="muted small">
        {introducedToday(state)} new today (limit {state.settings.newPerDay}). No streaks: study as much or as little as you like.
      </p>

      <h3>Progress</h3>
      <div className="tiles">
        <div className="tile">
          <b>{retention}</b>
          <span>true retention, 30 days (target {Math.round(state.settings.desiredRetention * 100)}%)</span>
        </div>
        <div className="tile">
          <b>
            {met}/{order.length}
          </b>
          <span>items met</span>
        </div>
        <div className="tile">
          <b>{known}</b>
          <span>cards known</span>
        </div>
        <div className="tile">
          <b>{speaking}</b>
          <span>things I can say</span>
        </div>
        <div className="tile">
          <b>{toneAcc(tl.slice(-50))}</b>
          <span>tone/sound ID, last 50{tl.length > 100 ? ` (first 50: ${toneAcc(tl.slice(0, 50))})` : ''}</span>
        </div>
      </div>
      {tl.length > 0 && (
        <ul className="list compact">
          {TONE_SETS.filter((s) => tl.some((t) => t.set === s.id)).map((s) => {
            const recent = tl.filter((t) => t.set === s.id).slice(-30)
            const ok = recent.filter((t) => t.asked === t.chose).length
            return (
              <li key={s.id}>
                <span>
                  <Mm text={s.options.map((o) => o.my).join(' · ')} size="sm" /> <span className="small muted">{s.contrast}</span>
                </span>
                <span className="small">
                  {ok}/{recent.length} ({Math.round((ok / recent.length) * 100)}%)
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {missed.length > 0 && (
        <>
          <h3>Most missed</h3>
          <ul className="list compact">
            {missed.map(({ item, type, lapses }) => (
              <li key={item!.id + type}>
                <span>
                  <Mm text={item!.my} size="sm" /> <span className="small">{item!.en}</span>
                </span>
                <span className="small muted">
                  {type === 'prod' ? 'saying' : type === 'glyph' ? 'reading' : 'meaning'} · {lapses}×
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <ToneLegend />
    </div>
  )
}

export function Browse({ state, update, onAdd }: { state: AppState; update: Update; onAdd: () => void }) {
  const [v, setV] = useState(0)
  const [recorded, setRecorded] = useState<Set<string>>(new Set())
  useEffect(() => {
    recordedIds().then(setRecorded)
  }, [v])
  const units = new Map<string, Item[]>()
  if (state.custom.length) units.set('My phrases', state.custom)
  for (const i of BASE_ITEMS) {
    const k = `${i.strand === 'script' ? 'Script' : 'Speaking'} · unit ${i.unit}`
    units.set(k, [...(units.get(k) ?? []), i])
  }
  const all = [...state.custom, ...BASE_ITEMS]
  const remove = (id: string) => {
    if (!confirm('Delete this phrase and its review history?')) return
    update((s) => ({
      ...s,
      custom: s.custom.filter((c) => c.id !== id),
      cards: Object.fromEntries(Object.entries(s.cards).filter(([k]) => parseKey(k).itemId !== id)),
    }))
    deleteRecording(id).then(() => setV((x) => x + 1))
  }
  return (
    <div className="screen">
      <div className="row between">
        <h2>All items</h2>
        <button className="btn small" onClick={onAdd}>
          ＋ Add phrase
        </button>
      </div>
      <p className="muted small">
        {all.length} items · {all.filter((i) => recorded.has(i.id)).length} with native audio · {Object.values(state.meta).filter((m) => m.checked).length}{' '}
        checked
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
                  {i.rom && <Rom rom={i.rom} />}
                  <span className="small">{i.en}</span>
                  {state.meta[i.id]?.note && <span className="small muted">✎ {state.meta[i.id].note}</span>}
                </div>
                <span className="row gap-sm">
                  <PlayButton itemId={i.id} version={v} />
                  {i.custom && (
                    <button className="btn small" onClick={() => remove(i.id)} aria-label="Delete">
                      🗑
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** Hand the phone to a native speaker: record audio, mark items correct, leave notes. */
export function Partner({ state, update }: { state: AppState; update: Update }) {
  const [mode, setMode] = useState<'phrases' | 'tones'>('phrases')
  return (
    <div className="screen">
      <div className="row between">
        <h2>Partner mode</h2>
        <div className="seg">
          <button className={mode === 'phrases' ? 'active' : ''} onClick={() => setMode('phrases')}>
            Phrases
          </button>
          <button className={mode === 'tones' ? 'active' : ''} onClick={() => setMode('tones')}>
            Tones
          </button>
        </div>
      </div>
      {mode === 'phrases' ? <PartnerPhrases state={state} update={update} /> : <PartnerTones />}
    </div>
  )
}

function PartnerPhrases({ state, update }: { state: AppState; update: Update }) {
  const [onlyTodo, setOnlyTodo] = useState(true)
  const [recorded, setRecorded] = useState<Set<string>>(new Set())
  const [v, setV] = useState(0)
  useEffect(() => {
    recordedIds().then(setRecorded)
  }, [v])
  const all = learningOrder('both', state.custom)
  // Freeze the to-do list when it's opened, so ticking an item doesn't make the current one jump away.
  const [frozen, setFrozen] = useState<string[] | null>(null)
  useEffect(() => {
    recordedIds().then((rec) => setFrozen(all.filter((i) => !onlyTodo || !rec.has(i.id) || !state.meta[i.id]?.checked).map((i) => i.id)))
  }, [onlyTodo]) // eslint-disable-line react-hooks/exhaustive-deps
  const list = (frozen ?? []).map((id) => all.find((i) => i.id === id)).filter((i): i is Item => !!i)
  const [idx, setIdx] = useState(0)
  if (!frozen) return null
  const item = list[Math.min(idx, list.length - 1)]
  if (!item) {
    return (
      <div className="center-content">
        <p>Everything is recorded and checked 🎉</p>
        <button className="btn" onClick={() => setOnlyTodo(false)}>
          Show all
        </button>
      </div>
    )
  }
  const meta = state.meta[item.id] ?? {}
  const setMeta = (m: typeof meta) => update((s) => ({ ...s, meta: { ...s.meta, [item.id]: { ...s.meta[item.id], ...m } } }))
  return (
    <>
      <label className="small row gap-sm">
        <input type="checkbox" checked={onlyTodo} onChange={(e) => (setOnlyTodo(e.target.checked), setIdx(0))} /> to-do only
      </label>
      <p className="muted small">
        Please read this naturally, as you'd say it in Yangon. Fix anything that sounds wrong. ({Math.min(idx, list.length - 1) + 1}/{list.length})
      </p>
      <div className="card">
        <div className="stack">
          <Mm text={item.my} size="xl" />
          {item.rom && <Rom rom={item.rom} />}
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
    </>
  )
}

/** Record each option of each tone/sound set. Extra takes (or other voices) add variety for the trainer. */
function PartnerTones() {
  const [v, setV] = useState(0)
  const [recorded, setRecorded] = useState<Set<string>>(new Set())
  useEffect(() => {
    recordedIds().then(setRecorded)
  }, [v])
  const takes = toneTakes(recorded)
  return (
    <>
      <p className="muted small">
        Say each one clearly, on its own. These are sound contrasts, so some aren't real words. Recording a second take (or getting someone else to)
        helps the trainer.
      </p>
      {TONE_SETS.map((set) => (
        <section key={set.id} className="card compact">
          <div className="small muted">{set.contrast}</div>
          <ul className="list">
            {set.options.map((o, i) => {
              const mine = takes.get(set.id)?.get(i) ?? []
              return (
                <li key={i}>
                  <span className="row gap-sm">
                    <Mm text={o.my} size="md" />
                    <Rom rom={o.rom} />
                  </span>
                  <span className="row gap-sm">
                    <span className="small muted">{mine.length}×</span>
                    <RecordSlot itemId={toneRecId(set.id, i, Date.now())} onSaved={() => setV((x) => x + 1)} />
                    {mine.length > 0 && (
                      <button className="btn small" onClick={() => deleteRecording(mine[mine.length - 1]).then(() => setV((x) => x + 1))} aria-label="Delete last take">
                        ↶
                      </button>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </>
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
      <label className="row gap-sm">
        <input type="checkbox" checked={s.fadeRom} onChange={(e) => set('fadeRom', e.target.checked)} /> Fade it out on items I know well (tap to show)
      </label>
      <h3>Backup</h3>
      <p className="muted small">Export a backup now and then, especially before cloud sync is switched on.</p>
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

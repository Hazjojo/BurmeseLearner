import { useState, type CSSProperties } from 'react'
import { getItem, MODULES, parseKey, type Item } from '../content'
import { Pic } from '../exercises'
import { deleteRecording, exportBackup, importBackup, type AppState, type Settings as S } from '../lib/store'
import { Mm, PlayButton, Rom, ToneLegend } from '../components'

type Update = (fn: (s: AppState) => AppState) => void

type Cat = { id: string; icon: string; title: string; summary?: string; color?: string; groups: [string, Item[]][] }

/** Phrasebook: categories (matching the course modules) first; each opens its own page of phrases. */
export function Phrasebook({ state, update, onAdd }: { state: AppState; update: Update; onAdd: () => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const cats: Cat[] = [
    ...(state.custom.length ? [{ id: 'mine', icon: '⭐', title: 'My phrases', summary: 'Phrases you added yourself', groups: [['', state.custom] as [string, Item[]]] }] : []),
    ...MODULES.map((m) => ({
      id: m.id,
      icon: m.icon,
      title: m.title,
      summary: m.summary,
      color: m.color,
      groups: m.lessons
        .filter((l) => l.items?.length)
        .map((l) => [l.title, (l.items ?? []).map((id) => getItem(id)).filter((i): i is Item => !!i)] as [string, Item[]]),
    })).filter((c) => c.groups.length),
  ]
  const remove = (id: string) => {
    if (!confirm('Delete this phrase and its review history?')) return
    update((s) => ({
      ...s,
      custom: s.custom.filter((c) => c.id !== id),
      cards: Object.fromEntries(Object.entries(s.cards).filter(([k]) => parseKey(k).itemId !== id)),
    }))
    deleteRecording(id)
  }
  const term = q.trim().toLowerCase()
  const match = (i: Item) =>
    i.en.toLowerCase().includes(term) || i.my.includes(term) || i.rom.normalize('NFD').replace(/[\u0300-\u036f\u0330]/g, '').includes(term)

  const cat = cats.find((c) => c.id === open)
  if (cat) {
    return (
      <div className="screen" style={cat.color ? ({ '--mod': cat.color } as CSSProperties) : undefined}>
        <button className="btn small ghost" onClick={() => setOpen(null)}>
          ← Phrasebook
        </button>
        <div className="map-banner">
          <span className="map-banner-icon">{cat.icon}</span>
          <div className="grow">
            <div className="module-title">{cat.title}</div>
            {cat.summary && <div className="small">{cat.summary}</div>}
          </div>
        </div>
        {cat.groups.map(([title, items]) => (
          <div key={title || cat.id}>
            {title && <div className="small muted subhead">{title}</div>}
            <PhraseList items={items} state={state} onRemove={remove} />
          </div>
        ))}
      </div>
    )
  }

  const all = cats.flatMap((c) => c.groups.flatMap(([, items]) => items))
  const results = term ? all.filter(match) : []
  return (
    <div className="screen">
      <div className="row between">
        <h2>Phrasebook</h2>
        <button className="btn small primary" onClick={onAdd}>
          ＋ Add my own
        </button>
      </div>
      <input type="text" placeholder="🔎 Search all phrases" value={q} onChange={(e) => setQ(e.target.value)} />
      {term ? (
        results.length ? (
          <PhraseList items={results} state={state} onRemove={remove} />
        ) : (
          <p className="muted">Nothing matches “{q}”.</p>
        )
      ) : (
        <div className="cat-grid">
          {cats.map((c) => {
            const items = c.groups.flatMap(([, i]) => i)
            const learned = items.filter((i) => state.introduced[i.id]).length
            return (
              <button key={c.id} className="cat-card" style={c.color ? ({ '--mod': c.color } as CSSProperties) : undefined} onClick={() => setOpen(c.id)}>
                <span className="cat-card-icon">{c.icon}</span>
                <span className="cat-card-title">{c.title}</span>
                <span className="small muted">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                  {learned ? ` · ${learned} learned` : ''}
                </span>
                <span className="cat-card-bar">
                  <span style={{ width: `${items.length ? Math.round((learned / items.length) * 100) : 0}%` }} />
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PhraseList({ items, state, onRemove }: { items: Item[]; state: AppState; onRemove: (id: string) => void }) {
  return (
    <ul className="list">
      {items.map((i) => (
        <li key={i.id}>
          <span className="row gap-sm grow">
            {i.emoji ? <Pic item={i} size="sm" /> : <span className="pic pic-sm glyph-pic">{i.my}</span>}
            <span className="stack tight">
              <span className="row gap-sm">
                <Mm text={i.my} size="sm" />
                {state.introduced[i.id] && <span className="pill">learned</span>}
              </span>
              {i.rom && <Rom rom={i.rom} />}
              <span className="small">{i.en}</span>
            </span>
          </span>
          <span className="row gap-sm">
            <PlayButton my={i.my} itemId={i.id} />
            {i.custom && (
              <button className="btn small" onClick={() => onRemove(i.id)} aria-label="Delete">
                🗑
              </button>
            )}
          </span>
        </li>
      ))}
    </ul>
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
      <div className="field">
        <span>Appearance</span>
        <div className="seg">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button key={t} className={s.theme === t ? 'active' : ''} onClick={() => set('theme', t)}>
              {t === 'light' ? '☀️ Light' : t === 'dark' ? '🌙 Dark' : '📱 Match phone'}
            </button>
          ))}
        </div>
      </div>
      <label className="row gap-sm">
        <input type="checkbox" checked={s.showRom} onChange={(e) => set('showRom', e.target.checked)} /> Show romanization in questions
      </label>
      <label className="field">
        <span>How much to remember: {Math.round(s.desiredRetention * 100)}%</span>
        <input type="range" min={80} max={95} value={Math.round(s.desiredRetention * 100)} onChange={(e) => set('desiredRetention', +e.target.value / 100)} />
        <span className="muted small">Higher means more frequent reviews. 90% is a good balance.</span>
      </label>
      <h3>Tone colours</h3>
      <ToneLegend />
      <h3>Backup</h3>
      <p className="muted small">Cloud sync keeps your progress safe when you're signed in. You can also export a file.</p>
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
      <p className="muted small">App version: {__BUILD__}</p>
    </div>
  )
}

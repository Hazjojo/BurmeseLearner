import { useState, type CSSProperties } from 'react'
import { getItem, MODULES, parseKey, type Item } from '../content'
import { Pic } from '../exercises'
import { deleteRecording, exportBackup, importBackup, type AppState, type Settings as S } from '../lib/store'
import { Mm, PlayButton, Rom, ToneLegend } from '../components'

type Update = (fn: (s: AppState) => AppState) => void

/** Everything in the course plus my own phrases, grouped like the course, searchable. */
export function Phrasebook({ state, update, onAdd }: { state: AppState; update: Update; onAdd: () => void }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [onlyLearned, setOnlyLearned] = useState(false)
  const match = (i: Item) => {
    if (onlyLearned && !state.introduced[i.id]) return false
    const t = q.trim().toLowerCase()
    return !t || i.en.toLowerCase().includes(t) || i.my.includes(t) || i.rom.normalize('NFD').replace(/[\u0300-\u036f\u0330]/g, '').includes(t)
  }
  // Categories follow the course modules (and their lessons), plus my own phrases.
  const cats: { id: string; icon: string; title: string; color?: string; groups: [string, Item[]][] }[] = [
    ...(state.custom.length ? [{ id: 'mine', icon: '⭐', title: 'My phrases', groups: [['', state.custom] as [string, Item[]]] }] : []),
    ...MODULES.map((m) => ({
      id: m.id,
      icon: m.icon,
      title: m.title,
      color: m.color,
      groups: m.lessons
        .filter((l) => l.items?.length)
        .map((l) => [l.title, (l.items ?? []).map((id) => getItem(id)).filter((i): i is Item => !!i)] as [string, Item[]]),
    })).filter((c) => c.groups.length),
  ]
  const shown = cats.filter((c) => cat === 'all' || c.id === cat)
  const remove = (id: string) => {
    if (!confirm('Delete this phrase and its review history?')) return
    update((s) => ({
      ...s,
      custom: s.custom.filter((c) => c.id !== id),
      cards: Object.fromEntries(Object.entries(s.cards).filter(([k]) => parseKey(k).itemId !== id)),
    }))
    deleteRecording(id)
  }
  let any = false
  return (
    <div className="screen">
      <div className="row between">
        <h2>Phrasebook</h2>
        <button className="btn small primary" onClick={onAdd}>
          ＋ Add my own
        </button>
      </div>
      <input type="text" placeholder="Search English, Burmese or romanization" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips">
        <button className={`chip ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>
          All
        </button>
        {cats.map((c) => (
          <button key={c.id} className={`chip ${cat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>
            {c.icon} {c.title}
          </button>
        ))}
      </div>
      <label className="row gap-sm small">
        <input type="checkbox" checked={onlyLearned} onChange={(e) => setOnlyLearned(e.target.checked)} /> Only what I've learned
      </label>
      {shown.map((c) => {
        const groups = c.groups.map(([t, items]) => [t, items.filter(match)] as [string, Item[]]).filter(([, items]) => items.length)
        if (!groups.length) return null
        any = true
        return (
          <section key={c.id} className="phrase-cat" style={c.color ? ({ '--mod': c.color } as CSSProperties) : undefined}>
            <h3 className="cat-title">
              <span className="cat-icon">{c.icon}</span> {c.title}
            </h3>
            {groups.map(([title, items]) => (
              <div key={title || c.id}>
                {title && <div className="small muted subhead">{title}</div>}
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
                          <button className="btn small" onClick={() => remove(i.id)} aria-label="Delete">
                            🗑
                          </button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )
      })}
      {!any && <p className="muted">Nothing matches.</p>}
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

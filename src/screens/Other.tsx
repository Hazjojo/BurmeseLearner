import { useState } from 'react'
import { BASE_ITEMS, parseKey, type Item } from '../content'
import { deleteRecording, exportBackup, importBackup, type AppState, type Settings as S } from '../lib/store'
import { Mm, PlayButton, Rom, ToneLegend } from '../components'

type Update = (fn: (s: AppState) => AppState) => void

/** Everything in the course plus my own phrases, searchable. */
export function Phrasebook({ state, update, onAdd }: { state: AppState; update: Update; onAdd: () => void }) {
  const [q, setQ] = useState('')
  const [onlyLearned, setOnlyLearned] = useState(false)
  const match = (i: Item) => {
    if (onlyLearned && !state.introduced[i.id]) return false
    const t = q.trim().toLowerCase()
    return !t || i.en.toLowerCase().includes(t) || i.my.includes(t) || i.rom.normalize('NFD').replace(/[̀-̰ͯ]/g, '').includes(t)
  }
  const groups: [string, Item[]][] = [
    ['My phrases', state.custom],
    ['Speaking', BASE_ITEMS.filter((i) => i.strand === 'speak')],
    ['Script', BASE_ITEMS.filter((i) => i.strand === 'script')],
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
  return (
    <div className="screen">
      <div className="row between">
        <h2>Phrasebook</h2>
        <button className="btn small primary" onClick={onAdd}>
          ＋ Add my own
        </button>
      </div>
      <input type="text" placeholder="Search English, Burmese or romanization" value={q} onChange={(e) => setQ(e.target.value)} />
      <label className="row gap-sm small">
        <input type="checkbox" checked={onlyLearned} onChange={(e) => setOnlyLearned(e.target.checked)} /> Only what I've learned
      </label>
      {groups.map(([name, items]) => {
        const shown = items.filter(match)
        if (!shown.length) return null
        return (
          <section key={name}>
            <h3>{name}</h3>
            <ul className="list">
              {shown.map((i) => (
                <li key={i.id}>
                  <div className="stack tight">
                    <span className="row gap-sm">
                      <Mm text={i.my} size="sm" />
                      {state.introduced[i.id] && <span className="pill">learned</span>}
                    </span>
                    {i.rom && <Rom rom={i.rom} />}
                    <span className="small">{i.en}</span>
                  </div>
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
          </section>
        )
      })}
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
    </div>
  )
}

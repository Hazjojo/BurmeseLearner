import { useState } from 'react'
import type { Item } from '../content'
import { cleanBurmese } from '../lib/myanmar'
import { romProblems } from '../lib/checks.js'
import type { AppState } from '../lib/store'
import { Mm, RecordSlot, Rom } from '../components'

type Update = (fn: (s: AppState) => AppState) => void

/** Add a phrase from real life in a few seconds. It goes to the front of the new-item queue. */
export function QuickAdd({ update, onDone }: { update: Update; onDone: () => void }) {
  const [my, setMy] = useState('')
  const [en, setEn] = useState('')
  const [rom, setRom] = useState('')
  const [note, setNote] = useState('')
  const [savedId, setSavedId] = useState<string | null>(null)

  const cleaned = cleanBurmese(my)
  const romIssues = rom.trim() ? romProblems(rom.trim().normalize('NFC')) : []
  const canSave = cleaned.text && en.trim()

  const save = () => {
    const id = `u.${Date.now().toString(36)}`
    const item: Item = {
      id,
      strand: 'speak',
      unit: 0,
      my: cleaned.text,
      rom: rom.trim().normalize('NFC'),
      en: en.trim(),
      note: note.trim() || undefined,
      custom: true,
    }
    update((s) => ({ ...s, custom: [...s.custom, item] }))
    setSavedId(id)
  }

  if (savedId) {
    return (
      <div className="screen">
        <h2>Added ✓</h2>
        <p className="muted">It will come up first among your new items.</p>
        <div className="card">
          <div className="stack">
            <Mm text={cleaned.text} size="lg" />
            {rom && <Rom rom={rom} />}
            <div>{en}</div>
            <p className="small muted">Got a native speaker nearby? Record it now:</p>
            <RecordSlot itemId={savedId} />
          </div>
        </div>
        <div className="row gap-sm">
          <button
            className="btn"
            onClick={() => {
              setSavedId(null)
              setMy('')
              setEn('')
              setRom('')
              setNote('')
            }}
          >
            Add another
          </button>
          <button className="btn primary wide" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="row between">
        <h2>Add a phrase</h2>
        <button className="btn small" onClick={onDone}>
          Cancel
        </button>
      </div>
      <label className="field">
        <span>Burmese</span>
        <textarea lang="my" className="mm mm-sm" value={my} onChange={(e) => setMy(e.target.value)} placeholder="Type or paste Burmese" />
        {cleaned.converted && (
          <span className="small ok">
            Converted from Zawgyi to Unicode: <Mm text={cleaned.text} size="sm" />
          </span>
        )}
        {cleaned.problems.length > 0 && <span className="small error">This text looks malformed: {cleaned.problems[0]}</span>}
      </label>
      <label className="field">
        <span>Meaning</span>
        <input type="text" value={en} onChange={(e) => setEn(e.target.value)} placeholder="English" />
      </label>
      <label className="field">
        <span>Romanization (optional)</span>
        <input type="text" value={rom} onChange={(e) => setRom(e.target.value)} placeholder="e.g. nèi káun lá" />
        {rom && <Rom rom={rom} />}
        {romIssues.length > 0 && <span className="small muted">Tip: {romIssues[0]} (marks: à low, á high, a̰ creaky, aʔ checked, ə weak)</span>}
      </label>
      <label className="field">
        <span>Note (optional)</span>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Where you heard it, who says it…" />
      </label>
      <div className="actions">
        <button className="btn primary wide" disabled={!canSave} onClick={save}>
          Save
        </button>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { listeners, loadState, saveState, type AppState } from './lib/store'
import { getScheduler } from './lib/srs'
import type { Sync } from './lib/sync'
import { Session } from './screens/Session'
import { Browse, Partner, Settings, Today } from './screens/Other'
import { Tones } from './screens/Tones'
import { QuickAdd } from './screens/QuickAdd'
import { SyncPanel } from './screens/SyncPanel'

type Tab = 'today' | 'tones' | 'browse' | 'partner' | 'settings'

export default function App() {
  const [state, setState] = useState<AppState | null>(null)
  const [tab, setTab] = useState<Tab>('today')
  const [overlay, setOverlay] = useState<'session' | 'add' | null>(null)
  const [sync, setSync] = useState<Sync | null>(null)
  const [, bump] = useState(0)
  const latest = useRef<AppState | null>(null)

  const replace = useCallback((s: AppState) => {
    latest.current = s
    setState(s)
    saveState(s)
  }, [])

  useEffect(() => {
    loadState().then((s) => {
      latest.current = s
      setState(s)
      // Cloud sync only exists when served from Firebase Hosting; load it lazily.
      import('./lib/sync')
        .then((m) => m.initSync())
        .then((sy) => {
          if (!sy) return
          setSync(sy)
          sy.onChange(() => bump((x) => x + 1))
          listeners.rec = (id, blob) => sy.uploadRecording(id, blob)
          listeners.log = (l) => sy.pushLog(l)
          sy.watchUser(async () => replace(await sy.fullSync(latest.current!)))
        })
        .catch(() => {})
    })
  }, [replace])

  useEffect(() => {
    if (state) getScheduler(state.settings.desiredRetention)
  }, [state?.settings.desiredRetention]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback(
    (fn: (s: AppState) => AppState) => {
      const prev = latest.current!
      const next = { ...fn(prev), updatedAt: new Date().toISOString() }
      latest.current = next
      setState(next)
      saveState(next)
      sync?.push(prev, next)
    },
    [sync],
  )

  if (!state) return <div className="screen center muted">Loading…</div>

  if (overlay === 'session') return <Session state={state} update={update} onExit={() => setOverlay(null)} />
  if (overlay === 'add') return <QuickAdd update={update} onDone={() => setOverlay(null)} />

  return (
    <div className="app">
      <main>
        {tab === 'today' && <Today state={state} onStart={() => setOverlay('session')} onAdd={() => setOverlay('add')} />}
        {tab === 'tones' && <Tones state={state} update={update} />}
        {tab === 'browse' && <Browse state={state} update={update} onAdd={() => setOverlay('add')} />}
        {tab === 'partner' && <Partner state={state} update={update} />}
        {tab === 'settings' && (
          <>
            <Settings state={state} update={update} />
            <SyncPanel sync={sync} onSyncNow={async () => sync && replace(await sync.fullSync(latest.current!))} />
          </>
        )}
      </main>
      <nav className="tabs">
        {(
          [
            ['today', 'Today'],
            ['tones', 'Tones'],
            ['browse', 'Items'],
            ['partner', 'Partner'],
            ['settings', 'Settings'],
          ] as const
        ).map(([t, label]) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {label}
            {t === 'settings' && sync?.status === 'error' ? ' ⚠' : ''}
          </button>
        ))}
      </nav>
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { loadState, saveState, type AppState } from './lib/store'
import { getScheduler } from './lib/srs'
import { Session } from './screens/Session'
import { Browse, Partner, Settings, Today } from './screens/Other'

type Tab = 'today' | 'browse' | 'partner' | 'settings'

export default function App() {
  const [state, setState] = useState<AppState | null>(null)
  const [tab, setTab] = useState<Tab>('today')
  const [inSession, setInSession] = useState(false)
  const latest = useRef<AppState | null>(null)

  useEffect(() => {
    loadState().then((s) => {
      latest.current = s
      setState(s)
    })
  }, [])

  useEffect(() => {
    if (state) getScheduler(state.settings.desiredRetention)
  }, [state?.settings.desiredRetention]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback((fn: (s: AppState) => AppState) => {
    const next = fn(latest.current!)
    latest.current = next
    setState(next)
    saveState(next)
  }, [])

  if (!state) return <div className="screen center muted">Loading…</div>

  if (inSession) return <Session state={state} update={update} onExit={() => setInSession(false)} />

  return (
    <div className="app">
      <main>
        {tab === 'today' && <Today state={state} onStart={() => setInSession(true)} />}
        {tab === 'browse' && <Browse state={state} />}
        {tab === 'partner' && <Partner state={state} update={update} />}
        {tab === 'settings' && <Settings state={state} update={update} />}
      </main>
      <nav className="tabs">
        {(
          [
            ['today', 'Today'],
            ['browse', 'Items'],
            ['partner', 'Partner'],
            ['settings', 'Settings'],
          ] as const
        ).map(([t, label]) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}

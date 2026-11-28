import { useCallback, useEffect, useRef, useState } from 'react'
import { listeners, loadState, saveState, type AppState } from './lib/store'
import { getScheduler } from './lib/srs'
import type { Sync } from './lib/sync'
import { Course, Home, LessonView, ReviewView } from './screens/Learn'
import { Phrasebook, Settings } from './screens/Other'
import { DialoguePlayer, Practice, type Dialogue } from './screens/Practice'
import { setAISync } from './lib/ai'
import { QuickAdd } from './screens/QuickAdd'
import { SyncPanel } from './screens/SyncPanel'
import { ErrorBoundary } from './ErrorBoundary'

type Tab = 'home' | 'course' | 'tones' | 'phrases' | 'settings'
type Overlay = { kind: 'lesson'; id: string } | { kind: 'review' } | { kind: 'add' } | { kind: 'dialogue'; d: Dialogue } | null

export default function App() {
  const [state, setState] = useState<AppState | null>(null)
  const [tab, setTab] = useState<Tab>('home')
  const [overlay, setOverlay] = useState<Overlay>(null)
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
          setAISync(sy)
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

  const close = () => setOverlay(null)
  const guard = (node: React.ReactNode) => (
    <ErrorBoundary key={`${tab}-${overlay?.kind ?? ''}`} onReset={() => (setOverlay(null), setTab('home'))}>
      {node}
    </ErrorBoundary>
  )
  if (overlay?.kind === 'lesson') return guard(<LessonView key={overlay.id} lessonId={overlay.id} state={state} update={update} onExit={close} />)
  if (overlay?.kind === 'review') return guard(<ReviewView state={state} update={update} onExit={close} />)
  if (overlay?.kind === 'add') return guard(<QuickAdd update={update} onDone={close} />)
  if (overlay?.kind === 'dialogue') return guard(<DialoguePlayer d={overlay.d} state={state} update={update} onExit={close} />)

  const banner =
    sync && !sync.user ? (
      <div className="banner">
        <span className="small">Sign in to sync progress across your devices.</span>
        <button className="btn small primary" onClick={() => sync.signIn().catch((e) => alert(e instanceof Error ? e.message : String(e)))}>
          Sign in with Google
        </button>
      </div>
    ) : sync?.status === 'error' ? (
      <div className="banner error small">⚠ Sync problem: {sync.lastError}</div>
    ) : null

  const openLesson = (id: string) => setOverlay({ kind: 'lesson', id })
  return (
    <div className="app">
      <main>
        {guard(<>
        {tab === 'home' && <Home state={state} banner={banner} onLesson={openLesson} onReview={() => setOverlay({ kind: 'review' })} onCourse={() => setTab('course')} />}
        {tab === 'course' && <Course state={state} onLesson={openLesson} onDialogue={(d) => setOverlay({ kind: 'dialogue', d })} />}
        {tab === 'tones' && <Practice state={state} update={update} sync={sync} />}
        {tab === 'phrases' && <Phrasebook state={state} update={update} onAdd={() => setOverlay({ kind: 'add' })} />}
        {tab === 'settings' && (
          <>
            <Settings state={state} update={update} />
            <SyncPanel sync={sync} onSyncNow={async () => sync && replace(await sync.fullSync(latest.current!))} />
          </>
        )}
        </>)}
      </main>
      <nav className="tabs">
        {(
          [
            ['home', '🏠', 'Home'],
            ['course', '🗺️', 'Course'],
            ['tones', '🎧', 'Practice'],
            ['phrases', '📖', 'Phrases'],
            ['settings', '⚙️', 'Settings'],
          ] as const
        ).map(([t, icon, label]) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            <span className="tab-icon">{icon}</span>
            {label}
            {t === 'settings' && sync?.status === 'error' ? ' ⚠' : ''}
          </button>
        ))}
      </nav>
    </div>
  )
}

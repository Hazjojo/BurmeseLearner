import { useState } from 'react'
import type { Sync } from '../lib/sync'

export function SyncPanel({ sync, onSyncNow, reminder, onReminder }: { sync: Sync | null; onSyncNow: () => void; reminder: string; onReminder: (t: string) => void }) {
  const [time, setTime] = useState(reminder || '19:00')
  const [rmsg, setRmsg] = useState('')
  const setRem = async (t: string) => {
    setRmsg('')
    try {
      await sync!.setReminder(t)
      onReminder(t)
      setRmsg(t ? `Reminder set for ${t} each day (skipped if you've already practised).` : 'Reminder off.')
    } catch (e) {
      setRmsg(e instanceof Error ? e.message : String(e))
    }
  }
  const [err, setErr] = useState('')
  return (
    <div className="screen pt0">
      <h3>Cloud sync</h3>
      {!sync ? (
        <p className="muted small">Not available here. Sync turns on automatically when the app runs from its Firebase address (see docs/deploy.md).</p>
      ) : !sync.user ? (
        <>
          <p className="muted small">Sign in to back up progress and recordings, and to use the app on more than one device.</p>
          <button className="btn primary" onClick={() => sync.signIn().catch((e) => setErr(e instanceof Error ? e.message : String(e)))}>
            Sign in with Google
          </button>
        </>
      ) : (
        <>
          <p className="small">
            Signed in as {sync.user.email}.{' '}
            {sync.status === 'syncing' ? 'Syncing…' : sync.status === 'synced' ? 'Up to date ✓' : sync.status === 'error' ? '⚠ Sync problem' : ''}
          </p>
          {sync.status === 'error' && <p className="small error">{sync.lastError}</p>}
          <div className="row gap-sm">
            <button className="btn" onClick={onSyncNow}>
              Sync now
            </button>
            <button className="btn" onClick={() => sync.signOut()}>
              Sign out
            </button>
          </div>
        </>
      )}
      {err && <p className="small error">{err}</p>}
      <h3>Daily reminder</h3>
      {!sync?.user ? (
        <p className="muted small">Sign in (above) to get a daily reminder notification.</p>
      ) : (
        <>
          <p className="muted small">A notification at this time if you haven't practised yet that day. On iPhone it only works when the app is added to your Home Screen.</p>
          <div className="row gap-sm wrap">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="time-input" />
            <button className="btn primary" onClick={() => setRem(time)}>
              {reminder ? 'Update' : 'Turn on'}
            </button>
            {reminder && (
              <button className="btn" onClick={() => setRem('')}>
                Turn off
              </button>
            )}
          </div>
          {rmsg && <p className="small">{rmsg}</p>}
        </>
      )}
    </div>
  )
}

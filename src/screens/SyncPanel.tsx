import { useState } from 'react'
import type { Sync } from '../lib/sync'

export function SyncPanel({ sync, onSyncNow }: { sync: Sync | null; onSyncNow: () => void }) {
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
    </div>
  )
}

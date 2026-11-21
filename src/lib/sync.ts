// Cloud sync (Firestore + Cloud Storage), loaded lazily and only when the app is served by Firebase Hosting.
// Everything still works offline and locally; the cloud copy keeps phone and laptop in step and acts as a backup.
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import { deleteObject, getBytes, getMetadata, getStorage, listAll, ref, uploadBytes, type FirebaseStorage } from 'firebase/storage'
import { mergeStates } from './merge'
import { emptyState, getRecording, loadLogs, recordedIds, saveLogs, setRecording, type AppState } from './store'
import type { StoredLog } from './srs'

export type SyncStatus = 'signed-out' | 'syncing' | 'synced' | 'error'

// Firestore document ids can't contain '/'.
const docId = (s: string) => s.replace(/\//g, '∕')
const logId = (l: StoredLog) => docId(`${l.key}|${l.reviewTime}`)
const recPath = (uid: string, id: string) => `users/${uid}/rec/${encodeURIComponent(id)}`

export class Sync {
  user: User | null = null
  status: SyncStatus = 'signed-out'
  lastError = ''
  private listeners = new Set<() => void>()
  private stateTimer: ReturnType<typeof setTimeout> | null = null
  private storage: FirebaseStorage | null

  constructor(
    private app: FirebaseApp,
    private db: Firestore,
  ) {
    try {
      this.storage = getStorage(app)
    } catch {
      this.storage = null // Storage not enabled (needs the Blaze plan); recordings stay on the device
    }
  }

  onChange(fn: () => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  private set(status: SyncStatus, err = '') {
    this.status = status
    this.lastError = err
    this.listeners.forEach((f) => f())
  }

  watchUser(onSignedIn: (u: User) => void) {
    // Surface errors from a redirect sign-in instead of silently coming back signed out.
    getRedirectResult(getAuth(this.app)).catch((e) => this.set('error', `Sign-in failed: ${e instanceof Error ? e.message : e}`))
    onAuthStateChanged(getAuth(this.app), (u) => {
      this.user = u
      if (u) onSignedIn(u)
      else this.set('signed-out')
    })
  }

  async signIn() {
    const auth = getAuth(this.app)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (e) {
      // Installed iOS web apps often block popups; fall back to a full-page redirect.
      if (e instanceof Error && /popup/i.test(e.message)) await signInWithRedirect(auth, provider)
      else throw e
    }
  }
  signOut = () => signOut(getAuth(this.app))

  private userDoc = () => doc(this.db, 'users', this.user!.uid)

  /** Pull the cloud copy, merge with this device, and push the merged result back. Returns the merged state. */
  async fullSync(local: AppState): Promise<AppState> {
    if (!this.user) return local
    this.set('syncing')
    try {
      const uid = this.user.uid
      const [snap, cardSnaps, logSnaps] = await Promise.all([
        getDoc(this.userDoc()),
        getDocs(collection(this.db, 'users', uid, 'cards')),
        getDocs(collection(this.db, 'users', uid, 'logs')),
      ])
      const remote: AppState = { ...emptyState(), ...(snap.data() as Partial<AppState> | undefined), cards: {} }
      cardSnaps.forEach((d) => (remote.cards[d.id.replace(/∕/g, '/')] = d.data() as AppState['cards'][string]))
      const merged = mergeStates(local, remote)

      // Push merged cards that differ from the cloud copy.
      let batch = writeBatch(this.db)
      let n = 0
      const flush = async () => {
        if (n) await batch.commit()
        batch = writeBatch(this.db)
        n = 0
      }
      for (const [k, c] of Object.entries(merged.cards)) {
        if (JSON.stringify(remote.cards[k]) === JSON.stringify(c)) continue
        batch.set(doc(this.db, 'users', uid, 'cards', docId(k)), c)
        if (++n >= 400) await flush()
      }
      // Review logs: union of both sides.
      const localLogs = await loadLogs()
      const remoteLogIds = new Set(logSnaps.docs.map((d) => d.id))
      for (const l of localLogs) {
        if (remoteLogIds.has(logId(l))) continue
        batch.set(doc(this.db, 'users', uid, 'logs', logId(l)), l)
        if (++n >= 400) await flush()
      }
      await flush()
      const localIds = new Set(localLogs.map(logId))
      const missing = logSnaps.docs.filter((d) => !localIds.has(d.id)).map((d) => d.data() as StoredLog)
      if (missing.length) await saveLogs([...localLogs, ...missing].sort((a, b) => a.reviewTime.localeCompare(b.reviewTime)))

      await setDoc(this.userDoc(), stateDoc(merged))
      await this.syncRecordings().catch((e) => console.warn('Recording sync failed', e))
      this.set('synced')
      return merged
    } catch (e) {
      this.set('error', e instanceof Error ? e.message : String(e))
      return local
    }
  }

  /** Push incremental changes after a local update. */
  push(prev: AppState, next: AppState) {
    if (!this.user) return
    const uid = this.user.uid
    for (const [k, c] of Object.entries(next.cards)) {
      if (prev.cards[k] !== c) setDoc(doc(this.db, 'users', uid, 'cards', docId(k)), c).catch((e) => this.set('error', String(e)))
    }
    // The non-card part changes often while typing notes, so debounce it.
    if (this.stateTimer) clearTimeout(this.stateTimer)
    this.stateTimer = setTimeout(() => {
      setDoc(this.userDoc(), stateDoc(next))
        .then(() => this.set('synced'))
        .catch((e) => this.set('error', String(e)))
    }, 1500)
  }

  pushLog(l: StoredLog) {
    if (!this.user) return
    setDoc(doc(this.db, 'users', this.user.uid, 'logs', logId(l)), l).catch((e) => this.set('error', String(e)))
  }

  async uploadRecording(id: string, blob: Blob | undefined) {
    if (!this.user || !this.storage) return
    const r = ref(this.storage, recPath(this.user.uid, id))
    try {
      if (blob) await uploadBytes(r, blob, { contentType: blob.type || 'audio/webm' })
      else await deleteObject(r)
    } catch (e) {
      this.set('error', `Recording sync: ${e instanceof Error ? e.message : e}`)
    }
  }

  private async syncRecordings() {
    if (!this.user || !this.storage) return
    const uid = this.user.uid
    let remote: string[]
    try {
      remote = (await listAll(ref(this.storage, `users/${uid}/rec`))).items.map((i) => decodeURIComponent(i.name))
    } catch {
      return // Storage not set up yet
    }
    const local = await recordedIds()
    for (const id of local) if (!remote.includes(id)) await this.uploadRecording(id, await getRecording(id))
    for (const id of remote) {
      if (local.has(id)) continue
      try {
        const r = ref(this.storage, recPath(uid, id))
        const [bytes, meta] = await Promise.all([getBytes(r), getMetadata(r)])
        await setRecording(id, new Blob([bytes], { type: meta.contentType || 'audio/webm' }), false)
      } catch (e) {
        // A single bad recording shouldn't block syncing the rest.
        console.warn('Could not download recording', id, e)
      }
    }
  }
}

function stateDoc(s: AppState) {
  const { cards: _cards, ...rest } = s
  // Firestore rejects `undefined` values; JSON round-trip drops them.
  return JSON.parse(JSON.stringify(rest))
}

/** Returns a Sync instance when served from Firebase Hosting, otherwise null (local-only mode). */
export async function initSync(): Promise<Sync | null> {
  // Firebase Hosting serves the app at the root; anywhere else (e.g. GitHub Pages) is local-only.
  if (import.meta.env.BASE_URL !== '/') return null
  let config: Record<string, string>
  try {
    const res = await fetch('/__/firebase/init.json')
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null
    config = await res.json()
  } catch {
    return null
  }
  // Use the hosting domain for auth so sign-in works in Safari / installed web apps.
  if (/\.(web\.app|firebaseapp\.com)$/.test(location.hostname)) config.authDomain = location.hostname
  const app = initializeApp(config)
  const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
  return new Sync(app, db)
}

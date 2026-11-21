// Integration test for cloud sync against the Firebase emulators. Run with: npm run test:sync
import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth'
import { connectFirestoreEmulator, doc, getDoc, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { clear } from 'idb-keyval'
import { Sync } from '../src/lib/sync'
import { appendLog, emptyState, getRecording, loadLogs, setRecording, type AppState } from '../src/lib/store'
import type { StoredCard, StoredLog } from '../src/lib/srs'

const app = initializeApp({ projectId: 'demo-burmeselearner', apiKey: 'demo-key', storageBucket: 'demo-burmeselearner.appspot.com' })
const auth = getAuth(app)
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
const db = getFirestore(app)
connectFirestoreEmulator(db, '127.0.0.1', 8080)
connectStorageEmulator(getStorage(app), '127.0.0.1', 9199)

const card = (reviewed: string, reps: number): StoredCard =>
  ({ dueAt: '2027-01-01T00:00:00.000Z', lastReviewAt: reviewed, state: 2, reps, lapses: 0, stability: 3 }) as StoredCard
const log = (key: string, t: string): StoredLog => ({ key, rating: 3, reviewTime: t, state: 2 }) as StoredLog

describe('cloud sync (emulators)', () => {
  it('merges two devices without losing reviews, and isolates users', async () => {
    const email = `t${Date.now()}@example.com`
    const cred = await createUserWithEmailAndPassword(auth, email, 'password1')
    const uid = cred.user.uid

    // Device A: two cards, a custom phrase with a recording, one review log.
    const sync = new Sync(app, db)
    sync.user = cred.user
    const a: AppState = {
      ...emptyState(),
      cards: { 'x__recog': card('2026-11-20T00:00:00.000Z', 2), 'y__recog': card('2026-11-19T00:00:00.000Z', 1) },
      custom: [{ id: 'u.1', strand: 'speak', unit: 0, my: 'ရေ', rom: 'yèi', en: 'water', custom: true }],
      updatedAt: '2026-11-20T00:00:00.000Z',
    }
    await setRecording('u.1', new Blob(['fake-audio'], { type: 'audio/webm' }), false)
    await appendLog(log('x__recog', '2026-11-20T00:00:00.000Z'))
    const afterA = await sync.fullSync(a)
    expect(sync.status, sync.lastError).toBe('synced')
    expect(Object.keys(afterA.cards).sort()).toEqual(['x__recog', 'y__recog'])

    // Device B: fresh storage, newer copy of x, a new card z.
    await clear()
    const b: AppState = {
      ...emptyState(),
      cards: { 'x__recog': card('2026-11-21T00:00:00.000Z', 3), 'z__glyph': card('2026-11-21T00:00:00.000Z', 1) },
      updatedAt: '2026-11-21T00:00:00.000Z',
    }
    const afterB = await sync.fullSync(b)
    expect(sync.status, sync.lastError).toBe('synced')
    expect(Object.keys(afterB.cards).sort()).toEqual(['x__recog', 'y__recog', 'z__glyph'])
    expect(afterB.cards['x__recog'].reps).toBe(3)
    expect(afterB.custom.map((c) => c.id)).toEqual(['u.1'])
    expect(await getRecording('u.1')).toBeInstanceOf(Blob) // downloaded from Storage
    expect((await loadLogs()).map((l) => l.key)).toContain('x__recog') // pulled from Firestore

    // Incremental push of a changed card.
    const next = { ...afterB, cards: { ...afterB.cards, 'w__recog': card('2026-11-22T00:00:00.000Z', 1) } }
    sync.push(afterB, next)
    await new Promise((r) => setTimeout(r, 2500))
    expect((await getDoc(doc(db, 'users', uid, 'cards', 'w__recog'))).exists()).toBe(true)

    // Another account can't read this user's data.
    await signOut(auth)
    await createUserWithEmailAndPassword(auth, `o${Date.now()}@example.com`, 'password1')
    await expect(getDoc(doc(db, 'users', uid))).rejects.toThrow() // denied by firestore.rules
  }, 60_000)
})

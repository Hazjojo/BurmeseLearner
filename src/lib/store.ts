import { get, set, del, keys } from 'idb-keyval'
import type { StoredCard, StoredLog } from './srs'
import type { Item } from '../content'
import type { Exercise, Outcome, RunnerSnapshot } from '../exercises'

export interface Settings {
  speaker: 'm' | 'f' | 'both'
  newPerDay: number
  showRom: boolean
  /** Hide romanization on the question side once an item is well known (tap to show). */
  fadeRom: boolean
  desiredRetention: number
}
export interface ItemMeta {
  checked?: boolean
  note?: string
}
export interface ToneTrial {
  t: string
  set: string
  /** index of the option played */
  asked: number
  /** index the learner chose */
  chose: number
}
export interface LessonDraft {
  at: string
  step: 'teach' | 'practice'
  ti: number
  exercises: Exercise[]
  drills: Item[]
  /** itemId → worst outcome so far */
  results: Record<string, Outcome>
  toneLog: ToneTrial[]
  runner?: RunnerSnapshot
}
export interface AppState {
  version: 1
  settings: Settings
  cards: Record<string, StoredCard>
  /** itemId → ISO date first met */
  introduced: Record<string, string>
  meta: Record<string, ItemMeta>
  /** Items I added myself (quick add). */
  custom: Item[]
  toneLog: ToneTrial[]
  /** lessonId → when completed and score (0–1). */
  lessons: Record<string, { at: string; score: number }>
  /** Lessons left part-way through, so they can be resumed (any device). */
  drafts: Record<string, LessonDraft>
  /** ISO time of the last local change (used when merging with the cloud copy). */
  updatedAt: string
}

export const DEFAULT_SETTINGS: Settings = { speaker: 'both', newPerDay: 8, showRom: true, fadeRom: true, desiredRetention: 0.9 }
export const emptyState = (): AppState => ({
  version: 1,
  settings: { ...DEFAULT_SETTINGS },
  cards: {},
  introduced: {},
  meta: {},
  custom: [],
  toneLog: [],
  lessons: {},
  drafts: {},
  updatedAt: new Date(0).toISOString(),
})

const STATE_KEY = 'state'
const LOG_KEY = 'revlog'
const recKey = (itemId: string) => `rec:${itemId}`

export async function loadState(): Promise<AppState> {
  try {
    const s = (await get(STATE_KEY)) as AppState | undefined
    if (!s) return emptyState()
    return { ...emptyState(), ...s, settings: { ...DEFAULT_SETTINGS, ...s.settings } }
  } catch {
    return emptyState()
  }
}
export const saveState = (s: AppState) => set(STATE_KEY, s)

/** Hooks for cloud sync (set by the app when signed in). */
export const listeners: { rec?: (id: string, blob?: Blob) => void; log?: (l: StoredLog) => void } = {}

export async function appendLog(log: StoredLog) {
  listeners.log?.(log)
  const logs = ((await get(LOG_KEY)) as StoredLog[] | undefined) ?? []
  logs.push(log)
  await set(LOG_KEY, logs)
}
export const loadLogs = async () => ((await get(LOG_KEY)) as StoredLog[] | undefined) ?? []
export const saveLogs = (logs: StoredLog[]) => set(LOG_KEY, logs)

export const getRecording = (itemId: string) => get(recKey(itemId)) as Promise<Blob | undefined>
export async function setRecording(itemId: string, blob: Blob, notify = true) {
  await set(recKey(itemId), blob)
  if (notify) listeners.rec?.(itemId, blob)
}
export async function deleteRecording(itemId: string) {
  await del(recKey(itemId))
  listeners.rec?.(itemId, undefined)
}
export async function recordedIds(): Promise<Set<string>> {
  const ks = (await keys()) as string[]
  return new Set(ks.filter((k) => typeof k === 'string' && k.startsWith('rec:')).map((k) => k.slice(4)))
}

// ---- Backup (until cloud sync exists, this is the safety net) ----

const blobToDataURL = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(b)
  })

export async function exportBackup(): Promise<Blob> {
  const [state, logs, ids] = await Promise.all([loadState(), loadLogs(), recordedIds()])
  const recordings: Record<string, string> = {}
  for (const id of ids) {
    const b = await getRecording(id)
    if (b) recordings[id] = await blobToDataURL(b)
  }
  const data = { app: 'burmeselearner', exportedAt: new Date().toISOString(), state, logs, recordings }
  return new Blob([JSON.stringify(data)], { type: 'application/json' })
}

export async function importBackup(file: File) {
  const data = JSON.parse(await file.text())
  if (data.app !== 'burmeselearner') throw new Error('Not a BurmeseLearner backup')
  await saveState(data.state)
  await set(LOG_KEY, data.logs ?? [])
  for (const [id, url] of Object.entries(data.recordings ?? {})) {
    const blob = await (await fetch(url as string)).blob()
    await setRecording(id, blob, false)
  }
}

import { get, set, del, keys } from 'idb-keyval'
import type { StoredCard, StoredLog } from './srs'

export interface Settings {
  speaker: 'm' | 'f' | 'both'
  newPerDay: number
  showRom: boolean
  desiredRetention: number
}
export interface ItemMeta {
  checked?: boolean
  note?: string
}
export interface AppState {
  version: 1
  settings: Settings
  cards: Record<string, StoredCard>
  /** itemId → ISO date first met */
  introduced: Record<string, string>
  meta: Record<string, ItemMeta>
}

export const DEFAULT_SETTINGS: Settings = { speaker: 'both', newPerDay: 8, showRom: true, desiredRetention: 0.9 }
const emptyState = (): AppState => ({ version: 1, settings: { ...DEFAULT_SETTINGS }, cards: {}, introduced: {}, meta: {} })

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

export async function appendLog(log: StoredLog) {
  const logs = ((await get(LOG_KEY)) as StoredLog[] | undefined) ?? []
  logs.push(log)
  await set(LOG_KEY, logs)
}
export const loadLogs = async () => ((await get(LOG_KEY)) as StoredLog[] | undefined) ?? []

export const getRecording = (itemId: string) => get(recKey(itemId)) as Promise<Blob | undefined>
export const setRecording = (itemId: string, blob: Blob) => set(recKey(itemId), blob)
export const deleteRecording = (itemId: string) => del(recKey(itemId))
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
    await setRecording(id, blob)
  }
}

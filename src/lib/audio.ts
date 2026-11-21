/** Pick a recording format the browser supports (Safari < 18.4 needs mp4). */
export function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  for (const t of ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus']) {
    if (MediaRecorder.isTypeSupported(t)) return t
  }
  return undefined
}

export interface Recorder {
  stop: () => Promise<Blob>
  cancel: () => void
}

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  })
  const mimeType = pickMimeType()
  const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  const chunks: BlobPart[] = []
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  rec.start()
  const release = () => stream.getTracks().forEach((t) => t.stop())
  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        rec.onstop = () => {
          release()
          resolve(new Blob(chunks, { type: rec.mimeType || mimeType || 'audio/webm' }))
        }
        rec.stop()
      }),
    cancel: () => {
      rec.onstop = release
      rec.stop()
    },
  }
}

let current: HTMLAudioElement | null = null
export function playBlob(blob: Blob, rate = 1): Promise<void> {
  current?.pause()
  const url = URL.createObjectURL(blob)
  const a = new Audio(url)
  a.playbackRate = rate
  current = a
  return new Promise((resolve) => {
    a.onended = a.onerror = () => {
      URL.revokeObjectURL(url)
      resolve()
    }
    a.play().catch(() => resolve())
  })
}

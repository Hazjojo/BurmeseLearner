import { useEffect, useRef, useState } from 'react'
import { splitRom } from './lib/checks.js'
import { getRecording, setRecording } from './lib/store'
import { playBlob, startRecording, type Recorder } from './lib/audio'

/** Burmese script, sized for reading. */
export function Mm({ text, size = 'lg' }: { text: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  return (
    <span className={`mm mm-${size}`} lang="my">
      {text}
    </span>
  )
}

/** Romanization with each syllable coloured by tone. */
export function Rom({ rom }: { rom: string }) {
  return (
    <span className="rom">
      {splitRom(rom).map((p, i) =>
        p.tone ? (
          <span key={i} className={`tone tone-${p.tone}`}>
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </span>
  )
}

export function ToneLegend() {
  return (
    <div className="legend">
      <span className="tone tone-low">à low</span>
      <span className="tone tone-high">á high</span>
      <span className="tone tone-creaky">a̰ creaky</span>
      <span className="tone tone-checked">aʔ checked</span>
      <span className="tone tone-weak">ə weak</span>
    </div>
  )
}

/** Plays the native recording for an item, if one exists. Optionally auto-plays once. */
export function PlayButton({ itemId, autoPlay = false, version = 0 }: { itemId: string; autoPlay?: boolean; version?: number }) {
  const [blob, setBlob] = useState<Blob | undefined>()
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let live = true
    setLoaded(false)
    getRecording(itemId).then((b) => {
      if (!live) return
      setBlob(b)
      setLoaded(true)
      if (b && autoPlay) playBlob(b)
    })
    return () => {
      live = false
    }
  }, [itemId, autoPlay, version])
  if (!loaded) return null
  if (!blob) return <span className="muted small">no audio yet</span>
  return (
    <span className="row gap-sm">
      <button className="btn icon" onClick={() => playBlob(blob)} aria-label="Play">
        ▶
      </button>
      <button className="btn icon" onClick={() => playBlob(blob, 0.7)} aria-label="Play slowly">
        🐢
      </button>
    </span>
  )
}

/** Record into an item's native-audio slot (partner mode / browse). */
export function RecordSlot({ itemId, onSaved }: { itemId: string; onSaved?: () => void }) {
  const [rec, setRec] = useState<Recorder | null>(null)
  const [err, setErr] = useState('')
  const toggle = async () => {
    setErr('')
    try {
      if (rec) {
        const blob = await rec.stop()
        setRec(null)
        await setRecording(itemId, blob)
        onSaved?.()
        playBlob(blob)
      } else {
        setRec(await startRecording())
      }
    } catch (e) {
      setRec(null)
      setErr(e instanceof Error ? e.message : 'Microphone unavailable')
    }
  }
  return (
    <span className="row gap-sm">
      <button className={`btn ${rec ? 'danger' : ''}`} onClick={toggle}>
        {rec ? '■ Stop' : '● Record'}
      </button>
      {err && <span className="error small">{err}</span>}
    </span>
  )
}

/** Record yourself and play it back next to the model. Nothing is saved, no score. */
export function RecordCompare({ itemId }: { itemId: string }) {
  const [rec, setRec] = useState<Recorder | null>(null)
  const mine = useRef<Blob | null>(null)
  const [hasMine, setHasMine] = useState(false)
  const toggle = async () => {
    if (rec) {
      mine.current = await rec.stop()
      setRec(null)
      setHasMine(true)
      const model = await getRecording(itemId)
      if (model) await playBlob(model)
      await playBlob(mine.current)
    } else {
      try {
        setRec(await startRecording())
      } catch {
        /* mic denied: silently ignore */
      }
    }
  }
  return (
    <span className="row gap-sm">
      <button className={`btn small ${rec ? 'danger' : ''}`} onClick={toggle}>
        {rec ? '■ Stop' : '🎙 Say it & compare'}
      </button>
      {hasMine && !rec && (
        <button className="btn small" onClick={() => mine.current && playBlob(mine.current)}>
          ▶ Me
        </button>
      )}
    </span>
  )
}

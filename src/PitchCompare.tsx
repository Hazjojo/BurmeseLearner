import { useEffect, useState } from 'react'
import { pitchContour } from './lib/pitch'
import { clipBlob } from './lib/speech'

/** Draw my pitch curve next to the native voice's. Pitch is only part of a Burmese tone, so this is a guide, not a score. */
export function PitchCompare({ my, mine }: { my: string; mine: Blob }) {
  const [curves, setCurves] = useState<{ model: number[]; me: number[] } | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    ;(async () => {
      const model = await clipBlob(my)
      if (!model) return setFailed(true)
      const [a, b] = await Promise.all([pitchContour(model), pitchContour(mine)])
      if (live) setCurves({ model: a, me: b })
    })().catch(() => setFailed(true))
    return () => {
      live = false
    }
  }, [my, mine])
  if (failed) return null
  if (!curves) return <span className="small muted">Drawing pitch…</span>
  const W = 300
  const H = 110
  const range = 8 // ± semitones shown
  const path = (c: number[]) => {
    let d = ''
    let pen = false
    c.forEach((v, i) => {
      if (isNaN(v)) return (pen = false)
      const x = (i / Math.max(1, c.length - 1)) * W
      const y = H / 2 - (Math.max(-range, Math.min(range, v)) / range) * (H / 2 - 6)
      d += `${pen ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `
      pen = true
    })
    return d
  }
  return (
    <div className="pitch">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Pitch of the native voice and of your recording">
        <line x1="0" x2={W} y1={H / 2} y2={H / 2} className="pitch-mid" />
        <path d={path(curves.model)} className="pitch-model" />
        <path d={path(curves.me)} className="pitch-me" />
      </svg>
      <div className="small pitch-legend">
        <span className="dot-model">━ native</span> <span className="dot-me">━ you</span>
        <span className="muted"> · pitch shape only; tones also differ in length and voice quality</span>
      </div>
    </div>
  )
}

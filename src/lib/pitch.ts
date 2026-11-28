import { PitchDetector } from 'pitchy'

/**
 * Pitch contour of a recording, in semitones relative to the speaker's own median
 * (so a man and a woman can be compared), resampled to `points` steps. NaN = no clear pitch.
 */
export async function pitchContour(blob: Blob, points = 60): Promise<number[]> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new Ctx()
  const buf = await ctx.decodeAudioData(await blob.arrayBuffer())
  ctx.close()
  const data = buf.getChannelData(0)
  const size = 2048
  const hop = 512
  const det = PitchDetector.forFloat32Array(size)
  const raw: number[] = []
  for (let i = 0; i + size <= data.length; i += hop) {
    const [p, clarity] = det.findPitch(data.subarray(i, i + size), buf.sampleRate)
    raw.push(clarity > 0.85 && p > 65 && p < 500 ? p : NaN)
  }
  // Trim silence at both ends.
  const first = raw.findIndex((x) => !isNaN(x))
  const last = raw.length - 1 - [...raw].reverse().findIndex((x) => !isNaN(x))
  if (first < 0) return []
  const voiced = raw.slice(first, last + 1)
  const sorted = voiced.filter((x) => !isNaN(x)).sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const semis = voiced.map((x) => (isNaN(x) ? NaN : 12 * Math.log2(x / median)))
  return Array.from({ length: points }, (_, i) => semis[Math.min(semis.length - 1, Math.floor((i / points) * semis.length))])
}

// Shared, dependency-free checks for Burmese text and romanization.
// Plain JS so both the app (TypeScript) and the Node content validator can import it.

/** @typedef {'low'|'high'|'creaky'|'checked'|'weak'|'none'} Tone */

const GRAVE = '̀'
const ACUTE = '́'
const TILDE_BELOW = '̰'

/**
 * Work out the tone of one romanized syllable.
 * @param {string} syl
 * @returns {Tone}
 */
export function toneOf(syl) {
  const d = syl.normalize('NFD')
  if (d.includes('ʔ')) return 'checked'
  if (d.includes(TILDE_BELOW)) return 'creaky'
  if (d.includes(ACUTE)) return 'high'
  if (d.includes(GRAVE)) return 'low'
  if (d.includes('ə')) return 'weak'
  return 'none'
}

/**
 * Split romanization into syllables, keeping separators so it can be re-rendered.
 * @param {string} rom
 * @returns {{text: string, tone: Tone | null}[]}
 */
export function splitRom(rom) {
  const parts = rom.split(/([\s\-]+|___)/).filter((p) => p !== '')
  return parts.map((p) => (/^[\s\-]+$|^___$/.test(p) ? { text: p, tone: null } : { text: p, tone: toneOf(p) }))
}

/**
 * Burmese consonants and independent letters a vowel sign / medial may attach to.
 */
const BASE = /[က-ဪဿ၎]/
const MEDIAL_OR_SIGN = /[ါ-ှ]/

/**
 * Detect likely Zawgyi (legacy encoding) or malformed Unicode Burmese.
 * Returns a list of human-readable problems; empty means it looks like valid Unicode.
 * @param {string} s
 * @returns {string[]}
 */
export function burmeseProblems(s) {
  const problems = []
  if (s !== s.normalize('NFC')) problems.push('not NFC-normalized')
  // Zawgyi-only glyph code points (U+1060–U+1097 used for stacked/variant forms; no Burmese use in Unicode).
  if (/[ၠ-႗]/.test(s)) problems.push('contains Zawgyi-style code points U+1060–U+1097')
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    const prev = s[i - 1] ?? ''
    // In Unicode, vowel signs/medials always follow a consonant (or another sign).
    if (MEDIAL_OR_SIGN.test(ch) && !(BASE.test(prev) || MEDIAL_OR_SIGN.test(prev) || prev === '္')) {
      problems.push(`sign U+${ch.codePointAt(0).toString(16).toUpperCase()} at position ${i} doesn't follow a consonant (Zawgyi typing order?)`)
    }
    // Virama (stacker) must be followed by a consonant.
    if (ch === '္' && !BASE.test(s[i + 1] ?? '')) problems.push(`stacker U+1039 at ${i} not followed by a consonant (Zawgyi uses it as asat)`)
  }
  return problems
}

/**
 * Validate a romanization string against the scheme in docs/romanization.md.
 * @param {string} rom
 * @returns {string[]}
 */
export function romProblems(rom) {
  const problems = []
  if (rom !== rom.normalize('NFC')) problems.push('romanization not NFC-normalized')
  for (const { text, tone } of splitRom(rom)) {
    if (tone === null) continue
    if (tone === 'none') problems.push(`syllable "${text}" has no tone mark`)
    const d = text.normalize('NFD')
    const marks = [GRAVE, ACUTE, TILDE_BELOW].filter((m) => d.includes(m)).length + (d.includes('ʔ') ? 1 : 0)
    if (marks > 1) problems.push(`syllable "${text}" has more than one tone mark`)
  }
  return problems
}

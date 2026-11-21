import { describe, expect, it } from 'vitest'
import { burmeseProblems, romProblems, splitRom, toneOf } from './checks.js'

describe('toneOf', () => {
  it('reads each tone mark', () => {
    expect(toneOf('là')).toBe('low')
    expect(toneOf('lá')).toBe('high')
    expect(toneOf('ya̰')).toBe('creaky')
    expect(toneOf('kḛ')).toBe('creaky') // precomposed e-with-tilde-below
    expect(toneOf('tiʔ')).toBe('checked')
    expect(toneOf('mə')).toBe('weak')
    expect(toneOf('la')).toBe('none')
  })
  it('splits romanization keeping separators', () => {
    expect(splitRom('mìn-gə-là').map((p) => p.tone)).toEqual(['low', null, 'weak', null, 'low'])
  })
})

describe('burmeseProblems', () => {
  it('accepts Unicode Burmese', () => {
    expect(burmeseProblems('မင်္ဂလာပါ')).toEqual([])
    expect(burmeseProblems('ကျေးဇူးတင်ပါတယ်')).toEqual([])
  })
  it('flags Zawgyi-ordered text', () => {
    expect(burmeseProblems('ေနေကာင္းလား').length).toBeGreaterThan(0)
  })
})

describe('romProblems', () => {
  it('requires a tone on every syllable', () => {
    expect(romProblems('nèi káun lá')).toEqual([])
    expect(romProblems('nei káun')).toHaveLength(1)
  })
})

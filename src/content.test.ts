import { describe, expect, it } from 'vitest'
import { DRILLS, getItem } from './content'

describe('pattern drills', () => {
  it('builds Burmese and voicing-aware romanization', () => {
    const want = getItem('g.pat.want.v.eat')!
    expect(want.my).toBe('စားချင်တယ်')
    expect(want.rom).toBe('sá jìn dè')
    expect(want.en).toBe('I want to eat')
    const drink = getItem('g.pat.want.v.drink')!
    expect(drink.rom).toBe('thauʔ chìn dè') // no voicing after a checked syllable
    expect(getItem('g.pat.neg.v.go')!.my).toBe('မသွားဘူး')
  })
  it('generates every pattern × verb', () => {
    expect(DRILLS.length).toBe(60)
  })
})

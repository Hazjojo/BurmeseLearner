import { describe, expect, it } from 'vitest'
import { cleanBurmese } from './myanmar'

describe('cleanBurmese', () => {
  it('leaves Unicode alone', () => {
    expect(cleanBurmese('နေကောင်းလား')).toEqual({ text: 'နေကောင်းလား', converted: false, problems: [] })
  })
  it('converts Zawgyi', () => {
    const r = cleanBurmese('ေနေကာင္းလား')
    expect(r.text).toBe('နေကောင်းလား')
    expect(r.converted).toBe(true)
  })
})

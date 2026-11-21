import { describe, expect, it } from 'vitest'
import { buildPrompt } from './prompt.js'

describe('buildPrompt', () => {
  it('includes the scenario, known words and transcript', () => {
    const { system, prompt } = buildPrompt({
      scenario: { title: 'Meal', setup: 'Dinner at a friend’s home.', role: 'Su, the host' },
      history: [{ who: 'ai', my: 'ထမင်းစားပြီးပြီလား', en: 'Have you eaten?' }, { who: 'me', my: 'စားပြီးပြီ' }],
      known: ['စား — eat'],
      speaker: 'm',
    })
    expect(system).toContain('Su, the host')
    expect(system).toContain('ကျွန်တော်')
    expect(prompt).toContain('စား — eat')
    expect(prompt).toContain('LEARNER: စားပြီးပြီ')
  })
  it('asks the AI to open when there is no history', () => {
    expect(buildPrompt({ scenario: { title: 'x', setup: 'y', role: 'z' }, history: [], known: [], speaker: 'both' }).prompt).toContain('Open it naturally')
  })
})

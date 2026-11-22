// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { emptyState } from '../lib/store'

vi.mock('../lib/ai', async (orig) => ({
  ...(await orig<typeof import('../lib/ai')>()),
  aiAvailable: () => true,
  converse: vi.fn(async () => ({
    reply: { my: 'မင်္ဂလာပါ', rom: 'mìn-gə-là-bà', en: 'Hello' },
    heard: '',
    feedback: '',
    better: { my: '', rom: '', en: '' },
    suggestions: [{ my: 'နေကောင်းလား', rom: 'nèi káun lá', en: 'How are you?' }],
    end: false,
    audio: null,
  })),
}))

import { Conversation } from './Conversation'
Element.prototype.scrollIntoView = () => {}
HTMLMediaElement.prototype.play = () => Promise.resolve()

describe('Conversation', () => {
  it('opens a scenario and shows the partner’s first line', async () => {
    const errors: unknown[] = []
    const onErr = (e: ErrorEvent) => errors.push(e.error)
    window.addEventListener('error', onErr)
    const ui = render(<Conversation state={emptyState()} sync={{ user: {} } as never} onExit={() => {}} />)
    fireEvent.click(ui.getByText('Meeting someone new'))
    await waitFor(() => expect(ui.getAllByText('မင်္ဂလာပါ').length).toBeGreaterThan(0))
    expect(errors).toEqual([])
  })
})

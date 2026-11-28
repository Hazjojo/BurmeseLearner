// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react'
afterEach(cleanup)
import { emptyState } from '../lib/store'

vi.mock('../lib/audio', async (orig) => ({
  ...(await orig<typeof import('../lib/audio')>()),
  openMic: vi.fn(async () => ({ getTracks: () => [] })),
  recordFrom: vi.fn(() => ({ stop: async () => new Blob(['x'], { type: 'audio/webm' }), cancel: () => {} })),
  playBlob: vi.fn(async () => {}),
}))

vi.mock('../lib/ai', async (orig) => ({
  ...(await orig<typeof import('../lib/ai')>()),
  aiAvailable: () => true,
  warmUp: () => {},
  converse: vi.fn(async (_input: unknown, rec?: Blob) => ({
    reply: { my: 'မင်္ဂလာပါ', rom: 'mìn-gə-là-bà', en: 'Hello' },
    learner: { my: '', rom: '', en: '' },
    heardText: null,
    ...(rec ? { learner: { my: 'နေကောင်းပါတယ်', rom: 'nèi káun bà dè', en: "I'm well" }, heardText: 'နေကောင်းပါတယ်' } : {}),
    feedback: '',
    better: { my: '', rom: '', en: '' },
    suggestions: [{ my: 'နေကောင်းလား', rom: 'nèi káun lá', en: 'How are you?' }],
    end: false,
    audio: null,
  })),
}))

import { Conversation } from './Conversation'
// Mimic newer browsers, where scrollIntoView returns a Promise (this used to crash the screen).
Element.prototype.scrollIntoView = (() => Promise.resolve()) as never
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

describe('Hold to talk', () => {
  it('records while held, then shows what I said with romanization and the reply', async () => {
    const ui = render(<Conversation state={emptyState()} sync={{ user: {} } as never} onExit={() => {}} />)
    fireEvent.click(ui.getByText('Meeting someone new'))
    const btn = await ui.findByLabelText('Hold to talk')
    await waitFor(() => expect((btn as HTMLButtonElement).disabled).toBe(false))
    fireEvent.pointerDown(btn)
    await new Promise((r) => setTimeout(r, 600))
    fireEvent.pointerUp(btn)
    await waitFor(() => expect(ui.getByText('nèi', { exact: false })).toBeTruthy())
    expect(ui.getAllByText('မင်္ဂလာပါ').length).toBeGreaterThan(1) // the partner replied again
  })
})

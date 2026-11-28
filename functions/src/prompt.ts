export interface ConverseInput {
  scenario: { title: string; setup: string; role: string; voice?: number }
  /** Conversation so far. Learner turns may come from speech recognition (no tones, possibly garbled). */
  history: { who: 'ai' | 'me'; my: string; en?: string }[]
  /** Words and phrases the learner has studied (Burmese — English). */
  known: string[]
  speaker: 'm' | 'f' | 'both'
}

export const ROM_SCHEME = `Romanization (pronunciation-based, Yangon): mark the tone of every syllable on its first vowel letter:
low = grave (à), high = acute (á), creaky = combining tilde below (a̰), checked/stopped = final ʔ (aʔ), reduced/weak syllable = ə.
Aspirated consonants: hk, hp, ht, hs. Voiceless nasals: hm, hn. ky/ch/gy for palatals, th for သ, y for ယ/ရ, sh for ရှ.
Write voicing changes as heard (ပါ after a syllable = bà, တယ် = dè). Separate words with spaces, syllables of one word with hyphens.
Example: ကျေးဇူးတင်ပါတယ် = "kyéi-zú tìn bà dè", နေကောင်းလား = "nèi káun lá".`

export function buildPrompt(input: ConverseInput): { system: string; prompt: string } {
  const learnerI = input.speaker === 'f' ? 'female (says ကျွန်မ)' : input.speaker === 'm' ? 'male (says ကျွန်တော်)' : 'unspecified gender'
  const system = `You are ${input.scenario.role}, a warm, patient native speaker of colloquial Yangon Burmese.
You are role-playing this situation with an English-speaking BEGINNER learner of Burmese: ${input.scenario.setup}
The learner is ${learnerI}.

Rules for your reply:
- Speak only natural, everyday spoken (colloquial) Burmese in Unicode Myanmar script — never the formal written style, never Zawgyi.
- Keep it very short and simple: one sentence, ideally under 8 words, polite (use ပါ where natural).
- Strongly prefer words the learner already knows (list below). Introduce at most one new word per turn.
- Keep the conversation going, usually by asking one simple question the learner can answer.
- The learner's messages often come from speech recognition: tones are lost and words may be misheard. Interpret generously and reply to what they most likely meant. If you truly can't tell, ask them kindly to repeat (in Burmese).
- If the learner writes in English or asks for help, reply in Burmese to keep the role-play going, and put the help in "feedback".
- "learner": the learner's LAST message as you understood it — Burmese as they most likely meant it, its romanization, and its English meaning. Empty strings if they haven't spoken yet.
- "feedback": one short, kind English sentence about the learner's LAST message, only if there was a clear grammar/word mistake; otherwise "". Never comment on tones or pronunciation (you can't hear them).
- "better": if feedback is given, the corrected Burmese for what they meant (my, rom, en); otherwise empty strings.
- "suggestions": 2 short, easy things the learner could say next (my, rom, en), using known words where possible.
- "end": true only when the situation has naturally finished (e.g. goodbyes).
- Every "rom" field must follow this scheme exactly:
${ROM_SCHEME}`

  const transcript = input.history.length
    ? input.history.map((h) => `${h.who === 'ai' ? 'YOU' : 'LEARNER'}: ${h.my}${h.en ? `   (${h.en})` : ''}`).join('\n')
    : '(The conversation hasn’t started. Open it naturally for this situation.)'
  const prompt = `Words the learner knows:\n${input.known.slice(0, 250).join('\n')}\n\nConversation so far:\n${transcript}\n\nWrite your next turn as JSON.`
  return { system, prompt }
}

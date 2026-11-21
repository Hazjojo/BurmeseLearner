# BurmeseLearner — Vision & Roadmap

> Evidence: [`reports/Effective Burmese learning app.md`](reports/Effective%20Burmese%20learning%20app.md) (full report) and [`research_notes/`](research_notes/Effective%20Burmese%20learning%20app/) (raw notes). This file is the decision record: what we build, what we don't, and in what order.

---

## 1. Vision

**A personal Burmese learning tool built only around what helps someone learn a language. It has no commercial goals.**

- **One learner, me.** It's hosted on Firebase only so I can use it on my phone.
- **No business incentive.** It doesn't need to keep me hooked, sell me anything, or look good in a dashboard. Every feature has to answer one question: *does this help me understand and speak Burmese?*
- **Goal: to understand and speak everyday spoken Burmese.** Reading is taught because it supports speaking and lets me use real material, not as an end in itself.

### What "language learning paradise" means here
Commercial apps are shaped by things that have nothing to do with learning: free-tier limits (hearts/energy), retention and daily-user targets (streaks, leagues, notifications), fixed content for millions of users, and avoiding anything hard. Dropping those lets this app:
- **Never limit practice.** Study as much or as little as I want.
- **Be built around my own life.** Phrases from my conversations, tutor sessions and Burmese people I know go straight into the review queue.
- **Be honest.** Show real retention numbers and what I actually get wrong, not encouragement designed to keep me coming back.
- **Use the best tools available.** At one-user scale, premium speech/AI services cost cents.
- **Adapt to me.** Use FSRS settings tuned on my own review history, extra practice on my weak tones, and content chosen to fit my interests.

---

## 2. What the evidence says helps (business-free reading of the research)

The research mixed two kinds of findings: *what makes people learn* and *what keeps users in an app*. Only the first matters here.

### Strong evidence: the core of the app
| Technique | Evidence | In the app |
|---|---|---|
| **Retrieval practice** (recall, don't reread) | Testing beats restudy, g ≈ 0.50, 0.69 at delays >1 day (Rowland 2014). One of only two "high utility" techniques (Dunlosky 2013) | Every review asks me to produce the answer |
| **Spacing** | Medium-to-large effect across 48 L2 experiments (Kim & Webb 2022) | FSRS schedules everything |
| **Productive recall** (English → Burmese) | Builds spelling and form knowledge, which recognition doesn't (Nakata) | Production cards unlock once I know a card receptively |
| **Tone/sound perception training** (high-variability phonetic training, HVPT) | Mandarin tone ID went from 69% to 90% in 8 sessions and held for 6 months (Wang 1999); carries over to production (meta-analysis of 31 studies) | Dedicated tone & sound trainer |

### Moderate evidence: worth building
| Technique | Evidence | In the app |
|---|---|---|
| Short explicit grammar notes | Explicit > implicit instruction (d ≈ 1.13 vs 0.54), with caveats | One-screen notes on particles and sentence endings |
| Chunks / phrases as units | Collocation instruction d ≈ 1.4 (small studies) | Phrase cards, not just single words |
| Prompt to self-correct before revealing the answer | Prompts beat simply giving the answer (Lyster & Saito) | Wrong answer → hint → second try → reveal |
| Lots of input I mostly understand | Helps, but beginners can't reach the 95–98% known-word coverage needed for native material | Graded micro-stories built from words I already know |
| Speech-recognition pronunciation practice | g ≈ 0.69, but **only with sustained practice**; weaker for tones (g ≈ 0.37) | Phase 2 speaking drills, used regularly |
| Speaking practice + corrective feedback with real people | Interaction & output research; a chatbot only partly substitutes | Support for a human tutor (see Phase 1.x) |

### Leaving out because there's no learning evidence (it's mostly for engagement)
Leaderboards, XP, gems, hearts/energy, league notifications, guilt messages, streak-saving lessons, and "learning style" modes. **The streak goes completely.**

### What's left of "motivation" for one person
The research on lasting motivation points to **autonomy and feeling competent**, not rewards. For a single learner, that means:
- I choose my daily load (new cards/day) and can pause without penalty
- Visible, *honest* progress: "you can now tell creaky vs high tone 85% of the time", "you know 640 phrases"
- Short sessions are fine; regular use with short breaks is what matters
- Content I care about (my own phrases)

---

## 3. Product principles

1. **Learning first, always.** If a feature doesn't help me learn, it's out.
2. **Recall over recognition.** Multiple choice only when meeting an item for the first time.
3. **One scheduler (FSRS) for everything:** words, phrases, script, tone pairs, my own cards.
4. **Audio on every item.** Burmese tone is pitch + length + voice quality, which text can't show.
5. **Spoken Burmese first.** Colloquial register and particles; literary register later and optional.
6. **My life is the curriculum.** Adding a card from a real conversation must take seconds.
7. **Honest feedback.** No fake precision; "didn't catch that" beats a wrong score.
8. **No practice limits, no guilt.**
9. **Works offline on my phone.**
10. **Keep it simple.** One user means no admin, no multi-tenant logic, no analytics pipeline.

---

## 4. The learning loop

```
  CAPTURE ──► MEET ──► REVIEW (daily, FSRS) ──► APPLY ──► SPEAK
     ▲                                                      │
     └──────── phrases from tutors / real conversations ◄───┘

  CAPTURE  course items + my own phrases (type/paste/record; Zawgyi auto-converted)
  MEET     audio + script + meaning + 1-line note (one easy recognition check)
  REVIEW   1. listen → meaning   2. read → meaning/sound   3. English → say it / build it
           wrong → hint ("check the tone") → retry → reveal
  APPLY    micro-stories & dialogues at ~98% known words
  SPEAK    record & compare → (phase 2) speaking drills and AI role-play
```

Alongside the loop:
- **Tone & sound trainer:** hear a minimal pair, pick which one you heard, get instant feedback, several voices. It automatically gives more practice on the contrasts I keep missing.
- **Script trainer:** glyphs introduced a few at a time with audio, in the same review queue; romanization fades out as I improve.

---

## 5. Content strategy

Content is still the hard part. Since this is for personal use, there are more options:

| Source | Use |
|---|---|
| **My own phrases** | From conversations, tutors, Burmese people I know. Highest value: relevant and tested in real life |
| **A tutor** (e.g. italki) | Checks content, records audio, corrects my speaking. The best single "feature" for speaking, according to the interaction research |
| **Textbooks I own** (e.g. Okell, *Colloquial Burmese*) | Typed in for personal study, following their lesson order |
| **Okell's *Burmese by Ear*** (SOAS, free download) | Listening material for personal use |
| **Azure Burmese neural voices (Nilar / Thiha)** | Audio for every item that doesn't have a human recording. The free tier (0.5M characters/month) easily covers one learner. Tone accuracy unverified, so check against a native speaker when possible |
| myWord frequency lists (MIT), Tatoeba (CC BY), SLR80 (CC BY-SA) | Starting points for frequency order and example sentences (biased toward written Burmese) |

**Privacy note:** textbook and *Burmese by Ear* material is fine for **personal** study but shouldn't be on a public URL. Files on Firebase Hosting are public to anyone who has the link. So:
- **Course structure and my own content:** JSON in the repo (keep the GitHub repo **private**).
- **Copyrighted material & audio:** Cloud Storage or Firestore, readable only by my account (security rules locked to my user ID).

**Starting targets:** ~300 core colloquial items + my own phrases, ~10 tone/sound pair sets, the full script. Grow continuously instead of in big releases.

**Text rules:** Unicode only; Zawgyi detected and converted on input (`myanmar-tools`); text normalized before answers are compared.

---

## 6. Architecture

Single user, so this can stay very small.

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vite + React + TypeScript, installable PWA (`vite-plugin-pwa`) | Install to phone home screen; works offline |
| Scheduling | `ts-fsrs` 6.x (MIT), FSRS model version pinned, target retention ≈ 0.9 (adjustable) | Optimize parameters on my own review log once there's enough history |
| Auth | Google sign-in; **security rules allow only my user ID** | No anonymous/account-linking logic |
| Data | Firestore: card state + full review log + my own cards | Offline cache (`persistentLocalCache`); syncs between phone and laptop |
| Audio & private material | Cloud Storage with owner-only rules, cached on the phone for offline use | Needs the Blaze (pay-as-you-go) plan: expect pennies/month; set a **$5 budget alert** |
| Public app shell | Firebase Hosting | Only the app code is public, no content |
| Burmese text | Bundled Noto Sans Myanmar; `Intl.Segmenter('my')` for words; custom syllable splitter; on-screen Burmese keyboard / syllable tiles | Grapheme splitting ≠ syllables |
| Deploy | GitHub Actions → Firebase Hosting | Preview URL for each PR |
| Phase 2 | Cloud Functions (2nd gen) hold API keys; App Check on; all speech/AI behind one swappable module | Daily spend cap |

**Expected cost:** phase 1 ≈ $0–1/month. Phase 2 ≈ a few dollars a month for regular conversation practice.

---

## 7. Roadmap

Each phase ends on **personal exit criteria**: things I can actually do, not features shipped.

### Phase 0: Foundations
- [ ] Make the GitHub repo private (if it isn't)
- [ ] Scaffold: Vite/React/TS, PWA, Firebase project (Blaze + budget alert), Google sign-in locked to my user ID, GitHub Actions deploy
- [ ] Content schema (items, card types, audio refs, source) + validator (Unicode/Zawgyi check, missing audio)
- [ ] Audio pipeline: Azure TTS generation + loudness normalization → `.m4a`; slot for human recordings that replace the TTS versions
- [ ] First 100 items, 3 tone pair sets, first script unit

**Exit:** the app opens on my phone, signed in, with real content.

### Phase 1: Core loop
- [ ] FSRS review queue with recall-first card types; production cards unlock later
- [ ] Hint → retry → reveal on wrong answers
- [ ] Tone & sound perception trainer with adaptive focus on my weak contrasts
- [ ] Script trainer in the same queue; fading romanization
- [ ] One-screen grammar notes linked from cards
- [ ] **Quick add:** new card from phone in seconds (Burmese + meaning, optional voice memo); Zawgyi auto-fix; TTS audio auto-generated
- [ ] Today screen: due count, new-card budget I set, no streak
- [ ] Offline review with sync
- [ ] **Honest progress page:** true retention, cards known, tone-ID accuracy over time, my most-missed items/contrasts
- [ ] Self-tests: tone-ID check with voices I haven't trained on, every couple of weeks

**Exit:** I review daily on my phone for 4 weeks, tone-ID accuracy is measurably up, and adding phrases from real life is effortless.

### Phase 1.x: Input, speaking-lite, tutor support
- [ ] Graded micro-stories/dialogues using only my known words (AI-drafted allowed; flagged until checked)
- [ ] **Record & compare:** record myself next to the native/TTS clip
- [ ] Pitch + length overlay of my recording vs the reference (presented as "compare", not a grade)
- [ ] **Tutor mode:** a list of phrases to ask a tutor about, a place to save tutor corrections and recordings, and a "prep for tutor session" view
- [ ] Tune FSRS parameters on my own review history
- [ ] Expand content continuously; replace TTS with human audio where available

**Exit:** I can follow short dialogues made from my vocabulary and hold basic exchanges with a tutor.

### Phase 2: Speak with the app
Burmese speech tech is new and **unmeasured on learner speech**, so test first.

- [ ] **2a: Personal speech benchmark.** Record ~30 phrases (me + a native/tutor), run them through Azure (my-MM), Google Chirp 3, ElevenLabs Scribe, an OpenAI transcriber and an open model. Compare accuracy and latency; listen critically to the Burmese voices.
  - *Go/no-go:* can the best one reliably tell when I said the right phrase vs a wrong one?
- [ ] **2b: Speaking drills.** Say the target → speech recognition checks the content → pitch/length overlay with coarse labels. If recognition fails, show what it heard and let me retry or type.
- [ ] **2c: Conversation role-play.** I speak → Burmese speech-to-text → AI model running a scenario (market, taxi, family dinner, my real upcoming situations) limited to my known words + a few new ones → Burmese TTS speaks back. Visible transcript, typed fallback, corrections as hints, and the new words from each conversation go into my review queue automatically.
- [ ] Spot-check AI Burmese with a tutor; feature labelled as practice, not authority.

**Exit:** I can complete everyday role-plays by voice without frustration, and new phrases from them stick in review.

### Phase 3+: Later / maybe
- Real-time voice conversation (Gemini Live / OpenAI Realtime) once Burmese is supported: **re-test periodically**. Cost isn't a barrier at one user; Burmese support is
- Literary/written Burmese reading track (signs, news, Facebook posts)
- Reading real material with tap-to-look-up and one-tap "add to review"
- Optional illustrated memory aids for stubborn words

---

## 8. Measuring my progress

Only learning measures, no engagement metrics.

| Measure | How |
|---|---|
| Tone identification | Periodic test using voices I haven't trained on |
| True retention | FSRS review log: % recalled vs target |
| Active knowledge | Count of production cards (English → Burmese) mastered |
| Comprehension | % of a new graded story understood on first listen |
| Speaking (phase 2) | Speech-recognition success on target phrases; role-plays completed; tutor's judgement |

---

## 9. Open decisions

1. **Tutor:** do I have (or want) a native speaker or tutor for checking content, recordings and speaking practice? It's the single biggest quality boost.
2. **Romanization:** which system to show while it fades (e.g. MLC transcription vs a simpler one with tone marks)?
3. **Textbook:** which course to follow for structure (e.g. Okell's *Burmese: An Introduction* or *Colloquial Burmese*), if any?
4. **Repo visibility:** confirm the GitHub repo is private.
5. **Situations I most need Burmese for:** these drive the first phrases and the phase 2 scenarios.

## 10. Risks

| Risk | Mitigation |
|---|---|
| Content effort stalls the project | Start small (~100 items); quick-add from real life; TTS audio so nothing waits on recordings |
| TTS teaches subtly wrong tones | Prefer human audio for tone sets; flag TTS-only items; check with a tutor |
| Evidence comes from Mandarin/Thai, not Burmese | My own tone-ID tests show whether the trainer works for me |
| Speech recognition misfires on my speech | Phase 2 gated on a personal benchmark; never show a score for a recognition failure |
| AI produces unnatural Burmese | Scenario scripts + known-word limits; tutor spot checks; AI = practice |
| Zawgyi/encoding bugs | Unicode-only, convert on input, normalize before comparing |
| Surprise cloud bill | $5 budget alert, daily caps on AI calls, keys only in Cloud Functions |

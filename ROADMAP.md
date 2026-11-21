# BurmeseLearner — Vision & Roadmap

> Evidence: [`reports/Effective Burmese learning app.md`](reports/Effective%20Burmese%20learning%20app.md) (full report) and [`research_notes/`](research_notes/Effective%20Burmese%20learning%20app/) (raw notes). This file is the decision record: what we build, what we don't, and in what order.

---

## 1. Vision

**A personal Burmese learning tool built only around what helps someone learn a language. It has no commercial goals.**

- **One learner, me.** It's hosted on Firebase only so I can use it on my phone.
- **No business incentive.** It doesn't need to keep me hooked, sell me anything, or look good in a dashboard. Every feature has to answer one question: *does this help me understand and speak Burmese?*
- **Why:** to talk with my partner's family. Her parents don't speak English.
- **First milestone, the wedding (~3 months, late Feb 2027):** hold a basic, warm conversation with her family. Greet properly, introduce myself, understand and answer the questions they'll ask, make small talk about food and the wedding, and politely recover when I don't understand.

### Being realistic about 3 months
At ~20–30 minutes a day that's roughly **30–45 hours**. Burmese is one of the harder languages for English speakers (around 1,100 classroom hours to general proficiency). In 3 months, free conversation isn't realistic. What is realistic, and what this plan aims for:
- ~200–300 well-practised phrases and words, said with recognisable tones
- understanding the **predictable questions** family will ask, and answering them
- "repair" phrases, so conversations don't collapse when I'm lost
- reading the script slowly (a bonus, not a requirement for the wedding)

### What "language learning paradise" means here
Commercial apps are shaped by things that have nothing to do with learning: free-tier limits (hearts/energy), retention and daily-user targets (streaks, leagues, notifications), fixed content for millions of users, and avoiding anything hard. Dropping those lets this app:
- **Never limit practice**, and never guilt-trip
- **Be built around my real life:** her family, her family's way of speaking, our situations
- **Be honest:** real retention and real weak spots, no encouragement designed to keep me coming back
- **Adapt to me:** scheduling tuned on my own review history, and extra practice on the tones I keep missing

---

## 2. What the evidence says helps

The research mixed *what makes people learn* with *what keeps users in an app*. Only the first matters here.

### Strong evidence: the core of the app
| Technique | Evidence | In the app |
|---|---|---|
| **Retrieval practice** (recall, don't reread) | Testing beats restudy, g ≈ 0.50, 0.69 at delays >1 day (Rowland 2014); one of only two "high utility" techniques (Dunlosky 2013) | Every review asks me to produce the answer |
| **Spacing** | Medium-to-large effect across 48 L2 experiments (Kim & Webb 2022) | FSRS schedules everything |
| **Productive recall** (English → Burmese) | Builds form knowledge that recognition doesn't (Nakata) | Speaking cards: see English → **say it aloud** → hear the model |
| **Tone/sound perception training** (high-variability phonetic training, HVPT) | Mandarin tone ID went from 69% to 90% in 8 sessions and held for 6 months (Wang 1999); carries over to production (meta-analysis of 31 studies) | Tone & sound trainer, recorded in several voices |

### Moderate evidence: worth building
| Technique | Evidence | In the app |
|---|---|---|
| Chunks / phrases as units | Collocation instruction d ≈ 1.4 (small studies) | Mostly **phrase** cards, especially early on |
| Short explicit grammar notes | Explicit > implicit (d ≈ 1.13 vs 0.54), with caveats | One-screen notes on particles and sentence endings |
| Prompt to self-correct before revealing the answer | Prompts beat simply giving the answer (Lyster & Saito) | Wrong → hint → retry → reveal |
| Speaking with real people + corrective feedback | Interaction/output research | **Partner practice sessions** (§5) |
| Input I mostly understand | Helps, but needs ~95–98% known words | Short dialogues built from my known phrases |
| Speech-recognition pronunciation practice | g ≈ 0.69 with sustained practice; weaker for tones | Stretch goal (Phase 3) |

### Leaving out (no learning evidence; it's for engagement)
Streaks, XP, leaderboards, gems, hearts/energy, guilt notifications, "learning style" modes, and recognition-only games as the main loop.

### Motivation for one person
The research on lasting motivation points to **autonomy and feeling competent**. So: I set my daily load, I can pause without penalty, and progress is shown honestly ("you recognise creaky vs high tone 85% of the time"). The wedding countdown supplies the rest.

---

## 3. Romanization: how Burmese is shown

### The problem
Burmese has **no standard romanization**. That matters because **Burmese spelling doesn't match pronunciation exactly**. The classic example is voicing in compounds: ပါ is spelled *pa* but often said *ba* after another syllable, as in မင်္ဂလာပါ "hello", said *mingalaba*. Most romanizations either follow the spelling or ignore tones.

### The main systems
| System | What it represents | Tones? | Good for | Bad for |
|---|---|---|---|---|
| **MLC Transcription System** (Myanmar Language Commission, 1980) | The **spelling**, letter by letter | Yes, by spelling convention | Linking romanization to the script | Speaking: it shows how a word is written, not said |
| **ALA-LC** (library standard) | The spelling, with diacritics | Partially | Cataloguing books | Learners |
| **Pronunciation-based learner transcriptions** (the approach in textbooks such as John Okell's) | The **sound** | Yes, marked | Speaking and listening | Learning to spell |
| **IPA** | The sound, exactly | Yes | Linguists | Readability; heavy |
| **Informal / everyday** (names like *Aung San Suu Kyi*, texting) | Rough sound, English-style spelling | **No** | Recognising names | Learning tones; inconsistent |

### Decision
**Every card shows the Burmese script and a pronunciation-based romanization with tones marked.**
- Pronunciation-based, because speaking with her family is the priority. I need to know how things are *said*, including voicing changes.
- **Tones always visible.** In the romanization, a wrong tone can mean a different word (e.g. နာ "be sore" vs နား "ear"). Proposed marks: low **à**, high **á**, creaky **a̰**, checked/stopped **aʔ**. Final symbols get confirmed against a published source when we build the content schema.
- **Colour or underline per tone**, matching the tone trainer, so the mark and the sound connect.
- **Fading is per item, not global.** Once I can read an item's script reliably (shown by its script card), its romanization hides by default and comes back with a tap. Speaking cards keep romanization **until the wedding**; after that it becomes a toggle.
- Script is learned **in parallel at a low dose** (~5–10 min/day). It doesn't block speaking content. It's still worth doing because the script **marks tones explicitly**, which helps long-term pronunciation.
- My partner checks that the romanization matches *how her family says it* (dialect and family forms of address).

---

## 4. Product principles

1. **Learning first, always.**
2. **Speaking first** (for now): phrase-based, audio-led, said out loud.
3. **Recall over recognition.**
4. **One scheduler (FSRS) for everything.**
5. **Real native audio, ideally my partner's**, so I learn how her family actually speaks.
6. **Script + tone-marked romanization**, fading per item.
7. **Honest feedback.** No fake precision.
8. **No practice limits, no guilt.**
9. **Works offline on my phone.**
10. **Keep it simple.** One user means no admin, no multi-tenant logic, no analytics.

---

## 5. My partner's role

She is the most valuable resource in this project. The **interaction research** (speaking + feedback with a real person) is the strongest evidence for building speaking skill. She also knows exactly how her family talks.

Keep the asks small and specific, so it never feels like a job:
| Ask | How the app helps |
|---|---|
| **Record audio** for phrases (~5–10 min sessions) | "Recording session" screen: shows a phrase, she taps record, next. Auto-trims and normalises |
| **Check phrases & romanization** | "Review queue for partner": tick / fix / comment |
| **Tell me what her family will actually ask and say** | Builds the "likely questions" pack |
| **Practise with me** (~10 min a few times a week) | **Partner session mode:** the app picks due speaking items and role-play prompts; she plays her mum/dad/aunt, marks each one ✓ / try again, and notes corrections; results feed FSRS |
| Record a few tone minimal pairs | The tone trainer needs several voices; hers + TTS + any relatives willing |

No professional tutor for now; this can be revisited later.

---

## 6. Content strategy

**Data-driven method, not a textbook.** Content is chosen by usefulness (frequency + what her family will say), not a textbook's order. I'll pull resources as needed and ask when something needs uploading.

| Source | Use |
|---|---|
| **Partner** | Audio, corrections, likely questions, family-specific forms of address |
| **Azure Burmese neural voices (Nilar / Thiha)** or **ElevenLabs** | Audio so nothing waits on recordings; extra voices for the tone trainer. Compare both; the partner judges which sounds more natural |
| **Okell's *Burmese by Ear*** (SOAS, free download) | Reference for core phrases and pronunciation; personal listening |
| SEAsite (Northern Illinois University), myWord frequency lists (MIT), Tatoeba (CC BY) | Frequency order, example sentences, cross-checking |
| Textbooks (optional, only if I hit a gap) | e.g. Okell's *Burmese: An Introduction* or *Colloquial Burmese* as grammar reference; I'll say if one is worth buying |

### Content packs, in order (wedding-driven)
1. **Sounds & tones:** the four tones, aspiration, a few minimal pairs
2. **Meeting family:** greetings, respectful forms of address for elders (partner confirms what I should call her parents), introducing myself, thanks, sorry
3. **Repair kit:** "I'm learning Burmese", "a little", "please speak slowly", "say it again please", "I don't understand", "what is this called?"
4. **Their likely questions** (listening + short answers): where are you from, what's your job, do you like Burmese food, how long have you been together, have you been to Myanmar, can you speak Burmese?
5. **Food & eating:** delicious, I'm full, a little more, I like it, it's spicy
6. **Wedding:** congratulations, beautiful, wishing happiness, toasts, polite small talk
7. **Small talk & feelings:** happy, tired, cold UK weather, family, numbers and ages
8. **Script track** (parallel): consonants → vowels → tone marks → medials → stacked consonants

**Targets by the wedding:** ~250 items, ~10 tone pair sets, partner audio on everything in packs 2–6.

**Privacy:** the repo is currently **public**. Partner recordings and any copyrighted material go in Cloud Storage/Firestore, readable only by my account. Only the app code is public. Consider making the repo private too.

**Text rules:** Unicode only; Zawgyi detected and converted (`myanmar-tools`); normalized before comparison.

---

## 7. Architecture

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vite + React + TypeScript, installable PWA | Phone home screen; works offline |
| Scheduling | `ts-fsrs` 6.x (MIT), pinned model, target retention ≈ 0.9 | Tune on my own reviews later |
| Auth | Google sign-in; security rules allow **only my account** (+ optionally my partner's, for recording/review) | |
| Data | Firestore: cards, review log, my phrases, partner feedback | Offline cache; syncs phone ↔ laptop |
| Audio & private material | Cloud Storage, owner-only rules, cached on the phone | Blaze plan with a **$5 budget alert**; expect pennies/month |
| Recording | MediaRecorder (`audio/webm;codecs=opus`, fallback `audio/mp4` for older Safari) | Used for partner recordings and my practice |
| Burmese text | Bundled Noto Sans Myanmar; `Intl.Segmenter('my')`; custom syllable splitter; tone-coloured romanization | |
| Deploy | GitHub Actions → Firebase Hosting | |
| Speech/AI (later) | Cloud Functions hold API keys; App Check; all vendors behind one swappable module | |

**Expected cost:** ≈ $0–1/month until speech features; a few dollars a month with them.

---

## 8. Roadmap

### Phase 0: Foundations (~week 1)
- [ ] Scaffold: Vite/React/TS PWA, Firebase (Blaze + budget alert), Google sign-in locked to my account, deploy pipeline
- [ ] Content schema: script, tone-marked romanization, meaning, audio refs, source, pack
- [ ] Settle the romanization marks (§3)
- [ ] Audio pipeline: TTS generation + normalization; partner recordings replace TTS automatically
- [ ] Packs 1–3 drafted (~60 items); partner reviews

**Exit:** the app is on my phone with real content and audio.

### Phase 1: Core loop for the wedding (~weeks 1–3, then used daily)
- [ ] FSRS queue with card types: **listen → meaning**, **English → say it aloud → hear model → self-grade**, read script → sound
- [ ] Hint → retry → reveal
- [ ] Tone & sound trainer (multi-voice minimal pairs, adapts to my weak contrasts)
- [ ] Script trainer in the same queue (low daily dose); per-item romanization fading
- [ ] **Partner tools:** recording session, review queue, partner practice session mode
- [ ] **Quick add:** new phrase in seconds (from a chat with her family, or her)
- [ ] **Record & compare:** record myself, play back next to her clip
- [ ] Today screen (due count, my chosen new-card budget, wedding countdown) and honest progress page
- [ ] Short **dialogues** from known phrases ("Meeting Mum", "At the wedding table")

**Exit:** daily use; packs 1–6 learned; partner sessions running.

### Weeks 4–12: Learning, not building
Development pauses except for fixes and small improvements. The app is used; content grows.

| Weeks | Focus |
|---|---|
| 1–2 | Tones & sounds, greetings, introducing myself, repair kit; script: first consonants |
| 3–5 | Their likely questions + my answers; family terms; food |
| 6–8 | Wedding phrases; small talk; numbers/ages; dialogues; partner role-plays 2–3×/week |
| 9–11 | Full role-plays with partner playing family members; fill gaps she spots; listening to her speaking at natural speed |
| 12 | Rehearsal: run the "wedding day" dialogue set; review weak items only |

**Wedding exit criteria:** with my partner role-playing, I can greet and introduce myself, understand and answer the likely questions, make 2–3 exchanges of small talk, and use repair phrases. She says my tones are understandable.

### Phase 2: After the wedding, broaden
- Phrases from real conversations at the wedding → the queue
- More grammar notes; more patterns for building my own sentences; more listening
- Graded dialogues (AI-drafted allowed, partner-checked)
- Tune FSRS on my own history
- Script → reading real short texts (signs, messages from family)

### Phase 3: Stretch — speak with the app
Uses **ElevenLabs** (Scribe speech-to-text, Burmese voices, possibly its conversational agents) and/or Azure. *Higgsfield is mainly an AI video tool; its Burmese speech support would need checking, so ElevenLabs is the better candidate.*

- [ ] **3a: Personal speech test.** ~30 phrases recorded by me + my partner, run through ElevenLabs Scribe, Azure (my-MM) and Google Chirp 3. Does it reliably tell when I said the right phrase? Can my partner tell the Burmese voices are natural?
- [ ] **3b: Speaking drills.** Say the target → recognition checks it → pitch/length comparison with her recording, coarse labels. On failure: "didn't catch that", show what it heard.
- [ ] **3c: Conversation role-play.** I speak → speech-to-text → AI plays a family member in a scenario, using my known words → Burmese voice speaks back. Transcript visible, corrections as hints, new words go to review. Partner spot-checks the AI's Burmese.
- [ ] Optional, **only with her explicit consent:** an ElevenLabs voice clone of my partner for extra practice audio. It sounds like her, but tone accuracy depends on the model, so her real recordings stay the reference.
- Re-check real-time voice conversation APIs periodically; Burmese support is unconfirmed today.

---

## 9. Measuring my progress

| Measure | How |
|---|---|
| Tone identification | Periodic test with voices I haven't trained on |
| True retention | FSRS review log |
| Speaking | Partner session ✓ rate; full wedding dialogue completed |
| Listening | % of her natural-speed questions I understand first time |

---

## 10. Open decisions

1. **Forms of address:** what should I call her parents and older relatives? (partner)
2. **Region/dialect:** where is her family from? Mostly standard Yangon/Mandalay speech, or something different? (partner)
3. **Partner account:** give her a login for recording/reviewing, or record on my phone?
4. **Repo visibility:** make it private?
5. **Wedding details:** Burmese-style ceremony, and will her family be there in person? This shapes pack 6.

## 11. Risks

| Risk | Mitigation |
|---|---|
| Building eats the learning time | Strict ~3-week build window, then use the app; features wait until after the wedding |
| Partner fatigue | Small, specific asks; short sessions; TTS as fallback so nothing blocks on her |
| TTS teaches subtly wrong tones | Her recordings are the reference; TTS items flagged until she checks them |
| Romanization misleads | Pronunciation-based, tone-marked, checked by partner; script learned alongside |
| Evidence comes from Mandarin/Thai | Own tone-ID tests show whether the trainer works for me |
| Speech/AI features unreliable for Burmese | Stretch goal only; personal test before building |
| Zawgyi/encoding bugs | Unicode-only, convert on input, normalize before comparing |
| Surprise cloud bill | $5 budget alert; daily caps on AI calls; keys only in Cloud Functions |

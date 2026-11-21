# BurmeseLearner — Vision & Roadmap

> Evidence: [`reports/Effective Burmese learning app.md`](reports/Effective%20Burmese%20learning%20app.md) (full report) and [`research_notes/`](research_notes/Effective%20Burmese%20learning%20app/) (raw notes). This file is the decision record: what we build, what we don't, and in what order.

---

## 1. Vision

**A personal Burmese learning tool built only around what helps someone learn a language. It has no commercial goals.**

- **One learner, me.** It's hosted on Firebase only so I can use it on my phone.
- **No business incentive.** It doesn't need to keep me hooked, sell me anything, or look good in a dashboard. Every feature has to answer one question: *does this help me understand and speak Burmese?*
- **Goal: learn the language properly,** to understand and speak everyday spoken Burmese, Yangon standard. I want to be able to talk with my partner's family (her parents don't speak English) and keep improving for years, not memorise a phrasebook.

### Checkpoint, not curriculum
A family wedding in ~3 months (late Feb 2027) is a useful **progress check**, nothing more. The curriculum isn't built around it. At ~20–30 min/day, 3 months is roughly 30–45 hours. Burmese takes English speakers ~1,100 classroom hours to general proficiency, so a realistic 3-month level is:
- the sound system and tones heard and produced recognisably
- ~250–400 high-frequency words and phrases known well
- the core sentence patterns, so I can **build** simple sentences, not only recite them
- basic exchanges: greetings, introducing myself, simple questions and answers, repair phrases
- reading the script slowly

### What "language learning paradise" means here
Commercial apps are shaped by things that have nothing to do with learning: free-tier limits (hearts/energy), retention and daily-user targets (streaks, leagues, notifications), fixed content for millions of users, and avoiding anything hard. Dropping those lets this app:
- **Never limit practice**, and never guilt-trip
- **Be built around my real life:** my partner's Yangon speech, the conversations I actually have
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
| Chunks / phrases as units | Collocation instruction d ≈ 1.4 (small studies) | Phrase cards early on, then broken down into reusable patterns (see §6) |
| Short explicit grammar notes | Explicit > implicit (d ≈ 1.13 vs 0.54), with caveats | One-screen notes on particles and sentence endings |
| Prompt to self-correct before revealing the answer | Prompts beat simply giving the answer (Lyster & Saito) | Wrong → hint → retry → reveal |
| Speaking with real people + corrective feedback | Interaction/output research | **Partner practice sessions** (§5) |
| Input I mostly understand | Helps, but needs ~95–98% known words | Short dialogues built from my known phrases |
| Speech-recognition pronunciation practice | g ≈ 0.69 with sustained practice; weaker for tones | Stretch goal (Phase 3) |

### Leaving out (no learning evidence; it's for engagement)
Streaks, XP, leaderboards, gems, hearts/energy, guilt notifications, "learning style" modes, and recognition-only games as the main loop.

### Motivation for one person
The research on lasting motivation points to **autonomy and feeling competent**. So: I set my daily load, I can pause without penalty, and progress is shown honestly ("you recognise creaky vs high tone 85% of the time"). Real conversations with my partner's family supply the rest.

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
- Pronunciation-based, because speaking is the priority. I need to know how things are *said*, including voicing changes.
- **Tones always visible.** In the romanization, a wrong tone can mean a different word (e.g. နာ "be sore" vs နား "ear"). Proposed marks: low **à**, high **á**, creaky **a̰**, checked/stopped **aʔ**. Final symbols get confirmed against a published source when we build the content schema.
- **Colour or underline per tone**, matching the tone trainer, so the mark and the sound connect.
- **Fading is per item, not global.** Once I can read an item's script reliably (shown by its script card), its romanization hides by default and comes back with a tap. Speaking cards keep romanization longer (for the first few months), then it becomes a toggle.
- Script is learned **in parallel at a low dose** (~5–10 min/day). It doesn't block speaking content. It's still worth doing because the script **marks tones explicitly**, which helps long-term pronunciation.
- My partner checks that the romanization matches how it's said in Yangon.

---

## 4. Product principles

1. **Learning first, always.**
2. **Speaking first** (for now): phrase-based, audio-led, said out loud.
3. **Recall over recognition.**
4. **One scheduler (FSRS) for everything.**
5. **Real native audio, ideally my partner's**, so I learn real Yangon speech.
6. **Script + tone-marked romanization**, fading per item.
7. **Honest feedback.** No fake precision.
8. **No practice limits, no guilt.**
9. **Works offline on my phone.**
10. **Keep it simple.** One user means no admin, no multi-tenant logic, no analytics.

---

## 5. My partner's role

She is the most valuable resource in this project. The **interaction research** (speaking + feedback with a real person) is the strongest evidence for building speaking skill, and she speaks the Yangon Burmese I want to learn.

She doesn't need her own login: everything happens **on my phone**, handed to her. Keep the asks small and specific, so it never feels like a job:
| Ask | How the app helps |
|---|---|
| **Record audio** for phrases (~5–10 min sessions) | "Recording session" screen: shows a phrase, she taps record, next. Auto-trims and normalises |
| **Check phrases & romanization** | "Check" screen: tick / fix / comment |
| **Tell me how people actually say things** | Notes on natural phrasing, politeness, what's too formal |
| **Practise with me** (~10 min a few times a week) | **Partner session mode:** the app picks due speaking items and role-play prompts, she marks each one ✓ / try again and notes corrections, results feed FSRS |
| Record a few tone minimal pairs | The tone trainer needs several voices; hers + TTS (+ anyone else willing) |

No professional tutor for now; this can be revisited later.

---

## 6. Content strategy

**Data-driven method, not a textbook.** Content is chosen by usefulness (frequency in everyday speech + how much it unlocks), not a textbook's order. I'll pull resources as needed and ask when something needs uploading.

| Source | Use |
|---|---|
| **Partner** | Audio, corrections, natural phrasing, politeness |
| **Azure Burmese neural voices (Nilar / Thiha)** or **ElevenLabs** | Audio so nothing waits on recordings; extra voices for the tone trainer. Compare both; the partner judges which sounds more natural |
| **Okell's *Burmese by Ear*** (SOAS, free download) | Reference for core phrases and pronunciation; personal listening |
| SEAsite (Northern Illinois University), myWord frequency lists (MIT), Tatoeba (CC BY) | Frequency order, example sentences, cross-checking |
| Textbooks (optional, only if I hit a gap) | e.g. Okell's *Burmese: An Introduction* or *Colloquial Burmese* as grammar reference; I'll say if one is worth buying |

### Curriculum: general, frequency-driven
Three strands run in parallel every day. Order inside each is by **usefulness** (frequency in everyday speech + how many other sentences it unlocks).

**A. Sounds** (front-loaded, then ongoing maintenance)
- The four tones, aspiration (unaspirated / aspirated / voiced), voiceless nasals, final glottal stops, voicing in compounds
- Minimal-pair perception training, then production with record & compare

**B. Speaking: words, chunks and patterns**
1. **Survival core:** greetings, thanks, sorry, yes/no, polite sentence endings, and repair phrases ("I don't understand", "slowly please", "again please", "what's this called?", "how do you say ___?")
2. **Core sentence patterns.** Burmese grammar lives in particles and sentence endings, so these are the generative heart:
   - statements, negation (မ… ဘူး), yes/no questions (…လား), wh-questions (…လဲ)
   - want / can / like / have / going to; past and future markers; polite request forms
   - subject/topic and object particles; "and", "with", "at", "from", "to"
   - noun + classifier + numbers
3. **High-frequency vocabulary in themes that come up in any conversation:** people & family terms (including how to address elders: uncle/aunt-style terms for older relatives), self (name, where from, work, where I live), numbers & time, food & eating, daily activities, places & directions, feelings & opinions, weather
4. **Each new pattern is drilled with words I already know**, so I'm building sentences, not memorising lines. (Explicit notes + retrieval + production, per §2.)

**C. Script** (low daily dose): consonants → vowels → tone marks → medials → asat & stacked consonants → reading known words → reading short texts

**Listening input throughout:** short dialogues built from known words (~95–98% coverage), recorded by my partner at slow and natural speed.

**Targets at ~3 months:** ~300 items, the core patterns, ~10 tone pair sets, the full script introduced.

**Privacy:** the repo stays public; only app code and my own authored content go in it. Partner recordings and any copyrighted material go in Cloud Storage/Firestore, readable only by my account.

**Text rules:** Unicode only; Zawgyi detected and converted (`myanmar-tools`); normalized before comparison.

---

## 7. Architecture

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vite + React + TypeScript, installable PWA | Phone home screen; works offline |
| Scheduling | `ts-fsrs` 6.x (MIT), pinned model, target retention ≈ 0.9 | Tune on my own reviews later |
| Auth | Google sign-in; security rules allow **only my account** | Partner uses my phone |
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
- [ ] First content drafted (~60 items: sounds, survival core, first patterns, first script unit); partner reviews

**Exit:** the app is on my phone with real content and audio.

### Phase 1: Core loop (~weeks 1–3, then used daily)
- [ ] FSRS queue with card types: **listen → meaning**, **English → say it aloud → hear model → self-grade**, read script → sound
- [ ] Hint → retry → reveal
- [ ] Tone & sound trainer (multi-voice minimal pairs, adapts to my weak contrasts)
- [ ] Script trainer in the same queue (low daily dose); per-item romanization fading
- [ ] **Partner tools:** recording session, review queue, partner practice session mode
- [ ] **Pattern drills:** a pattern card generates practice with words I already know
- [ ] **Quick add:** new phrase in seconds (from conversations or from my partner)
- [ ] **Record & compare:** record myself, play back next to her clip
- [ ] Today screen (due count, my chosen new-card budget) and honest progress page
- [ ] Short **dialogues** from known words, slow + natural speed

**Exit:** daily use; partner sessions running; content growing steadily.

### Then: learning, not building
After the ~3-week build, development drops to fixes and small improvements, so the time goes into learning. Content keeps growing through the three strands (§6).

**~3-month checkpoint**: with my partner, I can hold basic exchanges (greet, introduce myself, ask and answer simple questions, use repair phrases), build new simple sentences from the core patterns, and she says my tones are understandable.

### Phase 2: Broaden
- Phrases from real conversations → the queue
- More grammar notes; more patterns for building my own sentences; more listening
- Graded dialogues (AI-drafted allowed, partner-checked)
- Tune FSRS on my own history
- Script → reading real short texts (signs, messages)

### Phase 3: Stretch — speak with the app
Uses **ElevenLabs** (Scribe speech-to-text, Burmese voices, possibly its conversational agents) and/or Azure. *Higgsfield is mainly an AI video tool; its Burmese speech support would need checking, so ElevenLabs is the better candidate.*

- [ ] **3a: Personal speech test.** ~30 phrases recorded by me + my partner, run through ElevenLabs Scribe, Azure (my-MM) and Google Chirp 3. Does it reliably tell when I said the right phrase? Can my partner tell the Burmese voices are natural?
- [ ] **3b: Speaking drills.** Say the target → recognition checks it → pitch/length comparison with her recording, coarse labels. On failure: "didn't catch that", show what it heard.
- [ ] **3c: Conversation role-play.** I speak → speech-to-text → AI plays a character in an everyday scenario, using my known words → Burmese voice speaks back. Transcript visible, corrections as hints, new words go to review. Partner spot-checks the AI's Burmese.
- [ ] Optional, **only with her explicit consent:** an ElevenLabs voice clone of my partner for extra practice audio. It sounds like her, but tone accuracy depends on the model, so her real recordings stay the reference.
- Re-check real-time voice conversation APIs periodically; Burmese support is unconfirmed today.

---

## 9. Measuring my progress

| Measure | How |
|---|---|
| Tone identification | Periodic test with voices I haven't trained on |
| True retention | FSRS review log |
| Speaking | Partner session ✓ rate; new sentences I can build from the core patterns |
| Listening | % of her natural-speed questions I understand first time |

---

## 10. Decisions made

- Target variety: **Yangon (standard) Burmese**
- No professional tutor for now; my partner is the native reference
- Partner uses my phone; no separate login
- Repo stays public; private material in owner-only storage
- No textbook to follow; method follows the evidence, resources pulled as needed
- Romanization: pronunciation-based, tone-marked, alongside script (§3)
- Speech/AI conversation: stretch goal (ElevenLabs first)

## 11. Risks

| Risk | Mitigation |
|---|---|
| Building eats the learning time | ~3-week build window, then mainly use the app; new features are small and occasional |
| Becoming a phrasebook | Pattern strand + pattern drills; measure new sentences I can build |
| Partner fatigue | Small, specific asks; short sessions; TTS as fallback so nothing blocks on her |
| TTS teaches subtly wrong tones | Her recordings are the reference; TTS items flagged until she checks them |
| Romanization misleads | Pronunciation-based, tone-marked, checked by partner; script learned alongside |
| Evidence comes from Mandarin/Thai | Own tone-ID tests show whether the trainer works for me |
| Speech/AI features unreliable for Burmese | Stretch goal only; personal test before building |
| Zawgyi/encoding bugs | Unicode-only, convert on input, normalize before comparing |
| Surprise cloud bill | $5 budget alert; daily caps on AI calls; keys only in Cloud Functions |

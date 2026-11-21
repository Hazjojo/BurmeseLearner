# BurmeseLearner — Vision & Roadmap

> The full evidence behind this document is in [`reports/Effective Burmese learning app.md`](reports/Effective%20Burmese%20learning%20app.md), with raw notes in [`research_notes/`](research_notes/Effective%20Burmese%20learning%20app/). This file is the decision record: what we build, what we don't, and in what order.

---

## 1. Vision

**The best way for an English speaker to learn to *understand and speak* everyday Burmese, with nothing in the app that doesn't help you learn.**

No major app offers a Burmese course (Duolingo doesn't), and nothing on the market trains Burmese tones properly. The opportunity is not "Duolingo for Burmese". It is a focused tool built on the two techniques with the strongest evidence, **spaced retrieval** and **tone/sound perception training**, filled with native audio of real spoken Burmese.

### One-line pitch
*Hear it, recall it, say it, and come back right before you'd forget it.*

### Who it's for (initial)
Adult English speakers starting from zero who want to **talk to people**: partners and family, travellers, aid and NGO workers, heritage learners. Reading is taught because it supports speaking, not as a separate academic track.

---

## 2. Product principles

These are the rules for deciding whether a feature goes in. When in doubt, check here.

1. **Recall over recognition.** The core loop makes you *produce* the answer (say it, recall the meaning, build the word). Multiple choice appears only when you first meet an item. *(Testing effect g ≈ 0.5–0.7; recognition formats transfer poorly.)*
2. **Spacing does the heavy lifting.** One scheduler (FSRS) for everything: words, phrases, script, tone pairs.
3. **Audio on everything.** Every Burmese item has native audio. Burmese tone lives in pitch, *length and voice quality*, which text can't show.
4. **Spoken Burmese first.** Teach the colloquial register and its particles. The literary/written register comes later, if at all.
5. **Content quality beats feature count.** Most of the budget goes to native recordings and curated material, not code.
6. **Habit without manipulation.** A goal you choose, a gentle streak tied to clearing due reviews, and freezes. No hearts, no energy, no leagues, no limit on how much you can practise.
7. **Honest feedback.** We never show a precise-looking score we can't justify. "I didn't catch that, try again" is better than a wrong 43/100.
8. **Measure learning, not just activity.** Built-in listening and recall checks tell us whether people improve. Streak numbers look good either way.
9. **Offline-first and cheap to run.** Works on a phone on a bus. Runs on Firebase's free tier in phase 1.

### Deliberately NOT building
| Out | Why |
|---|---|
| Leaderboards, gems, hearts/energy, practice caps | Thin causal evidence; Duolingo's Energy change caused a user backlash |
| Matching-pair / tap-the-tiles as the main loop | Recognition ≠ recall; feels productive, isn't |
| Long grammar lessons | Short explicit notes work; lectures don't add more |
| "Learning style" modes | No evidence |
| Pure input / "silent period" design | Beginners in a distant language can't reach the ~95–98% known-word coverage needed to understand native material |
| 0–100 pronunciation scores, pitch-only tone grading | Burmese tone isn't just pitch; speech recognition for Burmese isn't accurate enough |
| AI-generated curriculum shipped without native review | No AI model reliably produces good colloquial Burmese yet |

---

## 3. The learning loop

```
        ┌──────────── new item (meet it) ────────────┐
        │  audio + script + meaning + 1-line note    │
        │  (one easy recognition check)              │
        └───────────────────┬────────────────────────┘
                            ▼
   REVIEW (daily, FSRS-scheduled, recall-first)
   1. Listen → what does it mean?            (receptive)
   2. Read Burmese → meaning / sound         (script)
   3. English → say it in Burmese, hear the  (productive; unlocks once
      model, grade yourself / build tiles     you know it receptively)
                            │
          wrong? → prompt to self-correct ("check the tone") → then reveal
                            ▼
   APPLY: tiny graded stories & dialogues using ~98% known words
                            ▼
   SPEAK (phase 1.x: record & compare; phase 2: AI role-play)
```

Alongside the loop:
- **Tone & sound trainer:** hear a pair, pick which you heard, get instant feedback. Uses 4–6 different native voices. *(Mandarin learners went from 69% to 90% after 8 sessions and kept the gain for 6 months.)*
- **Script trainer:** glyphs introduced a few at a time, always with audio, in the same review queue, with picture mnemonics provided. Romanization starts on and fades out.

---

## 4. Content strategy (the real work)

**This is the biggest risk and the biggest moat.** There's no open colloquial Burmese word list, learner dictionary or colloquial audio corpus. We have to make our own.

| Asset | Phase 1 target | Source |
|---|---|---|
| Core vocabulary + phrases ("chunks") | ~500 items, frequency-ordered, colloquial | Curated by us + native speaker review; myWord (MIT) frequency data as a starting point (written-register bias) |
| Native audio | Every item, 2+ voices; tone pairs with 4–6 voices | Commissioned native speakers (needs budget/recruitment) |
| Tone/sound minimal pairs | ~10 sets covering low/high/creaky/checked, aspiration, voiceless nasals | Curated + recorded |
| Script units | Consonants, medials, vowels, tone marks, asat, stacked consonants | Authored |
| Grammar notes | ~15 one-screen notes on key particles and sentence endings | Authored, native-checked |
| Graded micro-stories | ~10 short dialogues/stories by end of 1.x | Authored (AI-drafted allowed only with native review) |
| Synthetic voice (TTS) | Long-tail fallback only | Azure Burmese voices (Nilar / Thiha), native-reviewed |

**Rules**
- Course content lives as **versioned JSON in this repo**, not in the database. It can be reviewed, diffed and cached offline.
- **Unicode only.** CI fails on Zawgyi-encoded text. Pasted input is detected and converted (`myanmar-tools`).
- **Every asset records its source and licence.** Share-alike data (OpenSLR SLR80, FLORES+, Wiktionary) is kept in separate, clearly licensed packs. *Burmese by Ear* is linked to, not embedded.

---

## 5. Architecture (phase 1)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vite + React + TypeScript, installable offline web app (PWA via `vite-plugin-pwa`) | Small, fast, offline |
| Scheduling | `ts-fsrs` 6.x (MIT), FSRS model version pinned, target retention ≈ 0.9 | Runs in the browser |
| Hosting | Firebase Hosting (free Spark plan) | Each pull request gets its own preview URL via GitHub Actions |
| Audio | Loudness-normalised `.m4a` (AAC) as static files on Hosting, precached with Workbox (`RangeRequestsPlugin`) | Cloud Storage needs the paid Blaze plan since Feb 2026, so avoid it in phase 1 |
| Auth | Anonymous sign-in on first launch, linkable to Google/email later | Start learning without signing up |
| User data | Firestore: settings, card state (`noteId__cardType`), batched review logs | Offline cache via `persistentLocalCache` |
| Burmese text | Bundled Noto Sans Myanmar; `Intl.Segmenter('my')` for words; custom regex syllable splitter; on-screen Burmese keyboard / tiles | Grapheme splitting ≠ syllables |
| Testing | Vitest + Firebase emulators (security rules) + Playwright smoke tests | |

**Estimated running cost, phase 1:** about $0–2/month at ~100 active learners.

**Phase 2 additions:** Blaze plan, 2nd-gen Cloud Functions holding API keys as secrets, App Check (required for Firebase AI Logic since Nov 2026), budget alerts, per-user AI rate limits. All speech/AI vendors sit behind **one swappable service module**.

---

## 6. Roadmap

Phases end on **exit criteria**, not dates.

### Phase 0: Foundations
- [ ] Decide initial learner focus and app name (see §8)
- [ ] Find 1–2 native-speaker collaborators (content review + recording); agree pay and rights
- [ ] Project scaffold: Vite/React/TS, PWA, Firebase project, GitHub Actions deploy + PR previews
- [ ] Content schema (notes, card types, audio refs, licence/source fields) + validator in CI (Unicode/Zawgyi check, missing audio, schema)
- [ ] Recording & loudness-normalisation pipeline (script → `.m4a`)
- [ ] Draft first 100 items + 3 tone pair sets + first script unit

**Exit:** a deployed empty shell; content validator passing on 100 real items with audio.

### Phase 1: Core loop (MVP)
- [ ] FSRS review queue with recall-first card types (listen→meaning, read→meaning, English→say/build)
- [ ] Production cards unlock after receptive learning
- [ ] Prompt-then-reveal feedback on wrong answers
- [ ] Tone & sound perception trainer (multi-voice minimal pairs)
- [ ] Script trainer in the same queue; fading romanization
- [ ] One-screen grammar notes linked from cards
- [ ] Today screen: due count, new-item budget, learner-set goal, gentle streak with freezes
- [ ] Offline: precached content + audio; reviews sync when back online
- [ ] Anonymous → linked accounts
- [ ] Built-in learning checks: short listening/recall quiz every ~2 weeks; tone identification test before and after
- [ ] ~500 items, ~10 tone sets, full script

**Exit:** 5–10 pilot learners use it for 4 weeks; tone-ID accuracy and recall-check scores go up; core loop works fully offline.

### Phase 1.x: Input & speaking-lite
- [ ] Graded micro-stories/dialogues at ~98% known words, unlocked by what you know
- [ ] **Record & compare:** record yourself, play it back next to the native clip (no score)
- [ ] Optional pitch + length overlay of your recording vs the native one, presented as "compare", not a verdict
- [ ] Expand to ~1,000–1,500 items; more voices
- [ ] Simple anonymous analytics on retention (day 1 / 7 / 14) and learning checks

**Exit:** learners use stories and recording regularly; content pipeline can add ~100 items per batch with native review.

### Phase 2: Speak with the app (the stretch goal)
**Gate first, build second.** Burmese speech tech is new and unproven on learner speech, so phase 2 starts with a test.

- [ ] **2a: Speech benchmark.** Record ~30 target phrases from learners + natives. Run them through Azure (my-MM), Google Chirp 3, ElevenLabs Scribe, an OpenAI transcriber and an open MMS fine-tune. Measure character error rate, latency, cost. Also native-rate the Azure Burmese voices.
  - *Go/no-go:* is the best option good enough to tell "right phrase" from "wrong phrase" on learner speech?
- [ ] **2b: Speaking drills.** Say the target phrase → speech recognition checks the content → pitch/length overlay with coarse labels ("pitch: good / try higher / a bit long"). If recognition fails: "didn't catch that", show what it heard, allow retry or typing.
- [ ] **2c: Turn-based role-play.** Learner speaks → Burmese speech-to-text → AI model running a *scripted* scenario (ordering food, taxi, meeting family) limited to known vocabulary and colloquial register → Azure TTS speaks back. Transcript visible, typed fallback, corrections framed as hints. Target: ~2 s to first audio.
- [ ] Native review of scenario scripts and sampled AI turns; feature labelled as "practice".
- [ ] Cost controls: per-user daily minutes, budget alerts.

**Exit:** pilot learners complete role-plays without frustration (low "didn't catch that" rate); no wrong-Burmese incidents in sampled transcripts.

### Phase 3+: Later / maybe
- Real-time speech-to-speech conversation (Gemini Live / OpenAI Realtime): **re-test yearly**; Burmese support is unconfirmed today
- Per-user FSRS parameter tuning (occasional, offline job)
- Literary/written Burmese reading track; separate paths for heritage learners, travellers and researchers
- AI-drafted graded readers limited to known words, native-reviewed
- Optional illustrated memory aids for hard words
- Native mobile wrapper if the installable web app's limits bite (e.g. iOS background audio)

---

## 7. How we'll know it works

| Metric | Why |
|---|---|
| Tone identification accuracy (before vs after, unfamiliar voices) | Directly measures the key Burmese skill |
| Recall-check score on previously learned items | Real retention, not app activity |
| Items known and retention rate at target (≈90%) | Health of the review system |
| Day-1 / 7 / 14 retention | Most drop-out happens in the first two weeks |
| Phase 2: content-recognition success rate, role-play completion | Is speaking practice usable or frustrating? |

Streaks and daily-user counts are tracked but **are not success metrics**.

---

## 8. Open decisions

1. **Primary learner:** partners/family, travellers, aid workers or heritage learners? This affects the first 500 items and the scenario list.
2. **Native-speaker collaborators:** who, and on what terms (pay, rights to recordings)?
3. **Accounts:** is anonymous-first OK, or should sign-in be required from the start?
4. **Romanization:** which system to show while it fades (e.g. MLC transcription vs a simpler learner-friendly one with tone marks)?
5. **Open source or closed?** This affects which share-alike datasets we can mix in.

## 9. Key risks (short version)

| Risk | Mitigation |
|---|---|
| Content is the bottleneck | Recruit native collaborators before heavy coding; start with 500 items |
| Evidence comes from Mandarin/Thai, not Burmese | Treat early users as a pilot with before/after tone tests |
| Speech recognition misfires on learner speech | Phase 2 gated on our own benchmark; never show low scores for recognition failures |
| AI or TTS teaches wrong Burmese | Scripts + word lists, native review, label AI as practice |
| Zawgyi/encoding bugs | Unicode-only, CI check, convert input |
| Licence mix-ups | Source and licence logged per asset; share-alike data kept separate |
| Vendor claims unverified | Re-check docs and prices before committing; swappable service module |

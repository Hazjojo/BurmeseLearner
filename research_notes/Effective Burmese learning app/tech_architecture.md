# Technical building blocks for a lean, offline-capable Burmese learning web app on Firebase

Research date: 2026-11-21. Method notes: firebase.google.com and docs.cloud.google.com could not be fetched directly from this research session (network allowlist), so Firebase/Google Cloud facts come from search-result extracts of the official pages, cross-checked where possible. Package versions were checked directly against the npm and PyPI registries on 2026-11-21 (`npm view`, PyPI JSON API), and some Burmese text-segmentation behaviour was tested locally in Node 22.23 (ICU 78.3, Unicode 17). Opinion and third-party blog claims are flagged.

## 1. Spaced repetition libraries, review logs, parameter optimization, card data model

### Takeaway
Use **ts-fsrs 6.0.0** (MIT, released 2026-10-28) in the client. It now defaults to the **FSRS-7** model and has a new `DefaultScheduler()` / `scheduler.review()` API that returns `{card, revlog}` immutably, so it fits an offline-first client that writes card state plus an append-only review log. Parameter optimization is available via `@open-spaced-repetition/binding` (fsrs-rs compiled to WASI, public beta). It can run in a browser Worker, but for a hobby app it is simpler to run it rarely (or never) and keep the default weights. Model data like Anki: content "notes" (lexical items) in the repo, with per-user "cards" (note × card type) holding scheduling state.

### Cited Findings
**ts-fsrs (TypeScript)**
- Current npm version is **6.0.0**, published 2026-10-28. Earlier releases: 5.4.2 (2026-09-01), 5.4.1 (2026-05-22), 5.4.0 (2026-05-18), 5.3.3 (2026-05-11), 5.3.2 (2026-03-31). The roughly monthly cadence shows active maintenance. License MIT. — [npm: ts-fsrs](https://www.npmjs.com/package/ts-fsrs) (registry `time` field queried 2026-11-21)
- Note: Snyk/aggregator pages still show 5.3.x/5.4.1 as "latest", so they are stale. — [Snyk ts-fsrs](https://security.snyk.io/package/npm/ts-fsrs)
- "ts-fsrs v6 supports FSRS-3, FSRS-4, FSRS-4.5, FSRS-5, FSRS-6, and FSRS-7. The library version and FSRS model version are independent." `DefaultScheduler()` "uses FSRS-7 when `version` is omitted". — [ts-fsrs README (v6.0.0 package)](https://github.com/open-spaced-repetition/ts-fsrs)
- Quickstart API: `const scheduler = await DefaultScheduler(); const card = scheduler.newCard({ now }); scheduler.preview({ card, now })` returns results for Again/Hard/Good/Easy, and `scheduler.review({ card, grade: Rating.Good, now })` "returns a new card and review log without mutating the input card. Save both `result.card` and `result.revlog`." — [ts-fsrs README](https://github.com/open-spaced-repetition/ts-fsrs)
- Config options: `version`, `desiredRetention` (e.g. 0.9), `enableShortTerm`, `learningSteps: ['1m','10m']`, `relearningSteps: ['10m']`, `enableFuzz`, `maximumInterval` (days), and optional `weights`. Omitting `weights` uses the version's preset. — [ts-fsrs README](https://github.com/open-spaced-repetition/ts-fsrs)
- FSRS-7 memory state needs `stability`, `stabilityFast`, `difficulty` and uses fractional elapsed days. Retrievability comes from `scheduler.model.forgettingCurve(card, elapsedDays)`. — [ts-fsrs README](https://github.com/open-spaced-repetition/ts-fsrs)
- v6 adds a composable `defineScheduler({ model, chrono }).use(middleware).create({ config })` API. There is a v5→v6/FSRS-7 migration guide. — [ts-fsrs docs: migration](https://open-spaced-repetition.github.io/ts-fsrs/guide/migration)
- The legacy (now `@deprecated`) `Card` type has fields `due, stability, difficulty, scheduled_days, learning_steps, reps, lapses, state, last_review?`. Legacy `ReviewLog` has `rating, state, due, stability, difficulty, scheduled_days, learning_steps, review`. The v6 recommendation is to use the inferred `DefaultSchedulerCard` type. — ts-fsrs 6.0.0 type declarations in the [npm package](https://www.npmjs.com/package/ts-fsrs)
- Package `engines`: Node.js `>=24.0.0` (the same applies to the binding package). — [npm: ts-fsrs](https://www.npmjs.com/package/ts-fsrs)

**Optimizer: fsrs-rs / WASM**
- `@open-spaced-repetition/binding` v0.6.1 (MIT): "Node.js bindings for the FSRS Optimizer implemented in Rust and compiled to WASI". It is powered by `fsrs-rs` and `napi-rs`, and does parameter optimization, CSV→FSRS item conversion and learning-step recommendation. "Public beta notice: this package is in public testing and its API may change between releases." — [npm: @open-spaced-repetition/binding](https://www.npmjs.com/package/@open-spaced-repetition/binding)
- API: `convertCsvToFsrsItems(csv, nextDayStartsAt, timezoneOrOffset, modelVersion)` and `computeParameters(items, { enableShortTerm, modelVersion: 'FSRS-7'|'FSRS-6', numRelearningSteps, timeout, progress })`. The timezone can be an IANA name such as 'Asia/Yangon' or an offset in minutes. — [binding README](https://www.npmjs.com/package/@open-spaced-repetition/binding)
- Browser: a "Dynamic WASI initialization" path loads `@open-spaced-repetition/binding-wasm32-wasi` (Vite `?url` / `?worker` imports). The README says to call the optimizer "from a dedicated Worker so the main thread stays responsive" and to enable cross-origin isolation (COOP/COEP headers) for browser deployments. — [binding README](https://www.npmjs.com/package/@open-spaced-repetition/binding)
- `computeOptimalSteps` (learning-step recommender) "is not usable with FSRS-3 … or FSRS-7 (dual-trace curve)". — [binding README](https://www.npmjs.com/package/@open-spaced-repetition/binding)

**py-fsrs (Python)**
- PyPI package `fsrs` latest is **6.3.3**, uploaded 2026-11-13, MIT license (Copyright 2022 Open Spaced Repetition). — [PyPI: fsrs](https://pypi.org/project/fsrs/)

### Inferences
- **Recommended stack:** use ts-fsrs in the browser for scheduling, so reviews work fully offline and no server round-trip is needed. Persist `result.card` to the per-user card document and append `result.revlog` to a review-log store.
- **Store review logs in a form the optimizer can consume:** card id, review timestamp (UTC ms), rating (1–4), and ideally state before review and duration. That lets you export a CSV for `convertCsvToFsrsItems` later. Also store the user's IANA timezone, which the optimizer needs to compute day boundaries.
- **Run optimization rarely, if at all.** FSRS default weights work out of the box, and optimizers need a substantial review history per user (hundreds to thousands of reviews) to beat defaults. Adding COOP/COEP headers to Firebase Hosting for WASI threads can break third-party embeds and Google sign-in popups. A simpler option is a scheduled Cloud Function, or a local Python script using py-fsrs/fsrs-rs, that optimizes per-user weights monthly and writes them to the user's settings doc. Treat this as a later enhancement.
- **Node ≥24 is a toolchain requirement** (your dev/CI Node version). The scheduler is pure TypeScript and should bundle for browsers. Confirm with a quick Vite build test; this inference is unverified.
- **Pin `version: 'FSRS-7'` (or 'FSRS-6') explicitly** in config. That way a future library default change won't silently alter scheduling, and stored card fields stay consistent (FSRS-7 adds `stabilityFast`).
- **Data model (Anki-like):**
  - A *note* is a learning item: Burmese text, romanization, gloss, audio id, tags, lesson.
  - A *card type* (template) is one direction, e.g. "Listen→meaning", "Burmese→English", "English→Burmese (production)", "Tone/pronunciation".
  - A *card* is (userId, noteId, cardType) holding FSRS state.
  - Notes and templates are static course content shipped with the app. Only cards, review logs and settings are per-user data in Firestore.
  - Deterministic card ids such as `${noteId}__${cardType}` make offline creation idempotent.

### Gaps
- Could not confirm the exact v6 card/revlog field names for FSRS-7 from the docs site (only deprecated legacy types were inspected). Check `DefaultSchedulerCard` in the API reference.
- Did not verify a pure-browser (non-WASI) FSRS-7 optimizer, or how much review data FSRS-7 optimization needs.
- The fsrs-rs crate version and the separate `fsrs-browser` WASM project status were not checked.

## 2. Frontend framework and PWA tooling for a small app on Firebase Hosting

### Takeaway
For a solo hobby SPA that must work offline, **Vite 8 + React 19 (or Svelte) + vite-plugin-pwa 2.0 (Workbox 7.4)** deployed as static files to Firebase Hosting is the leanest path. SvelteKit with `adapter-static` is an equally good choice for developers who prefer Svelte. Next.js 16 static export works but brings SSR-oriented complexity that an offline SPA doesn't need (opinion). Audio offline caching needs deliberate Workbox config: pre-cache or explicitly cache the files, and add RangeRequestsPlugin.

### Cited Findings
- Current versions (npm, 2026-11-21): vite 8.3.8, react 19.3.1, @sveltejs/kit 3.4.0, next 16.4.6, vite-plugin-pwa 2.0.0 (MIT, Oct 2026), workbox-build / workbox-range-requests 7.4.1. — [npm: vite](https://www.npmjs.com/package/vite), [npm: react](https://www.npmjs.com/package/react), [npm: @sveltejs/kit](https://www.npmjs.com/package/@sveltejs/kit), [npm: next](https://www.npmjs.com/package/next), [npm: vite-plugin-pwa](https://www.npmjs.com/package/vite-plugin-pwa)
- vite-plugin-pwa 2.0.0 peer dependencies: vite `^3 … ^8`, workbox-build `^7.4.1`, workbox-window `^7.4.1`, @vite-pwa/assets-generator `^1 || ^2`. It supports current Vite 8. — [npm: vite-plugin-pwa](https://www.npmjs.com/package/vite-plugin-pwa)
- Workbox audio/video caching requirements:
  - The route needs `RangeRequestsPlugin`.
  - Media elements need `crossorigin="anonymous"`, "even for same-origin URLs".
  - "Caching the media asset as it's streamed at runtime won't work", because playback fetches partial 206 responses. Add files ahead of time via precaching, `cache.add()`, or `warmStrategyCache`.
  - Example: CacheFirst for `request.destination === 'audio'` with `CacheableResponsePlugin({statuses:[200]})` + `RangeRequestsPlugin`.
  - Warning that media "can be quite large and exceed storage quotas".
  — [Chrome Developers: Serving cached audio and video](https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video)
- IndexedDB helpers for local-first data: idb 8.0.4 (ISC), Dexie 4.4.7 (Apache-2.0). — [npm: idb](https://www.npmjs.com/package/idb), [npm: dexie](https://www.npmjs.com/package/dexie)

### Inferences
- **Pick by familiarity.** React + Vite has the largest ecosystem and examples for Firebase. Svelte/SvelteKit gives smaller bundles. Both deploy as a static `dist/` folder with a SPA rewrite (`"rewrites":[{"source":"**","destination":"/index.html"}]`) on Firebase Hosting. Next.js static export (`output: 'export'`) loses server features, and its PWA story needs third-party plugins, so it is the least lean option here (opinion).
- **PWA config suggestions:**
  - `registerType: 'prompt'`, so a new content version doesn't reload mid-review.
  - Precache app shell + course JSON.
  - A separate runtime cache `audio-v{n}` populated per lesson with `cache.addAll()` when the user taps "download lesson for offline".
  - Call `navigator.storage.persist()` to reduce eviction risk.
- **Offline review state:** Firestore's persistent cache (§3) may be enough. A local-first design (Dexie/IndexedDB as source of truth, synced to Firestore) gives more control over conflict handling and pre-login use. The simplest approach is Firestore persistent cache alone, adding Dexie only if needed.

### Gaps
- Did not fetch vite-plugin-pwa 2.0 release notes, so breaking changes vs 1.x are unverified.
- No current benchmarks comparing bundle sizes of the frameworks were gathered.
- iOS Safari storage-eviction behaviour for PWAs (the 7-day script-writable storage cap for non-installed sites) was not re-verified for 2026.

## 3. Firebase: Hosting, Auth, Firestore, Storage, Functions, App Check, AI Logic, Genkit, plans and costs

### Takeaway
Hosting + Auth + Firestore work on the free Spark plan. **Cloud Storage now requires the Blaze plan** (enforced from 2026-02-03), and Cloud Functions need Blaze too. Options: (a) stay on Spark and serve audio as static files from Firebase Hosting, or (b) move to Blaze with a budget alert; for ~100 users costs are realistically ~$0–2/month. Firebase AI Logic (formerly Vertex AI in Firebase) lets the web client call Gemini directly, including the WebSocket-based **Gemini Live API** for audio. The Gemini Developer API has a no-billing free tier, and App Check enforcement is now required for AI Logic.

### Cited Findings
**Plans / pricing**
- "To use Cloud Storage for Firebase, your Firebase project must be on the pay-as-you-go Blaze pricing plan". Firebase release notes set enforcement for **February 3, 2026**. New default buckets are named `PROJECT_ID.firebasestorage.app`. — [Firebase FAQ: Cloud Storage default bucket and billing changes](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024); [Firebase release notes](https://firebase.google.com/support/releases)
- One secondary source says that after enforcement, Spark projects lose access to existing buckets (console redirects to upgrade, API calls return 402/403). — [agentdeals.dev Firebase free tier 2026](https://agentdeals.dev/vendor/firebase) (secondary; unverified)
- Blaze no-cost Storage allowance for new `.firebasestorage.app` buckets: sources conflict. One says 5 GB-months stored and 100 GB/month downloaded; another (legacy `.appspot.com`) says 5 GB stored and 1 GB/day download. — [DEV: Spark vs Blaze guide](https://dev.to/androve2k/spark-vs-blaze-the-firebase-pricing-guide-i-wish-id-read-sooner-onb); [we.inc Firebase pricing](https://we.inc/guides/firebase-pricing) (secondary; conflicting)
- **Firestore Standard edition pricing:**
  - Reads $0.03, writes $0.09, deletes $0.01 per 100,000 documents.
  - Free tier per day: 50,000 reads, 20,000 writes, 20,000 deletes (plus 1 GiB storage per secondary sources).
  - "Each set or update operation counts as a single write", and Standard edition does not bill index writes.
  - Enterprise edition instead bills 1 KiB write units.
  — [Google Cloud: Firestore pricing](https://cloud.google.com/firestore/pricing)
- **Firebase Hosting free limits:** most secondary sources give 10 GB storage and 360 MB/day transfer on Spark, with Blaze overage about $0.026/GB stored and $0.15/GB transferred. One source notes the Hosting docs say 10 GB/month transfer instead. — [toolradar Firebase Hosting pricing](https://toolradar.com/tools/firebase-hosting/pricing); [freetier.co Firebase Hosting](https://freetier.co/directory/products/firebase-hosting) (secondary)
- Cloud Run / Cloud Functions 2nd gen free tier is reportedly 2M requests, 180,000 vCPU-s and 360,000 GiB-s per month per billing account. This could **not** be verified from the live page (fetch returned only the title; the figures came from the fetch tool's background knowledge). — [Cloud Run pricing](https://cloud.google.com/run/pricing) (unverified)

**Firestore offline persistence (web)**
- `enableIndexedDbPersistence()` and `enableMultiTabIndexedDbPersistence()` are deprecated and "will be removed in a future major release". Instead, set `FirestoreSettings.localCache` to `persistentLocalCache(...)`. Multi-tab support is `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`; the default is single-tab. Mixing the old and new approaches throws. — [Firebase JS reference: Firestore](https://firebase.google.com/docs/reference/js/firestore.md.txt); [Firestore: Enable offline data](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- Current JS SDK: `firebase` 13.4.0 (npm, 2026-11-16); AI subpackage `@firebase/ai` 3.1.0. — [npm: firebase](https://www.npmjs.com/package/firebase)

**Auth (anonymous → permanent account)**
- When linking a Google credential to an anonymous user where that Google account already belongs to another Firebase user, the error is `auth/credential-already-in-use`. You "can recover from this error by signing in with error.credential directly via signInWithCredential". — [Firebase JS v8 reference: User](https://firebase.google.com/docs/reference/js/v8/firebase.User); [AuthError reference](https://firebase.google.com/docs/reference/node/firebase.auth.AuthError)
- Community reports say `error.credential` can be null in some Flutter-web cases. Third-party guides recommend merge logic so anonymous progress isn't lost (opinion). — [flutterfire issue #9920](https://github.com/firebase/flutterfire/issues/9920); [rapidevelopers guide](https://www.rapidevelopers.com/firebase-tutorial/how-to-handle-anonymous-users-in-firebase)

**App Check**
- reCAPTCHA Enterprise is recommended for new web integrations and is "no-cost for 10,000 assessments each month". Each browser token refresh creates an assessment, and a longer token TTL reduces assessments. One third-party blog says the 10k quota is per organization (unverified). — [Firebase App Check overview](https://firebase.google.com/docs/app-check); [App Check web reCAPTCHA docs](https://firebase.google.com/docs/app-check/web/recaptcha-provider)
- For 2nd-gen callable functions, `enforceAppCheck: true` in `onCall` options rejects requests without valid tokens. Client SDKs attach tokens automatically. — [App Check for Cloud Functions](https://firebase.google.com/docs/app-check/cloud-functions)

**Cloud Functions 2nd gen secrets**
- `defineSecret()` params are stored in Cloud Secret Manager and must be bound to the functions that use them (`secrets: [key]` in options, `key.value()` at runtime). — [Configure your environment](https://firebase.google.com/docs/functions/config-env); [Code with Andrea: API keys with 2nd-gen functions](https://codewithandrea.com/articles/api-keys-2ndgen-cloud-functions-firebase/)
- `onCallGenkit` wraps a Genkit flow as a callable function and supports `enforceAppCheck` and `defineSecret` keys. Streaming callable responses are supported. — [Invoke Genkit flows from your app](https://firebase.google.com/docs/functions/oncallgenkit); [Firebase blog: streaming Cloud Functions + Genkit](https://firebase.blog/posts/2025/03/streaming-cloud-functions-genkit/)
- Genkit JS current version: `genkit` 1.44.0 (Apache-2.0). — [npm: genkit](https://www.npmjs.com/package/genkit)

**Firebase AI Logic (renamed from Vertex AI in Firebase)**
- It supports two providers: the Gemini Developer API and the "Agent Platform Gemini API (formerly Vertex AI)". The Gemini Developer API free tier needs no billing account (works on Spark); the Vertex path requires Blaze. The no-cost option is supported on the Web SDK. — [Firebase AI Logic docs](https://firebase.google.com/docs/ai-logic); [AI Logic pricing](https://firebase.google.com/docs/ai-logic/pricing); [Firebase blog Sept 2025 updates](https://firebase.blog/posts/2025/09/firebase-ai-logic-updates/)
- Note the provider rename: search extracts call Vertex AI "Agent Platform Gemini API" in current docs. This came from search snippets and needs verifying.
- App Check: limited-use tokens (5-minute lifespan) with replay protection are supported. One migration page says "Starting November 2, 2026, Firebase App Check enforcement will be required to use Firebase AI Logic", and a guide says console guided setup auto-enforces App Check from early July 2026. — [AI Logic: App Check](https://firebase.google.com/docs/ai-logic/app-check); [Migrate from preview](https://firebase.google.com/docs/ai-logic/migrate-from-preview)
- **Live API:** a "stateful API that creates a WebSocket connection" between client and Gemini. The Web SDK creates a live model with audio response modality. Models listed include `gemini-3.1-flash-live-preview` (Gemini Developer API) and 2.5 native-audio previews such as `gemini-2.5-flash-native-audio-preview-12-2025`. With Vertex, Live models are "not supported in the global location". — [Get started with the Gemini Live API using Firebase AI Logic](https://firebase.google.com/docs/ai-logic/live-api); [Live API capabilities](https://firebase.google.com/docs/ai-logic/live-api/capabilities)
- AI Logic pricing defers to the chosen Gemini provider's token pricing. No authoritative audio-token price was retrieved. — [AI Logic pricing](https://firebase.google.com/docs/ai-logic/pricing)
- Opinion: a third-party post on shipping Gemini via AI Logic recommends App Check plus per-user limits to avoid quota abuse. — [Aditya Seth blog](https://adityaseth.in/blog/firebase-ai-logic-app-check-gemini-mobile-quota)

### Inferences
- **Firestore data model:**
  - `users/{uid}` holds settings: timezone, desiredRetention, FSRS weights, courseVersion.
  - `users/{uid}/cards/{noteId__cardType}` holds FSRS state plus `due` (indexed for "due today" queries).
  - `users/{uid}/reviewLogs/{autoId}`, or better, batched `users/{uid}/reviewSessions/{sessionId}` with an array of compact logs.
  - Security rules: `request.auth.uid == uid`.
  - Avoid one ever-growing log document: Firestore documents are capped at 1 MiB (well-known limit, not re-verified in this session).
- **Write cost math (inference):** a review = 1 card write + 1 log write. 100 users × 100 reviews/day = 20,000 writes/day, exactly the Spark daily free write quota. Batching logs into one session doc per ~50 reviews roughly halves writes. On Blaze, even 40k writes/day exceeds the free tier by only 20k/day ≈ 600k/month ≈ $0.54/month at $0.09/100k. Reads are similar or smaller with the offline cache.
- **Audio hosting:** because Storage needs Blaze, the leanest Spark-compatible option is to ship audio as static files in the Hosting deploy (CDN-cached, versioned filenames, long `Cache-Control`).
  - Example: 2,000 clips × ~20 KB Opus ≈ 40 MB, well under 10 GB Hosting storage.
  - Every user downloading everything once = 100 × 40 MB = 4 GB total, spread over weeks. That fits 360 MB/day (≈10 GB/month) only if spread out. Per-lesson downloads are better.
  - Cloud Storage makes sense mainly for user-generated audio (future speaking practice), which needs Blaze anyway.
- **Estimated monthly cost for ~100 hobby users (inference):**
  - Spark: $0 if audio stays on Hosting and AI uses the Gemini Developer API free tier (no Functions).
  - Blaze: realistically $0–$2/month for Firebase services, plus AI token costs that depend entirely on usage. Set a budget alert and AI rate limits.
  - The Blaze free allowances (Firestore daily quota, Hosting 10 GB, Cloud Run free tier) likely cover the core app.
- **AI architecture:** use AI Logic from the client for low-risk generative features (example sentences, explanations, Live API conversation practice), with App Check enforced. Use a 2nd-gen callable function with `defineSecret` (or `onCallGenkit`) for third-party APIs without Firebase client SDKs, e.g. a Burmese TTS/ASR vendor, or when you need server-side per-user quotas. Verify each model's Burmese ('my') support and quality before committing.
- **Anonymous auth flow:** sign in anonymously on first launch so progress syncs immediately, then `linkWithPopup(GoogleAuthProvider)` / `linkWithCredential(EmailAuthProvider...)` to upgrade. Handle `auth/credential-already-in-use` by signing into the existing account and merging local cards (max of reps/last_review, union of logs).

### Gaps
- Could not fetch the official Firebase pricing page directly, so Hosting transfer (360 MB/day vs 10 GB/month), Blaze Storage free allowance and Cloud Functions free tier remain unverified.
- Current Gemini audio-token prices and free-tier rate limits were not retrieved.
- Whether AI Logic's Live API supports Burmese speech input/output was not verified.
- The AI Logic App Check enforcement date (Nov 2, 2026) comes from a search snippet; actual console behaviour is unconfirmed.
- Firestore limits (1 MiB doc, per-document sustained write guidance, 500-ops batch) were not re-verified this session (docs.cloud.google.com unreachable).
- Did not verify whether anonymous Auth accounts count toward any MAU limits or whether there's an auto-cleanup setting for stale anonymous users.

## 4. Content pipeline and audio formats

### Takeaway
Keep course content (notes, lessons, card templates) as **versioned JSON/YAML in the git repo**, built into static JSON at deploy time. It's free, diffable, offline-precachable, and needs no Firestore reads. Store only per-user state in Firestore. For audio, **AAC in MP4 (.m4a) at ~48–64 kbps mono** is the safest universal format. Opus in WebM/Ogg is smaller and now plays in Safari 18.4+, but needs a fallback for older iOS. Normalize clips with two-pass EBU R128 (ffmpeg-normalize) to a consistent target (−16 to −19 LUFS for mono speech, true peak ≈ −1.5 dBTP).

### Cited Findings
- Safari Opus support history, with conflicting claims:
  - Safari 11–18.3 played Opus only in a CAF container.
  - Safari 18.4 (iOS 18.4 / macOS 15.4) added Ogg container support for Opus and Vorbis.
  - Claims for WebM-Opus support range from "Safari 14" to "17.4".
  Use `canPlayType` feature detection and test on real devices. — [testmuai: Opus browser support](https://www.testmuai.com/learning-hub/opus-audio-codec-browser-support/); [salivity: Safari codecs](https://salivity.github.io/safari/article/audio-and-video-codecs-supported-by-the-safari-browser); [WebKit bug 183852](https://bugs.webkit.org/show_bug.cgi?id=183852) (secondary sources conflict)
- Safari 18.4 also added WebM (Opus/VP8/VP9) *recording* to MediaRecorder, plus fragmented MP4, ALAC and PCM. — [Media Codings: recording cross-browser media](https://media-codings.com/articles/recording-cross-browser-compatible-media)
- **Loudness normalization:**
  - Two-pass loudnorm (measure, then linear gain) is the usual recommendation; single-pass uses dynamic mode, which compresses and can pump on dialogue.
  - `ffmpeg-normalize` automates two-pass linear normalization.
  - Common settings: −16 LUFS, TP −1.5 dBTP, LRA 11.
  - Google's audio-loudness guidance says mono content should average −19 LUFS (or −16 with dual-mono metering).
  - A developer test found loudnorm "silently switched to dynamic mode" on short TTS clips, so verify the output mode.
  — [Google: Audio loudness](https://developers.google.com/assistant/tools/audio-loudness); [ffmpeg-normalize](https://github.com/slhck/ffmpeg-normalize); [DEV: two-pass loudnorm](https://dev.to/masonwritescode/two-pass-loudness-normalization-with-ffmpeg-loudnorm-the-right-way-1nm3)

### Inferences
- **Format choice:** serve `.m4a` (AAC-LC, mono, 48–64 kbps, 44.1/48 kHz) as the single format. It plays everywhere, including all iOS versions, and is simple. If bandwidth matters, add Opus (`.webm`/`.ogg`, ~24–32 kbps) as the primary `<source>` with m4a fallback, chosen via `canPlayType`. For short words and sentences, the size difference is small, so a single AAC format is the lean choice.
- **Very short clips:** two-pass loudnorm on clips of a few seconds or less can be unreliable. Consider normalizing a longer concatenated recording session before slicing. Alternatively, use peak/RMS normalization plus a limiter for single words. Add ~100–150 ms silence padding so iOS doesn't clip onsets.
- **Pipeline sketch:**
  1. `content/*.yaml` (notes with `id`, `my`, `romanization`, `en`, `audio: id`, `tags`).
  2. A CI script validates the schema, checks for Zawgyi with myanmar-tools (§5), and checks that audio files exist.
  3. Normalize and encode with ffmpeg; write hashed filenames.
  4. Emit `public/content/course.v{N}.json` and `public/audio/{hash}.m4a`.
  5. The app compares `courseVersion` to migrate cards when note ids change. Never reuse or renumber note ids.
- **Why not Firestore for content:** Firestore content costs reads per user per sync and complicates offline precaching. Firestore makes sense only if non-developers need to edit content via an admin UI.

### Gaps
- No authoritative (MDN/caniuse) table for Safari Opus playback by container was retrieved.
- No data on the minimum clip duration for reliable loudnorm measurement.
- Did not research Burmese TTS options for generating audio (out of scope, but relevant to the pipeline).

## 5. Burmese (Myanmar script) on the web

### Takeaway
Use Unicode Burmese only, with `lang="my"` on Burmese text. Load **Noto Sans Myanmar** (UI) and optionally **Padauk** or **Noto Serif Myanmar** from Google Fonts; all three are available. Give Burmese generous `line-height`, because stacked diacritics need vertical room. `Intl.Segmenter('my', {granularity:'word'})` produces good dictionary-based word breaks (useful for tap-to-gloss, word tiles and spacing). **Grapheme segmentation does not give Burmese syllables**, so write a regex syllable segmenter for letter/syllable exercises. Use Google's **myanmar-tools** to detect Zawgyi in any user-entered or imported text. For input, rely on OS keyboards (Gboard, iOS, Windows, macOS) or Keyman/KeyMagic, and consider an in-app on-screen keyboard for exercises.

### Cited Findings
- Google Fonts CSS2 API currently serves **Noto Sans Myanmar** (v27), **Noto Serif Myanmar** (v14) and **Padauk** (v17) at weights 400/700. Checked live via `fonts.googleapis.com/css2?family=…` on 2026-11-21. — [Google Fonts: Noto Sans Myanmar](https://fonts.google.com/noto/specimen/Noto+Sans+Myanmar); [Google Fonts: Padauk](https://fonts.google.com/specimen/Padauk); [Google Fonts: Noto Serif Myanmar](https://fonts.google.com/noto/specimen/Noto+Serif+Myanmar)
- Unicode FAQ: fonts supporting Burmese include Myanmar Text (Windows), Myanmar Sangam MN (macOS/iOS) and Noto Sans Myanmar (Android). Padauk (SIL) is "the best font as of early 2022 for other languages using the Myanmar script". Zawgyi should be converted to Unicode before display. Using a Zawgyi web font makes Zawgyi text look right but Unicode text look wrong. — [Unicode FAQ: Myanmar](http://www.unicode.org/faq/myanmar.html)
- Pyidaungsu is the government-promoted Unicode font distributed via the Myanmar Computer Federation / mmunicode.org. — [MCF: Pyidaungsu font](https://mcf.org.mm/pyidaungsu-font); [mmunicode.org keyboards](https://www.mmunicode.org/wiki_cats/keyboards/)
- myanmar-tools (Google) uses a Markov model to estimate whether a string is Zawgyi or Unicode. It is available for JS, Java, and other platforms, and offers a tunable score threshold. The npm package `myanmar-tools` is at **1.2.0** (Apache-2.0, last published 2022-06, i.e. stable but unmaintained-looking). — [Unicode Conference talk: Fixing Burmese (Carr/Hoffman/Swartz)](https://www.unicodeconference.org/presentations-42/S8T3-Carr-Hoffman-Swartz.pdf); [npm: myanmar-tools](https://www.npmjs.com/package/myanmar-tools); [awesome-myanmar-unicode](https://github.com/khzaw/awesome-myanmar-unicode)
- Detectors distinguish only Zawgyi vs Unicode, not other legacy encodings. — [Burmese_Font_Detector](https://github.com/HtetAungWai/Burmese_Font_Detector)
- **Intl.Segmenter** is Baseline since April 2024 (Chrome/Edge 87, Firefox 125, Safari 14.1). — [web.dev: Intl.Segmenter is Baseline](https://web.dev/blog/intl-segmenter); [caniuse: Intl.Segmenter](https://caniuse.com/mdn-javascript_builtins_intl_segmenter)
- ICU ships a Burmese dictionary for break iteration, and Firefox added language-aware word selection for Burmese. — [Mozilla bug 1423593](https://bugzilla.mozilla.org/show_bug.cgi?id=1423593); [Mozilla bug 1854032](https://bugzilla.mozilla.org/show_bug.cgi?id=1854032)
- **Local test** (Node 22.23.5, ICU 78.3): `Intl.Segmenter('my',{granularity:'word'})` on "မြန်မာစကားကိုလေ့လာနေပါတယ်။ ကျွန်တော်ကျောင်းသွားမယ်" gives `မြန်မာ | စကား | ကို | လေ့လာ | နေ | ပါ | တယ် | ။ | ကျွန်တော် | ကျောင်း | သွား | မယ်`, which matches correct word segmentation. Grapheme segmentation of "ကျွန်တော်" gives `ကျွ | န် | တေ | ာ်`, which are not linguistic syllables (expected: ကျွန် | တော်). — local test; [MDN: Intl.Segmenter](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)
- CSS: WPT/W3C i18n tests expect browsers to break Burmese at word boundaries under `word-break: normal` with `lang="my"`. Per-engine pass results were not found. — [WPT word-break-normal-my-000](https://github.com/web-platform-tests/wpt/blob/master/css/css-text/word-break/word-break-normal-my-000.html); [W3C i18n line-break results](https://www.w3.org/International/tests/html-css/line-break/results-word-break)
- **Input methods:**
  - KeyMagic is an open-source Myanmar IME for Windows 10/11, macOS (Intel/Apple Silicon) and Linux.
  - SIL "myWin Extended" Keyman keyboard works on Windows/macOS/Linux/web/iOS/Android (updated Oct 2025).
  - An older blog says macOS has a built-in Myanmar input source.
  - Gboard Burmese layouts, including a phonetic one, are claimed by a low-reliability source only.
  — [KeyMagic](https://keymagic.net/); [Keyman: myWin Extended](https://keyman.com/en/keyboards/sil_myanmar_mywinext); [Naing Ye Minn: macOS Myanmar keyboard](https://naingyeminn.com/posts/myanmar-unicode-keyboard-for-yosemite/); [englishtomyanmar.com (low reliability)](https://englishtomyanmar.com/myanmar-to-english-translation-keyboard-free/)

### Inferences
- **CSS:**
  - `:lang(my) { font-family: "Noto Sans Myanmar", "Myanmar Text", "Myanmar Sangam MN", "Padauk", sans-serif; line-height: 1.8–2; }`
  - Use `font-display: swap`.
  - Self-host the font in the PWA precache (download the woff2 via a tool like google-webfonts-helper or fontsource) so Burmese renders offline. A Google Fonts CDN link won't be cached reliably for first offline use unless you add a runtime cache rule.
  - Avoid `letter-spacing`, which breaks shaping, and synthetic bold.
- **Segmentation:** use `Intl.Segmenter` for word-level features. Test in Safari/JavaScriptCore and Firefox, because results can differ by ICU/dictionary version (verified only in Node/V8). For syllable-level features (syllable tiles, tone drills), implement the well-known regex-based Myanmar syllable breaking (as in the Python `sylbreak` approach) rather than graphemes.
- **Zawgyi handling:** run myanmar-tools in the content CI to fail builds on Zawgyi. Also run it on any user text input, e.g. typed answers. Users on older Android phones may still type Zawgyi, so detect it and show a warning or convert (Rabbit converter or ICU transliterator). Also apply Unicode normalization/reordering checks before comparing typed answers, because diacritic order varies. Compare answers after NFC plus a Myanmar-specific canonical-order fix.
- **Typing exercises:** because many learners won't have a Burmese keyboard installed, an in-app on-screen keyboard or syllable-tile picker is the lowest-friction option. Typing via the OS keyboard can be an optional mode.

### Gaps
- No official Gboard/Windows/Apple documentation for Burmese layouts was retrieved, so the names of the built-in layouts are unconfirmed.
- Safari/Firefox Intl.Segmenter output for Burmese was not tested.
- Per-browser CSS line-break behaviour for Burmese (dictionary breaks vs. none) was not confirmed. Without it, long Burmese strings may not wrap well, and inserting U+200B zero-width spaces at Intl.Segmenter word boundaries is a workaround (inference).
- No current status was found on Zawgyi prevalence in 2026.

## 6. Testing and CI

### Takeaway
Use the **Firebase Local Emulator Suite** (Auth, Firestore, Functions, Hosting) for local dev and security-rules tests. Use the official **FirebaseExtended/action-hosting-deploy** GitHub Action, which `firebase init hosting:github` can scaffold, to deploy production on merge and an auto-expiring **preview channel per PR**.

### Cited Findings
- action-hosting-deploy creates a separate preview channel per PR when `channelId` is left blank. Default expiry is 7 days, reset on each deploy. Inputs include `repoToken` and `firebaseServiceAccount` from secrets. It runs on every commit pushed to the PR. — [GitHub: FirebaseExtended/action-hosting-deploy](https://github.com/FirebaseExtended/action-hosting-deploy); [DEV: preview deployments with Firebase Hosting](https://dev.to/ozantunca/preview-deployments-with-firebase-hosting-github-actions-27ag)
- Firebase docs: the GitHub integration "creates a new preview channel (and its associated preview URL) for every PR", and the Firebase CLI setup generates the workflow files. — [Firebase Hosting GitHub integration](https://firebase.google.com/docs/hosting/github-integration)
- firebase-tools current version: 15.37.0 (npm, 2026-11-19). — [npm: firebase-tools](https://www.npmjs.com/package/firebase-tools)

### Inferences
- **CI steps:**
  1. Install with Node 24, as required by ts-fsrs.
  2. Lint/typecheck.
  3. Run unit tests (Vitest) for scheduling and content validation.
  4. Run Firestore security-rules tests with `@firebase/rules-unit-testing` against `firebase emulators:exec`.
  5. Build, then deploy a preview channel on PR and `live` on main.
- **Preview channels and auth:** preview channels share the project's Firestore/Auth (production data). Use a separate Firebase project for staging if you want isolation. Add preview domains to Auth's authorized domains if sign-in must work on previews.
- **Workload Identity Federation** is a more secure alternative to a JSON service-account secret (inference; not verified for this action).

### Gaps
- Did not verify the current major version tag of action-hosting-deploy (e.g. `@v0`), or whether it supports Workload Identity Federation natively.
- Emulator support for AI Logic / Live API was not researched.

## 7. Browser audio recording and pitch detection for future speaking features

### Takeaway
MediaRecorder works in all major browsers. Probe `MediaRecorder.isTypeSupported()` with `audio/webm;codecs=opus` first and `audio/mp4` as fallback: Safari 18.4+ records WebM/Opus, while older Safari records only MP4/AAC. For pitch/tone feedback on Burmese's tones (which also involve phonation and duration, not just pitch), start with **pitchy** (MIT, lightweight McLeod method) on Web Audio frames. ML options (ml5 CREPE, Spotify basic-pitch) are heavier. Sending recordings to Gemini (via AI Logic or the Live API) or an ASR service is the more realistic route to pronunciation feedback.

### Cited Findings
- Safari wrote only `audio/mp4`/`video/mp4` until Safari 18.4. Safari 18.4 added WebM with Opus/VP8/VP9, fragmented MP4, ALAC and PCM. Since then `audio/webm; codecs=opus` should return true in Chrome, Firefox and Safari. — [Media Codings: recording cross-browser compatible media](https://media-codings.com/articles/recording-cross-browser-compatible-media)
- Safari 14.1–18.3: `isTypeSupported` returns false for webm and true for mp4. — [buildwithmatija: iPhone Safari MediaRecorder](https://www.buildwithmatija.com/blog/iphone-safari-mediarecorder-audio-recording-transcription)
- Chrome and Firefox default to audio/webm with Opus. Firefox also supports Ogg/Opus and does not record MP4. Sources conflict on Firefox Ogg vs WebM defaults. — [addpipe: recording audio in the browser](https://blog.addpipe.com/recording-audio-in-the-browser-using-pure-html5-and-minimal-javascript/); [testmuai: MediaRecorder support](https://www.testmuai.com/learning-hub/mediarecorder-browser-support/)
- Recommended practice is to probe a candidate list at runtime rather than hard-code a type. The W3C mediacapture-record WG has an open issue (#226) about narrowing `isTypeSupported()` results. — [openreplay: Recording audio in the browser](https://blog.openreplay.com/record-audio-browser-web-audio-api/); [W3C public-webrtc-logs](https://lists.w3.org/Archives/Public/public-webrtc-logs/2025Jul/0106.html)
- Pitch libraries (npm, 2026-11-21):
  - pitchy 4.1.0 (MIT, last published Jan 2024)
  - pitchfinder 2.3.4 (GPL-3.0, so watch the license)
  - aubiojs 0.2.1 (aubio WASM, last published 2022)
  - ml5 1.4.0 (MIT, Aug 2026)
  - @spotify/basic-pitch 1.0.1 (Apache-2.0)
  — [npm: pitchy](https://www.npmjs.com/package/pitchy); [npm: pitchfinder](https://www.npmjs.com/package/pitchfinder); [npm: aubiojs](https://www.npmjs.com/package/aubiojs); [npm: ml5](https://www.npmjs.com/package/ml5); [npm: @spotify/basic-pitch](https://www.npmjs.com/package/@spotify/basic-pitch)
- The Gemini Live API via Firebase AI Logic streams audio over WebSocket from the web client. — [Firebase AI Logic Live API](https://firebase.google.com/docs/ai-logic/live-api)

### Inferences
- **Mic permission UX:**
  - Request `getUserMedia({audio:true})` only after a user gesture on a clear "Record" button, never on page load.
  - Explain why first (a pre-prompt).
  - Handle `NotAllowedError` with instructions to re-enable in browser settings.
  - Requires HTTPS, which Firebase Hosting provides.
  - On iOS, a PWA added to the home screen may re-prompt per session.
  - Release tracks (`track.stop()`) after recording so the mic indicator turns off.
- **Store recordings** (if needed) in Cloud Storage under `users/{uid}/recordings/` with rules. This requires Blaze. Otherwise keep them local only (IndexedDB Blob) for self-comparison playback, which costs nothing.
- **Tone feedback approach:** compute an f0 contour with pitchy on a Web Audio `AnalyserNode` / AudioWorklet, then plot the learner's contour against the reference clip's contour (pre-computed offline in the content pipeline). Burmese tone categories (low, high, creaky, checked) depend heavily on phonation and duration, so pitch-only scoring would be misleading. Show visual overlays rather than pass/fail scores (inference from general phonetics knowledge, not sourced here).
- **Prepare for later AI/speech features now:**
  - Keep a clean `AudioRecorder` abstraction that returns `{blob, mimeType}`.
  - Centralize AI calls behind one service module, so AI Logic, Genkit callables and third-party APIs are swappable.
  - Enable App Check early.
  - Store per-note reference audio ids and romanization, which an ASR comparison will need.

### Gaps
- No evidence was gathered on the accuracy of browser pitch trackers on Burmese speech, or on CREPE/ml5 model size and latency.
- No verified source was found for which commercial ASR/TTS services support Burmese well in 2026, or for Gemini's Burmese speech quality.
- The current state of W3C issue #226 is unknown.

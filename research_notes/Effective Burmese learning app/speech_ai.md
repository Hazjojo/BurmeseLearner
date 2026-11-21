# Speech and AI Technology for Burmese (my-MM), and Evidence for AI Speaking Practice (Phase 2 planning)

> **Research conditions (read first):** This session's network blocked direct fetches of most primary sources (learn.microsoft.com, docs.cloud.google.com, huggingface.co, arxiv.org, elevenlabs.io, OpenAI docs, aclanthology.org, raw GitHub). Findings below come from **web-search result snippets and summaries** of those pages, not full-page reads. Treat every number as "reported by search snippet of the cited page", and verify on the live page before building. Vendor accuracy numbers are **vendor claims** unless stated otherwise. Some model names in results (e.g., "Gemini 3.5 Transcribe Live", "gemini-3.8-live", "gpt-realtime-2.1", "Scribe v3", "Eleven v4", "MAI-Transcribe-2") came up in search but could not be opened and checked. Date of research: 2026-11-21.

## 1. Speech-to-text (STT) for Burmese (my-MM)

### Takeaway
Burmese STT is now offered by at least Azure (real-time, batch, fast transcription, LLM Speech), Google Cloud (Chirp 3, in **Preview** for my-MM) and ElevenLabs Scribe. Error rates on FLEURS Burmese are still high in absolute terms (best reported figures are around 20% WER and 13–24% CER). Zero-shot Whisper large-v3 is effectively unusable (around 100% WER or more). No source measured accuracy on **non-native or learner** Burmese speech. That is a major unknown for a pronunciation app.

### Cited Findings
**Azure Speech**
- Microsoft's language-support table lists Burmese (Myanmar) my-MM for **real-time transcription, batch transcription, fast transcription, and Azure LLM Speech transcription**. It also lists monolingual post-stream refinement, but not multilingual refinement. The Azure China docs also list my-MM for fast transcription — [Microsoft Learn: Language and voice support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support); [Azure China docs](https://docs.azure.cn/en-us/ai-services/speech-service/language-support) (via search snippet).
- Fast transcription has two model paths. "Azure LLM Speech" is described as the flagship, LLM-powered model with contextual and multilingual recognition, custom prompting and speech translation. "Azure Transcribe" is the general-purpose path, with diarization, phrase lists, language ID and timestamps — [Microsoft Learn: LLM Speech](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/llm-speech) (via search snippet).
- A newer "MAI-Transcribe" model is said to cover 60 languages and to accept a `locales` field that forces a language. I could not confirm whether my-MM is among the 60 — [Microsoft Learn: MAI-Transcribe-2](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/mai-transcribe) (via search snippet).

**Google Cloud Speech-to-Text**
- The V2 supported-languages table lists my-MM under the **chirp_3** model in the `us` and `eu` locations, with automatic punctuation, profanity filter and model adaptation — [Google Cloud STT V2 supported languages](https://docs.cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages) (via search snippet).
- The Chirp 3 model page lists "Burmese (Myanmar) · my-MM · **Preview**". Chirp 3 as a whole reached GA on 13 Oct 2025 and is available only in the STT API V2. The search summary notes that the two Google pages do not fully agree on launch stage and regions. Google recommends querying the locations API for the current list — [Google Cloud: Chirp 3](https://docs.cloud.google.com/speech-to-text/docs/models/chirp-3) (via search snippet).

**ElevenLabs Scribe**
- ElevenLabs' Burmese STT landing page cites **21.7% WER for Scribe v1 on FLEURS Burmese**. The same page lists 100.0% WER for zero-shot Whisper large-v3 (**vendor claim**) — [ElevenLabs Burmese speech-to-text](https://elevenlabs.io/speech-to-text/burmese) (via search snippet).
- ElevenLabs' model docs say Scribe v3 cut the FLEURS WER averaged over 102 languages from 16.94% to 12.38% compared with Scribe v2. They also warn that they average per-clip WER per language, which gives higher figures than corpus-level WER. These are aggregate numbers, not Burmese-specific (**vendor claim**) — [ElevenLabs Models docs](https://elevenlabs.io/docs/overview/models) (via search snippet).

**OpenAI (Whisper, gpt-4o-transcribe, newer)**
- OpenAI says gpt-4o-transcribe improves WER and language recognition over the original Whisper models. An independent review notes OpenAI publishes no stated per-language FLEURS figure, and the launch post shows the numbers only as a chart — [OpenAI gpt-4o-transcribe model page](https://developers.openai.com/api/docs/models/gpt-4o-transcribe); [OpenTranscription review](https://opentranscription.io/en/models/openai/gpt-4o-transcribe) (via search snippet).
- A third-party report (Qwen3.5-Omni technical report) gives gpt-4o-transcribe an *average* FLEURS multilingual WER of 10.4%. I did not see the Burmese row — [Qwen3.5-Omni Technical Report, arXiv 2604.15804](https://arxiv.org/pdf/2604.15804) (via search snippet).
- OpenAI model pages exist for "gpt-transcribe" and "gpt-realtime-whisper". gpt-realtime-whisper is priced at **$0.017/min** — [OpenAI gpt-realtime-whisper](https://developers.openai.com/api/docs/models/gpt-realtime-whisper); [OpenAI gpt-transcribe](https://developers.openai.com/api/docs/models/gpt-transcribe) (via search snippet).

**Open-source and fine-tuned models**
- **BuzzASR/burmese** (a full fine-tune of Whisper large-v3) reports FLEURS **CER 24.01** and WER 97.39. Zero-shot Whisper large-v3 scored CER 123.32 on the same test set. The card claims a roughly 5.1x CER reduction on its combined test set. The WER is much higher than the CER, which suggests Burmese word segmentation inflates WER, so CER is the more meaningful metric — [HF: BuzzASR/burmese](https://huggingface.co/BuzzASR/burmese); see also [BuzzASR paper, arXiv 2609.09554](https://arxiv.org/pdf/2609.09554) (via search snippet).
- **ToeLay/whisper_large_v3_turbo_mm2** (Whisper large-v3-turbo fine-tune) reports **WER 47.1 / CER 15.6 on OpenSLR-80**, not FLEURS — [HF: ToeLay/whisper_large_v3_turbo_mm2](https://huggingface.co/ToeLay/whisper_large_v3_turbo_mm2) (via search snippet).
- A Journal of Signal Processing paper fine-tuned Whisper and other models on a combined Burmese corpus that includes FLEURS. **w2v-BERT 2.0 was best at 32.70% WER with 12 h** of data — [J. Signal Processing 30(6)](https://www.jstage.jst.go.jp/article/jsp/30/6/30_221/_article) (via search snippet).
- **myandev/Meta-MMS-300M-ASR** (MMS fine-tune, character-level CTC) reports **test CER 6.66 on unseen speakers** and validation WER 20.66. These figures are on the Burmese Daily Dialogue Corpus, not FLEURS (self-reported) — [HF: myandev/Meta-MMS-300M-ASR](https://huggingface.co/myandev/Meta-MMS-300M-ASR) (via search snippet).
- A GitHub project fine-tuned **SeamlessM4T v2 Large** on FLEURS my_mm (about 3,000 samples) and reports **WER 49.12% / CER 13.04%** — [GitHub: Hein-HtetSan/myanmar-asr](https://github.com/Hein-HtetSan/myanmar-asr) (via search snippet).
- A 102-language FLEURS study found SeamlessM4Tv2-Large the more robust transcriber overall. Whisper-v3-large's average non-English CER was more than twice as high — [Fleurs-SLU, arXiv 2501.06117](https://arxiv.org/pdf/2501.06117) (via search snippet).
- A 2025 paper on ASR error correction for low-resource Burmese uses alignment-enhanced transformers with phonetic features. It is relevant if the app post-processes ASR output — [arXiv 2511.21088](https://arxiv.org/html/2511.21088v1) (via search title only).

### Inferences
- **CER, not WER, is the right Burmese metric.** Burmese has no spaces between words, so WER depends on the segmenter. Numbers like BuzzASR's 97% WER next to 24% CER show this.
- Best-in-class Burmese STT in late 2026 looks like roughly 13–25% CER on read FLEURS speech. That is good enough to check whether a learner said roughly the target phrase (keyword or phrase matching against a known prompt). It is **not** good enough to grade tones or fine pronunciation from the transcript alone.
- Candidates to benchmark first: Azure my-MM (production-grade, real-time streaming), Google Chirp 3 my-MM (Preview), ElevenLabs Scribe, gpt-4o-transcribe or its successor, and a self-hosted MMS or Whisper fine-tune. Running the app's own prompts and a dozen learner recordings through each is the only way to get relevant accuracy.
- ASR models trained on native speech tend to "auto-correct" toward plausible native words. A learner's wrong tone may still be transcribed as the right word. That is good for conversation flow and bad for feedback (see Section 7).

### Gaps
- No per-model Burmese FLEURS table was found for Azure, Google Chirp 3, gpt-4o-transcribe, Gemini, AssemblyAI or Deepgram. The Qwen3.5-Omni report (Table 13) and the MMS paper's per-language tables may hold some of these numbers but could not be opened.
- **AssemblyAI and Deepgram support for Burmese: not verified.** Searches surfaced no Burmese mention, and their docs were unreachable.
- Gemini audio input for Burmese transcription: a "Gemini 3.5 Transcribe Live" language table reportedly lists my-MM (see Section 4), but I could not verify it or find accuracy figures.
- **No study of ASR accuracy on non-native or learner Burmese speech was found.**
- Common Voice Burmese results: none found.

## 2. Text-to-speech (TTS) for Burmese

### Takeaway
Azure has long-standing Burmese neural voices: **my-MM-NilarNeural (female)** and **my-MM-ThihaNeural (male)**. ElevenLabs lists Burmese for its latest multilingual model. Google Cloud TTS support for Burmese, OpenAI TTS support, and Burmese tone accuracy could not be verified. There are no published naturalness or tone-accuracy evaluations for any Burmese TTS voice.

### Cited Findings
- Microsoft's TTS blog table lists "my-MM | Burmese (Myanmar) | Nilar | Female" and Thiha as Male. Third-party voice catalogues list the IDs **my-MM-NilarNeural** and **my-MM-ThihaNeural** — [Microsoft Tech Community TTS update](https://techcommunity.microsoft.com/t5/azure-ai/azure-speech-s-neural-tts-empowers-organizations-to-serve-users/ba-p/2920882); [json2video: my-MM-NilarNeural](https://json2video.com/ai-voices/azure/voices/my-mm-nilarneural/); [json2video: my-MM-ThihaNeural](https://json2video.com/ai-voices/azure/voices/my-mm-thihaneural/) (via search snippet).
- A third-party catalogue estimates Nilar at about 63 wpm and Thiha at about 71 wpm. It says Thiha supports SSML for pauses, rate, pitch and say-as. These are third-party estimates, not Microsoft specifications — [json2video Burmese voices](https://json2video.com/ai-voices/languages/burmese/) (via search snippet).
- ElevenLabs lists Burmese among the 70+ languages of **Eleven v3**. Its Burmese TTS landing page instead frames Burmese under "Eleven v4". The naming is inconsistent across ElevenLabs pages. The v3 limit is 5,000 characters per request — [ElevenLabs v3](https://elevenlabs.io/v3); [ElevenLabs Burmese TTS](https://elevenlabs.io/text-to-speech/burmese); [ElevenLabs TTS docs](https://elevenlabs.io/docs/overview/capabilities/text-to-speech) (via search snippet).
- Meta's MMS paper evaluated MMS-TTS by running ASR over synthesized speech and reporting CER. Burmese is among the languages covered, but I did not obtain the Burmese value — [Pratap et al., Scaling Speech Technology to 1,000+ Languages, arXiv 2305.13516](https://arxiv.org/pdf/2305.13516) (via search snippet).
- Azure TTS is billed per character: Neural and Neural HD are priced per 1M characters, with a free tier of 0.5M Neural characters per month. Dollar amounts did not render in the search results — [Azure Speech pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/) (via search snippet).

### Inferences
- **Azure Nilar and Thiha are the safest production default** for model audio. They are GA, have stable IDs and support SSML rate control, which is useful for "slow" playback in shadowing drills.
- For tone teaching, TTS audio should be **checked by a native speaker** or replaced with real native recordings for core drills (minimal pairs, tone sets). Generated audio can mispronounce tone, and especially creaky versus high tone, with no warning.
- Rate control (SSML `prosody rate`) is cheap and valuable for "hear it slow, then normal".

### Gaps
- **Google Cloud TTS, including Chirp 3 HD and Gemini-TTS, for my-MM: not verified.** The Google docs pages were unreachable and no snippet confirmed or denied Burmese.
- **OpenAI TTS (gpt-4o-mini-tts and similar) Burmese quality: not verified.** OpenAI voices are multilingual by prompt, but I found no Burmese evaluation.
- Gemini TTS Burmese: not verified (see Section 4 on Live API native audio, where Burmese was not on the "all audio models" list).
- No published naturalness (MOS) or tone-accuracy evaluation of any Burmese TTS voice was found.
- **Browser Web Speech API for Burmese:** not researched with sources this session. Unverified prior understanding: `speechSynthesis` voices depend on the OS and browser and rarely include Burmese. `SpeechRecognition` is Chrome or Edge only, sends audio to a vendor server, and its Burmese support is undocumented. Do not rely on Web Speech for Burmese. Test on target devices.
- Azure and ElevenLabs per-character prices for late 2026 could not be read (the pricing pages render dynamically).

## 3. Pronunciation assessment (tones, phonation, aspiration)

### Takeaway
**No off-the-shelf pronunciation-assessment API was found that supports Burmese.** Azure Pronunciation Assessment covers about 33 locales, and Burmese is not reported among them. Feedback has to be built: (a) ASR or forced-alignment checks for "right syllables, right order", (b) F0 (pitch) contour extraction plus duration measures for tones, and (c) comparison against native reference recordings (DTW or a template). Burmese tone is defined by F0, duration *and* phonation together, and the acoustic literature disagrees on how consistent creakiness is. F0 plus duration is the most feasible and defensible first target.

### Cited Findings
- Azure Pronunciation Assessment supports **33 locales** (from Arabic Egypt/Saudi through Vietnamese, with English, Chinese, French, Spanish, Portuguese and German variants). The search summaries of the official list and its GitHub mirror do not mention Burmese — [Microsoft Learn language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support); [GitHub mirror: pronunciation-assessment.md](https://github.com/MicrosoftDocs/azure-ai-docs/blob/main/articles/ai-services/speech-service/includes/language-support/pronunciation-assessment.md) (via search snippet).
- Even within supported locales, deeper features are narrower: syllable groups reportedly only for en-US, and phoneme names for en-US and zh-CN — [ittrip admin guide (third party)](https://en.ittrip.xyz/ai/azure-pronunciation-foundry) (via search snippet).

**Burmese tone acoustics (what feedback must capture)**
- A UT Austin acoustic study (4 native speakers, 4 tones, 2 vowels) measured F0 contour, duration, voice quality and vowel quality. High and low tones differed from creaky and stopped tones in onset F0, peak F0, duration and voice quality. Creaky and stopped tones were separated mainly by **vowel quality**. The study notes disagreement in the literature on the F0 contour of high and low tones and on how consistent creakiness is — [An acoustic analysis of Burmese tone, UT Austin](https://repositories.lib.utexas.edu/handle/2152/19915) (via search snippet).
- Lai and Lee describe pitch and phonation as the two main cues. They report creaky tone has the highest max F0, followed by glottal (stopped), high and low. Neutralization data suggest **F0 is more primary than phonation**. The glottal (stopped) tone is **shorter** — [Lai, ICU Working Papers in Linguistics 18](https://icu.repo.nii.ac.jp/record/5250/files/ICUWPL18-11_Lai.pdf) (via search snippet).
- Lee, Perkins and Villegas found **no evidence of increased creakiness** in creaky-tone syllables in sentence context. They had significantly higher F0, so creaky and low tones were distinguished mainly by F0 — [Lee, Perkins & Villegas, ICPP 2015](https://www2.ninjal.ac.jp/past-projects/phonology/ICPP2015-Lee%26Perkins%26Villegas.pdf) (via search snippet).
- Masuko's F0 study of the Myanmar four tones notes that F0 declination differs by tone and that duration should be examined alongside it — [TUFS: Distinctiveness of the Myanmar Four Tones by F0](https://tufs.repo.nii.ac.jp/record/6367/files/acs078004.html) (via search snippet).
- Other acoustic sources: [Some acoustic properties of tones in Burmese (core.ac.uk)](https://core.ac.uk/download/481747906.pdf); [Esposito 2012, J. Phonetics (phonation measurement methods)](https://www.phonetics.ucla.edu/voiceproject/Publications/Esposito_2012_JPhon.pdf) (search titles only).

### Inferences
- **A feasible feedback stack (my design inference, not taken from a source):**
  1. **Content check:** run Burmese ASR (or constrained matching against the known target phrase) to confirm the learner said the expected syllables. Feedback at this level is "word recognized / not recognized".
  2. **Tone check (pitch):** extract F0 from the learner and from a native reference. Normalize per speaker (semitones relative to the speaker's median, which handles male/female and child/adult differences). Time-normalize per syllable and compare the contour shape and relative height. Compare duration too, which matters for the short stopped/glottal tone. Show both curves overlaid. This is the most evidence-backed visual feedback (see Section 6).
  3. **Syllable timing:** forced alignment (for example an MMS-based CTC aligner, which covers 1,000+ languages per the MMS paper) to locate syllable boundaries for per-syllable pitch comparison. Simple energy and voicing segmentation may work for short drills.
  4. **Phonation (creaky voice):** measurable in principle (H1–H2, jitter, HNR via Praat or parselmouth), but the literature disagrees on whether creak is consistent. It also varies by speaker and is noisy on phone microphones. Treat it as a later, experimental feature. Since F0 height and duration carry most of the creaky/high distinction, pitch feedback captures much of it.
  5. **Aspiration (e.g., p/pʰ, t/tʰ, k/kʰ):** voice onset time is measurable from waveform burst-to-voicing in clean recordings, or detectable via a phoneme recognizer. Phone-microphone and room noise make it fragile, so offer it as a "listen and compare" exercise rather than a hard score at first.
- Tool options to evaluate (from general knowledge; I did not verify each this session): Praat or parselmouth (server-side Python), CREPE or other neural pitch trackers (more robust on noisy audio), browser-side YIN or autocorrelation pitch detectors (e.g., the `pitchy` or `pitchfinder` JS libraries) for live pitch display, phoneme recognizers (wav2vec2 phoneme models, Allosaurus, MMS), and DTW for template comparison.
- **Browser-side pitch tracking is viable** for live visual feedback: low latency, no API cost, and privacy-friendly. Server-side analysis (Cloud Function with parselmouth) gives more accurate scoring.

### Gaps
- No published Burmese CAPT system or Burmese-specific automatic tone scorer was found.
- I could not confirm whether any phoneme recognizer (Allosaurus, wav2vec2-phoneme, MMS) handles Burmese tones or phonation. Most phone inventories ignore tone.
- No accuracy data were found for browser pitch libraries on Burmese creaky or stopped syllables, where creak can make pitch tracking unreliable.

## 4. LLM quality in Burmese and real-time speech-to-speech

### Takeaway
Burmese is a low-resource language for LLMs. The new **BURMESE-SAN** benchmark (LREC 2026) and SEA-HELM show clear gaps. One tracker reports that **no model scores above 50 on SEA-HELM Burmese**. I found no head-to-head public Burmese scores for current Claude, GPT and Gemini models. Real-time speech-to-speech in Burmese is **not confirmed** for either OpenAI Realtime or Gemini Live native audio. A cascaded pipeline (STT, then LLM, then Azure TTS) is the dependable route.

### Cited Findings
- **BURMESE-SAN** is described as the first benchmark testing LLMs on Burmese understanding, reasoning and generation. Its seven subtasks are QA, sentiment, toxicity, causal reasoning, NLI, abstractive summarization and MT. The evaluation reveals "clear performance gaps between model families and generations" — [BURMESE-SAN, LREC 2026](https://aclanthology.org/2026.lrec-1.16/); [arXiv 2602.18788 summary](https://bytez.com/docs/arxiv/2602.18788/paper) (via search snippet).
- On SEA-HELM Burmese, SEA-LION v4 (Qwen) 32B led at **49.56**, Gemma 3 27B was second at 48.14, and "every model on Burmese fails to clear 50". This comes from a secondary tracker; the leaderboard was not checked directly — [Digital in Asia LLM benchmark tracker](https://digitalinasia.com/llm-benchmarks-asian-languages-tour/) (via search snippet).
- Other Burmese/SEA evaluations: [DeepSEA benchmark, arXiv 2610.26155](https://arxiv.org/pdf/2610.26155); [Myanmar XNLI, arXiv 2504.09645](https://arxiv.org/pdf/2504.09645). In Myanmar XNLI, multilingual mDeBERTa beat monolingual MyanBERTa (via search snippet).
- **Gemini Live:** Google's table for "Gemini 3.5 Transcribe Live" reportedly lists Burmese my-MM, but that covers transcription, not spoken responses. Firebase's list of languages supported by *all* audio-generating models does **not** include Burmese, and its 3.x list was cut off in results. Sources disagree on totals (24 vs 70 vs 97 languages) — [Google Cloud Live API: configure language and voice](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/live-api/configure-language-voice); [Firebase AI Logic Live API configuration](https://firebase.google.com/docs/ai-logic/live-api/configuration); [Gemini API live transcription](https://ai.google.dev/gemini-api/docs/live-api/live-transcribe) (via search snippet).
- **OpenAI Realtime:** gpt-realtime is token-priced at **$32 per 1M audio-input tokens** ($0.40 cached) and **$64 per 1M audio-output tokens**. gpt-realtime-translate is $0.034/min and reportedly takes 70+ input languages but outputs only 13 (list not seen). No source confirmed Burmese. A third-party blog (Oct 2026) mentions "gpt-realtime-2.1" and "GPT-Live 1" at $0.05/min; this is unverified — [OpenAI gpt-realtime model page](https://developers.openai.com/api/docs/models/gpt-realtime); [OpenAI realtime costs guide](https://developers.openai.com/api/docs/guides/realtime-costs); [OpenAI gpt-realtime-translate](https://developers.openai.com/api/docs/models/gpt-realtime-translate); [Cekura blog (third party)](https://www.cekura.ai/blogs/openai-realtime-api-pricing) (via search snippet).

### Inferences
- The benchmark tasks (QA, NLI, summarization) are formal-register tasks. **Colloquial spoken Burmese**, which differs a lot from literary Burmese in particles and verb endings, is likely weaker. The app should constrain the LLM with scenario scripts, target vocabulary lists and register instructions, and have native speakers spot-check output.
- Frontier models score below 50 on SEA-HELM Burmese, so the LLM's corrections of learner Burmese grammar should be treated as hints, not authority. Pair them with curated example sentences.
- Without confirmed native Burmese speech-to-speech, use **cascaded turn-based conversation**: learner speaks, then STT (my-MM), then LLM (text), then Azure my-MM TTS. This also gives the app transcripts to show and score.

### Gaps
- No public Burmese scores were found for specific Claude, GPT-5.x or Gemini 3.x models. BURMESE-SAN's results tables might have them but could not be opened.
- FLORES-200 Burmese (mya_Mymr) translation scores for current frontier models were not found.
- Whether OpenAI Realtime or Gemini Live *understand* Burmese speech input in practice is untested and undocumented in the results.

## 5. Architecture: audio capture, secure API calls, latency and cost

### Takeaway
I gathered limited sourced material this session; most of this section is design inference. Pricing found: OpenAI gpt-realtime-whisper $0.017/min, gpt-realtime-translate $0.034/min, and gpt-realtime audio tokens $32/$64 per 1M. Azure bills STT per hour (per-second increments) and TTS per 1M characters, with a free tier. Exact Azure and Google dollar rates could not be read.

### Cited Findings
- Azure Speech STT is billed per hour in one-second increments. TTS is billed per character (Neural and Neural HD per 1M characters). The free tier includes 0.5M Neural TTS characters per month, and commitment tiers exist — [Azure Speech pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/) (via search snippet; dollar figures did not render).
- OpenAI pricing as above: gpt-realtime-whisper $0.017/min; gpt-realtime-translate $0.034/min; gpt-realtime $32 per 1M audio-in tokens and $64 per 1M audio-out tokens — [OpenAI gpt-realtime-whisper](https://developers.openai.com/api/docs/models/gpt-realtime-whisper); [OpenAI gpt-realtime-translate](https://developers.openai.com/api/docs/models/gpt-realtime-translate); [OpenAI realtime costs](https://developers.openai.com/api/docs/guides/realtime-costs).
- OpenAI publishes a voice latency/cost guide — [OpenAI voice latency & cost guide](https://developers.openai.com/api/docs/guides/voice-latency-cost) (title only).
- Firebase AI Logic exposes the Gemini Live API to client apps — [Firebase AI Logic Live API configuration](https://firebase.google.com/docs/ai-logic/live-api/configuration).

### Inferences
- **Capture:** use `getUserMedia` plus `MediaRecorder` (Opus/WebM; Safari produces MP4/AAC) for upload-and-score drills. Use a WebAudio `AudioWorklet` for live pitch display and for streaming raw PCM16 when streaming STT is needed. Most STT APIs accept 16 kHz mono, so downsample on the client to cut upload size.
- **Security:** never ship API keys to the browser. A Firebase Cloud Function (with App Check and Auth) should proxy requests or mint **short-lived tokens**. Azure issues 10-minute auth tokens from a key, and OpenAI Realtime uses ephemeral client secrets for WebRTC, so the browser can stream directly without seeing the master key. Rate-limit per user to cap cost.
- **Latency budget for a conversational turn (target under about 2 s to first audio):** end-of-speech detection 300–700 ms, STT 300–1,000 ms (fast or streaming), LLM first token 300–800 ms (short responses), TTS first audio 200–500 ms (streaming synthesis). Pronunciation drills can tolerate 1–3 s because the learner expects "analysis". These ranges are engineering estimates, not sourced measurements.
- **Cost per learner-minute (rough):** STT at $0.006–$0.017/min (OpenAI-class pricing; Azure per-hour rates unverified), plus TTS for about 60–150 Burmese characters per reply, plus LLM tokens. A cascaded pipeline is likely **a few cents per active minute**. Token-priced realtime speech-to-speech is likely higher. Validate with real usage logs.
- Cache TTS for all fixed curriculum audio (generate once, store in Firebase Storage) so that only free conversation incurs live TTS cost.

### Gaps
- Current Azure, Google (Chirp 3 STT, Cloud TTS) and ElevenLabs per-unit dollar prices could not be retrieved.
- Measured Burmese-specific latency for any provider: none found.

## 6. Research evidence: CAPT, ASR feedback, visual pitch feedback, AI conversation partners

### Takeaway
Meta-analytic evidence supports ASR-based pronunciation training: **medium overall effect, g = 0.69** (Ngo, Chen & Lai, ReCALL). Effects are larger with **explicit corrective feedback**, for **segmentals over suprasegmentals**, and with **medium rather than very short** treatment duration. Visual pitch-contour feedback for tones has supportive but small-sample evidence. Speech-enabled LLM chatbots now have their own meta-analyses showing benefits for speaking and anxiety. Primary studies flag ASR misunderstanding as a source of frustration and anxiety.

### Cited Findings
**ASR and CAPT for pronunciation**
- Ngo, Chen & Lai (ReCALL, online 2023; 36(1), 4–21, 2024) covered **15 studies and 38 effect sizes (2008–2021)**. ASR had a **medium overall effect, g = 0.69**. Short treatments had a negligible effect (g = 0.07, k = 3), and medium-duration treatments a large one (g = 1.01) — [Cambridge Core: ReCALL article](https://www.cambridge.org/core/journals/recall/article/effectiveness-of-automatic-speech-recognition-in-eslefl-pronunciation-a-metaanalysis/A915444CF252B61D14961D2FE733822D); [PDF](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/A915444CF252B61D14961D2FE733822D/S0958344023000113a.pdf/effectiveness_of_automatic_speech_recognition_in_eslefl_pronunciation_a_metaanalysis.pdf).
- From the same meta-analysis, via a secondary summary (verify against the full paper): explicit ASR corrective feedback g = 0.86 vs indirect feedback such as ASR dictation g = 0.50. Segmental g = 0.82 vs suprasegmental g = 0.37. Practice with peers g = 0.89 vs alone g = 0.44 — [Academia.edu copy/summary](https://www.academia.edu/116596524/The_effectiveness_of_automatic_speech_recognition_in_ESL_EFL_pronunciation_A_meta_analysis).
- Related: a three-level meta-analysis of dialogue-based CALL systems for L2 speaking (ReCALL) — [Cambridge Core](https://www.cambridge.org/core/journals/recall/article/dialoguebased-computerassisted-language-learning-systems-for-second-language-speaking-development-a-threelevel-metaanalysis/31847710516602398819C5E594038E7B) (title only; effect sizes not retrieved). Also a 2026 systematic and meta-analytic review of technology in Korean EFL pronunciation interventions — [Language Research 62(2)](https://www.elanguageresearch.org/archive/view_article?doi=10.30961%2Flr.2026.62.2.229) (title only).

**Visual pitch feedback for tone learning**
- Liu et al. (2011): showing **pitch contours with Pinyin plus explicit information on pitch shape** gave better tone identification in English speakers than tone numbers — reported in [Frontiers in Education 2024 (introduction/review)](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1410795/xml/nlm) (via search snippet).
- In pilot work on learner-created tone visualizations (Chun, Jiang & Ávila 2013; 16 classroom learners), two-thirds found viewing pitch curves helpful — [ResearchGate: Acquisition of L2 Mandarin tones with learner-created tone visualizations](https://www.researchgate.net/publication/331088422_Acquisition_of_L2_Mandarin_Chinese_tones_with_learner-created_tone_visualizations) (via search snippet).
- Reviews report that *producing* pitch gestures beats merely observing them. Relying only on visual input has limits, and the benefit of embodied gestures is constrained by the learner's L1 tone system (2025, Thai tones) — [Journal of Phonetics 2025 (ScienceDirect)](https://www.sciencedirect.com/science/article/abs/pii/S0095447025000713) (via search snippet).
- Pitch ability predicts tone-learning success beyond musicality, L2 aptitude and general cognition — [ResearchGate: Pitch ability as an aptitude for tone learning](https://www.researchgate.net/publication/289528989_Pitch_ability_as_an_aptitude_for_tone_learning) (via search snippet).
- The search summary found no large controlled trial of real-time visual pitch-feedback apps (based on the results surveyed).

**AI chatbot conversation partners**
- A multilevel meta-analysis of **speech-enabled LLM-based chatbots** included **19 studies**, covering L2 outcomes and affective domains. It reports results consistent with Lyu et al. (2025) on lowering anxiety. Effect sizes were not visible in the snippet — [ResearchGate: Effects of speech-enabled LLM-based chatbots… multilevel meta-analysis](https://www.researchgate.net/publication/415402675_Effects_of_speech-enabled_LLM-based_chatbots_on_L2_learning_outcomes_and_affective_domains_a_multilevel_meta-analysis) (via search snippet).
- A separate chatbot meta-analysis (31 studies, 41 effect sizes) found "a lack of evidence about the disadvantages of chatbot use" (via search summary; source paper not cleanly identified in results).
- Humanities & Social Sciences Communications (Aug 2025), a mixed-methods study with a control group (Mondly): **78% of experimental participants reported decreased anxiety** — [Nature HSSC](https://www.nature.com/articles/s41599-025-05550-z).
- A Replika study found chatbot interaction "might not be a reliable way to lessen" L2 speaking anxiety. Learners' **difficulty being understood precisely** may have *raised* anxiety — [ResearchGate: AI chatbots vs peer interactions on speaking anxiety](https://www.researchgate.net/publication/391455139_A_comparison_of_the_effects_of_AI-based_chatbots_and_peer_interactions_on_speaking_anxiety_among_EFL_learners) (via search snippet).
- Further recent studies: dialogue-act patterns in GenAI oral practice ([arXiv 2604.05702](https://arxiv.org/pdf/2604.05702)); voice chatbots in low-resource multilingual schools ([arXiv 2601.19304](https://arxiv.org/pdf/2601.19304)); embodied LLM group conversation in AR ([arXiv 2505.24000](https://arxiv.org/pdf/2505.24000)) (titles only).

### Inferences
- The strongest design levers from the meta-analysis are **explicit, specific feedback** (not just "transcript didn't match") and **sustained practice over weeks**. One-off sessions show negligible effects.
- Suprasegmental effects are about half the size of segmental ones (g = 0.37 vs 0.82). Tone and intonation are harder to improve with ASR alone, which argues for **dedicated pitch visualization** for Burmese tones rather than ASR-pass/fail.
- All this evidence is overwhelmingly from **ESL/EFL and Mandarin**. Transfer to Burmese is plausible but untested.
- When ASR fails to understand a learner, it can raise anxiety. The app needs graceful fallbacks: show what was heard, let learners retry or type, and avoid penalizing ASR errors as learner errors.

### Gaps
- **Mahdi & Al Khateeb (2019) CAPT meta-analysis:** not retrieved this session, so its effect size remains unverified.
- Effect sizes from the LLM-chatbot meta-analysis and Lyu et al. (2025) were not retrieved.
- No CAPT or chatbot studies for **Burmese** learners (or learners of Burmese) were found.
- Evidence that ASR "accepts incorrect speech" (false acceptance) was not sourced quantitatively this session. It is a known limitation of native-trained ASR.

## 7. Design patterns that work

### Takeaway
The evidence base supports drills with explicit feedback, practised over weeks, with visual pitch contours for tone and production rather than passive viewing. Low-stakes AI role-play suits fluency and anxiety goals, provided ASR errors are handled gracefully. Specific patterns below are partly inferred from the cited findings.

### Cited Findings
- Explicit corrective feedback beats indirect feedback (g = 0.86 vs 0.50), and medium-duration treatments beat short ones (g = 1.01 vs 0.07) — [Ngo, Chen & Lai, ReCALL](https://www.cambridge.org/core/journals/recall/article/effectiveness-of-automatic-speech-recognition-in-eslefl-pronunciation-a-metaanalysis/A915444CF252B61D14961D2FE733822D); [Academia.edu summary](https://www.academia.edu/116596524/The_effectiveness_of_automatic_speech_recognition_in_ESL_EFL_pronunciation_A_meta_analysis).
- Pitch contours plus explicit shape information beat tone numbers for tone identification — [Frontiers in Education 2024](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1410795/xml/nlm).
- Producing pitch gestures beats observing them — [J. Phonetics 2025](https://www.sciencedirect.com/science/article/abs/pii/S0095447025000713).
- Chatbot practice can lower anxiety (78% reported decreases), but being misunderstood can raise it — [Nature HSSC 2025](https://www.nature.com/articles/s41599-025-05550-z); [ResearchGate Replika study](https://www.researchgate.net/publication/391455139_A_comparison_of_the_effects_of_AI-based_chatbots_and_peer_interactions_on_speaking_anxiety_among_EFL_learners).
- Burmese creaky and stopped tones differ from high and low in F0 height, duration and vowel quality; creakiness itself is inconsistent — [UT Austin](https://repositories.lib.utexas.edu/handle/2152/19915); [Lee, Perkins & Villegas](https://www2.ninjal.ac.jp/past-projects/phonology/ICPP2015-Lee%26Perkins%26Villegas.pdf).

### Inferences
- **"Hear, say, compare" loop:** play native (or vetted TTS) audio, the learner records, then show the learner's pitch curve over the native curve, with a duration bar and an A/B replay button. Score coarsely (for example "pitch shape match: good / try higher / too long"), not with a false-precision 0–100.
- **Minimal-pair tone drills:** the same segmental syllable in 4 tones (for example ka / kà / ká / kaʔ style sets). Pair a perception step (pick which one you heard) with a production step. Prefer native recordings over TTS.
- **Shadowing with slow-then-normal playback:** SSML rate control on Azure voices, or pre-recorded slow versions, with pitch overlay after each attempt.
- **Role-play scenarios** (ordering tea, taxi, market) with a constrained LLM. Set the scenario, target phrases and colloquial register in the system prompt, run cascaded STT → LLM → TTS, show the transcript of what the app heard, and offer gentle recasts rather than error lists. Allow retries and typed fallback when ASR fails.
- **Spaced, repeated short sessions** over weeks, to match the "medium-duration" effect finding.
- **Content-check gate before the pronunciation score:** if ASR doesn't recognize the target words, say "I didn't catch that" rather than giving a low pronunciation score, so ASR errors aren't misattributed to the learner.

### Gaps
- No controlled study was found comparing these specific patterns for Burmese.
- Optimal feedback granularity for Burmese tones (per syllable vs per phrase) is untested.

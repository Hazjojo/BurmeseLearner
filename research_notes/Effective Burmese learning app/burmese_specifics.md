# Burmese (Myanmar) for English-speaking learners: linguistic challenges, resources and content sources

> **Method note for the report writer.** This research used web search only. Page fetches to unicode.org, tatoeba.org and commonvoice.mozilla.org failed because those hosts are blocked by this session's network settings, so live statistics from those sites (Tatoeba Burmese sentence count, Common Voice Burmese hours) could **not** be checked. Search summaries were used instead, and they can be shallow. Points that come from the researcher's general knowledge and were **not verified with a source this session** are marked **[UNVERIFIED]**. They are standard textbook facts, but check them before publication.

## 1. Phonology: tones, phonation, aspiration, voiceless nasals, voicing sandhi, and L2 perception

### Takeaway
Burmese tone is not "just pitch". Its four-way syllable contrast (low, high, creaky, checked/killed) is carried by pitch, phonation (creaky or tense voice), duration and intensity together. Most tone-training material is built for pitch-only systems like Mandarin. I found no published study of how English speakers perceive Burmese tones, which is a real research gap. The app has to fill it with its own minimal-pair drills.

### Cited Findings
- The standard phonetic reference is Justin W. Watkins, "Illustrations of the IPA: Burmese", *Journal of the International Phonetic Association* 31 (2001): 291–295 (Cambridge UP). — [PHOIBLE source record](https://phoible.org/sources/mya_watkins2001); [Cambridge Core](https://cambridge.org/core/journals/journal-of-the-international-phonetic-association/article/burmese/334DD11C94575EF39A51109B008FB090)
- Watkins (1997, SOAS Working Papers vol. 7) has a table of tone features. **Creaky tone** is high pitch, slight fall, high intensity, creaky phonation and short duration. **Killed (checked) tone** is very high pitch, tense phonation and very short duration. Watkins notes that "phonation type is thus only partially responsible for tonal contrasts in Burmese." — [core.ac.uk PDF](https://core.ac.uk/download/2783471.pdf)
- Watkins (2000) "Notes on creaky and killed tone in Burmese", SOAS Working Papers in Linguistics and Phonetics 10, deals with the two non-level tones. It is available as an eprint. — [SOAS eprints 1948](https://eprints.soas.ac.uk/1948)
- Acoustic work by Tsukada finds that high and low tones differ from creaky and stopped tones in onset f0, peak f0, relative peak delay, duration and voice quality. — [UT Austin repository, "An acoustic analysis of Burmese tone"](https://repositories.lib.utexas.edu/handle/2152/19915) (as summarized in search results)
- Tsukada & Kondo (2019, *Language and Speech*) found that native Burmese listeners told Mandarin tone pairs apart *less* accurately than Australian English listeners with no tone background, and had most trouble with T2–T3 and T1–T2. The authors partly explain this by the fact that Burmese tones are cued by phonation type as well as pitch, while Mandarin tones are mainly pitch. — [PubMed 30343621](https://pubmed.ncbi.nlm.nih.gov/30343621); [Macquarie University record](https://researchers.mq.edu.au/en/publications/the-perception-of-mandarin-lexical-tones-by-native-speakers-of-bu/)
- Tsukada (2023, Routledge Handbook of Asian Linguistics) compared Burmese-, Thai- and Vietnamese-background listeners on Mandarin tones. Accuracy varied widely across the three groups, and all three scored below native Mandarin speakers. — [Taylor & Francis chapter](https://www.taylorfrancis.com/chapters/edit/10.4324/9781003090205-29/cross-language-perception-mandarin-lexical-tones-kimiko-tsukada)
- Google's Burmese TTS paper (Oo et al., LREC 2020) built pronunciation grammars and text normalization for Burmese, so text-to-speech pronunciation has already been modelled. — [ACL Anthology 2020.lrec-1.777](https://aclanthology.org/2020.lrec-1.777); [Google Research](https://research.google/pubs/pub49146)
- The UCLA Phonetics Lab Archive has Burmese recordings, which could serve as reference audio for phonetic contrasts. — [UCLA Phonetics Archive: Burmese](https://archive.phonetics.ucla.edu/Language/MYA/mya.html)

### Inferences
- The research above was not about English speakers, but it does show that Burmese tone perception depends on phonation and duration cues. Tone drills should therefore train **voice quality and length** (creaky/short against plain/long) as well as pitch contour. "Pitch curve" visualizations borrowed from Mandarin apps will mislead learners.
- **Background facts that matter for content design [UNVERIFIED]:**
  - **Four tones / syllable types.** Okell numbers them 1 = low (level, long, plain voice; unmarked in script), 2 = creaky (short, creaky, marked with the dot ့ *auk-myit*), 3 = high (long, often slightly breathy, falling at the end; marked with း *wizza-pauk/visarga*), and **stopped/checked** (ends in a glottal stop; written with a final stop consonant plus asat ်). Some analyses treat "checked" as a syllable type, not a tone. Nasal-final syllables carry tones 1–3 and are written with a final nasal plus asat.
  - **Three-way (and four-way) laryngeal contrast in stops and affricates:** voiceless unaspirated / voiceless aspirated / voiced (p pʰ b, t tʰ d, k kʰ g, tɕ tɕʰ dʑ, s sʰ z).
  - **Voiceless (aspirated) sonorants** m̥ n̥ ɲ̥ ŋ̥ l̥ (and ʍ), written with the medial ှ *ha-htoe*, for example the contrast မ *ma* vs မှ *m̥a*.
  - **Voicing sandhi.** In close compounds and phrase-internal positions, a voiceless initial is often pronounced voiced after a non-checked syllable, while the spelling stays the same. A common example is *mohinga* (မုန့်ဟင်းခါး), where ခါး is written with aspirated *kh* but said [gá]. This means spelling does not reliably predict pronunciation, and audio must accompany every multi-syllable item.
  - **Vowel reduction.** Many non-final syllables reduce to schwa [ə]. Example: တစ် *tiʔ* "one" becomes [tə] in တစ်ယောက် "one person".
  - **Hardest contrasts for English speakers (likely):** (1) unaspirated voiceless vs voiced stops (English listeners hear unaspirated [p] as /b/); (2) the s / sʰ contrast; (3) voiceless nasals and laterals; (4) creaky vs high vs low tone, especially in fast speech; (5) final glottal stop vs open syllable; (6) initial ŋ; (7) the palatal series tɕ tɕʰ dʑ ɲ.

### Gaps
- I found **no published study on English-L1 perception or production of Burmese tones or phonation.** The only L2 studies found go the other way (Burmese listeners learning Mandarin).
- Not retrieved: Gruber's dissertation on Burmese phonation (Georgetown, c. 2011) and Green's work. Their exact findings could not be cited.
- The exact wording of Watkins 2001 (paywalled) was not retrieved.

## 2. Script: abugida structure, symbol inventory, teaching order, Unicode vs Zawgyi, fonts, segmentation, input

### Takeaway
A web app in 2026 should **store and serve only Unicode**, but it must **detect and convert Zawgyi** in anything users paste or type, because Zawgyi was reportedly still the most widely used encoding in 2024. Google's open-source `myanmar-tools` (Apache-2.0 per the npm/yarn registry) is the standard detector and converter. Use open-licensed Unicode fonts (Noto Sans Myanmar, Padauk). Do not rely on spaces for word boundaries.

### Cited Findings
- The Myanmar government named **1 October 2019 as "U-Day"** for the official switch from Zawgyi to Unicode. — [Wikipedia: Zawgyi font](https://en.wikipedia.org/wiki/Zawgyi_font); [Global Voices 2019](https://rising.globalvoices.org/blog/2019/09/06/unified-under-one-font-system-as-myanmar-prepares-to-migrate-from-zawgyi-to-unicode/); [Frontier Myanmar](https://www.frontiermyanmar.net/en/zawgyi-to-unicode-the-big-switch)
- A 2024 GALA article says Zawgyi "is currently the most widely used font in Myanmar" and does not support ethnic minority languages. — [GALA: Zawgyi vs Unicode](https://gala-global.org/knowledge-center/professional-development/articles/zawgyi-vs-unicode-burmese-font-dilemma)
- Facebook built Zawgyi↔Unicode auto-conversion using Google's open-source myanmar-tools library (2019). — [Facebook Engineering](https://engineering.fb.com/2019/09/26/android/unicode-font-converter/)
- A June 2025 petition says automatic Zawgyi↔Unicode conversion "will no longer be available on Facebook and Messenger". This is a weak source (a petition update, not a Meta announcement). — [change.org](https://www.change.org/p/stop-auto-convert-zawgyi-font-to-unicode-in-facebook-application/u/33748862)
- A startup co-founder (c. 2020) said one barrier to Unicode adoption is that "the Burmese Unicode's keyboard is not very user-friendly." — [Yahoo/e27](https://sg.news.yahoo.com/clash-between-two-burmese-fonts-stalling-growth-myanmar-092218690.html)
- **myanmar-tools** uses a machine-learning model to detect Zawgyi vs Unicode and provides `ZawgyiConverter.zawgyiToUnicode`, with clients for Java, JavaScript (`npm install myanmar-tools`), Python (`myanmartools` on PyPI) and PHP. The Yarn registry lists it as **Apache-2.0**, while ecosyste.ms lists "other". The README says it is not an official Google product. — [GitHub google/myanmar-tools](https://github.com/google/myanmar-tools/); [JS README](https://github.com/google/myanmar-tools/blob/master/clients/js/README.md); [Yarn](https://classic.yarnpkg.com/en/package/myanmar-tools); [PyPI](https://pypi.org/project/myanmartools/1.2.1/)
- Other JS libraries exist: `knayi-myscript` (detection/conversion) and `@myanmartools/ng-zawgyi-detector` (Angular). — [knayi-myscript npm](https://npmjs.org/package/knayi-myscript); [ng-zawgyi-detector](https://github.com/myanmartools/ng-zawgyi-detector)
- ICU-style Burmese word-break dictionary data (`burmesedict.txt`) ships as third-party software in commercial products, which shows that dictionary-based Burmese word breaking is standard. — [Splunk third-party notice](https://help.splunk.com/en/data-management/collect-stream-data/release-notes/8.1/third-party-software/burmese-word-break-dictionary-data-burmesedict.txt)
- **myWord** (Ye Kyaw Thu) segments Burmese into syllables, words, sub-words and phrases. Word segmentation uses unigram and bigram dictionaries built from a hand-segmented corpus of more than 500,000 sentences and more than 12 million words, with Viterbi decoding. The README states the dictionaries are **MIT-licensed**. — [GitHub ye-kyaw-thu/myWord](https://github.com/ye-kyaw-thu/myWord); [PyPI myword](https://pypi.org/project/myword/)
- Okell's script primer *Burmese (Myanmar): An Introduction to the Script* is a dedicated script course. — [Cambridge Language Centre listing](https://www.langcen.cam.ac.uk/resources/langb/data/bm_107.html)

### Inferences
- **Engineering implications:** (1) Normalize all learner input with myanmar-tools before storing or comparing it. Learners who copy text from Facebook, Viber or older Burmese websites may paste Zawgyi, which looks like garbage, or looks correct but compares wrong, under a Unicode font. (2) Answer-checking must compare Unicode-normalized strings. Unicode Burmese stores characters in *logical* order: the vowel sign ေ is stored after the consonant even though it is drawn before it. Zawgyi stores *visual* order. (3) Self-host or bundle fonts. Do not rely on system fonts, because older Android phones in Myanmar may have Zawgyi set as the system font.
- **Background facts [UNVERIFIED]:**
  - **Structure.** 33 basic consonant letters (one of them, အ, carries vowels); 4 medials (ျ ya-pin, ြ ya-yit, ွ wa-hswe, ှ ha-htoe); dependent vowel signs (ါ/ာ, ိ, ီ, ု, ူ, ေ, ဲ, ံ); two tone marks (့ auk-myit = creaky, း visarga = high); **asat** ် (kills the inherent vowel and marks finals); **virama** ္ (U+1039) for stacked consonants, mostly in Pali/Sanskrit loans such as ဗုဒ္ဓ "Buddha" and in some native words; independent vowels (ဣ ဤ ဥ ဦ ဧ ဩ ဪ); Burmese digits ၀–၉; and punctuation ၊ ။.
  - **Rhymes.** Finals are written with consonant + asat but collapse to a small set of spoken finals (-ʔ, -ɴ nasalization). That gives many-to-one spelling-to-sound mappings: for example, -က်, -တ်, -ပ် all end in a glottal stop, and the preceding vowel differs.
  - **How many symbols.** About 33 consonants + 4 medials + about 10–12 vowel/tone diacritics + asat/virama. In practice learners must master **about 50–60 graphemes plus about 40–50 common rhyme combinations** before they can read freely.
  - **Teaching order** (follows Okell's primers and common practice): (1) open syllables with the most frequent consonants and the inherent vowel a; (2) the vowel signs ာ/ါ, ိ ီ, ု ူ, ေ, ဲ and the two tone marks, taught together as "tone sets" (for example, the three tones of *a*: အ / အာ? / အား; exact grapheme sets vary per rhyme); (3) medials ျ ြ ွ ှ, including the palatalization of ky/gy and voiceless nasals; (4) killed syllables with asat (-က် -င် -တ် -န် -ပ် -မ် …) and their irregular vowel values; (5) stacked consonants and common abbreviations (၍ ၌ ၏ ၎င်း) last.
  - **Fonts.** Noto Sans Myanmar and Noto Serif Myanmar (Google, SIL Open Font License); Padauk (SIL, OFL); Pyidaungsu (Myanmar government's standard Unicode font). Myanmar script has tall ascenders and descenders, so use a generous line-height (about 1.8–2.0). OFL licensing allows bundling in free or commercial apps.
  - **Segmentation in the browser.** Burmese writes no spaces between words; spaces mark phrase or clause breaks. `Intl.Segmenter` with `granularity: 'word'` in modern browsers uses ICU's Burmese dictionary. CSS line-breaking in Chromium and Firefox also uses dictionary-based breaking for Myanmar. Syllable segmentation can be done with a regex (as in myWord's syllable breaker) and is the right unit for tap-to-hear features.
  - **Input methods.** iOS, Android (Gboard) and Windows/macOS ship Unicode Myanmar keyboards. Third-party options include Keymagic and Frozen Keyboard. Learners need an on-screen script keyboard inside the app, because typing order (logical vs visual for ေ and ြ) confuses beginners.

### Gaps
- There are **no 2025–2026 statistics** on the Zawgyi/Unicode split, so it is unknown whether Zawgyi is still dominant in late 2026. The unicode.org Myanmar FAQ could not be fetched (host blocked).
- The myanmar-tools LICENSE file was not read directly, and sources disagree (Apache-2.0 vs "other/unknown").
- Meta's 2025 conversion change rests on a petition, not an official announcement.

## 3. Diglossia: literary vs colloquial Burmese

### Takeaway
Burmese has a well-documented High/Low split. The literary style is used in nearly all formal writing, news and signage. The colloquial style is used in speech and in informal writing such as social media, comics, dialogue and messaging. The two differ mostly in **grammatical particles**, not in content vocabulary. Beginners should learn **colloquial first**, with literary particles added later as a recognition skill.

### Cited Findings
- Burmese diglossia is described as a literary High used in nearly all writing and some formal speech, and a spoken Low used in very informal writing and most spoken contexts. The lexical differences are notable "in grammatical function forms". — [core.ac.uk PDF (diglossia study)](https://core.ac.uk/download/481747684.pdf); [Teanga journal article via DOAJ](https://doaj.org/article/52749bc53cc44ae083fc5d895af67df9)
- Okell's *Burmese (Myanmar): An Introduction to the Literary Style* is aimed at learners who already know the script and the informal colloquial style and want to move to the formal literary style. This colloquial-first sequence is the established pedagogy. — [Cambridge Language Centre listing](https://www.langcen.cam.ac.uk/resources/langb/data/bm_108.html)
- Okell's main grammar is *A Reference Grammar of Colloquial Burmese* (2 vols, Oxford UP, 1969). — [WALS reference](https://wals.info/refdb/record/Okell-1969); [Sprigg review, SOAS](https://soas-repository.worktribe.com/output/330010/a-reference-grammar-of-colloquial-burmese-by-john-okell)
- A corpus study of spoken Burmese treats particles as bound morphemes, many with no one-to-one English equivalent, and often with important discourse functions in speech. — [core.ac.uk PDF](https://core.ac.uk/download/481747063.pdf)
- Spoken Burmese drops syllables and uses contractions that do not appear in writing, so learners who study only formal Burmese struggle in conversation. — [Preply blog](https://preply.com/en/blog/how-long-does-it-take-to-learn-burmese-a-comprehensive-timeline-guide) (commercial blog; low authority)

### Inferences
- **Common colloquial ↔ literary pairs** to show side by side (as a "you'll see this in writing" toggle) **[UNVERIFIED; check against Okell & Allott 2001, *Burmese/Myanmar Dictionary of Grammatical Forms*]**:
  - Statement-final: တယ် *tè* ↔ သည် *thì*
  - Future/irrealis: မယ် *mè* ↔ မည် *mì*
  - Possessive: ရဲ့ *yɛ̰* ↔ ၏ *ḭ*
  - Relativizer: တဲ့ *dɛ̰* ↔ သော *thɔ́*
  - Locative: မှာ *m̥à* ↔ တွင် / ၌
  - Plural: တွေ *dwè* ↔ များ / တို့
  - "This/that": ဒီ / အဲဒီ / ဟို ↔ ဤ / ထို
  - Clause-linking "and/because": ပြီး / လို့ ↔ ၍ / သဖြင့်
  - Subject marker: က ↔ သည် / မှာ
- **App design:** teach colloquial forms in all speaking and listening content. Add a literary-recognition track at intermediate level, which matters for reading signs, news and official documents. Aid workers and researchers need it sooner than travellers.

### Gaps
- No single open-licensed table of literary/colloquial particle pairs was found. Okell & Allott's *Dictionary of Grammatical Forms* is the authoritative source but is copyrighted.

## 4. Romanization

### Takeaway
There is no single standard romanization. Several systems compete (MLC Transcription System, ALA-LC, BGN/PCGN, Okell's), and informal spellings (especially of names) are inconsistent and don't show tone. Romanization should be a scaffold only, with tones marked, and the app should move learners to the script early.

### Cited Findings
- Okell published a dedicated guide to romanizing Burmese (1971) and uses his own tone-marked transcription in his courses. — [SOAS eprints, Okell publications list](https://eprints.soas.ac.uk/view/people/Okell=3AJohn=3A=3A.html)
- Wiktionary has its own Burmese conventions page (romanization and entry format). — [Wiktionary:About Burmese](https://www.wiktionary.com/wiki/Wiktionary:About_Burmese)

### Inferences
- **Background [UNVERIFIED]:**
  - The **MLC Transcription System (MLCTS)** was devised by the Myanmar Language Commission around 1980. It transliterates spelling, not pronunciation (for example ky-, hm-), and marks tones with symbols such as `.` and `:`.
  - **ALA-LC** is the library-catalogue transliteration, with diacritics, and is not useful for pronunciation.
  - **BGN/PCGN (1970)** is used for place names.
  - **Okell's system** is pronunciation-based, with tone diacritics (for example, grave for low, acute for high, and a dot or other mark for creaky; check his conventions).
  - **Informal spellings** (*Aung, Kyaw, Thein, Htet*) are English-spelling based. "ky" is pronounced [tɕ] and "ht" is aspirated [tʰ], so these mislead English readers.
- **Recommendation:** use one consistent pronunciation-based romanization with *visible tone marks* (Okell-style or a simplified IPA), show it beside script and audio for the first few units, then fade it out. Teach learners to read informal name spellings as a separate decoding skill.

### Gaps
- Primary documentation for MLCTS and Okell's exact symbol conventions was not retrieved this session.

## 5. Grammar essentials for beginners

### Takeaway
The beginner essentials are: SOV word order with postpositional particles; obligatory verb-final markers that carry tense, aspect, mood and negation; politeness particles; gendered first-person pronouns; kinship terms used as pronouns; and numeral classifiers. Okell's colloquial grammar and course remain the reference.

### Cited Findings
- Particles in spoken Burmese are bound morphemes, often with no English equivalent and with discourse functions. — [core.ac.uk corpus study](https://core.ac.uk/download/481747063.pdf)
- *A Reference Grammar of Colloquial Burmese* (Okell 1969) is the standard description of the spoken grammar. — [WALS reference](https://wals.info/refdb/record/Okell-1969)
- Swadesh-list core vocabulary for Burmese is on Wiktionary. — [Wiktionary Appendix: Burmese Swadesh list](https://en.wiktionary.com/wiki/Appendix:Burmese_Swadesh_list)

### Inferences
- **Beginner grammar syllabus [UNVERIFIED; standard textbook content]:**
  1. **SOV order, particles after nouns:** subject/topic က *ká*, object ကို *ko*, location မှာ *m̥à*, "with" နဲ့ *nɛ̰*, "from" က/ကနေ.
  2. **Verb-final markers:** တယ် (realis statement), မယ် (future/irrealis), ပြီ (change of state, "already/now"), နေတယ် (progressive). **Negation** puts မ before the verb and ဘူး after it: မ-သွား-ဘူး "don't/didn't go".
  3. **Questions:** yes/no with လား *lá*; wh-questions with လဲ *lɛ́* (colloquial). The question word stays in place.
  4. **Politeness:** ပါ *pa* softens statements and requests; speakers end with ခင်ဗျာ *kʰəmjà* (male) or ရှင် *ʃìɴ* (female). Imperatives are softened with ပါ / နော်.
  5. **Pronouns:** gendered first person (ကျွန်တော် male, ကျွန်မ female; informal ငါ). Second person is usually a kinship or status term (ဦး *Ù* "uncle/Mr", ဒေါ် *Dɔ̀* "aunt/Ms", အစ်ကို "older brother", အစ်မ "older sister", ညီ/ညီမ "younger sibling", သား/သမီး "son/daughter" for younger people). Pronouns are often dropped.
  6. **Classifiers:** noun + number + classifier, e.g. လူ နှစ်ယောက် "two people". Common ones: ယောက် (people), ခု (general things), ကောင် (animals), လုံး (round objects/buildings), ချောင်း (long thin objects), စောင် (books/letters), ပါး (monks).
  7. **Numbers:** 1–10 တစ် နှစ် သုံး လေး ငါး ခြောက် ခုနစ် ရှစ် ကိုး ဆယ်. Pronunciation changes in compounds (reduction of တစ်/နှစ်, voicing of ဆယ်). Burmese digits ၀–၉ are used on signs, prices and bus numbers.
- Classifier and number pronunciation changes are a real stumbling block. They should be drilled with audio, not just spelling.

### Gaps
- No open-licensed beginner grammar text was found. Okell's works are copyrighted, except *Burmese by Ear*, which is free to download but carries no explicit open licence (see section 7).

## 6. Core vocabulary and open datasets (word frequency, sentence corpora, audio, translation data)

### Takeaway
There is no clean, openly licensed **colloquial** Burmese frequency list. The best available frequency data (myWord unigrams, MIT) comes from a mostly written-style corpus. The best openly licensed audio is Google's OpenSLR SLR80 (**CC BY-SA 4.0**, so commercial use is allowed with attribution and share-alike on the derived dataset). Other usable sources: FLORES+ for parallel sentences (CC BY-SA 4.0) and Tatoeba sentences (CC BY 2.0 FR, with audio licensed per contributor). Expect to commission native-speaker colloquial recordings and example sentences.

### Cited Findings

**Audio datasets**
- **OpenSLR SLR80 (Google Burmese speech):** transcribed, high-quality audio of Burmese sentences recorded by volunteers, distributed as WAV files with a `line_index.tsv`. Copyright 2018–2019 Google. **License: CC BY-SA 4.0.** For citation, use Oo et al. 2020. — [OpenSLR 80](https://www.openslr.org/80); [about page](https://openslr.org/resources/80/about.html); [Oo et al., LREC 2020](https://aclanthology.org/2020.lrec-1.777)
  - License conflict: the deepdml Hugging Face mirror tags it CC BY 4.0, but OpenSLR (authoritative) and SEACrowd both say CC BY-SA 4.0. — [deepdml mirror](https://huggingface.co/datasets/deepdml/openslr80-burmese/blob/main/README.md); [SEACrowd openslr](https://huggingface.co/datasets/SEACrowd/openslr/tree/main)
- **Commercial-only speech data:** Nexdata sells "212 Hours – Burmese Spontaneous Speech Data" and "120 Hours – Burmese Conversational Speech Data by Mobile Phone". These are paid licences, not open. — [Nexdata spontaneous](https://huggingface.co/datasets/Nexdata/Burmese_Spontaneous_Speech_Data); [Nexdata conversational](https://huggingface.co/datasets/Nexdata/Burmese_Conversational_Speech_Data_by_Mobile_Phone)
- **SOAS *Burmese by Ear* audio** (Okell) is on SoundCloud and SOAS. Free to stream and download, but no open licence found (see section 7). — [SoundCloud: Burmese by Ear](https://soundcloud.com/soas-university-of-london/sets/burmese-by-ear-by-john-okell)

**Text and parallel data**
- **FLORES+** (the successor to FLORES-200) is a multi-way MT benchmark translated from English into more than 200 varieties, including Burmese (`mya_Mymr`). **License: CC BY-SA 4.0.** — [Hugging Face openlanguagedata/flores_plus](https://huggingface.co/datasets/openlanguagedata/flores_plus)
- SIB-FLEURS (Burmese `mya_Mymr` split) is tagged cc-by-sa-4.0. It is a secondary mirror. — [WueNLP/sib-fleurs](https://huggingface.co/datasets/WueNLP/sib-fleurs/tree/b70340ed9b923c265885201e3344d40648b06bd3/data/mya_Mymr)
- **Tatoeba:** sentence text is released under **CC BY 2.0 FR**, and part of it is also CC0 1.0. Reuse requires crediting the sentence author. **Audio is licensed per contributor** (CC BY, CC BY-SA, CC BY-NC, or no public licence), so each recording must be checked, "especially if your project/app is commercial." — [Tatoeba downloads](https://tatoeba.org/oc/downloads); [Tatoeba wiki](https://en.wiki.tatoeba.org/history/show-version/3365); [Wikipedia: Tatoeba](https://en.wikipedia.org/wiki/Tatoeba)

**Frequency and lexicon data**
- **myWord** unigram/bigram dictionaries come from a 500k+ sentence, 12M+ word hand-segmented corpus. **License: MIT** (per README). They can serve as a word-frequency list. — [GitHub myWord](https://github.com/ye-kyaw-thu/myWord)
- **myspellchecker-resources** (Hugging Face) is **MIT**. It contains a segmentation dictionary derived from myWord and credits Ye Kyaw Thu's word-frequency data. — [HF thettwe/myspellchecker-resources](https://huggingface.co/datasets/thettwe/myspellchecker-resources/blob/main/README.md)
- **kanaung/wordlists** is a Burmese wordlist dictionary on GitHub. Its licence was not checked. — [GitHub kanaung/wordlists](https://github.com/kanaung/wordlists)
- Small community Hugging Face datasets exist, such as Burmese number words, a 10K+ pattern-sentence set and English–Burmese NLP pairs. Licences and quality are unverified. — [DatarrX numbers](https://huggingface.co/datasets/DatarrX/myX-Burmese-Numbers/viewer/default/train); [freococo sentences](https://huggingface.co/datasets/freococo/1_pattern_10Kplus_myanmar_sentences/viewer/default/train); [minnbanya en-my-nlp-a3](https://huggingface.co/datasets/minnbanya/en-my-nlp-a3)

### Inferences
- **License summary for app use:**

| Resource | License | Free app | Commercial app | Notes |
|---|---|---|---|---|
| OpenSLR SLR80 audio | CC BY-SA 4.0 | Yes | Yes | Attribution required. Share-alike applies to redistributed or adapted *audio/data*. Safest to keep the audio clips as a separately licensed asset pack. It is read-style, formal sentences, not colloquial dialogue. |
| FLORES+ `mya_Mymr` | CC BY-SA 4.0 | Yes | Yes | Formal or news-like register (Wikinews, Wikivoyage, Wikibooks sources). Good for advanced reading, poor for beginners. |
| Tatoeba text | CC BY 2.0 FR (some CC0) | Yes | Yes | Attribute each sentence's author. |
| Tatoeba audio | Per contributor | Check | Check each | Exclude NC and unlicensed audio from a commercial app. |
| myWord dictionaries | MIT | Yes | Yes | Keep the copyright notice. Written-style corpus bias. |
| myspellchecker-resources | MIT | Yes | Yes | Derived from myWord. |
| myanmar-tools | Apache-2.0 (per registry; verify) | Yes | Yes | Include NOTICE. |
| Nexdata speech | Commercial | Paid | Paid | Not open. |
| Burmese by Ear (SOAS) | No open licence found | Ask permission | Ask permission | Free to download ≠ free to reuse. |

- The SLR80 TSV transcripts also give a few thousand clean Unicode sentences with matching audio, useful for listening drills at intermediate level. They are not suitable for beginner frequency-based vocabulary.
- The myWord frequency list is probably skewed toward literary and news text. A colloquial core list would need manual curation: take the top myWord items, filter out literary particles, and add colloquial particles and kinship terms.
- **Background [UNVERIFIED]:**
  - Mozilla Common Voice datasets are CC0, but Burmese ("my") has had little or no released data. Check the current status.
  - Google's FLEURS speech dataset (CC BY 4.0) includes Burmese (`my_mm`), with read FLORES sentences.
  - The Asian Language Treebank (ALT) parallel corpus, with Burmese, is CC BY 4.0.
  - Ye Kyaw Thu has other resources (myPOS, myG2P, myPara, etc.) under mixed licences, some CC BY-NC-SA. Check each.
  - Leipzig Corpora Collection licensing for Burmese downloads is believed to be CC BY or CC BY-NC depending on the corpus. It was not confirmed.
  - OpenSubtitles Burmese in OPUS is small, and the underlying subtitles carry unclear copyright, so it is risky for commercial use.

### Gaps
- **The Tatoeba Burmese sentence count and its quality were not verified** (tatoeba.org blocked; search gave no figure).
- **The Common Voice Burmese status and hours were not verified** (commonvoice.mozilla.org blocked).
- **Not verified:** SLR80 size (number of utterances, hours, speakers), the Leipzig licence, the OpenSubtitles Burmese size, and any Wiktionary-derived frequency list for Burmese.
- No colloquial (spoken) frequency list was found anywhere.

## 7. Existing learner resources and their gaps

### Takeaway
The quality core is still John Okell's materials (1990s NIU courses; *Burmese by Ear*, free from SOAS since 2009) and *Colloquial Burmese* by San San Hnin Tun (Routledge). There is **no Duolingo course**. Apps (Ling, Simply Learn, Memrise/Anki community decks) are thin. Learners say self-study materials are scarce compared with major languages, especially for natural colloquial speech and listening, and they rely on tutors (italki, Preply) for speaking practice.

### Cited Findings
- ***Burmese by Ear*** (Okell, an audio-based course): the publisher gave up publication rights in 2006, after which the author distributed it. **Since 2009 the audio and text have been free to download from SOAS.** The PDF title page says "Available for free download", but **no Creative Commons or other open licence** was found. — [SOAS Research Online 18521](https://eprints.soas.ac.uk/18521); [SoundCloud SOAS set](https://soundcloud.com/soas-university-of-london/sets/burmese-by-ear-by-john-okell); [Scribd copy of PDF (file53735)](https://www.scribd.com/doc/237290204/File-53735)
- Okell's other works are listed at SOAS, including the NIU series *Burmese: An Introduction to the Spoken Language*, *…the Script* and *…the Literary Style*. — [SOAS eprints: Okell](https://eprints.soas.ac.uk/view/people/Okell=3AJohn=3A=3A.html); [Wikipedia: John Okell](https://en.wikipedia.org/wiki/John_Okell); [Cambridge LC: script](https://www.langcen.cam.ac.uk/resources/langb/data/bm_107.html); [Cambridge LC: literary style](https://www.langcen.cam.ac.uk/resources/langb/data/bm_108.html)
- *Colloquial Burmese* (San San Hnin Tun, Routledge) is the most-recommended book for spoken Burmese on a Burmese-learning subreddit thread and is called a solid introduction to everyday colloquial speech. — [r/myanmar thread, Feb 2025 (anecdotal; mirror)](https://red.ks32.dev/r/myanmar/comments/1iyrf9r/learning_to_speak); [Omniglot Burmese books](https://www.omniglot.com/books/language/burmese.htm)
- A Hong Kong University Press Burmese textbook preview exists, which suggests newer textbooks are available. — [HKU Press PDF preview](https://hkupress.hku.hk/image/catalog/pdf-preview/9789888528400.pdf)
- **SEAsite** (Northern Illinois University) offers free beginner-to-intermediate Burmese lessons and is listed by Carleton College's language centre among web resources. — [Carleton Language Center: Burmese web resources](https://www.carleton.edu/language-center/resources/outside/burmese/)
- The ANU (CALE) "Burmese toolkit" also collects links to resources. — [ANU CALE Burmese toolkit](https://cale.anu.edu.au/?p=399)
- A learner blog notes that self-study materials for Burmese are still scarce compared with English or Chinese. — [Live in Rangoon blog (2014; anecdotal)](https://liveinrangoon.blogspot.com/2014/04)
- **Duolingo has no Burmese course.** Ling markets itself as the alternative, but that source belongs to Ling and is biased. — [Ling: No Burmese on Duolingo](https://ling-app.com/my/no-burmese-on-duolingo/)
- Udemy has beginner Burmese courses. — [Udemy: Complete Burmese course](https://www.udemy.com/course/complete-burmese-course-learn-burmese-for-beginners/); [Udemy: Burmese speaking course](https://www.udemy.com/course/burmese-speaking-course-beginners/)
- Tutor marketplaces (Preply, italki) actively market Burmese tutoring. — [Preply: best online Burmese course](https://preply.com/en/blog/best-online-burmese-course)
- An r/languagelearning thread exists on Burmese resources (anecdotal; not reviewed in detail). — [Reddit mirror](https://reddit.sudovanilla.org/32but8)

### Inferences
- **Gaps an app could fill (synthesis; partly anecdotal):**
  1. Systematic **tone and phonation ear-training** with minimal pairs. No existing app is known to do this well.
  2. **Script instruction with Unicode-correct typing practice** and Zawgyi-proof input.
  3. **Natural colloquial listening** with real speed, reductions and voicing sandhi. The free audio that exists (Okell 1990s; SLR80 read speech) is either old-fashioned or formal.
  4. **Spaced repetition tied to audio**, instead of user-made Anki/Memrise decks of uneven quality.
  5. A **literary-recognition track** for signs and news.
  6. **Heritage-learner mode**: speaks but can't read, so script-first without basic vocabulary drills.
- *Burmese by Ear* is the strongest free audio course, but without a licence it should be **linked to**, not embedded. Any reuse needs permission from SOAS or the Okell estate.

### Gaps
- No terms of use were found for SEAsite.
- No reviews were found for Simply Learn, Memrise/Anki Burmese decks, or specific Burmese YouTube channels.
- Reddit coverage was thin, and the mirrors used are unofficial. No systematic learner survey of unmet needs was found.

## 8. Dictionaries and APIs usable in an app

### Takeaway
No major Burmese–English dictionary is clearly open-licensed for reuse in an app. The Myanmar Language Commission dictionary (on SEAlang) is the best reference but is government-copyrighted, with unstated terms. **Wiktionary** (CC BY-SA) and **myWord** (MIT) are the cleanest open sources. **Judson's 1893 Burmese–English dictionary** is very likely public domain but is archaic and needs digitization.

### Cited Findings
- The **Myanmar Language Commission's *Myanmar–English Dictionary*** (1993 government publication) is described as the largest Burmese dictionary and is hosted on SEAlang (sealang.net). — [Wiktionary:About Burmese](https://www.wiktionary.com/wiki/Wiktionary:About_Burmese); [Wikipedia: Myanmar–English Dictionary](https://wikipedia.com/wiki/Myanmar%E2%80%93English_Dictionary)
- **SEAlang Library** is an online library of Southeast Asian linguistic reference materials, founded in 2005 with mainly US funding. No reuse terms were found. — [Wikipedia: SEAlang Library](https://Www.Wikipedia.org/wiki/SEAlang_Library); [Burma Library](https://www.burmalibrary.org/en/taxonomy/term/1400); [Lexilogos Burmese dictionaries](https://lexilogos.com/english/burmese_dictionary.htm)
- **Judson's Burmese–English Dictionary** (Rangoon: Baptist Board of Publications, 1893) has digitized editions: the University of Michigan has a revised edition, and Open Library has a 1921 edition with internet access. Later revisions (1953, 1966 centenary edition by Stevenson & Eveleth) exist. — [STEDT citation](https://stedt.berkeley.edu/~stedt-cgi/rootcanal.pl/source/AJ-BED); [UMich Quod](https://quod.lib.umich.edu/g/genpub/ANH2956.0002.001/4); [Open Library 1921 ed.](https://openlibrary.org/books/OL25520843M); [Glottolog 1966 ed.](https://glottolog.org/resource/reference/id/160937)
- SOAS Digital hosts scanned historical Burmese dictionary volumes. — [SOAS Digital AA00000490](https://digital.soas.ac.uk/AA00000490/00001/allvolumes)
- **Freelang** offers a free downloadable Burmese–English wordlist. Licence not checked. — [Freelang Burmese](https://www.freelang.net/dictionary/burmese.php)
- A Myanmar–English–Pali dictionary dataset exists on Hugging Face. Licence not checked. — [HF freococo/myanmar-english-pali-dictionary](https://huggingface.co/datasets/freococo/myanmar-english-pali-dictionary)

### Inferences
- US copyright: works published before 1931 are in the US public domain as of 2026, so the **1893 and 1921 Judson editions are very likely PD in the US**. The 1953 and 1966 revisions probably are not. Judson's spelling and register are 19th-century and missionary, so it is best used as a supplementary etymology source, not as a learner gloss.
- **Practical approach:** build the app's own learner dictionary. Seed headwords from myWord (MIT), take glosses and examples from Wiktionary (CC BY-SA 4.0, attribution plus share-alike on the dictionary data), and have native-speaker editors review everything. Link out to the SEAlang MLC dictionary for advanced lookup instead of scraping it.
- **Background [UNVERIFIED]:** Wiktionary content is dual-licensed CC BY-SA 4.0 / GFDL. Its Burmese entries include MLCTS and IPA, but coverage is a few thousand lemmas.

### Gaps
- **SEAlang terms of use: not found.** The MLC dictionary's copyright and licensing terms were not found.
- The Wiktionary Burmese lemma count was not retrieved.
- There is no known public REST API for any Burmese–English dictionary.

## 9. Cultural and practical topics to cover early

### Takeaway
Early units should cover: greetings (including the fact that *mingalaba* is formal, and "have you eaten?" is a common everyday greeting); gendered polite sentence-enders; kinship-based address (U/Daw/Ko/Ma, older brother/sister); Burmese names (no surnames); numbers with classifiers for shopping and transport; and Buddhist etiquette (monks, pagodas, shoes off). These points come from general knowledge, and none were verified with a source this session.

### Cited Findings
- Common Burmese phrases (greetings, thanks, etc.) are collected on Omniglot and Wikivoyage. — [Omniglot Burmese phrases](https://omniglot.com/language/phrases/burmese.php); [Burmese phrasebook (Wikivoyage-derived)](https://guides.travel.sygic.com/production/en/Burmese_phrasebook)

### Inferences
- **Suggested early cultural content [UNVERIFIED]:**
  - **Greetings:** မင်္ဂလာပါ *mìngəlàbà* (formal/classroom); ထမင်းစားပြီးပြီလား "have you eaten (rice) yet?"; နေကောင်းလား "are you well?"; ကျေးဇူးတင်ပါတယ် "thank you".
  - **Politeness:** male ခင်ဗျာ vs female ရှင် endings and gendered "I". Learners must pick the right set for themselves from day 1.
  - **Address terms:** U/Daw for older or respected adults, Ko/Ma for peers, older brother/sister terms for slightly older people. **Names** have no family name, so you never call someone by the "last" part of their name.
  - **Religion and etiquette:** monks get special vocabulary (separate verbs and pronouns) and the classifier ပါး. Shoes come off at pagodas and homes. Seniority shapes how you speak to people.
  - **Practical:** numbers, prices in kyat (ကျပ်) with classifiers, Burmese digits on buses and signs, food vocabulary (mohinga, tea-shop orders).
  - **Sensitivity:** after 2021 the place-name and politics vocabulary is sensitive (Burma vs Myanmar; ethnic-minority terms). Content should be neutral.

### Gaps
- No sourced research was retrieved on what cultural content learners find most useful. No authoritative source was retrieved on the history of the greeting *mingalaba*.

## 10. Who learns Burmese and what they need

### Takeaway
I found no survey data on who learns Burmese. Plausible segments are heritage learners (diaspora children in the US, UK, Australia, Thailand, Singapore, Japan), NGO, aid and humanitarian workers, partners or spouses of Burmese speakers, researchers and diplomats, Buddhist practitioners, and travellers. Each has different priorities.

### Cited Findings
- Commercial tutoring platforms (Preply) publish "why learn Burmese" and "how long does it take" guides, which suggests there is a market for adult learner tutoring. These are commercial marketing sources with no learner statistics. — [Preply: Why learn Burmese](https://preply.com/en/blog/why-learn-burmese); [Preply: timeline guide](https://preply.com/en/blog/how-long-does-it-take-to-learn-burmese-a-comprehensive-timeline-guide)
- Free course provision by SOAS and NIU/SEAsite, and university language-centre resource lists (Carleton, ANU, Cambridge), show demand from academic and diplomatic-track learners. — [SOAS eprints 18521](https://eprints.soas.ac.uk/18521); [Carleton](https://www.carleton.edu/language-center/resources/outside/burmese/); [ANU CALE](https://cale.anu.edu.au/?p=399)

### Inferences
- **What each segment needs:**
  - **Heritage learners:** strong listening, weak reading. They need script, literacy and polite registers for elders, and can skip basic listening.
  - **Aid and NGO workers:** practical spoken Burmese quickly, plus literary-style reading for documents, and possibly exposure to ethnic-region contexts.
  - **Partners and spouses:** family kinship terms, home and food vocabulary, natural colloquial speech, and Thai or diaspora contexts.
  - **Researchers:** literary style, script, and dictionary skills.
  - **Travellers:** greetings, numbers, prices, food and directions, with romanization tolerated longer.
- An onboarding question ("Why are you learning?") could branch the syllabus. Heritage learners would go to script-first, travellers to phrase-first, and researchers to adding literary style early.

### Gaps
- No sourced data was found on learner numbers or demographics. FSI difficulty category, enrolment statistics and diaspora population figures were not retrieved.

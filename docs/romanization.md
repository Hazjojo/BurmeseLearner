# Romanization scheme

The app shows the Burmese script **and** a pronunciation-based romanization with every tone marked (see ROADMAP §3). The romanization shows **how words are said in Yangon**, not how they're spelled, so voicing changes are written as heard (ပါ *pa* → **bà** after another syllable).

All romanization is stored in Unicode NFC. The app works out tones from NFD.

## Tones (marked on the first vowel letter of the syllable)

| Tone | Mark | Example | Colour in app |
|---|---|---|---|
| Low (long, level) | grave `à` | လာ **là** "come" | blue |
| High (long, falling at the end) | acute `á` | လား **lá** (question particle) | red |
| Creaky (short, tense voice) | tilde below `a̰` | ရ **ya̰** "get" | purple |
| Checked / stopped (very short, glottal stop) | final `ʔ` | တစ် **tiʔ** "one" | green |
| Reduced (weak, unstressed, no tone) | `ə` | **mə**-thwá | grey |

Every full syllable carries exactly one tone. Low tone is **always** marked too, so a missing mark means a data error.

## Consonants

| Romanization | Sound | Script examples |
|---|---|---|
| k, g, ng | k, g, ŋ | က, ဂ, င |
| hk | aspirated k (kʰ) | ခ |
| s, z | s, z | စ, ဇ |
| hs | aspirated s (sʰ) | ဆ |
| ny | ɲ | ည, ဉ |
| t, d | t, d | တ, ဒ |
| ht | aspirated t (tʰ) | ထ |
| p, b | p, b | ပ, ဗ / ဘ |
| hp | aspirated p (pʰ) | ဖ |
| m, n | m, n | မ, န |
| hm, hn, hng, hny, hl | **voiceless** nasals and l | မှ, နှ, ငှ, ညှ, လှ |
| y | j | ယ, ရ (Yangon pronounces ရ as y) |
| ky, ch | tɕ, tɕʰ | ကျ / ကြ, ချ / ခြ |
| gy | dʑ | ဂျ / ဂြ |
| sh | ʃ | ရှ, သျှ |
| th | θ / ð (as in *thin* / *this*) | သ |
| w, l, h | w, l, h | ဝ, လ, ဟ |

## Vowels

| Romanization | Sound | Example |
|---|---|---|
| a | a | လာ **là** |
| i | i | ပြီ **pyì** |
| u | u | ဇူး **zú** |
| ei | e | နေ **nèi** |
| e | ɛ | တယ် **dè** |
| aw | ɔ | ပြော **pyáw** |
| o | o | ကို **gò** |
| ə | reduced vowel | **mə** |
| in, un, an, ein, oun, ain, aun | nasalised finals | တင် **tìn**, သုံး **thóun**, ကောင်း **káun** |
| iʔ, eʔ, aʔ, eiʔ, ouʔ, aiʔ, auʔ | checked finals | တစ် **tiʔ**, ဟုတ် **houʔ** |

## Status

This is a working scheme modelled on pronunciation-based learner transcriptions. **Every item is marked `draft` until my partner has checked it**, both the Burmese and the romanization.

# Content brief for new course modules

You are writing new lessons for a personal Burmese learning app (learner: an English speaker in the UK learning **colloquial Yangon Burmese** to talk with their partner's family). Read these first:

- `docs/romanization.md` — the romanization scheme. **Every syllable must carry a tone mark** (à low, á high, a̰ creaky, aʔ checked, ə weak). Write pronunciation as heard in Yangon, including voicing in compounds (ပါ → bà, တယ် → dè; after a checked syllable ʔ, no voicing: ကြိုက်တယ် → kyaiʔ tè).
- `content/speaking.json` — existing items (format + what the learner already knows; reuse these where useful instead of duplicating).
- `content/course.json` — existing modules/lessons (format; tone of the intro text).
- `content/dialogues.json`, `content/patterns.json`, `content/verbforms.json` — formats.

## Quality bar (most important)

- **Accuracy over quantity.** Only include phrases you are highly confident are natural, everyday spoken Yangon Burmese (not literary/written style). If unsure about a word, leave it out. List anything you're less than certain about in `"uncertain"` with a reason.
- Unicode Myanmar only (never Zawgyi), NFC. Use ့ before ် (canonical order).
- Polite but natural register (ပါ where natural). Learner gender varies: where "I" differs, give both forms with `"speaker": "m"` / `"f"` (ကျွန်တော် / ကျွန်မ), as the existing items do — or avoid "I" (Burmese often drops it).
- Frequency first: the most useful words and phrases for real conversation with family and in daily life.
- English glosses short and natural. `note` = one or two short sentences explaining grammar or usage (optional). `lit` = literal gloss (optional).
- Every item needs an `emoji` (a simple picture that fits the meaning).

## Output

Write exactly one file: the path you are given (in `content/drafts/`). Do not edit any other file. Format:

```json
{
  "modules": [
    { "id": "m8", "title": "...", "summary": "one line", "icon": "<emoji>", "color": "#hex (mid-dark, readable with white text)",
      "lessons": [ { "id": "m8.l1", "title": "...", "intro": ["short paragraph", "..."], "items": ["id", "..."], "drills": ["pat.id"] } ] }
  ],
  "items": [ { "id": "q.what", "unit": 8, "my": "…", "rom": "…", "en": "…", "emoji": "…", "note": "…", "lit": "…", "speaker": "m|f (optional)" } ],
  "verbs": { "v.new-verb-id": { "base": "go", "past": "went" } },
  "patterns": [ { "id": "pat.x", "from": "item id that teaches it", "my": "{v}…", "rom": ["{v} … (after open syllable)", "{v} … (after checked ʔ syllable)"], "en": "I … {base}", "note": "…" } ],
  "dialogues": [ { "id": "d.x", "title": "...", "after": "m8.l2", "speakers": { "A": { "name": "Su", "voice": 0 }, "B": { "name": "Thura", "voice": 1 } },
                   "lines": [ { "s": "A", "my": "…", "rom": "…", "en": "…" } ],
                   "questions": [ { "q": "…?", "options": ["right answer", "wrong", "wrong", "wrong"], "answer": 0 } ] } ],
  "scenarios": [ { "id": "sc.x", "title": "...", "blurb": "few words", "role": "who the AI plays", "setup": "the situation, for the AI", "voice": 0, "after": "m8.l3" } ],
  "reading": [ { "id": "s4.m8", "title": "Read: <topic>", "intro": ["…"], "items": ["4-6 short item ids from your modules, good for reading practice"] } ],
  "uncertain": [ { "id": "item id", "why": "…" } ]
}
```

Rules:
- Item ids: a short prefix unique to your module (given to you) + a readable slug, e.g. `q.who`. Never reuse an existing id.
- Each module: 3–4 lessons, each lesson 4–7 items (single words and short phrases mixed). Lesson `intro`: 1–3 short paragraphs teaching the key idea (grammar pattern, culture note), friendly and concrete, like the existing ones.
- Each module: **one dialogue** (5–9 lines, using mostly the module's words + earlier known words; voice 0 = female, 1 = male; A/B names any common Burmese names), 2 comprehension questions (answer index into options); **one conversation scenario** for an AI role-play; **one reading lesson** (`reading`).
- Optional: new verbs (as items with ids starting `v.` plus a `verbs` entry) and new sentence patterns (`patterns`) if your topic naturally introduces them; reference them in lesson `drills`. Patterns are combined with every verb, so only add patterns that work with any action verb.
- `unit`: use your module number (8, 9, …).

When done, run `node scripts/check-draft.mjs <your file>` and fix every problem until it prints "Draft OK". Then re-read your whole file once more purely for Burmese accuracy (spelling, tone marks, voicing, register) and fix anything doubtful. Report: modules written, item count, and the `uncertain` list.

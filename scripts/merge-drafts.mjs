// Merge content/drafts/*.json into the course content files (idempotent: skips ids that already exist).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const root = new URL('../content/', import.meta.url)
const load = (f) => JSON.parse(readFileSync(new URL(f, root), 'utf8'))
const save = (f, d) => writeFileSync(new URL(f, root), JSON.stringify(d, null, 1) + '\n')
const speaking = load('speaking.json')
const course = load('course.json')
const dialogues = load('dialogues.json')
const patterns = load('patterns.json')
const verbs = load('verbforms.json')
const scenarios = load('scenarios.json')
const has = (arr, id) => arr.some((x) => x.id === id)
let reading = course.scriptModules.find((m) => m.id === 's4')
if (!reading) {
  reading = { id: 's4', title: 'Reading practice', summary: 'Read real words and phrases from each speaking module.', icon: '📖', color: '#2563c9', lessons: [] }
  course.scriptModules.push(reading)
}
const files = readdirSync(new URL('drafts/', root)).filter((f) => f.endsWith('.json')).sort()
// The same Burmese phrase written in two modules becomes one item; later references point to the first.
const byText = new Map(speaking.map((i) => [i.my, i]))
// Only treat it as the same item if the meaning matches too (ငါး is both 'five' and 'fish').
const norm = (e) => e.toLowerCase().replace(/\(.*?\)|[^a-z ]/g, '').trim()
const sameMeaning = (a, b) => { const x = norm(a), y = norm(b); return x === y || x.includes(y) || y.includes(x) }
for (const f of files) {
  const d = load(`drafts/${f}`)
  const alias = new Map()
  for (const it of d.items ?? []) {
    const dup = byText.get(it.my)
    if (dup && dup.id !== it.id && !it.speaker && sameMeaning(dup.en, it.en)) {
      alias.set(it.id, dup.id)
      console.log(`  ${it.id} duplicates ${dup.id}: merged`)
      continue
    }
    if (!has(speaking, it.id)) speaking.push(it)
    if (!byText.has(it.my)) byText.set(it.my, it)
  }
  const fix = (ids) => [...new Set((ids ?? []).map((id) => alias.get(id) ?? id))]
  for (const m of d.modules ?? []) for (const l of m.lessons) l.items = fix(l.items)
  for (const r of d.reading ?? []) r.items = fix(r.items)
  for (const p of d.patterns ?? []) p.from = alias.get(p.from) ?? p.from
  for (const m of d.modules ?? []) if (!has(course.modules, m.id)) course.modules.push(m)
  for (const x of d.dialogues ?? []) if (!has(dialogues, x.id)) dialogues.push(x)
  for (const x of d.patterns ?? []) if (!has(patterns, x.id)) patterns.push(x)
  for (const x of d.scenarios ?? []) if (!has(scenarios, x.id)) scenarios.push(x)
  for (const [k, v] of Object.entries(d.verbs ?? {})) verbs[k] ??= v
  for (const r of d.reading ?? []) if (!has(reading.lessons, r.id)) reading.lessons.push({ id: r.id, kind: 'script', title: r.title, intro: r.intro, items: r.items })
  console.log(`merged ${f}`)
}
course.modules.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)))
reading.lessons.sort((a, b) => Number(a.id.split('.m')[1]) - Number(b.id.split('.m')[1]))
save('speaking.json', speaking)
save('course.json', course)
save('dialogues.json', dialogues)
save('patterns.json', patterns)
save('verbforms.json', verbs)
save('scenarios.json', scenarios)

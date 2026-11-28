// Validates a content draft (content/drafts/*.json) before it's merged into the course.
// Usage: node scripts/check-draft.mjs content/drafts/<name>.json
import { readFileSync } from 'node:fs'
import { burmeseProblems, romProblems } from '../src/lib/checks.js'

const file = process.argv[2]
const d = JSON.parse(readFileSync(file, 'utf8'))
const load = (f) => JSON.parse(readFileSync(new URL(`../content/${f}`, import.meta.url), 'utf8'))
const existing = new Set([...load('speaking.json'), ...load('script.json')].map((e) => e.id))
const errors = []
const ids = new Set()
const checkText = (where, my, rom) => {
  if (my !== undefined) for (const p of burmeseProblems(my)) errors.push(`${where}: Burmese ${p}`)
  if (rom !== undefined) for (const p of romProblems(rom)) errors.push(`${where}: ${p}`)
}
for (const it of d.items ?? []) {
  const w = `item ${it.id}`
  for (const k of ['id', 'my', 'rom', 'en', 'emoji']) if (typeof it[k] !== 'string' || !it[k]) errors.push(`${w}: missing ${k}`)
  if (existing.has(it.id) || ids.has(it.id)) errors.push(`${w}: duplicate id`)
  ids.add(it.id)
  checkText(w, it.my, it.rom)
}
const known = (id) => ids.has(id) || existing.has(id)
for (const [v, f] of Object.entries(d.verbs ?? {})) {
  if (!known(v)) errors.push(`verbs: ${v} must also be an item`)
  if (!f.base || !f.past) errors.push(`verbs: ${v} needs base and past`)
}
for (const m of d.modules ?? []) {
  for (const k of ['id', 'title', 'summary', 'icon', 'color']) if (!m[k]) errors.push(`module ${m.id}: missing ${k}`)
  for (const l of m.lessons ?? []) {
    if (!l.id || !l.title || !Array.isArray(l.intro) || !l.intro.length) errors.push(`lesson ${l.id}: needs id, title, intro`)
    for (const id of l.items ?? []) if (!known(id)) errors.push(`lesson ${l.id}: unknown item ${id}`)
    if ((l.items ?? []).length < 3 || (l.items ?? []).length > 8) errors.push(`lesson ${l.id}: use 3-8 items`)
  }
}
const lessonIds = new Set((d.modules ?? []).flatMap((m) => m.lessons.map((l) => l.id)))
for (const dl of d.dialogues ?? []) {
  if (!lessonIds.has(dl.after)) errors.push(`dialogue ${dl.id}: "after" must be one of your lesson ids`)
  dl.lines.forEach((l, i) => {
    if (!dl.speakers[l.s]) errors.push(`dialogue ${dl.id}#${i}: unknown speaker`)
    checkText(`dialogue ${dl.id}#${i}`, l.my, l.rom)
  })
  for (const q of dl.questions ?? []) if (!(q.answer >= 0 && q.answer < q.options.length)) errors.push(`dialogue ${dl.id}: bad answer index`)
}
for (const s of d.scenarios ?? []) for (const k of ['id', 'title', 'blurb', 'role', 'setup', 'after']) if (!s[k]) errors.push(`scenario ${s.id}: missing ${k}`)
for (const r of d.reading ?? []) for (const id of r.items ?? []) if (!known(id)) errors.push(`reading ${r.id}: unknown item ${id}`)
for (const p of d.patterns ?? []) {
  if (!p.my?.includes('{v}') || p.rom?.length !== 2) errors.push(`pattern ${p.id}: needs my with {v} and rom [afterOpen, afterChecked]`)
  if (!known(p.from)) errors.push(`pattern ${p.id}: from ${p.from} unknown`)
}
if (errors.length) {
  console.error(`${errors.length} problem(s):\n  ` + errors.join('\n  '))
  process.exit(1)
}
console.log(`Draft OK: ${ids.size} items, ${(d.modules ?? []).length} modules, ${(d.dialogues ?? []).length} dialogues.`)

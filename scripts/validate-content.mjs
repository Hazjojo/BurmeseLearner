// Validates content/*.json: schema, unique ids, Unicode Burmese (no Zawgyi), tone-marked romanization.
import { readFileSync } from 'node:fs'
import { burmeseProblems, romProblems } from '../src/lib/checks.js'

const errors = []
const ids = new Set()
const load = (f) => JSON.parse(readFileSync(new URL(`../content/${f}`, import.meta.url), 'utf8'))

function checkEntry(file, e, required) {
  const where = `${file}:${e.id ?? '(no id)'}`
  for (const k of required) if (typeof e[k] !== 'string' || !e[k].trim()) errors.push(`${where}: missing "${k}"`)
  if (e.id) {
    if (ids.has(e.id)) errors.push(`${where}: duplicate id`)
    ids.add(e.id)
  }
  if (e.my) for (const p of burmeseProblems(e.my)) errors.push(`${where}: Burmese ${p}`)
  if (e.rom) for (const p of romProblems(e.rom)) errors.push(`${where}: ${p}`)
  if (e.speaker && !['m', 'f'].includes(e.speaker)) errors.push(`${where}: speaker must be "m" or "f"`)
}

for (const file of ['speaking.json', 'script.json']) {
  for (const e of load(file)) {
    checkEntry(file, e, ['id', 'my', 'rom', 'en'])
    if (typeof e.unit !== 'number') errors.push(`${file}:${e.id}: missing numeric "unit"`)
  }
}
for (const set of load('tones.json')) {
  checkEntry('tones.json', set, ['id', 'contrast'])
  if (!Array.isArray(set.options) || set.options.length < 2) errors.push(`tones.json:${set.id}: needs 2+ options`)
  else set.options.forEach((o, i) => checkEntry('tones.json', { ...o, id: undefined }, ['my', 'rom']))
}

if (errors.length) {
  console.error(`Content validation failed (${errors.length}):\n  ` + errors.join('\n  '))
  process.exit(1)
}
console.log(`Content OK: ${ids.size} entries checked.`)

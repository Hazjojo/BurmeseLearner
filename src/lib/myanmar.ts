import { burmeseProblems } from './checks.js'
import { zawgyiToUnicode } from '../vendor/zawgyi.js'

/** Clean pasted/typed Burmese: convert Zawgyi to Unicode if it looks like Zawgyi, then NFC-normalize. */
export function cleanBurmese(input: string): { text: string; converted: boolean; problems: string[] } {
  const raw = input.trim()
  if (!raw) return { text: '', converted: false, problems: [] }
  let text = raw.normalize('NFC')
  let converted = false
  if (burmeseProblems(text).length) {
    const z = (zawgyiToUnicode(raw) as string).normalize('NFC')
    if (burmeseProblems(z).length < burmeseProblems(text).length) {
      text = z
      converted = true
    }
  }
  return { text, converted, problems: burmeseProblems(text) }
}

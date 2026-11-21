export type Tone = 'low' | 'high' | 'creaky' | 'checked' | 'weak' | 'none'
export function toneOf(syl: string): Tone
export function splitRom(rom: string): { text: string; tone: Tone | null }[]
export function burmeseProblems(s: string): string[]
export function romProblems(rom: string): string[]

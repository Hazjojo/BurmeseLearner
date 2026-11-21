// Renders public/icon.svg to the PNG sizes the PWA manifest and iOS need (uses the preinstalled Playwright).
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let pw
try { pw = require('playwright') } catch { pw = require(require('node:child_process').execSync('npm root -g').toString().trim() + '/playwright') }
const { chromium } = pw
import { readFileSync } from 'node:fs'
const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8')
const font = readFileSync(new URL('../node_modules/@fontsource/noto-sans-myanmar/files/noto-sans-myanmar-myanmar-700-normal.woff2', import.meta.url)).toString('base64')
const css = `<style>@font-face{font-family:'Noto Sans Myanmar';font-weight:400 700;src:url(data:font/woff2;base64,${font}) format('woff2')}</style>`
const browser = await chromium.launch()
const page = await browser.newPage()
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><head>${css}</head><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname, omitBackground: true })
}
await browser.close()
console.log('icons written')

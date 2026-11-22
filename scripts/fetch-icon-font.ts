// node scripts/fetch-icon-font.ts: downloads the Material Symbols subset for
// ICON_NAMES into public/fonts once, so visitors never hit Google. Rerun it
// whenever ICON_NAMES changes; src/lib/icons.test.ts fails until you do.
import { mkdir, writeFile } from 'node:fs/promises'
import { ICON_NAMES } from '../src/lib/icons.ts'

// GRAD is left out: nothing sets it since dark mode went away
const AXES = 'opsz,wght,FILL@20..48,100..700,0..1'
const FILE = 'material-symbols-outlined.woff2'

const cssUrl = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:${AXES}&icon_names=${ICON_NAMES.join(',')}&display=block`
// Google only serves woff2 to a browser it recognises
const headers = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
}

const css = await fetch(cssUrl, { headers }).then((r) => {
  if (!r.ok) {
    throw new Error(`${r.status} for ${cssUrl}`)
  }
  return r.text()
})
const fontUrl = /src:\s*url\((https:[^)]+)\)\s*format\('woff2'\)/.exec(css)?.[1]
if (!fontUrl) {
  throw new Error(`no woff2 url in the Google CSS:\n${css}`)
}
const font = await fetch(fontUrl, { headers }).then((r) => {
  if (!r.ok) {
    throw new Error(`${r.status} for ${fontUrl}`)
  }
  return r.arrayBuffer()
})

await mkdir('public/fonts', { recursive: true })
await writeFile(`public/fonts/${FILE}`, new Uint8Array(font))
await writeFile(
  'scripts/icon-font.manifest.json',
  `${JSON.stringify({ file: FILE, axes: AXES, iconNames: ICON_NAMES }, null, 2)}\n`,
)
console.log(`wrote public/fonts/${FILE} (${font.byteLength} bytes)`)

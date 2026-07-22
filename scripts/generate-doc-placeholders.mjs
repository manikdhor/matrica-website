/**
 * Generates placeholder project documents so the Downloads section works
 * end-to-end before the real files arrive from the client:
 *   public/docs/<slug>/{layout-plan,location-map,brochure}.pdf
 *   public/images/maps/<slug>-location-map.webp
 * Replace these files with the real ones — same names, no code change needed.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const projects = [
  { slug: 'chandra-chaya', name: 'Chandra Chaya' },
  { slug: 'ventura-city', name: 'Ventura City' },
]

const docs = [
  { file: 'layout-plan.pdf', title: 'Layout Plan' },
  { file: 'location-map.pdf', title: 'Location Map' },
  { file: 'brochure.pdf', title: 'Project Brochure' },
]

/* Minimal one-page PDF with centred text, built by hand so we need no deps. */
function makePdf(lines) {
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
  let text = 'BT /F1 24 Tf 72 720 Td 34 TL\n'
  for (const line of lines) text += `(${esc(line)}) Tj T*\n`
  text += 'ET'
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = []
  objects.forEach((obj, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  return Buffer.from(pdf, 'latin1')
}

function mapSvg(name) {
  return `<svg width="1600" height="1000" viewBox="0 0 1600 1000" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="1000" fill="#F3F1EB"/>
  <g stroke="#1A5C33" stroke-opacity="0.08" stroke-width="1">
    ${Array.from({ length: 32 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="1000"/>`).join('')}
    ${Array.from({ length: 20 }, (_, i) => `<line x1="0" y1="${i * 50}" x2="1600" y2="${i * 50}"/>`).join('')}
  </g>
  <line x1="0" y1="520" x2="1600" y2="520" stroke="#A98B4F" stroke-opacity="0.35" stroke-width="10"/>
  <line x1="1050" y1="0" x2="1050" y2="1000" stroke="#A98B4F" stroke-opacity="0.25" stroke-width="6"/>
  <circle cx="800" cy="500" r="26" fill="#1A5C33"/>
  <circle cx="800" cy="500" r="12" fill="#FAF9F6"/>
  <text x="800" y="450" text-anchor="middle" font-family="Georgia, serif" font-size="52" fill="#121814">${name}</text>
  <text x="800" y="580" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" letter-spacing="8" fill="#707A72">PLACEHOLDER LOCATION MAP</text>
  <text x="800" y="630" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#707A72">Replace with the real map image: same file name, same folder</text>
</svg>`
}

const root = path.resolve(process.cwd(), 'public')
for (const p of projects) {
  const docDir = path.join(root, 'docs', p.slug)
  await mkdir(docDir, { recursive: true })
  for (const d of docs) {
    await writeFile(
      path.join(docDir, d.file),
      makePdf([
        `${p.name} - ${d.title}`,
        '',
        'Placeholder document.',
        'Replace this file with the real one:',
        `public/docs/${p.slug}/${d.file}`,
      ]),
    )
  }
  const mapDir = path.join(root, 'images', 'maps')
  await mkdir(mapDir, { recursive: true })
  await sharp(Buffer.from(mapSvg(p.name)))
    .webp({ quality: 88 })
    .toFile(path.join(mapDir, `${p.slug}-location-map.webp`))
  console.log(`done: ${p.slug}`)
}

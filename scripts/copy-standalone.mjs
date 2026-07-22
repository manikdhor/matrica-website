// Copies the assets the Next.js standalone server needs into .next/standalone.
// Cross-platform replacement for `cp -r` (works on Windows PowerShell + bash).
import { cpSync, existsSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const DIST = process.env.NEXT_DIST_DIR || '.next'

// When image optimization is disabled for the target host (sharp's prebuilt
// libvips cannot load there — glibc too old, it SIGABRTs), ship a STUB sharp
// with NO native binary. require('sharp') then succeeds cleanly (so nothing at
// boot crashes) and any stray call throws an ordinary, catchable JS error
// instead of core-dumping a worker. A core-dumped worker is what triggered the
// Passenger respawn pileup -> LVE "cagefs_enter: Unable to fork" -> whole-site
// outage, so removing every native sharp path is the fix for BOTH the upload
// 500 and the fork exhaustion. next/image is set unoptimized in this build and
// the upload route skips optimization (DISABLE_IMAGE_OPTIMIZE=1), so the stub
// is only a belt-and-suspenders guard against any remaining import.
const DISABLE_IMAGE_OPTIMIZE = process.env.DISABLE_IMAGE_OPTIMIZE === '1'

// The bundle is built on Windows but runs on a linux-x64 host, and npm only
// installs the optional @img binary matching the build machine. Without this
// the deployed server throws "Could not load the sharp module using the
// linux-x64 runtime" on every image request and upload. --force bypasses the
// EBADPLATFORM check; --no-save keeps it out of package.json, and the install
// is additive so the local win32 binary survives.
//
// CRITICAL: the linux @img binary MUST match the sharp JS version exactly. A
// mismatch (e.g. sharp 0.34.5 JS beside @img/sharp-linux-x64 0.35.3, from a
// stale prior install) makes require('sharp') throw "Cannot read properties of
// undefined (reading 'output')" on the host — every image request and upload
// 500s. So we don't just check that a linux binary exists, we check its version
// matches sharp's, and reinstall the matched set otherwise. We pin only
// @img/sharp-linux-x64@<version> and let npm resolve its exact matching
// @img/sharp-libvips-linux-x64 and @img/colour deps.
function pkgVersion(p) {
  try { return JSON.parse(readFileSync(p, 'utf8')).version } catch { return null }
}

function ensureLinuxSharp() {
  const version = pkgVersion('node_modules/sharp/package.json')
  if (!version) {
    console.warn('[copy-standalone] sharp not installed — skipping linux binary fetch')
    return
  }
  const linuxVer = pkgVersion('node_modules/@img/sharp-linux-x64/package.json')
  if (linuxVer === version) return // matched binary already present
  if (linuxVer) {
    console.log(`[copy-standalone] @img/sharp-linux-x64 ${linuxVer} != sharp ${version} — replacing stale linux binary`)
    // Remove the mismatched linux binaries so the reinstall is clean. win32
    // (build host) and colour are refreshed by the reinstall below.
    for (const d of ['sharp-linux-x64', 'sharp-libvips-linux-x64']) {
      rmSync(`node_modules/@img/${d}`, { recursive: true, force: true })
    }
  }
  console.log(`[copy-standalone] fetching @img/sharp-linux-x64@${version} (+ matched libvips)`)
  try {
    execFileSync('npm', ['install', '--no-save', '--force', '--no-audit', '--no-fund', `@img/sharp-linux-x64@${version}`], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
  } catch {
    console.warn('[copy-standalone] linux sharp fetch failed — bundle will lack linux binaries')
  }
}

/** Write a native-free stub sharp into the standalone bundle. */
function writeStubSharp() {
  const dir = `${DIST}/standalone/node_modules/sharp`
  // Next's own file tracing copies the real sharp AND the native @img binaries
  // into the standalone regardless of this script. Wipe both so nothing native
  // survives — the native libvips is exactly what SIGABRTs on this host.
  rmSync(dir, { recursive: true, force: true })
  rmSync(`${DIST}/standalone/node_modules/@img`, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  writeFileSync(`${dir}/package.json`, JSON.stringify({ name: 'sharp', version: '0.0.0-stub', main: 'index.js' }, null, 2))
  writeFileSync(
    `${dir}/index.js`,
    [
      "'use strict';",
      '// Native-free stub: this host cannot run sharp (libvips SIGABRTs).',
      "function sharp(){ throw new Error('sharp is disabled on this host (DISABLE_IMAGE_OPTIMIZE=1)'); }",
      'sharp.concurrency=function(){ return 1; };',
      'sharp.cache=function(){ return false; };',
      'sharp.default=sharp;',
      'module.exports=sharp;',
      '',
    ].join('\n'),
  )
  console.log('[copy-standalone] wrote native-free stub sharp (image optimization disabled)')
}

if (!DISABLE_IMAGE_OPTIMIZE) ensureLinuxSharp()

const copies = [
  [`${DIST}/static`, `${DIST}/standalone/${DIST}/static`],
  ['public', `${DIST}/standalone/public`],
  // File tracing keeps only the build-host Prisma engine; copy the whole
  // generated client so every binaryTarget engine (rhel/debian, openssl
  // 1.1/3.0) ships and the query engine loads on the production host.
  ['node_modules/.prisma', `${DIST}/standalone/node_modules/.prisma`],
]

// Turbopack treats sharp as an external module and traces neither the package
// nor the @img binaries beside it, so with optimization ON both halves (the JS
// package AND the platform binary) must be copied. With optimization OFF we
// deliberately do NOT ship the native binaries — a stub is written instead.
if (!DISABLE_IMAGE_OPTIMIZE) {
  copies.push(['node_modules/sharp', `${DIST}/standalone/node_modules/sharp`])
  copies.push(['node_modules/@img', `${DIST}/standalone/node_modules/@img`])
}

for (const [from, to] of copies) {
  if (!existsSync(from)) {
    console.warn(`[copy-standalone] skip: ${from} does not exist`)
    continue
  }
  cpSync(from, to, { recursive: true })
  console.log(`[copy-standalone] ${from} -> ${to}`)
}

if (DISABLE_IMAGE_OPTIMIZE) writeStubSharp()

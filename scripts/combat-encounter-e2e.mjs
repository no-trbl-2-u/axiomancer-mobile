#!/usr/bin/env node
// scripts/combat-encounter-e2e.mjs
//
// Spec 25 Hazard-Pattern Combat — browser-driven end-to-end playthrough.
//
// Boots the exported web build, opens the dev entry, launches the
// `/combat-encounter` screen, and PLAYS the card-and-dice combat with real
// taps: asserts the two Pressure Tracks, the threat timeline, the stance-dice
// board, and the hand render; powers status-effect cards and watches the DoT
// pressure track advance; ends phases until the combat resolves; and asserts
// the post-combat attribution summary appears.
//
// Deterministic: the combat seed is pinned through `globalThis.__AXM_COMBAT_SEED__`
// before the app boots. Hermetic: everything runs against localhost.
//
// Usage:
//   node scripts/combat-encounter-e2e.mjs
//   COMBAT_E2E_REUSE_EXPORT=1 node scripts/combat-encounter-e2e.mjs
//   COMBAT_E2E_CHROME=/path/to/chrome ...
//
// Exit codes: 0 = combat played clean · 1 = assertion failed ·
// 3 = boot failure (export / server / browser).

import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const EXPORT_DIR = resolve(REPO_ROOT, '.smoke-dist')
const VIEWPORT = { width: 390, height: 844 }
const SEED = 12025

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=utf-8',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
}

function log(msg) { console.log(`combat-e2e: ${msg}`) }
function fail(msg) { console.error(`combat-e2e: FAIL — ${msg}`); process.exitCode = 1; throw new Error(msg) }

function runExpoExport() {
    if (existsSync(EXPORT_DIR) && process.env.COMBAT_E2E_REUSE_EXPORT === '1') {
        log('reusing existing .smoke-dist (COMBAT_E2E_REUSE_EXPORT=1)')
        return
    }
    log('running `expo export --platform web` → .smoke-dist ...')
    const result = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', EXPORT_DIR], {
        cwd: REPO_ROOT, stdio: 'inherit',
        // Dev tools (SELF → self-dev-tools-link → /dev → Debug* buttons) only
        // mount when isDevToolsEnabled(); bake it via a non-production profile.
        env: { ...process.env, BUILD_PROFILE: 'preview' },
    })
    if (result.status !== 0) { console.error('combat-e2e: expo export failed'); process.exit(3) }
}

async function fileCandidate(p) {
    try { const info = await stat(p); return { p, exists: true, dir: info.isDirectory() } }
    catch { return { p, exists: false, dir: false } }
}

function startStaticServer(rootDir) {
    return new Promise((resolveServer, rejectServer) => {
        const server = createServer(async (req, res) => {
            try {
                const url = new URL(req.url, 'http://localhost')
                let pathname = decodeURIComponent(url.pathname)
                if (pathname.endsWith('/')) pathname += 'index.html'
                const filePath = join(rootDir, pathname)
                if (!filePath.startsWith(rootDir)) { res.statusCode = 403; return res.end('forbidden') }
                const candidates = [
                    await fileCandidate(filePath),
                    await fileCandidate(join(filePath, 'index.html')),
                    await fileCandidate(join(rootDir, pathname + '.html')),
                    await fileCandidate(join(rootDir, 'index.html')),
                ]
                const chosen =
                    (candidates[0].exists && !candidates[0].dir && candidates[0].p) ||
                    (candidates[1].exists && !candidates[1].dir && candidates[1].p) ||
                    (candidates[2].exists && !candidates[2].dir && candidates[2].p) ||
                    candidates[3].p
                const body = await readFile(chosen)
                res.setHeader('content-type', MIME[extname(chosen)] ?? 'application/octet-stream')
                res.end(body)
            } catch (err) { res.statusCode = 500; res.end(String(err)) }
        })
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address()
            resolveServer({ server, baseUrl: `http://127.0.0.1:${port}` })
        })
        server.on('error', rejectServer)
    })
}

async function trackFill(page, key) {
    // The fill View width is a percentage style; read it from the DOM.
    const el = page.getByTestId(`combat-track-${key}-fill`)
    if (!(await el.count())) return 0
    const w = await el.evaluate((n) => n.style.width || '0%').catch(() => '0%')
    return Number(String(w).replace('%', '')) || 0
}

async function playCombat(page, baseUrl) {
    log(`=== playing hazard-pattern combat (seed ${SEED}) ===`)
    // The combat screen self-bootstraps a demo deck from the live player, so we
    // navigate straight to the route — no dev-menu dependency (which keeps this
    // hermetic and runnable both locally and in CI).
    await page.addInitScript((s) => { globalThis.__AXM_COMBAT_SEED__ = s }, SEED)
    await page.goto(`${baseUrl}/combat-encounter`, { waitUntil: 'networkidle' })

    // The board renders the full-information surface.
    await page.getByTestId('combat-encounter-board').waitFor({ state: 'visible', timeout: 15000 })
    for (const id of ['combat-pressure-tracks', 'combat-track-dot', 'combat-track-control', 'combat-threat-timeline', 'combat-dice-board', 'combat-hand', 'combat-threat-1']) {
        if (!(await page.getByTestId(id).count())) fail(`missing board element: ${id}`)
    }
    log('board renders pressure tracks + threat timeline + dice + hand ✅')

    // Drive the combat: power any available bottom action, end phases, repeat,
    // until the post-combat summary appears (or a generous guard trips). Re-check
    // for the summary before each click — once it mounts it overlays the board.
    const done = async () => (await page.getByTestId('combat-summary').count()) > 0
    // Prefer real skill cards over Retreat (we want the status-effect win path).
    const realBottoms = () => page.locator('[data-testid$="-bottom"][data-testid^="combat-card-"]:not([data-testid="combat-card-card-retreat-bottom"])')
    let sawPressure = false
    let maxDot = 0
    // Per phase: power every affordable skill card (accumulating pressure within
    // the phase, like the greedy sim), then END PHASE. Loop until a summary.
    for (let phase = 0; phase < 14; phase++) {
        if (await done()) break
        if (await page.getByTestId('combat-mercy').count()) {
            await page.getByTestId('combat-mercy-spare').click({ timeout: 3000 }).catch(() => {})
            await page.waitForTimeout(120)
            continue
        }
        // One pass over the hand: try to power each non-retreat card once.
        const btns = await realBottoms().all()
        for (const b of btns) {
            if (await done()) break
            const before = await trackFill(page, 'dot')
            await b.click({ timeout: 2500 }).catch(() => {})
            await page.waitForTimeout(60)
            const after = await trackFill(page, 'dot')
            if (after > before) sawPressure = true
            maxDot = Math.max(maxDot, after)
        }
        if (await done()) break
        const end = page.getByTestId('combat-end-phase')
        if (await end.count()) { await end.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(150) }
    }
    log(`peak dot-track fill: ${maxDot}%`)

    if (!sawPressure) log('note: dot track did not visibly advance (control/HP path or RNG) — non-fatal')

    if (!(await page.getByTestId('combat-summary').count())) {
        fail('combat never reached the post-combat attribution summary')
    }
    const summaryText = await page.getByTestId('combat-summary').innerText()
    if (!/Erosion|Saturation|Defeat|Retreat/i.test(summaryText)) {
        fail(`summary missing an outcome headline: ${summaryText.slice(0, 80)}`)
    }
    log(`combat resolved → summary shown ✅ (${summaryText.split('\n')[0]})`)
}

async function main() {
    runExpoExport()
    const { server, baseUrl } = await startStaticServer(EXPORT_DIR)
    log(`static server at ${baseUrl}`)
    const { chromium } = await import('playwright')
    const launchOptions = { headless: true }
    if (process.env.COMBAT_E2E_CHROME) launchOptions.executablePath = process.env.COMBAT_E2E_CHROME
    const browser = await chromium.launch(launchOptions)
    try {
        const context = await browser.newContext({ viewport: VIEWPORT, hasTouch: false })
        const page = await context.newPage()
        page.on('pageerror', (err) => console.error('combat-e2e: pageerror', err.message))
        await playCombat(page, baseUrl)
        await context.close()
        log('ALL PASS — hazard-pattern combat played end-to-end ✅')
    } finally {
        await browser.close()
        server.close()
    }
}

main().catch((err) => {
    console.error('combat-e2e: aborted —', err.message)
    process.exit(process.exitCode || 3)
})

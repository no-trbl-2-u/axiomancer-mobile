#!/usr/bin/env node
/**
 * Visual-audit screenshot capture (2026-06).
 *
 * Drives the static audit build (served by audit-serve.mjs) with
 * Playwright at iPhone-portrait 390x844 and captures the audit screen
 * set into a target dir. Mirrors smoke-screens.mjs viewport/reduced-
 * motion settings so captures are deterministic.
 *
 *   BASE_URL    server origin (default http://127.0.0.1:4173)
 *   CAPTURE_DIR output dir (default screenshots/audit-2026-06/after)
 *   ONLY        comma-separated screen ids to capture (default: all)
 *
 * Screens that need a specific game state are reached through the dev
 * menu (the export is built with BUILD_PROFILE=preview so dev tools are
 * enabled). Combat/encounter screens go through DebugTriggerEncounter /
 * DebugCombatButton.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__dirname, '..')
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173'
const OUT = resolve(REPO, process.env.CAPTURE_DIR ?? 'screenshots/audit-2026-06/after')
const VIEWPORT = { width: 390, height: 844 }
const only = process.env.ONLY ? new Set(process.env.ONLY.split(',').map((s) => s.trim())) : null

const log = (m) => console.log(`audit-capture: ${m}`)

/** Each screen: id, output filename, and an async drive(page) that
 *  leaves the page on the screen to shoot. */
const SCREENS = [
    { id: 'title', file: '00-title.png', drive: async (p) => { await goto(p, '/') } },
    { id: 'exploration', file: '01-exploration.png', drive: async (p) => { await goto(p, '/exploration') } },
    { id: 'character-top', file: '02-character-top.png', drive: async (p) => { await goto(p, '/character') } },
    {
        id: 'character-mid', file: '03-character-mid.png', drive: async (p) => {
            await goto(p, '/character')
            await p.mouse.move(195, 422)
            await p.mouse.wheel(0, 620)
            await settle(p, 500)
        },
    },
    { id: 'satchel', file: '04-satchel.png', drive: async (p) => { await goto(p, '/inventory') } },
    { id: 'memoir', file: '05-memoir.png', drive: async (p) => { await goto(p, '/memoir') } },
    {
        id: 'combat-prelude', file: '06-combat-prelude.png', drive: async (p) => {
            await triggerEncounter(p, 'encounter')
        },
    },
    {
        id: 'combat-fight', file: '07-combat-fight.png', drive: async (p) => {
            await goto(p, '/character')
            await openDevMenu(p)
            await p.getByTestId('debug-combat-button').click()
            await settle(p, 1400)
        },
    },
    {
        id: 'boss-prelude', file: '12-boss-prelude.png', drive: async (p) => {
            await triggerEncounter(p, 'boss')
        },
    },
    {
        id: 'hazard', file: '13-hazard.png', drive: async (p) => {
            await goto(p, '/character')
            await openDevMenu(p)
            await p.getByTestId('debug-hazard-button').click()
            await settle(p, 1600)
        },
    },
]

async function triggerEncounter(page, kind) {
    await goto(page, '/character')
    await openDevMenu(page)
    const btn = page.getByTestId(`debug-trigger-encounter-${kind}`)
    await btn.waitFor({ state: 'visible', timeout: 15000 })
    await btn.click()
    // Overlay mounts over the WILDS map.
    await page.getByTestId('encounter-modal-overlay').waitFor({ state: 'visible', timeout: 15000 })
    await settle(page, 1000)
}

async function goto(page, path) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
    await settle(page, 700)
}

async function openDevMenu(page) {
    const header = page.getByTestId('dev-menu-header')
    await header.waitFor({ state: 'visible', timeout: 15000 })
    await header.click()
}

async function settle(page, ms) {
    // Let fonts + SVG paint; reduced-motion means no long animations.
    await page.waitForTimeout(ms)
}

async function main() {
    await mkdir(OUT, { recursive: true })
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
    })
    // Deterministic minigame seeds so re-captures are stable. An
    // optional THEME env forces the colour theme (the boot resolver
    // reads __AXM_THEME__ first) — used to showcase the theme system.
    const theme = process.env.THEME ?? null
    await context.addInitScript((t) => {
        globalThis.__AXM_HAZARD_SEED__ = 424242
        globalThis.__AXM_HAZARD_ID__ = 'cracked-cliff'
        if (t) globalThis.__AXM_THEME__ = t
    }, theme)
    const page = await context.newPage()
    const errors = []
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })

    let captured = 0
    for (const screen of SCREENS) {
        if (only && !only.has(screen.id)) continue
        try {
            log(`→ ${screen.id}`)
            await screen.drive(page)
            await page.screenshot({ path: resolve(OUT, screen.file) })
            captured++
        } catch (err) {
            console.error(`audit-capture: FAILED ${screen.id}: ${err.message}`)
        }
    }

    await browser.close()
    log(`captured ${captured} screen(s) → ${OUT}`)
    if (errors.length) {
        log(`console errors (${errors.length}):`)
        for (const e of errors.slice(0, 8)) console.log(`  ! ${e}`)
    }
}

main().catch((err) => { console.error(err); process.exit(1) })

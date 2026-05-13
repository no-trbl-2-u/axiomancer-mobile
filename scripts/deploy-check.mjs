#!/usr/bin/env node
// scripts/deploy-check.mjs
//
// "Checking last deployment" — the post-push gate.
//
// Status: STUB. There is no auto-deploy from `main` for this
// project. EAS Build is triggered manually via
// `npm run deploy:preview` / `npm run deploy:production`. Until
// the deploy gate is wired against the EAS Build API (queued as
// phase 11 — see `plan/steps/01_build_plan.md`), this script
// exits 0 with a notice so the shipping skills' Step 12 doesn't
// trip.
//
// Exit contract (preserved for when phase 11 lands):
//
//   exit 0  →  deploy ready
//   exit 1  →  deploy errored or failed
//   exit 2  →  timeout
//   exit 3  →  config / auth failure
//
// When wiring this up, replace the stub block below with the EAS
// Build API polling pattern (see nexus/playbooks/ci-providers.md
// for the cross-provider matrix; EAS uses
// `https://api.expo.dev/v2/projects/<id>/builds` keyed to
// `gitCommitHash`).

import { execSync } from 'node:child_process'
import fs from 'node:fs'

// --- load .env if present (Node has no built-in .env loader) ---
if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}

const PROVIDER = process.env.DEPLOY_PROVIDER ?? 'none'

const sha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
const subject = execSync('git log -1 --pretty=%s', { encoding: 'utf-8' }).trim()

console.log(`deploy-check: HEAD ${sha.slice(0, 7)} ("${subject}")`)

if (PROVIDER === 'none') {
  console.log(
    'deploy-check: STUB — no auto-deploy provider configured.\n' +
      "          This repo's deploy contract is EAS Build (manual),\n" +
      '          not push-to-deploy. The gate is queued for wiring in\n' +
      '          phase 11 (see plan/steps/01_build_plan.md). Until then\n' +
      '          this script exits 0 so the loop contract stays uniform.',
  )
  process.exit(0)
}

// --- EAS BUILD (placeholder — implement in phase 11) -------------
if (PROVIDER === 'eas') {
  const TOKEN = process.env.EXPO_TOKEN
  const PROJECT_ID = process.env.EAS_PROJECT_ID
  if (!TOKEN || !PROJECT_ID) {
    console.error(
      'deploy-check: EXPO_TOKEN and EAS_PROJECT_ID required for the\n' +
        '          "eas" provider. Get a token at\n' +
        '          https://expo.dev/settings/access-tokens, then set\n' +
        '          DEPLOY_PROVIDER=eas in .env. Implementation lands in\n' +
        '          phase 11.',
    )
    process.exit(3)
  }
  console.error(
    'deploy-check: EAS Build polling not yet implemented. See phase 11\n' +
      '          in plan/steps/01_build_plan.md. Falling back to exit 0\n' +
      '          so the loop is not blocked.',
  )
  process.exit(0)
}

console.error(`deploy-check: unknown DEPLOY_PROVIDER "${PROVIDER}".`)
process.exit(3)

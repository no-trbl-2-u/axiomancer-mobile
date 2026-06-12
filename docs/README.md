# Documentation — Axiomancer Mobile

> This directory contains design notes, architectural decisions, and
> technical guidance for Axiomancer Mobile development.

## Quick reference

| File | Purpose |
|------|---------|
| [`testing.md`](./testing.md) | Hermetic E2E testing standard (REQUIRED) |
| [`presenters.md`](./presenters.md) | Presenter layer contract and patterns |
| [`state.md`](./state.md) | State management and store architecture |
| [`adr/`](./adr/) | Architectural Decision Records |

## Core testing documentation

| File | Coverage |
|------|----------|
| [`testing.md`](./testing.md) | Hermetic E2E testing standard (REQUIRED reading) |
| [`testing-guide.md`](./testing-guide.md) | Extended testing guidance and patterns |
| [`E2E_INVENTORY.md`](./E2E_INVENTORY.md) | Complete E2E test suite catalog |

## Engine integration and upgrades

| File | Coverage |
|------|----------|
| [`engine-upgrade-0.7.0-to-0.10.0.md`](./engine-upgrade-0.7.0-to-0.10.0.md) | Early major upgrade guide |
| [`engine-upgrade-0.10.0-to-0.10.2.md`](./engine-upgrade-0.10.0-to-0.10.2.md) | Patch upgrade documentation |
| [`engine-upgrade-0.14.0-to-0.15.0.md`](./engine-upgrade-0.14.0-to-0.15.0.md) | Major version upgrade guide |
| [`engine-upgrade-0.15.0-to-0.15.1.md`](./engine-upgrade-0.15.0-to-0.15.1.md) | Minor version upgrade guide |
| [`engine-upgrade-0.15.1-to-0.16.0.md`](./engine-upgrade-0.15.1-to-0.16.0.md) | Latest upgrade to 0.16.0 |
| [`mechanics-upgrade-0.14.0.md`](./mechanics-upgrade-0.14.0.md) | Mechanics engine upgrade notes |
| [`engine-team-handoff-2026-05-16.md`](./engine-team-handoff-2026-05-16.md) | Engine team transition documentation |
| [`engine-map-reconciliation-2026-05-24.md`](./engine-map-reconciliation-2026-05-24.md) | Map system reconciliation notes |

## UI audit documentation

| File | Screen Coverage |
|------|-----------------|
| [`mechanics-ui-audit-2026-05-21-combat.md`](./mechanics-ui-audit-2026-05-21-combat.md) | Combat screen UI audit |
| [`mechanics-ui-audit-2026-05-22-character.md`](./mechanics-ui-audit-2026-05-22-character.md) | Character screen UI audit |
| [`mechanics-ui-audit-2026-05-22-event.md`](./mechanics-ui-audit-2026-05-22-event.md) | Event handling UI audit |
| [`mechanics-ui-audit-2026-05-22-exploration.md`](./mechanics-ui-audit-2026-05-22-exploration.md) | Exploration screen UI audit |
| [`mechanics-ui-audit-2026-05-22-inventory.md`](./mechanics-ui-audit-2026-05-22-inventory.md) | Inventory screen UI audit |
| [`mechanics-ui-audit-2026-05-22-memoir.md`](./mechanics-ui-audit-2026-05-22-memoir.md) | Memoir screen UI audit |
| [`mechanics-ui-audit-2026-05-25-combat-modal.md`](./mechanics-ui-audit-2026-05-25-combat-modal.md) | Combat modal UI audit |

## Hazard minigame documentation

| File | Coverage |
|------|----------|
| [`hazard-balance-recommendations.md`](./hazard-balance-recommendations.md) | Game balance tuning recommendations |
| [`hazard-card-expansion-2026-06-11-spec.md`](./hazard-card-expansion-2026-06-11-spec.md) | Card expansion specification |
| [`hazard-playtest-2026-06-10-spec.md`](./hazard-playtest-2026-06-10-spec.md) | Playtest specification and results |
| [`hazard-v2-vs-mechanics-divergence.md`](./hazard-v2-vs-mechanics-divergence.md) | Version differences and reconciliation |

## Design and UX documentation

| File | Coverage |
|------|----------|
| [`combat.md`](./combat.md) | Combat system design documentation |
| [`early-combat-ux.md`](./early-combat-ux.md) | Combat UX evolution and design decisions |
| [`claude-design-prompt-2026-05-16.md`](./claude-design-prompt-2026-05-16.md) | Design handoff documentation and prompts |

## Architecture Decision Records (ADRs)

The [`adr/`](./adr/) folder contains durable mobile architecture and
product decisions. Each ADR documents a significant architectural choice:

| File | Decision Topic |
|------|---------------|
| [`adr/ADR-0001-engine-truth-and-presenter-boundary.md`](./adr/ADR-0001-engine-truth-and-presenter-boundary.md) | Engine as source of truth, presenter patterns |
| [`adr/ADR-0002-visual-baselines-are-committed-evidence.md`](./adr/ADR-0002-visual-baselines-are-committed-evidence.md) | Visual regression testing approach |
| [`adr/ADR-0003-mobile-does-not-invent-mechanics.md`](./adr/ADR-0003-mobile-does-not-invent-mechanics.md) | Engine authority over game mechanics |
| [`adr/ADR-0004-combat-terminology-prefers-player-language.md`](./adr/ADR-0004-combat-terminology-prefers-player-language.md) | Combat UI terminology decisions |
| [`adr/ADR-0005-reference-screenshots-and-generated-smoke-baselines-are-distinct.md`](./adr/ADR-0005-reference-screenshots-and-generated-smoke-baselines-are-distinct.md) | Testing baseline methodology |
| [`adr/ADR-0006-nexus-state-reconciliation-precedes-ui-polish.md`](./adr/ADR-0006-nexus-state-reconciliation-precedes-ui-polish.md) | Development priority guidance |
| [`adr/ADR-0007-befriend-mercy-choice-modal.md`](./adr/ADR-0007-befriend-mercy-choice-modal.md) | Combat mercy choice interaction |

See [`adr/README.md`](./adr/README.md) for ADR process and templates.

## Development workflow guides

| File | Coverage |
|------|----------|
| [`store-submission-checklist.md`](./store-submission-checklist.md) | App store submission process and requirements |
| [`source-of-truth-hierarchy.md`](./source-of-truth-hierarchy.md) | Decision-making authority and conflict resolution |

## AI assistance and templates

| File | Coverage |
|------|----------|
| [`prompts/onboarding-interview.prompt.md`](./prompts/onboarding-interview.prompt.md) | AI-assist onboarding interview template |

## Navigation

For the complete project structure and quick start guide, see the
[main README](../README.md). For planning and build process
documentation, see [`plan/`](../plan/).
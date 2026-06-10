# Documentation — Axiomancer Mobile

> This directory contains design notes, architectural decisions, and
> technical guidance for Axiomancer Mobile development.

## Quick reference

| File | Purpose |
|------|---------|
| [`testing.md`](./testing.md) | Hermetic E2E testing standard (REQUIRED) |
| [`presenters.md`](./presenters.md) | Presenter layer contract and patterns |
| [`adr/`](./adr/) | Architectural Decision Records |

## Architecture Decision Records (ADRs)

The [`adr/`](./adr/) folder contains durable mobile architecture and
product decisions that sit above build-plan execution and below T's
latest explicit decisions.

## Engine integration guidance

| File | Coverage |
|------|----------|
| [`engine-upgrade-0.14.0-to-0.15.0.md`](./engine-upgrade-0.14.0-to-0.15.0.md) | Latest engine upgrade guide |
| [`engine-upgrade-0.15.0-to-0.15.1.md`](./engine-upgrade-0.15.0-to-0.15.1.md) | Patch upgrade guide |
| [`mechanics-*.md`](./mechanics-ui-audit-2026-05-21-combat.md) | UI audit documentation per screen |

## Design and UX documentation

| File | Coverage |
|------|----------|
| [`../design/hazard-minigame-mobile.md`](../design/hazard-minigame-mobile.md) | Hazard minigame mobile design brief (route layout, color system, dual-meter rules, dice behavior) |
| [`claude-design-prompt-2026-05-16.md`](./claude-design-prompt-2026-05-16.md) | Design handoff documentation |
| [`combat.md`](./combat.md) | Combat system documentation |
| [`early-combat-ux.md`](./early-combat-ux.md) | UX evolution notes |

## Development workflows

| File | Coverage |
|------|----------|
| [`store-submission-checklist.md`](./store-submission-checklist.md) | App store submission guidance |
| [`source-of-truth-hierarchy.md`](./source-of-truth-hierarchy.md) | Decision-making hierarchy |
| [`testing-guide.md`](./testing-guide.md) | Extended testing guidance |

## Prompts and templates

The [`prompts/`](./prompts/) folder contains AI-assist prompt templates
for development workflows.

## Navigation

For the complete project structure and quick start guide, see the
[main README](../README.md). For planning and build process
documentation, see [`plan/`](../plan/).
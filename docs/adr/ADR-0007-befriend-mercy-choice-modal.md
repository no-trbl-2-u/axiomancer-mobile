# ADR-0007 — Befriend mercy choice is a modal consumer of engine truth

- Status: Proposed for future mobile implementation
- Date: 2026-06-02
- Related: `~/Workspace/decisions/CDR-0005-axiomancer-befriend-skill-and-mercy-choice.md`

## Context

Axiomancer Mechanics is expected to move Befriend toward a first-class heart-based skill that can open a mercy-choice state. Mobile must not invent this state. It must consume engine truth and make the choice legible.

## Decision candidate

When the mechanics engine emits a Befriend/mercy choice state, Mobile should present a modal with two choices:

1. Spare / befriend / preserve the encounter.
   - Text may later vary by the player's philosophical alignment.
   - The modal should make clear that this can alter alignment and future content.
2. Exploit the moment.
   - Grants a free guaranteed critical attack according to engine rules.
   - Must be presented as a consequential act, not a neutral attack button.

## Mobile obligations

- Do not decide Befriend eligibility locally.
- Do not calculate the free critical locally except through mechanics-provided action/report surfaces.
- Present the two choices clearly and with weight.
- Surface consequence language when mechanics exposes it: alignment shift, boss content, lost/altered reward, future flag, or narrative burden.
- Preserve accessibility: modal labels must explain both actions and the consequence category.

## Open questions

- What exact mechanics state/action names will represent the choice?
- Does the modal appear during combat or as a combat-resolution aftermath modal?
- What alignment-specific copy variants are needed first?

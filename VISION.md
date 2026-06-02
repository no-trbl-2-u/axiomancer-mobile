# Axiomancer Mobile Vision

This file preserves T's fundamental wants for Axiomancer as they affect the mobile client. Mobile does not invent mechanics; it makes engine truth legible, weighty, and playable.

Read this before major UX proposals, combat-screen work, mercy/friendship modals, alignment surfaces, or `/march` phase execution.

## Game identity

Axiomancer is an experimental philosophy RPG where mechanics make worldview consequential.

Mobile should make strange mechanics understandable without sanding off their danger.

## Combat UX vision

Combat is fundamentally status-effect-centered.

The UI should help the player understand:

1. what the enemy is doing;
2. what resources they are generating;
3. what skills are available;
4. what status effects exist and matter;
5. how victory, mercy, or consequence can happen.

The player may sometimes win by attacking or friendliness, but the intended mastery path is skill use, resource planning, status application, and status synergy. Mobile should not visually privilege brute attack or passive defense as the obvious always-correct action.

## Defend vision

The player should use defend only when:

- they fear a large attack is coming;
- they want to generate resource;
- they want to befriend an enemy.

The UI should make those reasons clear where engine truth permits.

## Friendship / mercy vision

Befriending should be difficult and consequential.

Current doctrine from mechanics/company vision:

- keep the HP gate;
- Befriend is a heart-based skill;
- every player starts with Befriend;
- Befriend requires 5 heart tokens to attempt;
- successful Befriend opens a choice:
  - spare / befriend / preserve the enemy;
  - exploit the opening for a free guaranteed critical hit.

Mobile obligation:

- present the post-Befriend choice as a modal when the engine emits the state;
- spare/befriend text may later vary by player philosophical alignment;
- exploit/free-critical text must be clear and morally charged, not a neutral attack button;
- consequence categories should be visible when engine exposes them: alignment, faction reputation, boss content, region state, reward changes, or future flags.

Anti-exploit doctrine mobile must represent when mechanics exposes it:

- exploiting an elite/miniboss Befriend opening prevents the region boss from gathering friendship counters;
- sparing that elite/miniboss makes the region boss begin with `open-minded`;
- `open-minded` may be a status effect whose only purpose is qualifying future Befriend paths;
- befriending a boss can trade reputation: lose standing with one faction, gain with another.

## Worker law

If a UI proposal makes the mechanics feel generic, hides status effects, treats mercy as a free reward, or presents exploit as morally neutral, it is suspect. Stop and reconcile with this file before implementation.

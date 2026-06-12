# Engine Integration Architecture

> How `axiomancer-mechanics` connects to mobile UI patterns

This document explains the architectural bridge between the `axiomancer-mechanics` npm engine and mobile-specific UI concerns. Newcomers should read this alongside [`docs/presenters.md`](./presenters.md) and [`docs/adr/ADR-0001-engine-truth-and-presenter-boundary.md`](./adr/ADR-0001-engine-truth-and-presenter-boundary.md).

## Overview — The Translation Layer

Axiomancer Mobile is fundamentally a **presentation layer** on top of the `axiomancer-mechanics` engine. The engine owns all game rules, state, and logic; the mobile app translates that truth into React Native UI patterns.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ axiomancer-     │    │ Mobile          │    │ React Native    │
│ mechanics       │───▶│ Presenters      │───▶│ Components      │
│ (npm engine)    │    │ (translation)   │    │ (UI)            │
└─────────────────┘    └─────────────────┘    └─────────────────┘
     Game Truth              Bridge Layer           User Interface
```

This architecture solves the **"parallel rules engine"** problem — mobile never reimplements game logic, it only presents what the engine provides.

## Engine-to-Mobile Data Flow

### 1. Engine State Shape

The engine exports structured state through its store:

```typescript
// Engine state (axiomancer-mechanics)
interface GameState {
  player: Character;          // Stats, effects, inventory
  combat: CombatState | null; // Active battle, phases, choices
  exploration: ExplorationState;
  // ... other slices
}
```

### 2. Mobile Store Integration

Mobile wraps the engine store with React bindings:

```typescript
// state/GameStoreProvider.tsx
const gameStore = createGameStore(memoryAdapter, initialState);

export function useGameState<T>(selector: (state: GameState) => T): T {
  return gameStore.getState((state) => selector(state));
}

export function useGameActions() {
  return gameStore.getActions(); // Engine actions, not mobile inventions
}
```

### 3. Presenter Translation Layer

Presenters (`state/presenters/*.engine.ts`) convert raw engine state into mobile-optimized view models:

```typescript
// Example: combat.engine.ts
export function selectCombatViewModel(
  state: GameState,
  localUi?: CombatLocalUi
): CombatViewModel {
  const combat = state.combat;
  
  // Engine truth → Mobile UI concerns
  return {
    isInCombat: combat !== null,
    phase: combat?.phase ?? 'choosing_stance',
    enemy: {
      name: combat?.enemy?.name?.toUpperCase() ?? '',
      hp: combat?.enemy?.health ?? 0,
      hpRatio: safeRatio(combat?.enemy?.health, combat?.enemy?.maxHealth),
      // ... mobile-specific formatting
    },
    // ... rest of view model
  };
}
```

### 4. Component Consumption

React components read ONLY from view models, never from engine state directly:

```tsx
// app/(tabs)/combat.tsx
export default function CombatScreen() {
  const vm = useCombatViewModel({ selectedStance: localStance });
  const actions = useGameActions();
  
  return (
    <View>
      <Text>{vm.enemy.name}</Text>
      <HealthBar ratio={vm.enemy.hpRatio} />
      <Button onPress={() => actions.selectStance('heart')}>
        {vm.stancePicker.options[0].label}
      </Button>
    </View>
  );
}
```

## Mobile-Specific Concerns

### UI State vs Game State

The architecture distinguishes between **engine state** (persisted game truth) and **ephemeral UI state** (mobile-only presentation concerns):

| Concern | Belongs To | Example |
|---------|------------|---------|
| Combat phase | Engine | `'choosing_stance'`, `'resolving'` |
| Player HP | Engine | `{ health: 45, maxHealth: 100 }` |
| Stance preview | Mobile | User hovering over Heart stance card |
| Modal visibility | Mobile | Skill picker expanded state |
| Animation state | Mobile | Damage number fade transition |

Ephemeral UI state flows through the `localUi` parameter:

```typescript
interface CombatLocalUi {
  selectedStance?: StanceKey;    // Preview before commit
  selectedSkillId?: string;      // Skill picker selection
  // NO game logic — just mobile presentation state
}
```

### Mobile UI Transformations

Presenters handle mobile-specific transformations that the engine shouldn't know about:

#### 1. Format Conversion
```typescript
// Engine: raw numbers
combat.enemy.health = 42;
combat.enemy.maxHealth = 100;

// Mobile: UI-ready ratios and display strings
vm.enemy.hpRatio = 0.42;  // For progress bars
vm.enemy.hpDisplay = "42 / 100";  // For text labels
```

#### 2. Mobile Constraints
```typescript
// Engine: unlimited effects list
player.effects = [poison, regen, shield, haste, fury, blessing, ...];

// Mobile: capped for small screens
vm.player.effects = player.effects.slice(0, MAX_EFFECTS_SHOWN);
```

#### 3. Touch Interaction Patterns
```typescript
// Engine: stance relationships
determineAdvantage('heart', 'body') // → 'advantage'

// Mobile: touch-friendly stance picker
vm.stancePicker.options = [
  {
    key: 'heart',
    label: 'HEART',
    advantage: 'adv',           // Simplified for chips
    counters: 'BODY',           // "Heart beats Body"
    gloss: 'parley, mercy',     // Flavor for mobile cards
    // ...
  }
];
```

### React Native-Specific Adaptations

#### Accessibility Integration
```typescript
// Mobile adds a11y props the engine doesn't need
vm.a11y = {
  stanceHeart: 'Choose Heart stance, beats Body, weak to Mind',
  playerHp: `You have ${player.hp} of ${player.hpMax} health`,
  // ... screen reader optimized descriptions
};
```

#### Performance Optimizations
```typescript
// Mobile-only caching and memoization
export function useCombatViewModel(localUi: CombatLocalUi = {}): CombatViewModel {
  const combat = useGameState(s => s.combat);     // Zustand subscriptions
  const player = useGameState(s => s.player);
  
  return useMemo(() => 
    selectCombatViewModel({ combat, player }, localUi),
    [combat, player, localUi.selectedStance]      // React-level caching
  );
}
```

## Integration Boundaries

### What Lives Where

| Component | Responsibility | Examples |
|-----------|----------------|----------|
| **Engine** | Game rules, state mutations, calculations | Damage formulas, stance advantages, skill effects |
| **Presenters** | State-to-UI translation, mobile formatting | HP ratios, truncated lists, display strings |
| **Components** | Visual rendering, touch handling, React lifecycle | StyleSheets, animations, gesture handling |

### Error Boundary Example

When a bug occurs, the architecture helps isolate the problem:

```
Bug: "Heart stance shows wrong advantage against Body enemy"

Investigation path:
1. Is the engine calculation wrong?
   → Check determineAdvantage('heart', 'body') in engine tests
2. Is the presenter mapping wrong?
   → Check stanceAdvantage() in combat.engine.ts
3. Is the component display wrong?
   → Check StanceCard rendering of vm.advantage prop
```

### Migration Patterns

When the engine evolves, mobile follows a predictable upgrade path:

```
Engine 0.15.0 → 0.16.0: New skill resource system

Mobile migration:
1. Update npm dependency: axiomancer-mechanics@^0.16.0
2. Update presenters: combat.engine.ts skill picker logic  
3. Update components: New resource displays (if needed)
4. Update tests: New presenter contracts

UI components rarely change for engine upgrades
```

## Common Patterns

### 1. Engine Truth with Mobile Polish

```typescript
// Engine provides raw data
const skillDamage = calculateSkillDamage(caster, skill);

// Mobile adds presentation concerns
const effectText = `${skillDamage} DMG · BLEED 2 (3R)`;
const costText = `2 BOD · 1 PRX`;  // Resource cost formatting
```

### 2. Defensive Fallbacks

```typescript
// Engine state might be incomplete during transitions
const enemyName = combat?.enemy?.name ?? '';
const displayName = enemyName.toUpperCase() || 'ADVERSARY';  // Never show empty
```

### 3. Engine Action Dispatch

```typescript
// Mobile triggers engine actions, never duplicates engine logic
const actions = useGameActions();

// ✅ Correct: Let engine handle the logic
actions.selectStance('heart');
actions.resolveCombatRound();

// ❌ Wrong: Mobile inventing game rules  
setPlayerHp(prev => Math.max(0, prev - damage));
```

## For Engine Integration Newcomers

### Quick Start Checklist

1. **Read the presenter docs**: [`docs/presenters.md`](./presenters.md)
2. **Examine a complete example**: [`state/presenters/combat.engine.ts`](../state/presenters/combat.engine.ts)
3. **Follow the data flow**: Engine state → Presenter → Component
4. **Test the boundary**: Every presenter has hermetic tests in `state/e2e/`

### Key Files to Understand

| File | Purpose |
|------|---------|
| `state/GameStoreProvider.tsx` | Engine store → React bindings |
| `state/presenters/*.engine.ts` | Engine state → view model translation |
| `state/e2e/*.engine.test.ts` | Presenter contract tests |
| `docs/adr/ADR-0001-*.md` | Architectural decision rationale |

### Mental Model

Think of mobile as a **smart display** for the engine:
- The engine is the "computer" (logic, rules, truth)
- The presenters are the "translator" (engine data → mobile format)  
- The components are the "screen" (pixels, touches, animations)

The engine never knows about React, mobile, or UI concerns. Mobile never reimplements combat math, randomness, or game progression. The presenter layer keeps these concerns cleanly separated.
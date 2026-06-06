/**
 * Combat screen — UI shell.
 *
 * Per Spec 04: this file holds no game logic. Every value it renders
 * is read from `selectCombatViewModel`; every state change it triggers
 * goes through `useGameActions()`. Phase ownership is on the engine
 * (`combat.phase`); the screen only previews the player's current
 * stance via local UI state until the player commits.
 *
 * Phase layout (Phase 32 sub-tick C, commit `9222bf9` — port from
 * the Claude Design handoff): the four phases stance / action /
 * skill / resolving render as a vertical PhaseStack. Each row sits
 * in one of three states:
 *   - past    — collapsed to one line with a right-aligned summary
 *               of the committed value (e.g. "BODY" / "STRIKE");
 *   - current — expanded panel with the active picker inline +
 *               sulfur dot indicator on the header strip;
 *   - future  — dimmed label only in ash, no body.
 * The skill row hides itself when the picked action wasn't 'skill'
 * (driven by `vm.phaseStack[i].visible`). Pre-Phase-32 this surface
 * was a horizontal swipe carousel; the swap removed the swipe-to-
 * change-phase affordance — committed phases stay committed within
 * a round.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AXM, FONTS } from '@/theme/axm';
import { useAesthetic } from '@/state/aesthetic-mode';
import { useCombatMode } from '@/state/combat-mode';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import {
    useCombatViewModel,
    type ActionOption,
    type SkillOption,
    type StanceKey,
} from '@/state/presenters/combat.engine';
import { selectCodexStatusLine } from '@/state/presenters/combat.codex.engine';
import { CodexStatusStrip } from '@/components/CodexStatusStrip';
import { ScreenBg } from '@/components/ScreenBg';
import { PhaseBottom } from '@/components/combat/PhaseBottom';
import { CombatEnemyPanel } from '@/components/combat/CombatEnemyPanel';
import { CombatLogDisplay } from '@/components/combat/CombatLogDisplay';
import { CombatPlayerHud } from '@/components/combat/CombatPlayerHud';
import { MercyChoiceModal } from '@/components/combat/MercyChoiceModal';

// ---------------------------------------------------------------------------
// Local UI state (Q2: stance preview lives here until the user commits)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Screen
//
// Phase 63a (2026-05-21): the inner content was extracted into a
// named-export `<CombatPanel>` so the same combat surface can
// mount inside `EncounterModalOverlay` (Phase 63b) without
// double-wrapping `<ScreenBg>`. Default-export `CombatScreen`
// stays as the tab shell that wraps `<CombatPanel>` in
// `<ScreenBg>`.
// ---------------------------------------------------------------------------

export default function CombatScreen() {
    return (
        <ScreenBg>
            <CombatPanel />
        </ScreenBg>
    );
}

/**
 * The combat surface without its outer ScreenBg wrap. Returns
 * the loading state OR the active combat render — neither
 * branch wraps in ScreenBg, so callers can mount this inside
 * any container (tab shell, modal overlay, etc.) and own the
 * outer scrolling / safe-area behaviour.
 */
/**
 * Phase 70 Tick A — capture the last log entry's skill / damage /
 * result-descriptor as the "final blow" snapshot the aftermath
 * panel shows. Engine doesn't tag skill *name* on log entries
 * (only the skillId on the action), so we surface the id (uppercased)
 * or the action verb (`attack` / `defend` / `skill` / `item` /
 * `flee`) as the fallback. A presenter-side name lookup is a
 * promotion candidate when the writers add display names.
 */
function buildFinalBlowSnapshot(combat: CombatStateLike): {
    skillName: string | null;
    damage: number;
    descriptor: string | null;
} | null {
    const last = combat.log[combat.log.length - 1];
    if (last === undefined) return null;
    // Defensive optional chaining — same shape-mismatch the
    // defeat-branch snapshot guards against. Engine types
    // playerAction as required, but log entries can ship the
    // field undefined in practice.
    const rawName =
        last.playerAction?.skillId
        ?? last.playerAction?.action
        ?? null;
    return {
        skillName: rawName !== null ? rawName.toUpperCase() : null,
        damage: last.damageToEnemy ?? 0,
        descriptor:
            typeof last.result === 'string' && last.result.length > 0
                ? last.result
                : null,
    };
}

// Structural type — the bits buildFinalBlowSnapshot reads. Avoids
// dragging the full engine CombatState import in for one helper.
type CombatStateLike = {
    log: {
        playerAction?: { skillId?: string; action?: string };
        damageToEnemy?: number;
        result?: string;
    }[];
};

/**
 * Phase 78 — derive a short preview line from a codex entry body.
 * Takes the first sentence (split on the first period), truncates
 * to ≤120 chars at a word boundary, strips the trailing period.
 * The aftermath panel appends `'…'` itself.
 */
export function derivePreview(body: string): string {
    const trimmed = body.trim();
    if (trimmed.length === 0) return '';
    const firstPeriod = trimmed.indexOf('.');
    const firstSentence =
        firstPeriod > 0 ? trimmed.slice(0, firstPeriod) : trimmed;
    if (firstSentence.length <= 120) return firstSentence;
    const cutoff = firstSentence.lastIndexOf(' ', 120);
    return cutoff > 0 ? firstSentence.slice(0, cutoff) : firstSentence.slice(0, 120);
}

export function CombatPanel() {
    const router = useRouter();
    const {
        exitCombat,
        exitCombatWith,
        inEncounterModal,
        closeEncounterModal,
        encountersFaced,
        deepestNodeId,
    } = useCombatMode();
    const { mode: aesthetic } = useAesthetic();
    const combat = useGameState((s) => s.combat);
    const currentMapId = useGameState((s) => s.world?.currentMap?.name ?? null);
    // Phase 65 Tick B — no default starting stance. `null` until the
    // player taps a stance card; the picker shows no card pre-highlighted
    // on combat entry. Was previously `'heart'`, which surfaced as a
    // user-confusing "Heart is already selected" UX.
    const [selectedStance, setSelectedStance] = useState<StanceKey | null>(null);
    const vm = useCombatViewModel({ selectedStance: selectedStance ?? undefined });
    const actions = useGameActions();
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (combat === null) {
            actions.startCombat(createMockEncounterEnemy());
        } else if (combat && vm.phase === 'ended' && vm.enemy.hp <= 0 && !vm.isInCombat) {
            // Phase 97 — Fix re-trigger after victory. If combat state exists but
            // VM shows combat ended with enemy defeated and not in combat anymore,
            // force clear the combat state to allow re-trigger.
            actions.endCombat();
        }
    }, [combat, actions, vm.phase, vm.enemy.hp, vm.isInCombat]);

    useEffect(() => {
        if (toast === null) return;
        const handle = setTimeout(() => setToast(null), 1800);
        return () => clearTimeout(handle);
    }, [toast]);

    const onPickStance = useCallback((stance: StanceKey) => {
        setSelectedStance(stance);
        actions.setPlayerStance(stance);
        actions.setCombatPhase('choosing_action');
    }, [actions]);

    const onPickAction = useCallback((key: ActionOption['key']) => {
        if (key === 'skill') {
            actions.setCombatPhase('choosing_skill');
            return;
        }
        if (key === 'item') {
            setToast(vm.actionPicker.itemMessage);
            return;
        }
        actions.setPlayerAction(key);
        actions.resolveRound();
    }, [actions, vm.actionPicker.itemMessage]);

    const onPickSkill = useCallback((skill: SkillOption) => {
        if (!skill.enabled) return;
        actions.setPlayerAction('skill', skill.id);
        actions.resolveRound();
    }, [actions]);

    // Phase 103 — Mercy choice modal callbacks
    const onMercySpare = useCallback(() => {
        actions.spareMercyChoice();
    }, [actions]);

    const onMercyExploit = useCallback(() => {
        actions.exploitMercyChoice();
    }, [actions]);

    // Phase 73 (user-direct 2026-05-23) — past phase rows are tappable
    // so a player can undo a stance or action choice before the round
    // resolves. Set the engine phase back to the tapped phase; the
    // picker for that phase re-mounts as the current row and the
    // player can pick again. The committed choice is preserved until
    // the player commits a new one (the engine's setStance / setAction
    // overwrite). Resolving rounds can't be "undone" — but the player
    // hasn't yet pressed LET IT FALL, so re-picking the action is
    // still meaningful up to that point.
    const onGoBackToPhase = useCallback((phase: 'choosing_stance' | 'choosing_action' | 'choosing_skill') => {
        actions.setCombatPhase(phase);
    }, [actions]);

    // Phase 63c — when CombatPanel runs inside the encounter modal,
    // combat-end handlers skip the `router.replace('/exploration')`
    // and instead close the encounter modal in-place; the exploration
    // screen is already mounted underneath the modal, so dismissing
    // the modal returns the player to the map naturally. The legacy
    // tab-context path still routes (kept for the /combat route
    // until Phase 63d retires it).
    const finalizeCombatExit = useCallback(() => {
        if (inEncounterModal) {
            closeEncounterModal();
        } else {
            router.replace('/exploration' as never);
        }
    }, [inEncounterModal, closeEncounterModal, router]);

    const onContinueRound = useCallback(() => {
        // Combat-end outcome resolution for the aftermath banner (Phase 41
        // port). Order matters: friendship max BEFORE enemy HP because a
        // parley fight ends when the friendship counter hits the cap even
        // if the enemy hasn't dropped. Player HP <= 0 is the defeat branch.
        if (vm.friendshipCounter >= vm.friendshipCounterMax) {
            // Phase 78 — capture combat.enemy.journalEntry BEFORE
            // actions.endCombat() clears the slice. The engine
            // report tells us which entry unlocked (by id+title);
            // the body comes from the live enemy's journalEntry
            // field. The engine guards against re-unlocking entries
            // already in state.codex.unlockedEntries — repeat
            // friendships with the same foe report no unlock and
            // the snapshot stays journalEntry: null.
            const enemyJournalEntry = combat?.enemy.journalEntry ?? null;
            const report = actions.endCombat();
            const codexUnlocked = report?.friendshipReward?.codexEntryUnlocked ?? null;
            const journalEntrySnapshot =
                codexUnlocked && enemyJournalEntry
                    ? {
                          bookName: 'CODEX',
                          entryTitle: codexUnlocked.title.toUpperCase(),
                          preview: derivePreview(enemyJournalEntry.body),
                      }
                    : null;
            const parleySnapshot = combat !== null
                ? {
                      variant: 'parley' as const,
                      enemy: {
                          name: combat.enemy.name,
                          description: combat.enemy.description,
                          level: combat.enemy.level,
                          // Phase 76 — thread engine narrative lines
                          // through. Optional; the presenter falls back
                          // to a generic per-tier phrase when absent.
                          pactLines: combat.enemy.pactLines,
                      },
                      xpReward: combat.enemy.xpReward ?? null,
                      journalEntry: journalEntrySnapshot,
                  }
                : undefined;
            exitCombatWith('parley', parleySnapshot);
            if (!inEncounterModal) {
                finalizeCombatExit();
            }
            return;
        }
        if (vm.enemy.hp <= 0) {
            // Phase 70 Tick A — snapshot the combat state before
            // endCombat() clears the slice, so the in-modal
            // CombatVictoryPanel has data to render. When we're
            // inside the encounter modal, skip finalizeCombatExit:
            // the panel's CARRY ON button drives dismissal via
            // dismissAftermath() instead. The legacy /combat tab
            // path (modal-less) finalizes immediately — that route
            // is unused in practice (encounters always open the
            // modal), but the branch stays for the /combat tab's
            // direct-mount harness pass.
            const aftermathSnapshot = combat !== null
                ? {
                      variant: 'victory' as const,
                      enemy: {
                          name: combat.enemy.name,
                          description: combat.enemy.description,
                          level: combat.enemy.level,
                          // Phase 76 — engine narrative lines (optional).
                          finalBlowLines: combat.enemy.finalBlowLines,
                      },
                      finalBlow: buildFinalBlowSnapshot(combat),
                      xpReward: combat.enemy.xpReward ?? null,
                  }
                : undefined;
            actions.endCombat();
            exitCombatWith('victory', aftermathSnapshot);
            if (!inEncounterModal) {
                finalizeCombatExit();
            }
            return;
        }
        if (vm.player.hp <= 0) {
            // Phase 70 Tick C — same snapshot pattern as victory /
            // parley. The defeat panel reads enemy + killer + run
            // summary from the AftermathData snapshot after
            // actions.endCombat() clears the slice.
            const defeatSnapshot = combat !== null
                ? {
                      variant: 'defeat' as const,
                      enemy: {
                          name: combat.enemy.name,
                          description: combat.enemy.description,
                          level: combat.enemy.level,
                          // Phase 76 — engine narrative lines (optional).
                          causeLines: combat.enemy.causeLines,
                      },
                      characterName: combat.player.name,
                      // Damage figure here is what the enemy dealt
                      // to the player on the killing round (mirror
                      // of the victory branch's damageToEnemy).
                      // Defensive optional chaining on enemyAction —
                      // the engine's BattleLogEntry types it as a
                      // required CombatAction, but a user-reported
                      // crash 2026-05-23 ("boss test encounter tried
                      // to use a skill") showed the field can be
                      // undefined in practice when a boss's enemy
                      // action lands on the killing log entry. Read
                      // defensively rather than trust the engine type.
                      finalBlow: (() => {
                          const last = combat.log[combat.log.length - 1];
                          if (last === undefined) return null;
                          const rawName =
                              last.enemyAction?.skillId
                              ?? last.enemyAction?.action
                              ?? null;
                          return {
                              skillName: rawName !== null ? rawName.toUpperCase() : null,
                              damage: last.damageToPlayer ?? 0,
                              descriptor:
                                  typeof last.result === 'string' && last.result.length > 0
                                      ? last.result
                                      : null,
                          };
                      })(),
                      runSummary: {
                          roundsEndured: combat.round,
                          encountersFaced,
                          deepestNodeId,
                          currentMapId,
                      },
                  }
                : undefined;
            actions.endCombat();
            exitCombatWith('defeat', defeatSnapshot);
            if (!inEncounterModal) {
                finalizeCombatExit();
            }
            return;
        }
        actions.nextRound();
    }, [
        actions,
        combat,
        exitCombatWith,
        finalizeCombatExit,
        inEncounterModal,
        encountersFaced,
        deepestNodeId,
        currentMapId,
        vm.enemy.hp,
        vm.player.hp,
        vm.friendshipCounter,
        vm.friendshipCounterMax,
    ]);

    const onFlee = useCallback(() => {
        setToast(vm.actionPicker.fleeMessage);
    }, [vm.actionPicker.fleeMessage]);

    const onLeaveCombat = useCallback(() => {
        actions.endCombat();
        // `onLeaveCombat` is the early-exit DEPART path before the
        // resolve phase; treat as 'flee' (the banner stays silent).
        exitCombat();
        finalizeCombatExit();
    }, [actions, exitCombat, finalizeCombatExit]);

    if (!vm.isInCombat) {
        // First render before useEffect runs the bootstrap. The pre-
        // Phase-30 placeholder was an empty <View>, which the user
        // observed as "combat encounter is blank" — the visible
        // `loadingMessage` keeps the screen from collapsing to a void.
        return (
            <View style={styles.loadingWrap} testID="combat-screen-loading">
                <Text style={styles.loadingText}>{vm.loadingMessage}</Text>
            </View>
        );
    }

    return (
        <>
            {aesthetic === 'codex' && (
                <CodexStatusStrip line={selectCodexStatusLine(vm)} />
            )}
            <CombatEnemyPanel vm={vm} />
            <CombatLogDisplay log={vm.log} round={vm.round} emptyMessage={vm.logEmptyMessage} />
            {/* Phase 73 — PlayerHud now renders AFTER the phase stack
              * to match the design's PtCombatBody order (`prototype.jsx:
              * 692-711`): enemy / round strip / phase stack (scrollable) /
              * player HUD at the bottom. Pre-Phase-73 the HUD sat above
              * the phase stack, which read as a player-summary block
              * before the action choices — the design wires it as a
              * "your turn" footer beneath the active picker. */}
            <PhaseBottom
                vm={vm}
                onPickStance={onPickStance}
                onPickAction={onPickAction}
                onPickSkill={onPickSkill}
                onGoBackToPhase={onGoBackToPhase}
                onFlee={onFlee}
                onContinue={onContinueRound}
                onLeave={onLeaveCombat}
            />
            <CombatPlayerHud vm={vm} />
            {toast !== null && (
                <View style={styles.toast} accessibilityLiveRegion="polite">
                    <Text style={styles.toastText}>{toast}</Text>
                </View>
            )}
            {/* Phase 103 — Mercy choice modal */}
            <MercyChoiceModal
                mercyChoice={vm.mercyChoice}
                onSpare={onMercySpare}
                onExploit={onMercyExploit}
            />
        </>
    );
}




// ---------------------------------------------------------------------------
// Sub-components extracted to components/combat/PhaseBottom.tsx
// (PhaseStack, StancePhase, ActionPhase, SkillPhase, SkillRow,
// ResolvePanel + their style sheets). The crucible "skill fuel"
// pool now renders as a persistent CombatResourceTracker in the
// player HUD footer (CombatPlayerHud), replacing the former
// action-phase-only CrucibleStrip legend.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    loadingText: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        letterSpacing: 2,
        color: AXM.bone,
        textTransform: 'uppercase',
    },
    toast: {
        position: 'absolute', bottom: 32, left: 24, right: 24,
        backgroundColor: AXM.panelBg,
        borderWidth: 1, borderColor: AXM.bone,
        padding: 10, alignItems: 'center',
    },
    toastText: { fontFamily: FONTS.serifItalic, fontSize: 12, color: AXM.parchment },
});


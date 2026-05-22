/**
 * App-wide React ErrorBoundary + ErrorScreen.
 *
 * Catches runtime render errors anywhere in the subtree so the
 * app shows a debug screen instead of breaking (white screen on
 * web, native red box on iOS/Android). Filed via user-jot
 * 2026-05-22 (oversight 29th call).
 *
 * Scope: deliberately simple. Surfaces:
 * - The error message + stack
 * - The React component stack (which surface threw)
 * - A snapshot of `state.player` + `state.combat` + the last few
 *   typed events (so the user can see *what game state was loaded
 *   when the crash happened*)
 * - "Try again" (reset boundary state) + "Reload page" affordances
 *
 * NOT in scope today:
 * - Error reporting (Sentry / similar) — wire when the team
 *   picks a provider.
 * - Persisted error log — could write to AsyncStorage in a
 *   follow-up if the user wants post-mortem analysis after a
 *   reload.
 *
 * The boundary must be mounted INSIDE the GameStoreProvider so
 * the fallback's `ErrorScreen` can read state via `useGameState`.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { AXM, FONTS } from '@/theme/axm';
import { useGameState } from '@/state/GameStoreProvider';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    error: Error | null;
    componentStack: string | null;
}

export class ErrorBoundary extends Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    state: ErrorBoundaryState = { error: null, componentStack: null };

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
         
        console.error('[ErrorBoundary] caught', error, info);
        this.setState({ componentStack: info.componentStack ?? null });
    }

    reset = (): void => {
        this.setState({ error: null, componentStack: null });
    };

    render(): ReactNode {
        if (this.state.error !== null) {
            return (
                <ErrorScreen
                    error={this.state.error}
                    componentStack={this.state.componentStack}
                    onReset={this.reset}
                />
            );
        }
        return this.props.children;
    }
}

interface ErrorScreenProps {
    error: Error;
    componentStack: string | null;
    onReset: () => void;
}

function ErrorScreen({ error, componentStack, onReset }: ErrorScreenProps) {
    // Read engine state for the debug snapshot. Guard against the
    // store throwing too (the provider may itself be where the
    // crash originated); fall back to a "store unavailable" line.
    let stateSnapshot: string;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        stateSnapshot = useStateSnapshot();
    } catch (e) {
        stateSnapshot = `(store snapshot unavailable: ${(e as Error)?.message ?? String(e)})`;
    }

    return (
        <View style={styles.root} testID="error-boundary-screen">
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.eyebrow}>✠ SOMETHING TORE</Text>
                <Text style={styles.title}>The page split.</Text>
                <Text style={styles.body}>
                    a render fell mid-step. the lines below carry what was on
                    the table when it did.
                </Text>

                <Section label="ERROR">
                    <Text style={styles.codeMessage}>{error.message || '(no message)'}</Text>
                    {error.stack ? (
                        <Text style={styles.codeBlock}>{error.stack}</Text>
                    ) : null}
                </Section>

                {componentStack !== null ? (
                    <Section label="COMPONENT STACK">
                        <Text style={styles.codeBlock}>{componentStack.trim()}</Text>
                    </Section>
                ) : null}

                <Section label="STATE SNAPSHOT">
                    <Text style={styles.codeBlock}>{stateSnapshot}</Text>
                </Section>

                <Section label="BUILD CONTEXT">
                    <Text style={styles.codeBlock}>{buildContext()}</Text>
                </Section>

                <View style={styles.actions}>
                    <Pressable
                        style={styles.action}
                        accessibilityRole="button"
                        accessibilityLabel="Try again"
                        onPress={onReset}
                    >
                        <Text style={styles.actionText}>TRY AGAIN ↻</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

/**
 * Hook that builds a compact JSON snapshot of the engine slices
 * worth eyeballing during a crash. Kept small on purpose — full
 * `state.player.inventory` arrays would drown the screen.
 */
function useStateSnapshot(): string {
    const player = useGameState((s) => s.player);
    const combat = useGameState((s) => s.combat);
    const world = useGameState((s) => s.world);
    const recentEvents = useGameState((s) => s._recentEvents);

    const snapshot = {
        player: player
            ? {
                  name: player.name,
                  level: player.level,
                  health: player.health,
                  maxHealth: player.maxHealth,
                  experience: player.experience,
                  inventoryCount: Array.isArray(player.inventory) ? player.inventory.length : 0,
              }
            : null,
        combat: combat
            ? {
                  phase: combat.phase,
                  round: combat.round,
                  enemyName: combat.enemy?.name,
                  enemyHp: combat.enemy?.health,
                  playerHp: combat.player?.health,
                  friendshipCounter: combat.friendshipCounter,
              }
            : null,
        world: world?.currentMap
            ? {
                  continent: world.currentContinent?.name,
                  map: world.currentMap.name,
                  currentNode: world.currentMap.currentNode ?? null,
                   
                  completedCount: Array.isArray((world.currentMap as any).completedNodes)
                       
                      ? (world.currentMap as any).completedNodes.length
                      : 0,
              }
            : null,
        recentEvents: Array.isArray(recentEvents)
            ? recentEvents.slice(0, 5).map((e) => e?.type ?? '?')
            : null,
    };
    return JSON.stringify(snapshot, null, 2);
}

function buildContext(): string {
    // Module-time captured at first render; effectively constant
    // for the session.
    const dev = typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : 'unknown';
    return JSON.stringify(
        {
            dev,
            timestamp: new Date().toISOString(),
             
            platform: typeof (globalThis as any).navigator?.userAgent === 'string'
                 
                ? (globalThis as any).navigator.userAgent
                : 'native',
        },
        null,
        2,
    );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionLabel}>{label}</Text>
            <View style={styles.sectionBody}>{children}</View>
        </View>
    );
}

declare const __DEV__: boolean | undefined;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: AXM.bg,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 48,
        paddingBottom: 48,
    },
    eyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        letterSpacing: 3,
        color: AXM.blood,
        marginBottom: 6,
    },
    title: {
        fontFamily: FONTS.gothic,
        fontSize: 28,
        lineHeight: 32,
        color: AXM.parchment,
        marginBottom: 8,
    },
    body: {
        fontFamily: FONTS.serif,
        fontSize: 13,
        lineHeight: 18,
        color: AXM.bone,
        marginBottom: 20,
    },
    section: {
        marginBottom: 16,
    },
    sectionLabel: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 2,
        color: AXM.sulfur,
        marginBottom: 4,
    },
    sectionBody: {
        backgroundColor: AXM.panelBg,
        borderLeftWidth: 2,
        borderLeftColor: AXM.ash,
        padding: 8,
    },
    codeMessage: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        color: AXM.blood,
        marginBottom: 6,
    },
    codeBlock: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        lineHeight: 14,
        color: AXM.parchment,
    },
    actions: {
        marginTop: 16,
        flexDirection: 'row',
        gap: 8,
    },
    action: {
        flex: 1,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.panelBg,
        alignItems: 'center',
    },
    actionText: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        letterSpacing: 2,
        color: AXM.sulfur,
    },
});

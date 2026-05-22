import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AXM, FONTS } from '@/theme/axm';
import { StatBar } from './StatBar';
import { SectionLabel } from './SectionLabel';
import { useGameState } from '@/state/GameStoreProvider';

interface StatusCardProps {
  /**
   * Optional override props for tests / fixtures. In production
   * the card reads from engine state directly via `useGameState`;
   * the props win only when explicitly passed. Closes the
   * `[5.5]` AUDIT row from the live-drive playtest 2026-05-22 —
   * the card was previously rendered with NO props by every
   * caller, so the defaults (HP 22/38, level 7, hardcoded name)
   * were what every player saw, regardless of real game state.
   */
  name?: string;
  level?: number;
  hp?: number;
  hpMax?: number;
}

export function StatusCard(props: StatusCardProps = {}) {
  // Read from engine `state.player` so the card reflects real
  // game state. Test fixtures may still inject props directly —
  // the prop wins when defined, otherwise we fall through to the
  // store. Phase-62 bug-sweep 2026-05-21 dropped the mana bar
  // (mana is combat-only via Phase 60d's combatMana slice); the
  // status card surfaces only the HP that exists out-of-combat.
  const playerName = useGameState((s) => s.player?.name ?? 'WORM-EATEN PILGRIM');
  const playerLevel = useGameState((s) => s.player?.level ?? 1);
  const playerHp = useGameState((s) => s.player?.health ?? 0);
  const playerHpMax = useGameState((s) => s.player?.maxHealth ?? 0);

  const name = props.name ?? playerName;
  const level = props.level ?? playerLevel;
  const hp = props.hp ?? playerHp;
  const hpMax = props.hpMax ?? playerHpMax;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.levelBox}>
          <Text style={styles.levelText}>{level}</Text>
        </View>
        <View style={styles.nameCol}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <SectionLabel size={9} style={{ color: AXM.bone, marginTop: 2 }}>
            LEVEL · LVL {level} PILGRIM
          </SectionLabel>
        </View>
      </View>
      <View style={styles.barsRow}>
        <View style={styles.bar}>
          <StatBar value={hp} max={hpMax} color={AXM.blood} label="HP" height={9} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 8,
    marginBottom: 0,
    padding: 8,
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: AXM.panelBg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBox: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderColor: AXM.parchment,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontFamily: FONTS.gothic,
    fontSize: 22,
    color: AXM.sulfur,
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: FONTS.gothic,
    fontSize: 15,
    lineHeight: 18,
    color: AXM.parchment,
    letterSpacing: 1,
  },
  barsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  bar: {
    flex: 1,
  },
});

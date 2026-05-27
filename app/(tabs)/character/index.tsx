import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AXM, FONTS } from '@/theme/axm';
import { TooltipTarget } from '@/components/tooltip/TooltipTarget';
import { AestheticDevToggle } from '@/components/AestheticDevToggle';
import { AscendStrip } from '@/components/levelup/AscendStrip';
import { LevelReadyStrip } from '@/components/levelup/LevelReadyStrip';
import { LevelUpModal } from '@/components/levelup/LevelUpModal';
import { DebugChaosToggle } from '@/components/DebugChaosToggle';
import { DebugCombatButton } from '@/components/DebugCombatButton';
import { DebugAlignmentShift } from '@/components/DebugAlignmentShift';
import { DebugCurrencyControl } from '@/components/DebugCurrencyControl';
import { DebugDialogueJump } from '@/components/DebugDialogueJump';
import { DebugEffectApply } from '@/components/DebugEffectApply';
import { DebugQuestState } from '@/components/DebugQuestState';
import { DebugEventKindForce } from '@/components/DebugEventKindForce';
import { DebugFriendship } from '@/components/DebugFriendship';
import { DebugHudOverrides } from '@/components/DebugHudOverrides';
import { DebugManaControl } from '@/components/DebugManaControl';
import { DebugMapResetButton } from '@/components/DebugMapResetButton';
import { DebugPresetPicker } from '@/components/DebugPresetPicker';
import { DebugPopulateAllItems } from '@/components/DebugPopulateAllItems';
import { DebugSeedButton } from '@/components/DebugSeedButton';
import { DebugXpGrant } from '@/components/DebugXpGrant';
import { DevMenu } from '@/components/DevMenu';
import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { StanceGlyph } from '@/components/StanceGlyph';
import { EffectGlyph } from '@/components/EffectGlyph';
import { XpChain } from '@/components/XpChain';
import { BodyDiagram } from '@/components/BodyDiagram';
import { useGameActions, useGameState, useGameStore } from '@/state/GameStoreProvider';
import { selectCharacterViewModel } from '@/state/presenters/character.engine';

export default function CharacterScreen() {
  // Subscribe to stable slices to avoid getSnapshot identity churn:
  // `selectCharacterViewModel` returns a frozen new object every call,
  // which would loop `useSyncExternalStore` if used directly as a
  // selector. Pull the underlying slice and memoize the VM downstream
  // (mirrors the pattern fixed in event screen, Phase 6 Tick A).
  const player = useGameState((s) => s.player);
  const vm = useMemo(
    () => selectCharacterViewModel({ player } as never),
    [player],
  );
  const store = useGameStore();
  const actions = useGameActions();

  // Phase 29 Tick A: acknowledge any pending level-up the moment the
  // character screen renders. The tab badge clears via
  // `selectTabBadges` (which gates on `levelUpAcknowledged`). Preserve
  // any other notification fields (toast, etc.) on the slice.
  useEffect(() => {
    const prev = store.getState().notifications;
    store.setState({
      notifications: { ...prev, levelUpAcknowledged: true },
    });
  }, [store]);

  // Phase 73 — LevelUpModal mount toggle. Strip tap opens, modal
  // commit / keep-deliberating dismisses. Snapshot the level + base
  // stat values at the moment the modal opens so it has the "before"
  // figures even if the engine mutates underneath us mid-allocation.
  const [levelUpOpen, setLevelUpOpen] = useState<boolean>(false);
  const onOpenLevelUp = useCallback(() => setLevelUpOpen(true), []);
  const onCloseLevelUp = useCallback(() => setLevelUpOpen(false), []);
  const onCommitAllocation = useCallback(
    (spent: { heart: number; body: number; mind: number }) => {
      // Dispatch the engine action N times — once per allocated
      // point. The engine clamps internally; we trust the modal's
      // local state to be valid (sum === totalPoints).
      for (let i = 0; i < spent.heart; i += 1) actions.allocateStatPoint('heart');
      for (let i = 0; i < spent.body; i += 1) actions.allocateStatPoint('body');
      for (let i = 0; i < spent.mind; i += 1) actions.allocateStatPoint('mind');
      setLevelUpOpen(false);
    },
    [actions],
  );

  return (
    <ScreenBg>
      {/* Header */}
      <View
        style={styles.header}
        accessible
        accessibilityLabel={`${vm.a11y.characterName}. ${vm.a11y.level}. ${vm.a11y.experience}.`}
      >
        <SectionLabel size={9} color={AXM.bone}>{vm.subtitle}</SectionLabel>
        <View style={styles.headerRow}>
          <Text style={styles.characterName}>{vm.displayName}</Text>
          <View style={styles.levelBox}>
            <Text style={styles.levelText}>{vm.level}</Text>
          </View>
        </View>
        {/* Phase 73 — ASCEND strip mounts between the level box row
            and the XP chain when the player has unspent stat-allocation
            points. When pendingPoints === 0 the header is byte-identical
            to pre-Phase-73. */}
        {vm.pendingPoints > 0 && (
          <AscendStrip
            pendingPoints={vm.pendingPoints}
            level={vm.level}
            onOpen={onOpenLevelUp}
          />
        )}
        {/* Phase 73 follow-up (user-jot 2026-05-24): the
            LevelReadyStrip mounts when XP has crossed the threshold
            but levelUp() has not yet been dispatched. Mutually
            exclusive with the AscendStrip above — when both
            conditions hold, AscendStrip takes priority (spend
            before earning more). Tap dispatches actions.levelUp(),
            engine drains XP into pending stat points, AscendStrip
            replaces this strip next render. */}
        {vm.pendingPoints === 0 && vm.levelUpReady && (
          <LevelReadyStrip
            level={vm.level}
            onLevelUp={() => actions.levelUp()}
          />
        )}
        <View style={{ marginTop: 8 }}>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>XP CHAIN TO LVL {vm.level + 1}</Text>
            <Text style={styles.xpValue}>{vm.xp} / {vm.xpMax}</Text>
          </View>
          <XpChain value={vm.xp} max={vm.xpMax} />
        </View>
      </View>

      {/* Phase 73 — LevelUpModal overlays the SELF tab when the
          ASCEND strip is tapped. Non-tap-out-dismissible per the
          design (chat5 brief). Closes via COMMIT (allocates + closes)
          or "keep deliberating" / discard-confirm step. */}
      {levelUpOpen && (
        <LevelUpModal
          characterName={vm.displayName}
          fromLevel={vm.level}
          toLevel={vm.level + 1}
          totalPoints={vm.pendingPoints}
          current={(() => {
            const heart = vm.base.find((r) => r.stanceKey === 'heart')?.value ?? 0;
            const body = vm.base.find((r) => r.stanceKey === 'body')?.value ?? 0;
            const mind = vm.base.find((r) => r.stanceKey === 'mind')?.value ?? 0;
            return { heart, body, mind };
          })()}
          currentDerived={(() => {
            // Phase 88: Map derived stats to modal format
            const physical = vm.derived.find((r) => r.label === 'PHYSICAL');
            const mental = vm.derived.find((r) => r.label === 'MENTAL');
            const emotional = vm.derived.find((r) => r.label === 'EMOTIONAL');
            
            if (!physical || !mental || !emotional) return undefined;
            
            return {
              heart: { attack: emotional.attack, skill: emotional.skill, defense: emotional.defense },
              body: { attack: physical.attack, skill: physical.skill, defense: physical.defense },
              mind: { attack: mental.attack, skill: mental.skill, defense: mental.defense },
            };
          })()}
          onCommit={onCommitAllocation}
          onCancel={onCloseLevelUp}
        />
      )}

      {/* Base Stats */}
      <View style={styles.section} accessible accessibilityLabel={vm.a11y.baseStats}>
        <SectionLabel size={10}>✠ BASE</SectionLabel>
        <View style={styles.baseRow}>
          {vm.base.map((r) => (
            // Phase 74 follow-up walkthrough Tick 1: wrap the base
            // stat card in a TooltipTarget so a tap fires the
            // existing kind:'stat' content (Phase 74 Tick A
            // authored HEART/BODY/MIND). id is the uppercased
            // stance key, matching STAT_CONTENT's keys.
            <TooltipTarget
              key={r.stanceKey}
              kind="stat"
              id={r.stanceKey.toUpperCase()}
              accessibilityLabel={`Explain ${r.label} stat`}
              accessibilityHint="tap to read description"
              testID={`self-base-${r.stanceKey}`}
            >
              <View style={styles.baseCard}>
                <StanceGlyph kind={r.stanceKey} size={28} color={AXM.parchment} />
                <Text style={styles.baseStatLabel}>{r.label}</Text>
                <Text style={styles.baseStatValue}>{r.value}</Text>
              </View>
            </TooltipTarget>
          ))}
        </View>
      </View>

      {/* Pools — VITAE + MORALE (Problem 6 design) */}
      <View style={styles.section}>
        <SectionLabel size={10}>✠ POOLS</SectionLabel>
        <View style={styles.poolsCard}>
          {[
            { label: 'VITAE', value: player?.health ?? 0, max: player?.maxHealth ?? 1, color: AXM.blood, gloss: 'flesh holds' },
            { label: 'MORALE', value: 7, max: 10, color: AXM.sulfur, gloss: 'resolve to walk', isNew: true, breakAt: 2 },
          ].map((pool) => (
            <View key={pool.label} style={styles.poolRow}>
              <View style={styles.poolHeader}>
                <View style={styles.poolLabelRow}>
                  <Text style={[styles.poolLabel, { color: pool.color }]}>{pool.label}</Text>
                  {'isNew' in pool && pool.isNew && <Text style={styles.poolNewBadge}>NEW</Text>}
                  <Text style={styles.poolGloss}>· {pool.gloss}</Text>
                </View>
                <Text style={styles.poolValue}>{pool.value}<Text style={{ color: AXM.bone }}> / {pool.max}</Text></Text>
              </View>
              <View style={styles.poolTrack}>
                <View style={[styles.poolFill, { width: `${(pool.value / pool.max) * 100}%`, backgroundColor: pool.color }]} />
                {'breakAt' in pool && pool.breakAt != null && (
                  <View style={[styles.poolBreakTic, { left: `${(pool.breakAt / pool.max) * 100}%` }]} />
                )}
              </View>
            </View>
          ))}
        </View>
        <View style={styles.moraleLedger}>
          <SectionLabel size={9} color={AXM.sulfur}>MORALE · LEDGER</SectionLabel>
          <View style={styles.ledgerGrid}>
            {[
              { v: '+i', l: 'every victory', c: AXM.sulfur },
              { v: '+ii', l: 'good rest at inn', c: AXM.sulfur },
              { v: '+i', l: 'mercy granted', c: AXM.sulfur },
              { v: '−ii', l: 'flee combat', c: AXM.blood },
              { v: '−i', l: 'ally falls', c: AXM.blood },
              { v: '−i', l: 'no rest in iii nights', c: AXM.blood },
            ].map((r, i) => (
              <View key={i} style={styles.ledgerRow}>
                <Text style={[styles.ledgerValue, { color: r.c }]}>{r.v}</Text>
                <Text style={styles.ledgerDesc}>{r.l}</Text>
              </View>
            ))}
          </View>
          <View style={styles.ledgerDivider} />
          <Text style={styles.ledgerLore}>
            {"At "}
            <Text style={{ color: AXM.blood }}>ii or below</Text>
            {" the road begins to lie. Maps shift. Nodes whisper wrong names."}
          </Text>
        </View>
      </View>

      {/* Derived Stats */}
      <View style={styles.section} accessible accessibilityLabel={vm.a11y.derivedStats}>
        <SectionLabel size={10}>✠ DERIVED</SectionLabel>
        <View style={styles.derivedTable}>
          <View style={[styles.derivedRow, styles.derivedHeader]}>
            <Text style={[styles.derivedCell, styles.derivedRowLabel]} />
            <Text style={[styles.derivedCell, styles.derivedHeaderCell]}>ATK</Text>
            <Text style={[styles.derivedCell, styles.derivedHeaderCell]}>SKL</Text>
            <Text style={[styles.derivedCell, styles.derivedHeaderCell]}>DEF</Text>
          </View>
          {vm.derived.map((row) => (
            <View key={row.label} style={[styles.derivedRow, styles.derivedDataRow]}>
              <Text style={[styles.derivedCell, styles.derivedRowLabel]}>{row.label}</Text>
              <TooltipTarget kind="item-stat" id={row.attackId} accessibilityLabel={`Explain ${row.label} attack`} accessibilityHint="tap to read description" testID={`self-derived-${row.attackId}`}>
                <Text style={[styles.derivedCell, styles.derivedData]}>{row.attack}</Text>
              </TooltipTarget>
              <TooltipTarget kind="item-stat" id={row.skillId} accessibilityLabel={`Explain ${row.label} skill`} accessibilityHint="tap to read description" testID={`self-derived-${row.skillId}`}>
                <Text style={[styles.derivedCell, styles.derivedData]}>{row.skill}</Text>
              </TooltipTarget>
              <TooltipTarget kind="item-stat" id={row.defenseId} accessibilityLabel={`Explain ${row.label} defense`} accessibilityHint="tap to read description" testID={`self-derived-${row.defenseId}`}>
                <Text style={[styles.derivedCell, styles.derivedData]}>{row.defense}</Text>
              </TooltipTarget>
            </View>
          ))}
          <View style={styles.luckRow}>
            <Text style={styles.luckLabel}>LUCK · AVG OF THREE</Text>
            <Text style={styles.luckValue}>{vm.luck}</Text>
          </View>
        </View>
      </View>

      {/* Saves & Tests */}
      <View style={styles.section} accessible accessibilityLabel={vm.a11y.saves}>
        <SectionLabel size={10}>✠ SAVES &amp; TESTS</SectionLabel>
        <View style={styles.savesGrid}>
          {vm.saves.map((s) => (
            // Phase 74 follow-up walkthrough Tick 4: wrap each
            // save/test cell in a TooltipTarget pointing at the
            // new kind:'derived' content (6 ids for the
            // save/test x stance matrix). Closes the SELF
            // walkthrough row.
            <TooltipTarget
              key={s.id}
              kind="derived"
              id={s.id}
              accessibilityLabel={`Explain ${s.label}`}
              accessibilityHint="tap to read description"
              testID={`self-derived-${s.id}`}
            >
              <View style={styles.saveCell}>
                <Text style={styles.saveKey}>{s.label}</Text>
                <Text style={styles.saveVal}>{s.value}</Text>
              </View>
            </TooltipTarget>
          ))}
        </View>
      </View>

      {/* Philosophical Alignment (Phase 52, engine 0.10.0 Philosophy module) */}
      <View style={styles.section} accessible accessibilityLabel={vm.a11y.alignment}>
        <SectionLabel size={10}>✠ ALIGNMENT</SectionLabel>
        <Text style={styles.alignmentCellName}>{vm.alignment.cellName}</Text>
        <View style={styles.alignmentAxesRow}>
          {vm.alignment.axes.map((axis) => (
            // Phase 74 follow-up walkthrough Tick 2: wrap each
            // axis chip in a TooltipTarget pointing at the new
            // kind:'alignment' content (epistemology / outlook /
            // scope). Tap explains the axis dimension.
            <TooltipTarget
              key={axis.axisKey}
              kind="alignment"
              id={axis.axisKey}
              accessibilityLabel={`Explain ${axis.label.toLowerCase()} axis`}
              accessibilityHint="tap to read description"
              testID={`self-alignment-${axis.axisKey}`}
            >
              <View style={styles.alignmentAxisChip}>
                <Text style={styles.alignmentAxisLabel}>{axis.label}</Text>
                <Text style={styles.alignmentAxisBucket}>{axis.bucket}</Text>
              </View>
            </TooltipTarget>
          ))}
        </View>
      </View>

      {/* Afflictions & Blessings */}
      <View style={styles.section} accessible accessibilityLabel={vm.a11y.effects}>
        <SectionLabel size={10}>✠ AFFLICTIONS &amp; BLESSINGS</SectionLabel>
        <View style={styles.effectsList}>
          {vm.effects.length === 0 ? (
            <Text style={styles.emptyLabel}>{vm.emptyEffectsMessage}</Text>
          ) : (
            vm.effects.map((e) => (
              // Phase 74 follow-up walkthrough Tick 1: wrap the
              // affliction/blessing row in a TooltipTarget so a tap
              // fires the existing kind:'effect' content (Phase 75
              // authored — reads engine `Effect.payload` for the
              // stat-effect line + accent). id is the engine
              // effectId threaded through CharacterEffectRow.
              <TooltipTarget
                key={e.name}
                kind="effect"
                id={e.effectId}
                accessibilityLabel={`Effect ${e.name}`}
                accessibilityHint="tap to read description"
                testID={`self-effect-${e.effectId || e.name}`}
              >
                <View
                  style={[
                    styles.effectRow,
                    {
                      backgroundColor: e.tint === 'buff' ? AXM.buff : AXM.debuff,
                      borderColor: e.tint === 'buff' ? AXM.sulfur : AXM.blood,
                    },
                  ]}
                >
                  <EffectGlyph kind={e.kind} size={20} color={e.tint === 'buff' ? AXM.sulfur : AXM.blood} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.effectTopRow}>
                      <Text style={styles.effectName}>{e.name}</Text>
                      <Text style={styles.effectMeta}>
                        {e.duration === null ? '∞' : `${e.duration}r`} · ×{e.intensity}
                      </Text>
                    </View>
                    <Text style={styles.effectDesc}>{e.description}</Text>
                  </View>
                </View>
              </TooltipTarget>
            ))
          )}
        </View>
      </View>

      {/* Equipment */}
      <View style={styles.section} accessible accessibilityLabel={vm.a11y.equipment}>
        <SectionLabel size={10}>✠ WORN &amp; WIELDED</SectionLabel>
        <View style={styles.equipRow}>
          <BodyDiagram />
          <View style={styles.slotsGrid}>
            {vm.equipment.map((s) => (
              // Phase 74 follow-up walkthrough Tick 3: wrap each
              // slot cell in a TooltipTarget pointing at the new
              // kind:'slot' content (7 engine slot ids). Tap
              // explains the slot's gameplay role.
              <TooltipTarget
                key={s.slotKey}
                kind="slot"
                id={s.slotKey}
                accessibilityLabel={`Explain ${s.name} slot`}
                accessibilityHint="tap to read description"
                testID={`self-slot-${s.slotKey}`}
              >
                <View style={[styles.slotCell, s.item === null && styles.slotEmpty]}>
                  <Text style={styles.slotName}>{s.name.toUpperCase()}</Text>
                  <Text style={[styles.slotItem, s.item === null && { color: AXM.ash }]}>
                    {s.item ?? '—'}
                  </Text>
                </View>
              </TooltipTarget>
            ))}
          </View>
        </View>
      </View>

      {/* Skills */}
      {vm.skills.length > 0 && (
        <View style={styles.section}>
          <SectionLabel size={10}>✠ FALLACIES &amp; PARADOXES</SectionLabel>
          <View style={styles.skillsGrid}>
            {vm.skills.map((s) => (
              // Phase 74 follow-up walkthrough Tick 2: wrap each
              // skill card in a TooltipTarget pointing at the
              // existing kind:'skill' content (Phase 75 authored
              // — engine description + cost/stance footnote).
              // vm.skills is currently dead surface ([] in the
              // presenter); the wire-up is forward-looking.
              <TooltipTarget
                key={s.id || s.name}
                kind="skill"
                id={s.id}
                accessibilityLabel={`Explain ${s.name} skill`}
                accessibilityHint="tap to read description"
                testID={`self-skill-${s.id || s.name}`}
              >
                <View
                  style={[
                    styles.skillCard,
                    {
                      borderColor: s.category === 'paradox' ? AXM.sulfur : AXM.parchment,
                      borderStyle: s.category === 'paradox' ? 'solid' : 'dashed',
                    },
                  ]}
                >
                  <StanceGlyph kind={s.stanceKey} size={16} color={AXM.bone} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.skillName}>{s.name}</Text>
                    <Text style={[styles.skillCat, { color: s.category === 'paradox' ? AXM.sulfur : AXM.parchment }]}>
                      {s.category.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TooltipTarget>
            ))}
          </View>
        </View>
      )}
      <DevMenu>
        <AestheticDevToggle />
        <DebugSeedButton />
        <DebugPopulateAllItems />
        <DebugCombatButton />
        <DebugMapResetButton />
        <DebugChaosToggle />
        <DebugPresetPicker />
        <DebugXpGrant />
        <DebugManaControl />
        <DebugCurrencyControl />
        <DebugAlignmentShift />
        <DebugEffectApply />
        <DebugEventKindForce />
        <DebugDialogueJump />
        <DebugQuestState />
        <DebugFriendship />
        <DebugHudOverrides />
      </DevMenu>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  header: { padding: 14, paddingBottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  characterName: { fontFamily: FONTS.gothic, fontSize: 26, lineHeight: 28, color: AXM.parchment, marginTop: 2 },
  levelBox: { width: 50, height: 50, borderWidth: 2, borderColor: AXM.parchment, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  levelText: { fontFamily: FONTS.gothic, fontSize: 30, color: AXM.sulfur },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  xpLabel: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, letterSpacing: 1 },
  xpValue: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.sulfur },
  section: { padding: 10, paddingHorizontal: 14, paddingBottom: 0 },
  baseRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  baseCard: { flex: 1, padding: 8, paddingHorizontal: 6, backgroundColor: AXM.panelBg, borderWidth: 1, borderColor: AXM.ash, alignItems: 'center' },
  baseStatLabel: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 2, color: AXM.bone, marginTop: 2 },
  baseStatValue: { fontFamily: FONTS.gothic, fontSize: 28, color: AXM.sulfur, lineHeight: 32 },
  derivedTable: { marginTop: 4, backgroundColor: AXM.panelBg, borderWidth: 1, borderColor: AXM.ash, padding: 6, paddingHorizontal: 8 },
  derivedRow: { flexDirection: 'row' },
  derivedHeader: { borderBottomWidth: 1, borderBottomColor: AXM.ash, borderStyle: 'dashed', paddingBottom: 3, marginBottom: 0 },
  derivedDataRow: { borderBottomWidth: 1, borderBottomColor: '#1a1814', paddingVertical: 3 },
  derivedCell: { flex: 1 },
  derivedRowLabel: { fontFamily: FONTS.sans, fontSize: 11, color: AXM.parchment, letterSpacing: 1.5, flex: 1.2 },
  derivedHeaderCell: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, textAlign: 'right', letterSpacing: 1 },
  derivedData: { fontFamily: FONTS.gothic, fontSize: 14, color: AXM.parchment, textAlign: 'right' },
  luckRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  luckLabel: { fontFamily: FONTS.sans, fontSize: 11, color: AXM.bone, letterSpacing: 1.5 },
  luckValue: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.sulfur },
  savesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  saveCell: { width: '31%', borderWidth: 1, borderColor: AXM.ash, borderStyle: 'dashed', padding: 3, paddingHorizontal: 5, flexDirection: 'row', justifyContent: 'space-between' },
  saveKey: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
  saveVal: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.parchment },
  alignmentCellName: { fontFamily: FONTS.gothic, fontSize: 14, color: AXM.parchment, letterSpacing: 1, marginTop: 4 },
  alignmentAxesRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  alignmentAxisChip: { flex: 1, borderWidth: 1, borderColor: AXM.ash, borderStyle: 'dashed', paddingVertical: 3, paddingHorizontal: 5 },
  alignmentAxisLabel: { fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1, color: AXM.bone },
  alignmentAxisBucket: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.parchment, marginTop: 1 },
  effectsList: { marginTop: 4, gap: 4 },
  emptyLabel: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.ash, letterSpacing: 1, textTransform: 'uppercase' },
  effectRow: { flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1, padding: 5, paddingHorizontal: 7 },
  effectTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  effectName: { fontFamily: FONTS.gothic, fontSize: 13, color: AXM.parchment, letterSpacing: 1 },
  effectMeta: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
  effectDesc: { fontFamily: FONTS.serif, fontSize: 10, color: AXM.bone, lineHeight: 13, marginTop: 1 },
  equipRow: { flexDirection: 'row', gap: 10, marginTop: 6, alignItems: 'flex-start' },
  slotsGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  slotCell: { width: '48%', borderWidth: 1, borderColor: AXM.ash, padding: 3, paddingHorizontal: 5, minHeight: 32, backgroundColor: AXM.panelBg },
  slotEmpty: { backgroundColor: 'transparent', borderStyle: 'dashed' },
  slotName: { fontFamily: FONTS.sans, fontSize: 8, letterSpacing: 1.5, color: AXM.bone },
  slotItem: { fontFamily: FONTS.serif, fontSize: 11, color: AXM.parchment, lineHeight: 14 },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  skillCard: { width: '48%', borderWidth: 2, padding: 4, paddingHorizontal: 6, backgroundColor: AXM.bg, flexDirection: 'row', alignItems: 'center', gap: 6 },
  skillName: { fontFamily: FONTS.gothic, fontSize: 12, color: AXM.parchment, lineHeight: 14 },
  skillCat: { fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1 },
  poolsCard: { marginTop: 4, backgroundColor: AXM.panelBg, borderWidth: 1, borderColor: AXM.ash, padding: 10, paddingHorizontal: 12, gap: 6 },
  poolRow: {},
  poolHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
  poolLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  poolLabel: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1.6 },
  poolNewBadge: { fontFamily: FONTS.mono, fontSize: 7, color: AXM.bg, backgroundColor: AXM.sulfur, paddingHorizontal: 4, letterSpacing: 1, overflow: 'hidden' },
  poolGloss: { fontFamily: FONTS.serifItalic, fontSize: 10, color: AXM.bone },
  poolValue: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.parchment },
  poolTrack: { position: 'relative' as const, height: 8, backgroundColor: '#000', borderWidth: 1, borderColor: AXM.ash },
  poolFill: { position: 'absolute' as const, top: 1, bottom: 1, left: 1 },
  poolBreakTic: { position: 'absolute' as const, top: -2, bottom: -2, width: 1, backgroundColor: AXM.blood },
  moraleLedger: { marginTop: 8, backgroundColor: AXM.deepBg, borderWidth: 1, borderColor: AXM.ash, padding: 10, paddingHorizontal: 12 },
  ledgerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  ledgerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, width: '48%' },
  ledgerValue: { fontFamily: FONTS.mono, fontSize: 12, width: 22, textAlign: 'right' },
  ledgerDesc: { fontFamily: FONTS.serif, fontSize: 11, color: AXM.parchment },
  ledgerDivider: { height: 1, borderTopWidth: 1, borderTopColor: AXM.ash, borderStyle: 'dashed', marginTop: 8, marginBottom: 6 },
  ledgerLore: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.bone, lineHeight: 14 },
});

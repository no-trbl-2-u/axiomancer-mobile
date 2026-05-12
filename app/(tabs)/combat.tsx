import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Ellipse, G, Defs, RadialGradient, Stop, Line } from 'react-native-svg';
import { FRIENDSHIP_COUNTER_MAX } from 'axiomancer-mechanics';
import { AXM, FONTS } from '@/theme/axm';
import { useCombatMode } from '@/state/combat-mode';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { StatBar } from '@/components/StatBar';
import { StanceGlyph } from '@/components/StanceGlyph';
import { EffectChip } from '@/components/EffectChip';
import { FriendshipMeter } from '@/components/FriendshipMeter';
import { MindMark } from '@/components/MindMark';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { ActionIcon } from '@/components/ActionIcon';
import { Splatter } from '@/components/Splatter';

type CombatPhase = 'choosing_stance' | 'choosing_action' | 'choosing_skill' | 'resolving';
type Stance = 'heart' | 'body' | 'mind';

const PHASES: CombatPhase[] = ['choosing_stance', 'choosing_action', 'choosing_skill', 'resolving'];

const STANCE_DATA: Record<Stance, { name: string; counters: string; weakTo: string; derived: Record<string, number> }> = {
  heart: { name: 'HEART', counters: 'BODY', weakTo: 'MIND', derived: { Attack: 11, Skill: 9, Defense: 6 } },
  body:  { name: 'BODY',  counters: 'MIND', weakTo: 'HEART', derived: { Attack: 13, Skill: 7, Defense: 10 } },
  mind:  { name: 'MIND',  counters: 'HEART', weakTo: 'BODY', derived: { Attack: 8, Skill: 14, Defense: 8 } },
};

const SKILLS = [
  { name: 'AD HOMINEM',     cat: 'fallacy', stance: 'heart' as Stance, cost: 3, desc: 'Strike the speaker. +2 dmg if foe wounded.' },
  { name: 'CIRCULAR LOGIC', cat: 'fallacy', stance: 'mind'  as Stance, cost: 4, desc: 'Foe loses next action. Costs 1 HP.' },
  { name: 'OF THESEUS',     cat: 'paradox', stance: 'mind'  as Stance, cost: 5, desc: 'Replace foe limb. Disarm 2 rounds.' },
  { name: 'STRAW MAN',      cat: 'fallacy', stance: 'body'  as Stance, cost: 2, desc: 'Conjure decoy. Absorb next blow.' },
  { name: "ZENO'S BLADE",   cat: 'paradox', stance: 'body'  as Stance, cost: 6, desc: 'Halve distance forever. Pierce.' },
  { name: 'SORITES HEAP',   cat: 'paradox', stance: 'heart' as Stance, cost: 4, desc: 'Wear foe down. +1 stack each round.' },
];

const BEATS: Record<Stance, Stance> = { heart: 'body', body: 'mind', mind: 'heart' };

const PHASE_LABELS: Record<CombatPhase, string> = {
  choosing_stance: '✠ CHOOSE THY STANCE',
  choosing_action: '✠ DECLARE THY ACTION',
  choosing_skill:  '✠ INVOKE A SKILL',
  resolving:       '✠ FATE SETTLES',
};

const LOG_LINES: Record<CombatPhase, string[]> = {
  choosing_stance: ['The Hierophant turns its head. Bone clicks.', 'YOU smell wet wood and milk gone wrong.'],
  choosing_action: ['You set your stance. The censer swings.', 'POISON seeps. –2 HP.'],
  choosing_skill:  ['Mana coils between your teeth.', 'Choose a fallacy or a paradox.'],
  resolving:       ['Your blade bites the hood. ROLL 18 vs 14.', 'CRIT — DOUBLE — 14 dmg. Bleed applied.'],
};

const PLAYER_MANA_PLACEHOLDER = { mana: 9, manaMax: 14 } as const;

export default function CombatScreen() {
  const [phase, setPhase] = useState<CombatPhase>('choosing_stance');
  const [selectedStance, setSelectedStance] = useState<Stance>('heart');
  const router = useRouter();
  const { exitCombat } = useCombatMode();

  const combat = useGameState((s) => s.combat);
  const enemyEntity = useGameState((s) => s.combat?.enemy ?? null);
  const playerEntity = useGameState((s) => s.combat?.player ?? null);
  const friendshipCounter = useGameState((s) => s.combat?.friendshipCounter ?? 0);
  const enemyStance = useGameState((s) => s.combat?.enemyChoice?.stance ?? null);
  const { startCombat, endCombat } = useGameActions();

  // Bootstrap a placeholder encounter until Spec 07/10 wires real navigation.
  useEffect(() => {
    if (combat === null) startCombat(createMockEncounterEnemy());
  }, [combat, startCombat]);

  const leaveCombat = () => {
    endCombat();
    exitCombat();
    router.replace('/exploration' as any);
  };

  if (combat === null || enemyEntity === null || playerEntity === null) {
    // First render before useEffect runs the bootstrap; render nothing rather
    // than the old literal fixture.
    return <ScreenBg><View /></ScreenBg>;
  }

  const enemyLastStance: Stance = (enemyStance ?? 'mind') as Stance;
  const enemy = {
    name: String(enemyEntity.name).toUpperCase(),
    tier: String(enemyEntity.difficulty ?? 'elite'),
    hp: enemyEntity.health as number,
    hpMax: enemyEntity.maxHealth as number,
    friendship: friendshipCounter,
    friendshipMax: FRIENDSHIP_COUNTER_MAX,
    mindMarks: 0,
    lastStance: enemyLastStance,
    effects: (enemyEntity.effects ?? []) as Array<{ kind: string; name: string; duration?: number; intensity?: number; tint?: string }>,
  };

  const player = {
    hp: playerEntity.health as number,
    hpMax: playerEntity.maxHealth as number,
    mana: PLAYER_MANA_PLACEHOLDER.mana,
    manaMax: PLAYER_MANA_PLACEHOLDER.manaMax,
    effects: (playerEntity.effects ?? []) as Array<{ kind: string; name: string; duration?: number; intensity?: number; tint?: string }>,
  };

  const advantage = BEATS[selectedStance] === enemy.lastStance ? 'ADV'
    : BEATS[enemy.lastStance] === selectedStance ? 'DIS' : '—';

  const phaseIndex = PHASES.indexOf(phase);

  return (
    <ScreenBg>
      {/* Enemy Panel */}
      <View style={styles.enemyPanel}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#100d0a' }]} />
        <Splatter color={AXM.blood} size={120} seed={17} style={{ position: 'absolute', top: -10, left: -10, opacity: 0.6 }} />

        {/* Enemy SVG silhouette */}
        <Svg viewBox="0 0 200 200" width={180} height={200} style={styles.enemySvg}>
          <Defs>
            <RadialGradient id="eg" cx="50%" cy="40%">
              <Stop offset="0%" stopColor={AXM.blood} stopOpacity={0.4} />
              <Stop offset="100%" stopColor={AXM.blood} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={100} cy={100} rx={90} ry={80} fill="url(#eg)" />
          <Path d="M100 30 C 60 30 40 70 50 130 L 30 200 L 170 200 L 150 130 C 160 70 140 30 100 30 Z"
            fill="#06050a" stroke={AXM.parchment} strokeWidth={1.5} />
          <Path d="M70 70 Q 100 50 130 70 L 130 110 Q 100 130 70 110 Z" fill="#000" />
          <Circle cx={85} cy={90} r={3.5} fill={AXM.blood} />
          <Circle cx={115} cy={90} r={3.5} fill={AXM.blood} />
          <Circle cx={85} cy={90} r={1.2} fill={AXM.sulfur} />
          <Circle cx={115} cy={90} r={1.2} fill={AXM.sulfur} />
          <Path d="M82 110 L 88 112 L 92 109 L 98 113 L 104 109 L 110 113 L 116 110 L 120 113"
            stroke={AXM.parchment} strokeWidth={1.2} fill="none" />
        </Svg>

        {/* Enemy info */}
        <View style={styles.enemyInfo}>
          <View style={styles.enemyTopRow}>
            <DifficultyBadge tier={enemy.tier} />
            <Text style={styles.roundText}>iv vs i</Text>
          </View>
          <Text style={styles.enemyName}>{enemy.name}</Text>
          <Text style={styles.enemyFlavor}>"…sings to the worms below."</Text>
          <View style={{ marginTop: 8 }}>
            <StatBar value={enemy.hp} max={enemy.hpMax} color={AXM.blood} label="VITALS" height={10} />
          </View>
          <View style={styles.enemyMetaRow}>
            <FriendshipMeter value={enemy.friendship} max={enemy.friendshipMax} />
            <MindMark stacks={enemy.mindMarks} />
          </View>
          <View style={styles.effectsRow}>
            {enemy.effects.map((e, i) => <EffectChip key={i} effect={e} />)}
          </View>
          <View style={styles.lastStanceRow}>
            <SectionLabel size={9}>LAST STANCE →</SectionLabel>
            <View style={styles.lastStanceBadge}>
              <StanceGlyph kind={enemy.lastStance} size={12} color={AXM.sulfur} />
              <Text style={styles.lastStanceText}>MIND</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Battle Log */}
      <View style={styles.logWrap}>
        <View style={styles.logBox}>
          <SectionLabel size={8} color={AXM.bone}>⚜ BATTLE LOG · ROUND IV</SectionLabel>
          {LOG_LINES[phase].map((l, i) => (
            <Text key={i} style={[styles.logLine, { color: i === 0 ? AXM.parchment : AXM.blood }]}>{l}</Text>
          ))}
        </View>
      </View>

      {/* Player Status */}
      <View style={styles.playerWrap}>
        <View style={styles.playerBar}>
          <View style={styles.playerBarItem}>
            <StatBar value={player.hp} max={player.hpMax} color={AXM.blood} label="HP" height={8} />
          </View>
          <View style={styles.playerBarItem}>
            <StatBar value={player.mana} max={player.manaMax} color={AXM.sulfur} label="MP" height={8} />
          </View>
          <View style={styles.playerEffects}>
            {player.effects.map((e, i) => <EffectChip key={i} effect={e} />)}
          </View>
        </View>
      </View>

      {/* Phase Bottom Section */}
      <View style={styles.phaseSection}>
        {/* Phase Header */}
        <View style={styles.phaseHeader}>
          <View style={styles.phaseHeaderLeft}>
            <View style={styles.phaseIndexBox}>
              <Text style={styles.phaseIndex}>{phaseIndex + 1}</Text>
            </View>
            <SectionLabel size={11} style={{ color: AXM.parchment }}>{PHASE_LABELS[phase]}</SectionLabel>
          </View>
          <View style={styles.phasePips}>
            {PHASES.map((_, i) => (
              <View key={i} style={[styles.pip, phaseIndex >= i ? styles.pipActive : styles.pipInactive]} />
            ))}
          </View>
        </View>

        {phase === 'choosing_stance' && (
          <StancePhase
            enemy={enemy}
            selected={selectedStance}
            onPick={(s) => { setSelectedStance(s); setPhase('choosing_action'); }}
          />
        )}
        {phase === 'choosing_action' && (
          <ActionPhase
            onSkill={() => setPhase('choosing_skill')}
            onAttack={() => setPhase('resolving')}
            onFlee={leaveCombat}
          />
        )}
        {phase === 'choosing_skill' && (
          <SkillPhase mana={player.mana} stance={selectedStance} onPick={() => setPhase('resolving')} />
        )}
        {phase === 'resolving' && (
          <ResolvePhase
            advantage={advantage}
            stance={selectedStance}
            enemyStance={enemy.lastStance}
            outcome={selectedStance === 'heart' ? 'friendship' : 'damage'}
            onContinue={() => setPhase('choosing_stance')}
          />
        )}
      </View>
    </ScreenBg>
  );
}

function StancePhase({ enemy, selected, onPick }: {
  enemy: { lastStance: Stance };
  selected: Stance;
  onPick: (s: Stance) => void;
}) {
  const stances: Stance[] = ['heart', 'body', 'mind'];
  return (
    <View style={stance_styles.row}>
      {stances.map(k => {
        const d = STANCE_DATA[k];
        const isAdv = BEATS[k] === enemy.lastStance;
        const isDis = BEATS[enemy.lastStance] === k;
        const isSel = selected === k;
        const accent = isAdv ? AXM.sulfur : isDis ? AXM.blood : AXM.parchment;
        return (
          <TouchableOpacity key={k} onPress={() => onPick(k)} style={stance_styles.cardTouch}>
            <View style={[stance_styles.card, { borderColor: isSel ? AXM.sulfur : accent, backgroundColor: isSel ? '#1a1410' : '#0a0a0a' }]}>
              {(isAdv || isDis) && (
                <View style={[stance_styles.advBadge, { borderColor: isAdv ? AXM.sulfur : AXM.blood }]}>
                  <Text style={[stance_styles.advText, { color: isAdv ? AXM.sulfur : AXM.blood }]}>
                    {isAdv ? 'ADV' : 'DIS'}
                  </Text>
                </View>
              )}
              <View style={stance_styles.glyphWrap}>
                <StanceGlyph kind={k} size={48} color={accent} />
              </View>
              <Text style={[stance_styles.stanceName, { color: accent }]}>{d.name}</Text>
              <Text style={stance_styles.stanceMeta}>BEATS {d.counters} · WEAK {d.weakTo}</Text>
              <View style={stance_styles.divider} />
              {Object.entries(d.derived).map(([key, val]) => (
                <View key={key} style={stance_styles.statRow}>
                  <Text style={stance_styles.statKey}>{key.toUpperCase()}</Text>
                  <Text style={[stance_styles.statVal, { color: accent }]}>{val}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ActionPhase({ onSkill, onAttack, onFlee }: { onSkill: () => void; onAttack: () => void; onFlee: () => void }) {
  const actions = [
    { key: 'attack', label: 'ATTACK',  icon: 'sword',  hint: 'DEAL DAMAGE BY STANCE', accent: AXM.blood, onPress: onAttack },
    { key: 'defend', label: 'DEFEND',  icon: 'shield', hint: 'REDUCE NEXT HARM',       accent: AXM.parchment, onPress: null },
    { key: 'skill',  label: 'SKILL',   icon: 'arcane', hint: 'SPEND MANA · INVOKE',    accent: AXM.sulfur, onPress: onSkill },
    { key: 'item',   label: 'ITEM',    icon: 'bag',    hint: 'USE A CONSUMABLE',        accent: AXM.rust, onPress: null },
  ];
  return (
    <View>
      <View style={action_styles.grid}>
        {actions.map(a => (
          <TouchableOpacity key={a.key} onPress={a.onPress || undefined} style={action_styles.cardTouch}>
            <View style={[action_styles.card, { borderColor: a.accent }]}>
              <ActionIcon kind={a.icon} size={32} color={a.accent} />
              <View style={action_styles.textCol}>
                <Text style={action_styles.label}>{a.label}</Text>
                <Text style={action_styles.hint}>{a.hint}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={onFlee} style={action_styles.fleeRow} accessibilityRole="button" accessibilityLabel="Flee combat">
        <Text style={action_styles.flee}>or … flee like a craven (luck save)</Text>
      </TouchableOpacity>
    </View>
  );
}

function SkillPhase({ mana, stance, onPick }: { mana: number; stance: Stance; onPick: () => void }) {
  const available = SKILLS.filter(s => s.stance === stance && s.cost <= mana).length;
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={skill_styles.scroll}>
        {SKILLS.map((s, i) => {
          const valid = s.cost <= mana && s.stance === stance;
          return (
            <TouchableOpacity key={s.name} onPress={valid ? onPick : undefined} style={[skill_styles.cardTouch, !valid && { opacity: 0.45 }]}>
              <View style={[skill_styles.card, { borderColor: s.cat === 'paradox' ? AXM.sulfur : AXM.parchment, borderStyle: s.cat === 'paradox' ? 'solid' : 'dashed' }]}>
                <View style={skill_styles.cardTop}>
                  <View style={[skill_styles.catBadge, s.cat === 'paradox' ? { backgroundColor: AXM.sulfur } : { borderWidth: 1, borderColor: AXM.parchment }]}>
                    <Text style={[skill_styles.catText, { color: s.cat === 'paradox' ? '#0a0a0a' : AXM.parchment }]}>{s.cat.toUpperCase()}</Text>
                  </View>
                  <StanceGlyph kind={s.stance} size={14} color={AXM.bone} />
                </View>
                <Text style={skill_styles.skillName}>{s.name}</Text>
                <Text style={skill_styles.skillDesc}>{s.desc}</Text>
                <View style={skill_styles.costRow}>
                  <Text style={skill_styles.costLabel}>cost</Text>
                  <Text style={[skill_styles.costValue, { color: s.cost > mana ? AXM.blood : AXM.sulfur }]}>{s.cost} MP</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text style={skill_styles.availHint}>{available} of {SKILLS.length} available — STANCE LOCKED</Text>
    </View>
  );
}

function ResolvePhase({ advantage, stance, enemyStance, outcome, onContinue }: {
  advantage: string;
  stance: Stance;
  enemyStance: Stance;
  outcome: 'damage' | 'friendship';
  onContinue: () => void;
}) {
  const advColor = advantage === 'ADV' ? AXM.sulfur : advantage === 'DIS' ? AXM.blood : AXM.parchment;
  const advLabel = advantage === 'ADV' ? 'ADVANTAGE' : advantage === 'DIS' ? 'DISADVANTAGE' : 'NEUTRAL';
  const isFriend = outcome === 'friendship';
  const isCrit = advantage === 'ADV';
  return (
    <View>
      <View style={resolve_styles.vs}>
        <View style={resolve_styles.vsPlayer}>
          <SectionLabel size={8}>YOU</SectionLabel>
          <StanceGlyph kind={stance} size={36} color={advColor} />
        </View>
        <View style={resolve_styles.vsCenter}>
          <Text style={[resolve_styles.advLabel, { color: advColor }]}>{advLabel}</Text>
          <View style={resolve_styles.rollRow}>
            <Text style={resolve_styles.rollText}>YOU <Text style={resolve_styles.rollVal}>18</Text></Text>
            <Text style={resolve_styles.vsText}>vs</Text>
            <Text style={resolve_styles.rollText}>FOE <Text style={resolve_styles.rollVal}>14</Text></Text>
          </View>
        </View>
        <View style={resolve_styles.vsFoe}>
          <SectionLabel size={8}>FOE</SectionLabel>
          <StanceGlyph kind={enemyStance} size={36} color={AXM.bone} />
        </View>
      </View>

      <View style={[resolve_styles.outcome, { borderColor: isFriend ? AXM.rust : AXM.blood, backgroundColor: isFriend ? '#1a0d05' : '#1a0a0a' }]}>
        {isFriend
          ? <Splatter color={AXM.rust} size={180} seed={5} style={{ position: 'absolute', top: -30, right: -30, opacity: 0.5 }} />
          : <Splatter color={AXM.blood} size={180} seed={5} style={{ position: 'absolute', top: -30, right: -30, opacity: 0.5 }} />
        }
        <SectionLabel size={9} style={{ position: 'relative' }}>
          {isFriend ? '❦ PARLEY · HEART OPENS' : isCrit ? '✶ CRIT · DOUBLE' : 'STRIKE LANDS'}
        </SectionLabel>
        <Text style={[resolve_styles.damage, isFriend ? { fontSize: 36 } : {}, {
          textShadowColor: isFriend ? AXM.rust : AXM.blood,
          textShadowOffset: { width: 3, height: 3 },
          textShadowRadius: 0,
        }]}>{isFriend ? 'FRIEND +1' : '–14'}</Text>
        <Text style={resolve_styles.outcomeText}>
          {isFriend
            ? 'FRIENDSHIP 3/5  ·  AT 5: endCombatWithFriendship()'
            : 'BLEED · 2 ROUNDS APPLIED  ·  HIEROPHANT WOUNDED'}
        </Text>
      </View>

      <TouchableOpacity onPress={onContinue} style={resolve_styles.nextBtn}>
        <Text style={resolve_styles.nextText}>✠ NEXT ROUND</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  enemyPanel: { position: 'relative', padding: 6, paddingHorizontal: 10, height: 200, overflow: 'hidden' },
  enemySvg: { position: 'absolute', right: -10, bottom: -8, opacity: 0.95 },
  enemyInfo: { position: 'absolute', top: 10, left: 12, right: 110 },
  enemyTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  roundText: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
  enemyName: { fontFamily: FONTS.gothic, fontSize: 22, lineHeight: 24, color: AXM.parchment, marginTop: 4, textShadowColor: AXM.blood, textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0 },
  enemyFlavor: { fontFamily: FONTS.serifItalic, fontSize: 10, color: AXM.bone, marginTop: 2 },
  enemyMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  effectsRow: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  lastStanceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  lastStanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 1, paddingHorizontal: 4, backgroundColor: '#000', borderWidth: 1, borderColor: AXM.sulfur },
  lastStanceText: { fontFamily: FONTS.sans, fontSize: 10, color: AXM.sulfur, letterSpacing: 1.5 },
  logWrap: { padding: 6, paddingHorizontal: 10, paddingBottom: 0 },
  logBox: { backgroundColor: '#06050a', borderWidth: 1, borderColor: AXM.ash, borderStyle: 'dashed', padding: 5, paddingHorizontal: 8, height: 52, overflow: 'hidden' },
  logLine: { fontFamily: FONTS.serif, fontSize: 11, lineHeight: 14, marginTop: 1 },
  playerWrap: { padding: 4, paddingHorizontal: 10, paddingBottom: 0 },
  playerBar: { backgroundColor: '#100d0a', padding: 5, paddingHorizontal: 8, borderWidth: 1, borderColor: AXM.ash, flexDirection: 'row', gap: 8, alignItems: 'center' },
  playerBarItem: { flex: 1 },
  playerEffects: { flexDirection: 'row', gap: 3 },
  phaseSection: { padding: 8, paddingHorizontal: 10, paddingBottom: 14 },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  phaseHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phaseIndexBox: { width: 18, height: 18, backgroundColor: AXM.sulfur, alignItems: 'center', justifyContent: 'center' },
  phaseIndex: { fontFamily: FONTS.gothic, fontSize: 14, color: '#0a0a0a' },
  phasePips: { flexDirection: 'row', gap: 3 },
  pip: { width: 14, height: 4 },
  pipActive: { backgroundColor: AXM.sulfur },
  pipInactive: { backgroundColor: AXM.ash },
});

const stance_styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  cardTouch: { flex: 1 },
  card: { borderWidth: 2, padding: 8, paddingHorizontal: 6, minHeight: 178 },
  advBadge: { position: 'absolute', top: 4, right: 4, borderWidth: 1, paddingHorizontal: 3, paddingVertical: 1, backgroundColor: '#0a0a0a', zIndex: 1 },
  advText: { fontFamily: FONTS.sans, fontSize: 8, letterSpacing: 1 },
  glyphWrap: { alignItems: 'center', marginTop: 4, marginBottom: 2 },
  stanceName: { textAlign: 'center', fontFamily: FONTS.gothic, fontSize: 17, letterSpacing: 1 },
  stanceMeta: { textAlign: 'center', fontFamily: FONTS.mono, fontSize: 7, color: AXM.bone, letterSpacing: 0.5, marginBottom: 4 },
  divider: { borderTopWidth: 1, borderTopColor: AXM.ash, marginBottom: 3 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', lineHeight: 14 },
  statKey: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
  statVal: { fontFamily: FONTS.gothic, fontSize: 12 },
});

const action_styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cardTouch: { width: '48%' },
  card: { backgroundColor: '#0a0a0a', borderWidth: 2, padding: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64 },
  textCol: { flex: 1 },
  label: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.parchment, lineHeight: 20, letterSpacing: 1 },
  hint: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1, marginTop: 2 },
  fleeRow: { alignItems: 'center', marginTop: 8 },
  flee: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.bone, borderBottomWidth: 1, borderBottomColor: AXM.bone, paddingBottom: 1 },
});

const skill_styles = StyleSheet.create({
  scroll: { gap: 6, paddingVertical: 2 },
  cardTouch: { width: 130 },
  card: { backgroundColor: '#0a0a0a', borderWidth: 2, padding: 7, minHeight: 138 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: { paddingVertical: 1, paddingHorizontal: 4 },
  catText: { fontFamily: FONTS.sans, fontSize: 8, letterSpacing: 1.5 },
  skillName: { fontFamily: FONTS.gothic, fontSize: 14, lineHeight: 16, color: AXM.parchment, marginTop: 6 },
  skillDesc: { fontFamily: FONTS.serif, fontSize: 10, color: AXM.bone, marginTop: 4, flex: 1, lineHeight: 13 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: AXM.ash },
  costLabel: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
  costValue: { fontFamily: FONTS.gothic, fontSize: 16 },
  availHint: { textAlign: 'center', marginTop: 6, fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, letterSpacing: 1 },
});

const resolve_styles = StyleSheet.create({
  vs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: AXM.ash, padding: 6, paddingHorizontal: 8 },
  vsPlayer: { alignItems: 'center' },
  vsFoe: { alignItems: 'center' },
  vsCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  advLabel: { fontFamily: FONTS.gothic, fontSize: 22, letterSpacing: 2 },
  rollRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 1 },
  rollText: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, letterSpacing: 1 },
  rollVal: { fontFamily: FONTS.gothic, fontSize: 14, color: AXM.parchment },
  vsText: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.ash },
  outcome: { position: 'relative', marginTop: 6, padding: 14, paddingHorizontal: 12, paddingBottom: 12, borderWidth: 2, textAlign: 'center', overflow: 'hidden', alignItems: 'center' },
  damage: { fontFamily: FONTS.gothic, fontSize: 64, lineHeight: 68, color: AXM.parchment, position: 'relative' },
  outcomeText: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.parchment, letterSpacing: 1, position: 'relative', textAlign: 'center' },
  nextBtn: { width: '100%', marginTop: 8, padding: 10, paddingHorizontal: 12, backgroundColor: '#0a0a0a', borderWidth: 2, borderColor: AXM.parchment, alignItems: 'center' },
  nextText: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 2, color: AXM.parchment },
});

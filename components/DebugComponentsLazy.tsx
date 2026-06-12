/**
 * Lazy-loaded debug components container for bundle size optimization.
 * All debug components are loaded asynchronously only when the DevMenu 
 * is expanded in __DEV__ builds, reducing the initial bundle size 
 * in production builds.
 * 
 * This container wraps all debug components with React.lazy() to enable
 * code splitting. In production builds where __DEV__ is false, these
 * components are never imported, saving bundle size.
 */

import React, { Suspense, lazy } from 'react';
import { Text, View } from 'react-native';
import { AXM, FONTS } from '@/theme/axm';
import { isDevToolsEnabled } from '@/lib/buildProfile';

// Lazy load debug components to reduce bundle size
const DebugChaosToggle = lazy(() => import('@/components/DebugChaosToggle').then(m => ({ default: m.DebugChaosToggle })));
const DebugCombatButton = lazy(() => import('@/components/DebugCombatButton').then(m => ({ default: m.DebugCombatButton })));
const DebugHazardButton = lazy(() => import('@/components/DebugHazardButton').then(m => ({ default: m.DebugHazardButton })));
const DebugHazardDeckRandomize = lazy(() => import('@/components/DebugHazardDeckRandomize').then(m => ({ default: m.DebugHazardDeckRandomize })));
const DebugGatheringButton = lazy(() => import('@/components/DebugGatheringButton').then(m => ({ default: m.DebugGatheringButton })));
const DebugAlignmentShift = lazy(() => import('@/components/DebugAlignmentShift').then(m => ({ default: m.DebugAlignmentShift })));
const DebugCurrencyControl = lazy(() => import('@/components/DebugCurrencyControl').then(m => ({ default: m.DebugCurrencyControl })));
const DebugDialogueJump = lazy(() => import('@/components/DebugDialogueJump').then(m => ({ default: m.DebugDialogueJump })));
const DebugEffectApply = lazy(() => import('@/components/DebugEffectApply').then(m => ({ default: m.DebugEffectApply })));
const DebugQuestState = lazy(() => import('@/components/DebugQuestState').then(m => ({ default: m.DebugQuestState })));
const DebugEventKindForce = lazy(() => import('@/components/DebugEventKindForce').then(m => ({ default: m.DebugEventKindForce })));
const DebugTriggerEncounter = lazy(() => import('@/components/DebugTriggerEncounter').then(m => ({ default: m.DebugTriggerEncounter })));
const DebugFriendship = lazy(() => import('@/components/DebugFriendship').then(m => ({ default: m.DebugFriendship })));
const DebugHudOverrides = lazy(() => import('@/components/DebugHudOverrides').then(m => ({ default: m.DebugHudOverrides })));
const DebugManaControl = lazy(() => import('@/components/DebugManaControl').then(m => ({ default: m.DebugManaControl })));
const DebugMapResetButton = lazy(() => import('@/components/DebugMapResetButton').then(m => ({ default: m.DebugMapResetButton })));
const DebugPlaythroughPresets = lazy(() => import('@/components/DebugPlaythroughPresets').then(m => ({ default: m.DebugPlaythroughPresets })));
const DebugPresetPicker = lazy(() => import('@/components/DebugPresetPicker').then(m => ({ default: m.DebugPresetPicker })));
const DebugPopulateAllItems = lazy(() => import('@/components/DebugPopulateAllItems').then(m => ({ default: m.DebugPopulateAllItems })));
const DebugSeedButton = lazy(() => import('@/components/DebugSeedButton').then(m => ({ default: m.DebugSeedButton })));
const DebugXpGrant = lazy(() => import('@/components/DebugXpGrant').then(m => ({ default: m.DebugXpGrant })));
const AestheticDevToggle = lazy(() => import('@/components/AestheticDevToggle').then(m => ({ default: m.AestheticDevToggle })));

function LoadingFallback() {
  return (
    <View style={{ padding: 8 }}>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone }}>
        Loading debug tools...
      </Text>
    </View>
  );
}

/**
 * Container for all debug components with lazy loading.
 * Only loads debug components when expanded in dev mode.
 */
export function DebugComponentsLazy() {
  if (!isDevToolsEnabled()) return null;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AestheticDevToggle />
      <DebugSeedButton />
      <DebugPopulateAllItems />
      <DebugTriggerEncounter />
      <DebugCombatButton />
      <DebugHazardButton />
      <DebugHazardDeckRandomize />
      <DebugGatheringButton />
      <DebugMapResetButton />
      <DebugChaosToggle />
      <DebugPresetPicker />
      <DebugPlaythroughPresets />
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
    </Suspense>
  );
}
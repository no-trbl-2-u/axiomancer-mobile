import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { PirataOne_400Regular } from '@expo-google-fonts/pirata-one';
import {
  IMFellEnglish_400Regular,
  IMFellEnglish_400Regular_Italic,
} from '@expo-google-fonts/im-fell-english';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TooltipProvider } from '@/components/tooltip/TooltipProvider';
import { AestheticModeProvider } from '@/state/aesthetic-mode';
import { CombatModeProvider } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';
// Side-effect import: registers exploration map event pools with
// the engine so walking onto encounter / rest / treasure / quest
// nodes fires the appropriate event. See state/exploration-maps/event-pools.ts.
import '@/state/exploration-maps/event-pools';
import { createAsyncStorageAdapter } from '@/state/persistence/asyncStorageAdapter';
import { CorruptSaveModal } from '@/components/CorruptSaveModal';
import { DevAutoSeed } from '@/components/DevAutoSeed';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HardwareBackHandler } from '@/components/HardwareBackHandler';
import { EventGate } from '@/components/EventGate';
import { ToastHost } from '@/components/ToastHost';

SplashScreen.preventAutoHideAsync();

// Single app-wide persistence adapter. Created once at module load; the
// `preload()` call below populates its in-memory cache from AsyncStorage
// before `<GameStoreProvider>` mounts. Tests bypass this entirely via
// the provider's `adapter` / `store` props.
const persistenceAdapter = createAsyncStorageAdapter();

export default function RootLayout() {
  const [loaded] = useFonts({
    PirataOne_400Regular,
    IMFellEnglish_400Regular,
    IMFellEnglish_400Regular_Italic,
    BebasNeue_400Regular,
    JetBrainsMono_400Regular,
  });
  const [preloaded, setPreloaded] = useState(false);
  const [corruptSave, setCorruptSave] = useState(false);

  useEffect(() => {
    let cancelled = false;
    persistenceAdapter
      .preload()
      .catch((err: unknown) => {
        // Q7=A on Spec 09: surface "save corrupted — start new game?" to
        // the user. Phase 53 wires the user-facing CorruptSaveModal; the
        // console.warn stays as a dev breadcrumb so the failure shows up
        // in Metro logs alongside the modal mount.
        if (__DEV__) {
          console.warn('[persistence] preload failed; surfacing modal', err);
        }
        if (!cancelled) setCorruptSave(true);
      })
      .finally(() => {
        if (!cancelled) setPreloaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onCorruptConfirm = useCallback(() => {
    // Clear the corrupt slot + drop the modal. The provider boots a fresh
    // `createNewGameState` because the persistence cache is now null.
    persistenceAdapter.clear().catch((err: unknown) => {
      if (__DEV__) {
        console.warn('[persistence] clear failed after corrupt-save confirm', err);
      }
    });
    setCorruptSave(false);
  }, []);

  const onCorruptCancel = useCallback(() => {
    // Keep the modal mounted so the user can troubleshoot / reach support.
    // No-op intentionally — the modal stays visible until they choose
    // Confirm or close the app.
  }, []);

  useEffect(() => {
    if (loaded && preloaded) SplashScreen.hideAsync();
  }, [loaded, preloaded]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // Best-effort: phones using gesture nav already hide the system bar,
    // but on devices with the legacy 3-button nav this drives it offscreen
    // until the user swipes from the bottom edge.
    NavigationBar.setVisibilityAsync('hidden').catch(() => undefined);
  }, []);

  // Deep linking is declared in `app.json` (`scheme: "axiomancer"`)
  // but **not yet wired to navigation**. A handler was scaffolded
  // here pre-Phase 8 and removed in critique-pass-1 close-out
  // because both branches were no-ops — keeping a subscription that
  // does nothing was actively misleading. When deep-linking is
  // wired, register the subscription here, look up the route from
  // `Linking.parse`, and call `router.replace(...)` (the router
  // must come from `useRouter()` rendered below the `<Stack>`
  // boundary, so the handler likely belongs in a child component,
  // not in this root layout).

  if (!loaded || !preloaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CorruptSaveModal
        visible={corruptSave}
        onConfirm={onCorruptConfirm}
        onCancel={onCorruptCancel}
      />
      <GameStoreProvider adapter={persistenceAdapter}>
        {/* ErrorBoundary mounts INSIDE the GameStoreProvider so
            the fallback ErrorScreen can read engine state via
            useGameState for the debug snapshot (filed via
            user-jot 2026-05-22 oversight 29th). */}
        <ErrorBoundary>
          <AestheticModeProvider>
          <CombatModeProvider>
          <TooltipProvider>
            <StatusBar style="light" />
            <HardwareBackHandler />
            <EventGate />
            <ToastHost />
            <DevAutoSeed />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen
                name="event/index"
                options={{ headerShown: false, presentation: 'fullScreenModal' }}
              />
            </Stack>
          </TooltipProvider>
          </CombatModeProvider>
          </AestheticModeProvider>
        </ErrorBoundary>
      </GameStoreProvider>
    </GestureHandlerRootView>
  );
}

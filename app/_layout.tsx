import { Stack } from 'expo-router';
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
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CombatModeProvider } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAsyncStorageAdapter } from '@/state/persistence/asyncStorageAdapter';
import { HardwareBackHandler } from '@/components/HardwareBackHandler';
import { EventGate } from '@/components/EventGate';

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

  useEffect(() => {
    let cancelled = false;
    persistenceAdapter
      .preload()
      .catch((err: unknown) => {
        // Q7=A on Spec 09: surface "save corrupted — start new game?" to
        // the user. Minimum viable for this phase: log and continue with
        // a fresh game (cache stays null, provider boots `createNewGameState`).
        // Replace with a UX modal in a follow-up.
        console.warn('[persistence] preload failed; starting fresh', err);
      })
      .finally(() => {
        if (!cancelled) setPreloaded(true);
      });
    return () => {
      cancelled = true;
    };
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

  // Handle deep links when app is already open
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { hostname, path } = Linking.parse(event.url);
      
      if (hostname === 'character') {
        // Navigate to character sheet
        // Router will handle this via expo-router
      } else if (hostname === 'event' && path) {
        // Navigate to specific event (read-only)
        // For now, just go to event tab - event ID handling can be enhanced later
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription?.remove();
  }, []);

  if (!loaded || !preloaded) return null;

  return (
    <GameStoreProvider adapter={persistenceAdapter}>
      <CombatModeProvider>
        <StatusBar style="light" />
        <HardwareBackHandler />
        <EventGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="event"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
        </Stack>
      </CombatModeProvider>
    </GameStoreProvider>
  );
}

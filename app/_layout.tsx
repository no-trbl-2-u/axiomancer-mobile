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
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CombatModeProvider } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    PirataOne_400Regular,
    IMFellEnglish_400Regular,
    IMFellEnglish_400Regular_Italic,
    BebasNeue_400Regular,
    JetBrainsMono_400Regular,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // Best-effort: phones using gesture nav already hide the system bar,
    // but on devices with the legacy 3-button nav this drives it offscreen
    // until the user swipes from the bottom edge.
    NavigationBar.setVisibilityAsync('hidden').catch(() => undefined);
  }, []);

  if (!loaded) return null;

  return (
    <GameStoreProvider>
      <CombatModeProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </CombatModeProvider>
    </GameStoreProvider>
  );
}

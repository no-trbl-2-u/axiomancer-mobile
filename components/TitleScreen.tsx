import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AXM, FONTS } from '@/theme/axm';
import { useGameActions } from '@/state/GameStoreProvider';

interface TitleScreenProps {
  onContinue: () => void;
}

export function TitleScreen({ onContinue }: TitleScreenProps) {
  const actions = useGameActions();

  const handleStartGame = () => {
    // Seed the game with basic starter equipment/stats if needed
    if (__DEV__) {
      actions.debugSeed();
    }
    onContinue();
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>AXIOMANCER</Text>
        <Text style={styles.subtitle}>MOBILE</Text>
      </View>

      {/* Flavor text */}
      <View style={styles.flavorSection}>
        <Text style={styles.flavorText}>
          You are a PILGRIM in the cursed lands, carrying{'\n'}
          ancient knowledge and modern steel. The path{'\n'}
          ahead winds through strange territories where{'\n'}
          VITAE flows like blood and every choice shapes{'\n'}
          your legend.
        </Text>
      </View>

      {/* Start button */}
      <View style={styles.buttonSection}>
        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.startButtonPressed,
          ]}
          onPress={handleStartGame}
          accessibilityRole="button"
          accessibilityLabel="Begin your journey"
        >
          <Text style={styles.startButtonText}>BEGIN JOURNEY</Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Touch to continue. Your path begins in the{'\n'}
          fishing village, where travelers gather before{'\n'}
          venturing into the LEAGUES beyond.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AXM.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  mainTitle: {
    fontFamily: FONTS.gothic,
    fontSize: 48,
    color: AXM.parchment,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: FONTS.sans,
    fontSize: 18,
    color: AXM.ash,
    letterSpacing: 4,
    marginTop: 4,
  },
  flavorSection: {
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  flavorText: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    color: AXM.bone,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonSection: {
    marginBottom: 48,
  },
  startButton: {
    backgroundColor: AXM.sulfur,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: AXM.ash,
  },
  startButtonPressed: {
    backgroundColor: AXM.rust,
    borderColor: AXM.parchment,
  },
  startButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 18,
    color: AXM.bg,
    letterSpacing: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FONTS.serifItalic,
    fontSize: 12,
    color: AXM.ash,
    textAlign: 'center',
    lineHeight: 16,
  },
});
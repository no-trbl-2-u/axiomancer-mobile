import { View, Text, Pressable } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import { useGameActions } from '@/state/GameStoreProvider';
import { TitleEmblem } from '@/components/art/TitleEmblem';
import { FiligreeRule } from '@/components/art/Filigree';

interface TitleScreenProps {
  onContinue: () => void;
}

export function TitleScreen({ onContinue }: TitleScreenProps) {
  const styles = useStyles();
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
      {/* Crest + title lockup */}
      <View style={styles.titleSection}>
        <TitleEmblem size={156} title="Axiomancer crest — a radiant eye above a sword" />
        <Text style={styles.mainTitle}>AXIOMANCER</Text>
        <Text style={styles.subtitle}>· MOBILE ·</Text>
      </View>

      {/* Flavor text */}
      <View style={styles.flavorSection}>
        <FiligreeRule />
        <Text style={styles.flavorText}>
          You are a PILGRIM in the cursed lands, carrying ancient knowledge and modern
          steel. The path ahead winds through strange territories where VITAE flows like
          blood and every choice shapes your legend.
        </Text>
        <FiligreeRule />
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
          Your path begins in the fishing village, where travelers gather
          before venturing into the LEAGUES beyond.
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((AXM) => ({
  container: {
    flex: 1,
    backgroundColor: AXM.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  mainTitle: {
    fontFamily: FONTS.gothic,
    fontSize: 48,
    color: AXM.parchment,
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 8,
    // Soft glow so the wordmark reads as lit rather than flat.
    textShadowColor: AXM.sulfurMed,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  subtitle: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    color: AXM.sulfur,
    letterSpacing: 8,
    marginTop: 6,
    opacity: 0.85,
  },
  flavorSection: {
    marginBottom: 40,
    paddingHorizontal: 8,
    maxWidth: 340,
    gap: 16,
  },
  flavorText: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    color: AXM.parchmentDim,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonSection: {
    marginBottom: 48,
  },
  startButton: {
    backgroundColor: AXM.sulfur,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: AXM.parchment,
    // Lift the CTA off the dark field with an accent glow.
    shadowColor: AXM.sulfur,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonPressed: {
    backgroundColor: AXM.rust,
    borderColor: AXM.parchment,
  },
  startButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 18,
    color: AXM.bg,
    letterSpacing: 3,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  footerText: {
    fontFamily: FONTS.serifItalic,
    fontSize: 12,
    color: AXM.bone,
    textAlign: 'center',
    lineHeight: 17,
    opacity: 0.7,
  },
}));

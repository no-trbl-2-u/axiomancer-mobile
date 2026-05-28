import { Redirect } from 'expo-router';
import { useState } from 'react';
import { useGameState } from '@/state/GameStoreProvider';
import { selectActiveTab } from '@/state/presenters/navigation.engine';
import { selectOnboardingViewModel } from '@/state/presenters/onboarding.engine';
import { TitleScreen } from '@/components/TitleScreen';

export default function Index() {
  const activeTab = useGameState(selectActiveTab);
  const onboarding = useGameState(selectOnboardingViewModel);
  const [titleScreenDismissed, setTitleScreenDismissed] = useState(false);

  // Show title screen for new players who haven't dismissed it yet
  if (onboarding.showTitleScreen && !titleScreenDismissed) {
    return (
      <TitleScreen onContinue={() => setTitleScreenDismissed(true)} />
    );
  }

  return <Redirect href={`/${activeTab}` as any} />;
}

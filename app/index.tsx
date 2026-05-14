import { Redirect } from 'expo-router';
import { useGameState } from '@/state/GameStoreProvider';
import { selectActiveTab } from '@/state/presenters/navigation.engine';

export default function Index() {
  const activeTab = useGameState(selectActiveTab);
  return <Redirect href={`/${activeTab}` as any} />;
}

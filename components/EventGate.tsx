import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { useGameState } from '@/state/GameStoreProvider';
import { selectHasActiveEvent } from '@/state/presenters/event.engine';

/**
 * Pushes the user into the full-screen event modal whenever the engine
 * reports an active event. Rendered as a side-effect-only component so
 * the gate runs anywhere inside the navigation tree.
 *
 * Spec 08 will make `selectHasActiveEvent` non-trivial. Until then this
 * is a no-op and the modal is reached manually via `router.push('/event')`.
 */
export function EventGate() {
  const hasEvent = useGameState(selectHasActiveEvent);
  const router = useRouter();

  useEffect(() => {
    if (hasEvent) router.push('/event' as never);
  }, [hasEvent, router]);

  return null;
}

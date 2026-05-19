import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { useGameState } from '@/state/GameStoreProvider';
import { selectHasActivePacedEvent } from '@/state/presenters/event.engine';

/**
 * Pushes the user into the full-screen `/event` route whenever the
 * engine reports an active **paced** event (narrative-choice kind).
 * Combat-adjacent events (combat-prelude) render in-place over the
 * exploration map via `<EncounterModalOverlay>` and stay out of the
 * router — see chat 2 §VI "two event shells (combat-adjacent vs
 * paced)" + Phase 40 audit (2026-05-19) for the split rationale.
 * Rendered as a side-effect-only component so the gate runs anywhere
 * inside the navigation tree.
 */
export function EventGate() {
  const hasPacedEvent = useGameState(selectHasActivePacedEvent);
  const router = useRouter();

  useEffect(() => {
    if (hasPacedEvent) router.push('/event' as never);
  }, [hasPacedEvent, router]);

  return null;
}

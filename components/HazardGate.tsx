import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { useGameState } from '@/state/GameStoreProvider';
import { selectHasActiveHazard } from '@/state/presenters/hazard.engine';

/**
 * Pushes the user into the full-screen `/hazard` route whenever a
 * hazard minigame session starts (hazard map event resolved, or the
 * dev entry fired). Mirrors `<EventGate>` — a side-effect-only
 * component mounted once in the root layout.
 */
export function HazardGate() {
    const hasHazard = useGameState(selectHasActiveHazard);
    const router = useRouter();

    useEffect(() => {
        if (hasHazard) router.push('/hazard' as never);
    }, [hasHazard, router]);

    return null;
}

import type { EventArtSlug } from '@/state/presenters/event-assets';

import { BossIllustration } from './BossIllustration';
import { EncounterIllustration } from './EncounterIllustration';
import { PlaceholderIllustration } from './PlaceholderIllustration';

/**
 * Renders the procedural SVG illustration for an event by its art
 * slug. Spec 08 Q3 = B: slug → component map is mobile-local.
 */
export function EventArt({ slug }: { slug: EventArtSlug }) {
    if (slug === 'encounter') return <EncounterIllustration />;
    if (slug === 'boss') return <BossIllustration />;
    return <PlaceholderIllustration slug={slug} />;
}

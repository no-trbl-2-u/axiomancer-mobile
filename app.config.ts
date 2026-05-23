import type { ExpoConfig } from 'expo/config';

import appJson from './app.json';

// EAS sets `EAS_BUILD_PROFILE` to the active profile name during
// build. `BUILD_PROFILE` is an explicit override for web deploys
// (Netlify / Vercel / etc.) where EAS isn't involved.
//
// DEV menu / Debug* affordances render whenever the profile is
// anything other than 'production'. Local dev (no env set) also
// shows them; runtime helper additionally honors `__DEV__`.
const buildProfile = process.env.EAS_BUILD_PROFILE ?? process.env.BUILD_PROFILE;
const devToolsEnabled = buildProfile !== 'production';

const expo = appJson.expo as ExpoConfig;

export default (): ExpoConfig => ({
  ...expo,
  extra: {
    ...(expo.extra ?? {}),
    devToolsEnabled,
    // Only include when set — Expo's config merge converts a literal
    // null into `{}` which would defeat the `?? null` fallback in
    // `getBuildProfile()`.
    ...(buildProfile ? { buildProfile } : {}),
  },
});

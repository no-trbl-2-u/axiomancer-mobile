import Constants from 'expo-constants';

type Extra = { devToolsEnabled?: boolean; buildProfile?: string | null };

// `extra.devToolsEnabled` is set by `app.config.ts` from
// `EAS_BUILD_PROFILE` (or `BUILD_PROFILE` for non-EAS web deploys):
// `false` only when the profile is `'production'`. Local dev
// without either env set falls through to `__DEV__`.
export function isDevToolsEnabled(): boolean {
  const extra = Constants.expoConfig?.extra as Extra | undefined;
  if (extra?.devToolsEnabled === false) return false;
  if (extra?.devToolsEnabled === true) return true;
  return __DEV__;
}

export function getBuildProfile(): string | null {
  const extra = Constants.expoConfig?.extra as Extra | undefined;
  return extra?.buildProfile ?? null;
}

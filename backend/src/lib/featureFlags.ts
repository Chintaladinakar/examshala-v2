// Lightweight feature-flag registry. Flags default on; disable one for the whole
// deployment via env (FEATURE_FLAG_<NAME>=off), which is enough for a single-tenant
// rollout gate today and can grow into a per-workspace DB-backed table later without
// changing the call sites below.

export type FeatureFlag = 'leaderboard' | 'globalSearch' | 'timetable' | 'announcements';

const DEFAULT_ENABLED: Record<FeatureFlag, boolean> = {
  leaderboard: true,
  globalSearch: true,
  timetable: true,
  announcements: true,
};

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const envKey = `FEATURE_FLAG_${flag.toUpperCase()}`;
  const override = process.env[envKey];
  if (override !== undefined) {
    return override.toLowerCase() !== 'off' && override !== '0' && override.toLowerCase() !== 'false';
  }
  return DEFAULT_ENABLED[flag];
}

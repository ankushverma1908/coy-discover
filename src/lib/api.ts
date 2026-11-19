import type { Profile, SwipeAction, SwipeResult } from './types';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}
export const fetchFeed = () => fetch('/api/feed', { cache: 'no-store' }).then((r) => json<{ profiles: Profile[] }>(r)).then((d) => d.profiles);
export const fetchMatches = () => fetch('/api/matches', { cache: 'no-store' }).then((r) => json<{ matches: Profile[] }>(r)).then((d) => d.matches);
export const postSwipe = (profileId: number, action: SwipeAction) =>
  fetch('/api/swipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId, action }) })
    .then((r) => json<SwipeResult>(r));export const resetDemo = () => fetch('/api/reset', { method: 'POST' }).then((r) => { if (!r.ok) throw new Error('Reset disabled'); });
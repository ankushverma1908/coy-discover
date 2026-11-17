import { beforeAll, describe, expect, it } from 'vitest';
import { LIKED_ME_IDS } from '../src/lib/db/seed';

type Handler = (req?: Request) => Promise<Response> | Response;
let feed: Handler, matches: Handler, swipe: Handler;

beforeAll(async () => {
  process.env.COY_DB_PATH = ':memory:'; // set before the db module is imported
  feed = (await import('../src/app/api/feed/route')).GET;
  matches = (await import('../src/app/api/matches/route')).GET;
  swipe = (await import('../src/app/api/swipe/route')).POST as Handler;
});

const post = (body: unknown, raw = false) =>
  swipe(new Request('http://test/api/swipe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: raw ? (body as string) : JSON.stringify(body) }));

describe('HTTP layer', () => {
  it('GET /api/feed returns public fields only, ordered by id, uncached', async () => {
    const res = await feed();
    const { profiles } = await res.json();
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(profiles).toHaveLength(32);
    expect(profiles.map((p: { id: number }) => p.id)).toEqual([...Array(32)].map((_, i) => i + 1));
    expect(Object.keys(profiles[0]).sort()).toEqual(['age', 'bio', 'id', 'interests', 'location', 'name', 'photoUrl']);
  });
  it('rejects bad input with 400 and unknown profiles with 404', async () => {
    expect((await post('not json', true)).status).toBe(400);
    expect((await post({ profileId: 'x', action: 'like' })).status).toBe(400);
    expect((await post({ profileId: 1, action: 'superlike' })).status).toBe(400);
    expect((await post({ profileId: 9999, action: 'like' })).status).toBe(404);
  });
  it('match flow works end to end and no response ever mentions liked-you data', async () => {
    const seen: string[] = [];
    const nonMatch = await (await post({ profileId: 1, action: 'like' })).json();
    const pass = await (await post({ profileId: 3, action: 'pass' })).json();
    expect(nonMatch).toEqual({ matched: false });
    expect(pass).toEqual(nonMatch); // indistinguishable
    const hit = await (await post({ profileId: LIKED_ME_IDS[0], action: 'like' })).json();
    expect(hit.matched).toBe(true);
    const again = await (await post({ profileId: LIKED_ME_IDS[0], action: 'pass' })).json();
    expect(again).toEqual(hit); // idempotent
    seen.push(JSON.stringify(nonMatch), JSON.stringify(hit), JSON.stringify(await (await feed()).json()), JSON.stringify(await (await matches()).json()));
    expect(seen.join()).not.toMatch(/incoming|likedYou|liked_you|likesYou/i);
    const m = await (await matches()).json();
    expect(m.matches.map((p: { id: number }) => p.id)).toEqual([LIKED_ME_IDS[0]]);
  });
});
import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type DB } from '../src/lib/db';
import { LIKED_ME_IDS } from '../src/lib/db/seed';
import { getFeed, getMatches, HttpError, swipe } from '../src/lib/services/swipes';

const LIKED = LIKED_ME_IDS[0];
const NOT_LIKED = 1;
let db: DB;
beforeEach(() => { db = createDb(':memory:'); });

describe('seed', () => {
  it('seeds >=30 profiles and 8-10 incoming likes; seeding is idempotent', async () => {
    const { seed } = await import('../src/lib/db/seed');
    seed(db); seed(db);
    expect(db.prepare('SELECT COUNT(*) c FROM profiles').get()).toEqual({ c: 32 });
    expect(db.prepare('SELECT COUNT(*) c FROM incoming_likes').get()).toEqual({ c: 9 });
  });
});

describe('feed', () => {
  it('excludes swiped profiles (like and pass)', () => {
    swipe(db, 1, 'like'); swipe(db, 2, 'pass');
    const ids = getFeed(db).map((p) => p.id);
    expect(ids).not.toContain(1); expect(ids).not.toContain(2); expect(ids).toHaveLength(30);
  });
  it('is ordered by id, so liked-me profiles are not surfaced first', () => {
    const ids = getFeed(db).map((p) => p.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });
  it('payload has only public fields and no liked-me info', () => {
    const feed = getFeed(db);
    for (const p of feed) expect(Object.keys(p).sort()).toEqual(['age', 'bio', 'id', 'interests', 'location', 'name', 'photoUrl']);
    expect(JSON.stringify(feed)).not.toMatch(/like|crush|incoming/i);
  });
  it('is identical in shape for liked-me and non-liked-me profiles', () => {
    const feed = getFeed(db);
    const a = Object.keys(feed.find((p) => p.id === LIKED)!);
    const b = Object.keys(feed.find((p) => p.id === NOT_LIKED)!);
    expect(a).toEqual(b);
  });
});

describe('swipe', () => {
  it('like on a liked-me profile creates a match', () => {
    const r = swipe(db, LIKED, 'like');
    expect(r.matched).toBe(true); expect(r.match?.id).toBe(LIKED);
    expect(getMatches(db).map((p) => p.id)).toEqual([LIKED]);
  });
  it('like on a non-liked-me profile does not match, and response has the same shape as pass', () => {
    expect(swipe(db, NOT_LIKED, 'like')).toEqual({ matched: false });
    expect(swipe(db, 3, 'pass')).toEqual({ matched: false });
    expect(getMatches(db)).toHaveLength(0);
  });
  it('pass never matches, even on a liked-me profile, and reveals nothing', () => {
    expect(swipe(db, LIKED, 'pass')).toEqual({ matched: false });
    expect(getMatches(db)).toHaveLength(0);
  });
  it('is idempotent: repeats keep the first result and create no duplicates', () => {
    const first = swipe(db, LIKED, 'like');
    expect(swipe(db, LIKED, 'like')).toEqual(first);
    expect(swipe(db, LIKED, 'pass')).toEqual(first); // later pass cannot undo it
    expect(db.prepare('SELECT COUNT(*) c FROM swipes').get()).toEqual({ c: 1 });
    expect(getMatches(db)).toHaveLength(1);
    swipe(db, LIKED_ME_IDS[1], 'pass');
    expect(swipe(db, LIKED_ME_IDS[1], 'like')).toEqual({ matched: false }); // first pass sticks
  });
  it('throws 404 for unknown profiles', () => {
    expect(() => swipe(db, 9999, 'like')).toThrow(HttpError);
    try { swipe(db, 9999, 'like'); } catch (e) { expect((e as HttpError).status).toBe(404); }
  });
});

describe('matches', () => {
  it('lists only mutual matches, newest first', () => {
    swipe(db, LIKED_ME_IDS[0], 'like'); swipe(db, NOT_LIKED, 'like'); swipe(db, LIKED_ME_IDS[1], 'like'); swipe(db, 3, 'pass');
    const m = getMatches(db).map((p) => p.id);
    expect(m).toEqual([LIKED_ME_IDS[1], LIKED_ME_IDS[0]]);
    expect(JSON.stringify(getMatches(db))).not.toMatch(/incoming|likedYou|liked_you/i);
  });
});

import type { DB } from '../db';
import { ME, type Profile, type SwipeAction, type SwipeResult } from '../types';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const COLS = 'id,name,age,photo_url AS photoUrl,bio,location,interests_json AS interestsJson';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toProfile = (r: any): Profile => {
  const { interestsJson, ...rest } = r;
  return { ...rest, interests: JSON.parse(interestsJson) };
};

/** Unswiped profiles, ordered by id. Never touches incoming_likes, so order/shape cannot leak. */
export function getFeed(db: DB, userId = ME): Profile[] {
  return db.prepare(`SELECT ${COLS} FROM profiles WHERE id NOT IN (SELECT profile_id FROM swipes WHERE user_id = ?) ORDER BY id`)
    .all(userId).map(toProfile);
}

export function getMatches(db: DB, userId = ME): Profile[] {
  return db.prepare(`SELECT ${COLS} FROM profiles p JOIN (SELECT profile_id, id mid, created_at FROM matches WHERE user_id = ?) m ON m.profile_id = p.id ORDER BY m.created_at DESC, m.mid DESC`)
    .all(userId).map(toProfile);
}

/**
 * Records a swipe. Idempotent: a repeat swipe on the same profile (any action) changes nothing and
 * replays the ORIGINAL outcome with HTTP 200 (chosen over 409 so retries/double-clicks are harmless).
 * Swipe + match are written in a single immediate transaction.
 */
export function swipe(db: DB, profileId: number, action: SwipeAction, userId = ME): SwipeResult {
  return db.transaction((): SwipeResult => {
    const row = db.prepare(`SELECT ${COLS} FROM profiles WHERE id = ?`).get(profileId);
    if (!row) throw new HttpError(404, 'Profile not found');
    const profile = toProfile(row);

    const prior = db.prepare('SELECT 1 FROM swipes WHERE user_id = ? AND profile_id = ?').get(userId, profileId);
    if (prior) {
      const m = db.prepare('SELECT 1 FROM matches WHERE user_id = ? AND profile_id = ?').get(userId, profileId);
      return m ? { matched: true, match: profile } : { matched: false };
    }
    db.prepare('INSERT INTO swipes (user_id, profile_id, action) VALUES (?,?,?)').run(userId, profileId, action);
    // Always read incoming_likes (like or pass) so both paths do equivalent work.
    const likedMe = !!db.prepare('SELECT 1 FROM incoming_likes WHERE profile_id = ?').get(profileId);
    if (action === 'like' && likedMe) {
      db.prepare('INSERT INTO matches (user_id, profile_id) VALUES (?,?)').run(userId, profileId);
      return { matched: true, match: profile };
    }
    return { matched: false };
  }).immediate();
}
/** Demo helper: clears this user's swipes and matches. Never touches profiles or incoming_likes. */
export function resetSwipes(db: DB, userId = ME): void {
  db.transaction(() => {
    db.prepare('DELETE FROM matches WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM swipes WHERE user_id = ?').run(userId);
  })();
}
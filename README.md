# Coy Discover

Mobile-first swipe deck for **Coy**, a privacy-first crush app. Core promise: *nobody learns who liked them unless the like is mutual.*

Stack: Next.js 15 (App Router) · TypeScript · Tailwind 3 · framer-motion · better-sqlite3 · Vitest.

## Run it

```bash
npm i && npm run dev        # http://localhost:3000 (DB auto-created and seeded on first request)
npm test                    # Vitest backend suite
npm run lint                # tsc --noEmit
npm run build && npm start  # production
npm run seed                # idempotent seed (INSERT OR IGNORE)
npm run reset-db            # delete the DB file and re-seed from scratch
```

DB path: `COY_DB_PATH` (default `./data/coy.db`, git-ignored). 32 profiles are seeded, 9 of which are in `incoming_likes` (ids in `src/lib/db/seed.ts`). The logged-in user is the constant `"me"`.

## Structure

```
src/lib/db/        schema, connection, seed
src/lib/services/  swipes.ts  (getFeed, swipe, getMatches): all business logic
src/lib/types.ts   public Profile type (no liked-me field exists)
src/app/api/       feed | swipe | matches route handlers (thin)
src/components/    Discover (deck / matches / overlay), SwipeCard
tests/             Vitest, runs against in-memory SQLite
```

## API

`GET /api/feed` → `200 { "profiles": [{ "id": 1, "name": "Aria", "age": 20, "photoUrl": "...", "bio": "...", "location": "...", "interests": ["hiking"] }] }`
Unswiped profiles only, ordered by id.

`POST /api/swipe` with body `{ "profileId": 2, "action": "like" | "pass" }`
- `200 { "matched": true, "match": { ...Profile } }` or `200 { "matched": false }`
- `400` malformed JSON or bad body, `404` unknown profile

`GET /api/matches` → `200 { "matches": [Profile, ...] }`, newest first.

**Duplicate swipes:** return `200` with the *original* outcome and change nothing (a later "pass" cannot undo a like, and vice versa). Chosen over `409` so retries and double-clicks are harmless and the client needs no special case.

## Privacy design

1. `incoming_likes` is read in exactly one place: inside the swipe transaction. No query, type, or endpoint exposes it, and the `Profile` type has no liked-you field.
2. `/feed` never touches `incoming_likes`; order is by id, so ordering and payload are identical for liked-me and other profiles.
3. A match row is created only when the user's like meets an existing incoming like, in the *same* transaction as the swipe insert.
4. A pass never creates a match. A non-matching like and a pass return the identical `{ "matched": false }`, and the incoming-likes lookup runs on both paths so the work is equivalent.
5. The only signal is a match itself, which is mutual by definition.

Tests (`tests/swipes.test.ts`) cover: feed excludes swiped, like on liked-me → match, like on non-liked-me → none, pass → none, idempotency, matches are mutual-only, feed payload keys/ordering/no liked-me data, 404s, and seed idempotency.

## UX notes

Drag with rotation, LIKE/NOPE stamps that fade in with distance, and spring-back under the 120 px / velocity threshold; heart/X buttons; ArrowLeft/ArrowRight. Swipes are optimistic; on failure the card is restored with a toast. A 300 ms client cooldown guards double-clicks, and the server's primary key plus immediate transaction guards races. Skeletons, error + retry, empty deck and empty matches states are included.

## Deployment

SQLite needs a **persistent disk** (Fly volume, Railway, a VPS). On Vercel the filesystem is ephemeral: set `COY_DB_PATH=/tmp/coy.db` for a demo (data resets on cold start), or use a hosted DB (Turso/libSQL or Postgres), which is the easier path there. Service functions take a `db` handle, which keeps that swap contained.

## Trade-offs and next steps

- **Auth:** single hard-coded user. Add real sessions and derive `userId` server-side.
- **Rate limiting / abuse:** limit swipes per user. The real "who liked me" risk is probing: many accounts liking a target and watching for matches. Needs rate limits, account verification and anti-enumeration.
- **Real incoming likes:** replace the seeded table with swipes from other users (match = mutual like), keeping the private-read-only rule.
- **Pagination:** the feed returns all unswiped profiles; add cursor pagination and prefetch.
- **Real-time matches:** push (SSE/WebSocket) so a match appears when the other user swipes second.
- **Persistence:** move to Postgres with migrations, keeping the transaction semantics (unique constraints plus row locks or `SERIALIZABLE`).
- **Testing:** add route-level and Playwright gesture tests; the suite currently targets the service layer.

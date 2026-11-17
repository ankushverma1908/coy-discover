import type { DB } from './index';

// [name, gender]. Gender is used ONLY to pick a matching placeholder photo; it is not stored or exposed.
const PEOPLE: [string, 'F' | 'M'][] = [
  ['Aria', 'F'], ['Liam', 'M'], ['Maya', 'F'], ['Noah', 'M'], ['Zara', 'F'], ['Ethan', 'M'], ['Priya', 'F'], ['Lucas', 'M'],
  ['Sofia', 'F'], ['Kabir', 'M'], ['Chloe', 'F'], ['Omar', 'M'], ['Ivy', 'F'], ['Arjun', 'M'], ['Nina', 'F'], ['Mateo', 'M'],
  ['Leila', 'F'], ['Jonas', 'M'], ['Tara', 'F'], ['Felix', 'M'], ['Anika', 'F'], ['Diego', 'M'], ['Mira', 'F'], ['Theo', 'M'],
  ['Yara', 'F'], ['Rohan', 'M'], ['Elena', 'F'], ['Sam', 'M'], ['Dev', 'M'], ['Isla', 'F'], ['Kai', 'M'], ['Nora', 'F'],
];
const PLACES = ['IISc Bengaluru', 'Christ University', 'Koramangala', 'Indiranagar', 'NIT Trichy', 'Delhi University', 'Mumbai', 'Pune', 'Hyderabad', 'Goa'];
const INTERESTS = ['hiking', 'coffee', 'indie films', 'climbing', 'cooking', 'photography', 'board games', 'yoga', 'live music', 'travel', 'reading', 'running', 'gaming', 'art', 'dancing'];

/** Seeded profiles that have already liked "me". Stored server-side only; never returned by any API. */
export const LIKED_ME_IDS = [2, 5, 7, 11, 14, 18, 21, 25, 29];

/** Idempotent: re-running refreshes profile fields (e.g. photos) but never touches swipes or matches. */
export function seed(db: DB): void {
  const upsertProfile = db.prepare(`
    INSERT INTO profiles (id,name,age,photo_url,bio,location,interests_json) VALUES (?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, age=excluded.age, photo_url=excluded.photo_url,
      bio=excluded.bio, location=excluded.location, interests_json=excluded.interests_json`);
  const insLike = db.prepare('INSERT OR IGNORE INTO incoming_likes (profile_id) VALUES (?)');
  db.transaction(() => {
    PEOPLE.forEach(([name, gender], i) => {
      const id = i + 1;
      const interests = [0, 4, 9].map((o) => INTERESTS[(i + o) % INTERESTS.length]);
      const photo = `https://randomuser.me/api/portraits/${gender === 'F' ? 'women' : 'men'}/${id}.jpg`;
      upsertProfile.run(id, name, 20 + ((i * 7) % 12), photo,
        `Into ${interests[0]} and ${interests[1]}. Ask me about ${interests[2]}.`, PLACES[i % PLACES.length], JSON.stringify(interests));
    });
    LIKED_ME_IDS.forEach((id) => insLike.run(id));
  })();
}
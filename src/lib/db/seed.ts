import type { DB } from './index';

const NAMES = ['Aria','Liam','Maya','Noah','Zara','Ethan','Priya','Lucas','Sofia','Kabir','Chloe','Omar','Ivy','Arjun','Nina','Mateo','Leila','Jonas','Tara','Felix','Anika','Diego','Mira','Theo','Yara','Rohan','Elena','Sam','Dev','Isla','Kai','Nora'];
const PLACES = ['IISc Bengaluru','Christ University','Koramangala','Indiranagar','NIT Trichy','Delhi University','Mumbai','Pune','Hyderabad','Goa'];
const INTERESTS = ['hiking','coffee','indie films','climbing','cooking','photography','board games','yoga','live music','travel','reading','running','gaming','art','dancing'];

/** Seeded profiles that have already liked "me". Stored server-side only; never returned by any API. */
export const LIKED_ME_IDS = [2, 5, 7, 11, 14, 18, 21, 25, 29];

export function seed(db: DB): void {
  const insP = db.prepare('INSERT OR IGNORE INTO profiles (id,name,age,photo_url,bio,location,interests_json) VALUES (?,?,?,?,?,?,?)');
  const insL = db.prepare('INSERT OR IGNORE INTO incoming_likes (profile_id) VALUES (?)');
  db.transaction(() => {
    NAMES.forEach((name, i) => {
      const id = i + 1;
      const interests = [0, 4, 9].map((o) => INTERESTS[(i + o) % INTERESTS.length]);
      insP.run(id, name, 20 + ((i * 7) % 12), `https://i.pravatar.cc/600?img=${id}`,
        `Into ${interests[0]} and ${interests[1]}. Ask me about ${interests[2]}.`, PLACES[i % PLACES.length], JSON.stringify(interests));
    });
    LIKED_ME_IDS.forEach((id) => insL.run(id));
  })();
}

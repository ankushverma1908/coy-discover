import { createDb, DB_PATH } from '../src/lib/db';
import { seed } from '../src/lib/db/seed';
const db = createDb(DB_PATH);
seed(db); // idempotent (INSERT OR IGNORE)
console.log(`Seeded ${DB_PATH}`);

import fs from 'node:fs';
import { createDb, DB_PATH } from '../src/lib/db';
for (const s of ['', '-wal', '-shm']) fs.rmSync(DB_PATH + s, { force: true });
createDb(DB_PATH); // recreates schema and seeds
console.log(`Reset ${DB_PATH}`);

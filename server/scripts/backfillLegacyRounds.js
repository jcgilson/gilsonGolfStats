/**
 * Parse the "Legacy Rounds" sheet of the Golf workbook and insert each row
 * as a golfrounds doc with `nonGhinRounds.legacyRound = true`. Existing
 * legacy round docs (matched by `roundInfo.key`) are skipped so re-running
 * the script is safe.
 *
 * Connection: same fallback as server.js (uri.js -> MONGO_URI env).
 *
 * Usage (from server/):
 *   node scripts/backfillLegacyRounds.js "C:\Users\Jack Gilson\Desktop\Golf (36).xlsx"
 *   node scripts/backfillLegacyRounds.js "C:\Users\Jack Gilson\Desktop\Golf (36).xlsx" --apply
 */

import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import dns from 'dns';
import GolfRoundsCollection from '../models/GolfRounds.js';
import { parseLegacyRounds } from '../../src/helpers/parseLegacyRounds.js';
dns.setServers(['8.8.8.8', '1.1.1.1']);

const filePath = process.argv[2];
const apply = process.argv.includes('--apply');
if (!filePath) {
    console.error('Pass the .xlsx path as the first arg.');
    process.exit(1);
}

let mongoURI;
try { const m = await import('../uri.js'); mongoURI = m.uri ?? m.default; } catch {}
mongoURI = mongoURI ?? process.env.MONGO_URI;
await mongoose.connect(mongoURI);
const dbName = mongoose.connection.db.databaseName;
console.log(`Connected to DB: ${dbName}${apply ? ' (APPLY)' : ' (dry-run)'}\n`);

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(filePath);
const sheet = wb.getWorksheet('Legacy Rounds');
if (!sheet) {
    console.error('No "Legacy Rounds" sheet in the workbook.');
    await mongoose.disconnect();
    process.exit(1);
}

const parsed = parseLegacyRounds(sheet);
console.log(`Parsed ${parsed.length} legacy rounds from Excel.`);

// Skip rounds whose key is already in Mongo so re-runs are idempotent.
const raw = mongoose.connection.db.collection('golfrounds');
const existingKeys = new Set(
    (await raw.find({ 'roundInfo.courseKey': 'Legacy' }, { projection: { 'roundInfo.key': 1 } }).toArray())
        .map(r => r.roundInfo?.key)
        .filter(Boolean)
);
console.log(`Existing legacy rounds in Mongo: ${existingKeys.size}\n`);

const toInsert = parsed.filter(r => !existingKeys.has(r.roundInfo.key));
console.log(`Will ${apply ? 'INSERT' : 'preview'} ${toInsert.length} new legacy rounds.\n`);

// ---- Summary ----
const byYear = {};
const byCourse = {};
let withScore = 0, withoutScore = 0;
let withPutts = 0;
for (const r of toInsert) {
    const y = r.roundInfo.yearForFilter ?? 'unknown';
    byYear[y] = (byYear[y] || 0) + 1;
    byCourse[r.roundInfo.course] = (byCourse[r.roundInfo.course] || 0) + 1;
    if (r.scoring.total != null) withScore++; else withoutScore++;
    if (r.putting.putts != null) withPutts++;
}
console.log('Year breakdown:', byYear);
console.log(`With numeric score: ${withScore}, score=null: ${withoutScore}, with putts: ${withPutts}`);
console.log('Top courses:', Object.fromEntries(
    Object.entries(byCourse).sort((a, b) => b[1] - a[1]).slice(0, 8)
));

// ---- First/last sample ----
if (toInsert.length) {
    console.log('\nFirst sample:'); console.log(JSON.stringify(toInsert[0], null, 2));
    console.log('\nLast sample:'); console.log(JSON.stringify(toInsert[toInsert.length - 1], null, 2));
}

// ---- Apply ----
if (apply && toInsert.length) {
    console.log(`\n=== Inserting ${toInsert.length} legacy rounds ===`);
    let ok = 0, fail = 0;
    for (const r of toInsert) {
        try {
            await new GolfRoundsCollection(r).save();
            ok++;
        } catch (err) {
            console.log(`  ✗ ${r.roundInfo.key} — ${err.message}`);
            fail++;
        }
    }
    console.log(`\nDone — inserted ${ok}, failed ${fail}.`);
} else if (!apply && toInsert.length) {
    console.log(`\nDry-run only. Re-run with --apply to write to ${dbName}.`);
}

await mongoose.disconnect();

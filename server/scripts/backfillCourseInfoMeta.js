/**
 * Backfill metadata onto every courseInfo doc in the connected DB:
 *   - sequence (1-N, by Excel sheet order — Stanley inserts at its true position)
 *   - scoreCardHoleAbbreviation (from GolfConsts.courses, "" if absent)
 *   - flagKey (from GolfConsts internationalFlag mapping; only present for international courses)
 *
 * Also fixes the Fox Hollow courseKey conflict introduced earlier
 * (foxHollowLinksCanyon -> foxHollow).
 *
 * Connection: same fallback as server.js (uri.js -> MONGO_URI env).
 *
 * Usage (from server/):
 *   node scripts/backfillCourseInfoMeta.js "C:\Users\Jack Gilson\Desktop\Golf (36).xlsx"
 *   node scripts/backfillCourseInfoMeta.js "C:\Users\Jack Gilson\Desktop\Golf (36).xlsx" --apply
 *
 * Default = dry-run.
 */

import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CourseInfoCollection from '../models/CourseInfo.js';
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
console.log(`Connected to DB: ${dbName}${apply ? ' (APPLY mode)' : ' (dry-run)'}\n`);

// ---- Read Excel for canonical sheet order ----
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(filePath);
const sheetOrder = wb.worksheets
    .map(ws => ws.name)
    .filter(name => name !== 'Legacy Rounds');
const sequenceByName = new Map(sheetOrder.map((name, i) => [name, i + 1]));

// ---- Parse GolfConsts.js for per-course meta ----
// Can't import directly (PNG imports break Node), so parse the courses array as text.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const constsPath = path.resolve(__dirname, '../../src/helpers/GolfConsts.js');
const constsText = fs.readFileSync(constsPath, 'utf8');

// Each course block: { sequence: N, displayName: "...", courseKey: "...",
//   scoreCardHoleAbbreviation: "...", [internationalFlag: internationalFlags.x] }
const blockRe = /\{\s*sequence:\s*\d+,[^}]+?\}/g;
const meta = new Map();
const blocks = constsText.match(blockRe) ?? [];
for (const blk of blocks) {
    const dm = blk.match(/displayName:\s*"([^"]+)"/);
    if (!dm) continue;
    const displayName = dm[1];
    const abbrM = blk.match(/scoreCardHoleAbbreviation:\s*"([^"]*)"/);
    const flagM = blk.match(/internationalFlag:\s*internationalFlags\.(\w+)/);
    meta.set(displayName, {
        scoreCardHoleAbbreviation: abbrM ? abbrM[1] : '',
        flagKey: flagM ? flagM[1] : null,
    });
}
console.log(`Parsed ${meta.size} course entries from GolfConsts.js`);
console.log(`Excel sheet order has ${sheetOrder.length} courses\n`);

// ---- Build update plan ----
const dbCourses = await CourseInfoCollection.find({}).lean();
console.log(`Mongo: ${dbCourses.length} courseInfo docs\n`);

const updates = [];
const issues = [];
for (const c of dbCourses) {
    const seq = sequenceByName.get(c.displayName);
    if (!seq) {
        issues.push(`No Excel sheet found for "${c.displayName}" — sequence will not be set.`);
    }
    const m = meta.get(c.displayName) ?? { scoreCardHoleAbbreviation: '', flagKey: null };
    const set = {};
    if (seq && c.sequence !== seq) set.sequence = seq;
    if (c.scoreCardHoleAbbreviation !== m.scoreCardHoleAbbreviation) {
        set.scoreCardHoleAbbreviation = m.scoreCardHoleAbbreviation;
    }
    if (m.flagKey && c.flagKey !== m.flagKey) set.flagKey = m.flagKey;

    // Fox Hollow special-case: rename courseKey foxHollowLinksCanyon -> foxHollow
    if (c.displayName === 'Fox Hollow - Links Canyon' && c.courseKey === 'foxHollowLinksCanyon') {
        set.courseKey = 'foxHollow';
    }

    if (Object.keys(set).length > 0) {
        updates.push({ _id: c._id, displayName: c.displayName, currentKey: c.courseKey, set });
    }
}

console.log(`Planned updates: ${updates.length}`);
for (const u of updates) {
    console.log(`  • ${u.displayName.padEnd(40)} → ${JSON.stringify(u.set)}`);
}

if (issues.length) {
    console.log(`\nIssues (${issues.length}):`);
    issues.forEach(i => console.log(`  - ${i}`));
}

// ---- Apply ----
if (apply && updates.length) {
    console.log(`\n=== Applying ${updates.length} updates ===`);
    let ok = 0, fail = 0;
    for (const u of updates) {
        try {
            const r = await CourseInfoCollection.updateOne({ _id: u._id }, { $set: u.set });
            if (r.matchedCount === 1) {
                console.log(`  ✓ ${u.displayName}`);
                ok++;
            } else {
                console.log(`  ✗ ${u.displayName} — no match (matched=${r.matchedCount})`);
                fail++;
            }
        } catch (err) {
            console.log(`  ✗ ${u.displayName} — ${err.message}`);
            fail++;
        }
    }
    console.log(`\nDone — updated ${ok}, failed ${fail}.`);
} else if (!apply && updates.length) {
    console.log(`\nDry-run only. Re-run with --apply to write to ${dbName}.`);
}

await mongoose.disconnect();

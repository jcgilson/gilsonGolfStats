/**
 * Walk every course sheet in the Golf workbook, parse `additionalHoles` for any
 * round that has them, and write the parsed object onto the matching `golfrounds`
 * doc in Mongo (matched by `roundInfo.key`).
 *
 * Mirrors the additional-holes parse from `src/helpers/ImportFileHelper.js`
 * (column layout: 9 columns per slot, up to 9 slots; first slot column is 128
 * for 18-hole sheets and 65 for 9-hole sheets). 9-vs-18 hole detection scans
 * row 3 for the highest "Hole N" header — same robust rule used by the missing-
 * courses backfill.
 *
 * Connection: same fallback as server.js (uri.js -> MONGO_URI env).
 *
 * Usage (from server/):
 *   node scripts/backfillAdditionalHoles.js "C:\Users\Jack Gilson\Desktop\Golf (36).xlsx"
 *   node scripts/backfillAdditionalHoles.js "C:\Users\Jack Gilson\Desktop\Golf (36).xlsx" --apply
 */

import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import dns from 'dns';
import GolfRoundsCollection from '../models/GolfRounds.js';
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
console.log(`Connected to DB: ${dbName}${apply ? ' (APPLY)' : ' (dry-run)'}\n`);

// ---- Read Excel ----
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(filePath);

// ---- Map sheet name -> courseKey via courseInfo ----
const courseInfo = await CourseInfoCollection.find({}, { displayName: 1, courseKey: 1 }).lean();
const courseKeyByName = new Map(courseInfo.map(c => [c.displayName, c.courseKey]));

// ---- Pre-load all existing round keys so we can flag misses cleanly ----
const allMongoKeys = new Set(
    (await GolfRoundsCollection.find({}, { 'roundInfo.key': 1 }).lean())
        .map(r => r.roundInfo?.key)
        .filter(Boolean)
);

// ---- Helpers ----
function detectHoleCount(ws) {
    const row3 = ws.getRow(3).values;
    let max = 0;
    for (const v of row3) {
        if (typeof v === 'string') {
            const m = v.match(/^Hole (\d+)$/);
            if (m) max = Math.max(max, parseInt(m[1]));
        }
    }
    return max >= 18 ? 18 : 9;
}

// Mirrors ImportFileHelper.js parse for additionalHoles (lines ~364-390).
function parseAdditionalHoles(row, parentCourseKey, additionalHoleStartCol) {
    if (!row[additionalHoleStartCol]) return null;
    const out = {};
    let holeCount = 1;
    let col = additionalHoleStartCol;
    for (let i = 0; i < 9; i++) {
        if (!row[col]) break;
        const dthRaw = row[col + 7];
        const dth = typeof dthRaw === 'number'
            ? dthRaw
            : dthRaw == null ? null
            : parseInt(String(dthRaw).split(', ')[0]);
        const puttLength = typeof dthRaw === 'number'
            ? dthRaw
            : dthRaw == null ? null
            : (() => {
                const parts = String(dthRaw).split(', ');
                return parseInt(parts[parts.length - 1]);
            })();
        out[`additionalHole${holeCount}`] = {
            course: row[col],
            courseKey: parentCourseKey,
            scoreCardHoleAbbreviation: '', // populated at app-import time; not required for storage
            hole: row[col + 1],
            score: parseInt(row[col + 2]),
            putts: parseInt(row[col + 3]),
            fir: row[col + 4],
            gir: row[col + 5],
            dtg: row[col + 6],
            dth,
            puttLength,
            notes: row[col + 8] ? row[col + 8] : ''
        };
        col += 9;
        holeCount++;
    }
    return Object.keys(out).length ? out : null;
}

// ---- Walk sheets ----
const updates = [];
const missesByCourse = {}; // round keys present in Excel but not in Mongo
const sheetSummary = [];
for (const ws of wb.worksheets) {
    if (ws.name === 'Legacy Rounds') continue;
    const courseKey = courseKeyByName.get(ws.name);
    if (!courseKey) {
        console.log(`! No courseInfo match for sheet "${ws.name}" — skipping`);
        continue;
    }
    const holeCount = detectHoleCount(ws);
    const startCol = holeCount === 18 ? 128 : 65;
    let withAdditional = 0;
    for (let rowNumber = 4; rowNumber <= ws.rowCount; rowNumber++) {
        const row = ws.getRow(rowNumber).values;
        if (!row || row.length === 0 || !row[1]) continue;
        const ah = parseAdditionalHoles(row, courseKey, startCol);
        if (!ah) continue;
        const roundKey = `${courseKey}${rowNumber - 3}`;
        if (!allMongoKeys.has(roundKey)) {
            (missesByCourse[ws.name] ||= []).push(roundKey);
            continue;
        }
        updates.push({ roundKey, additionalHoles: ah, sheet: ws.name });
        withAdditional++;
    }
    if (withAdditional > 0) sheetSummary.push({ sheet: ws.name, count: withAdditional });
}

console.log(`\n=== Summary ===`);
console.log(`Rounds with additionalHoles found in Excel: ${updates.length}`);
console.log(`Sheets contributing rounds (with counts):`);
sheetSummary.sort((a,b) => b.count - a.count).forEach(s => console.log(`  ${s.sheet.padEnd(35)}  ${s.count}`));

const missingRoundKeys = Object.values(missesByCourse).flat();
if (missingRoundKeys.length) {
    console.log(`\n${missingRoundKeys.length} Excel rounds have additionalHoles but no Mongo round-key match (will skip):`);
    for (const [sheet, keys] of Object.entries(missesByCourse)) {
        console.log(`  ${sheet}: ${keys.join(', ')}`);
    }
}

if (updates.length) {
    console.log(`\nSample additionalHoles object (first):`);
    console.log(JSON.stringify(updates[0], null, 2));
}

// ---- Apply ----
if (apply && updates.length) {
    console.log(`\n=== Applying ${updates.length} updates ===`);
    let ok = 0, fail = 0;
    for (const u of updates) {
        try {
            const r = await GolfRoundsCollection.updateOne(
                { 'roundInfo.key': u.roundKey },
                { $set: { additionalHoles: u.additionalHoles } }
            );
            if (r.matchedCount === 1) {
                ok++;
            } else {
                console.log(`  ✗ ${u.roundKey} — no match (matched=${r.matchedCount})`);
                fail++;
            }
        } catch (err) {
            console.log(`  ✗ ${u.roundKey} — ${err.message}`);
            fail++;
        }
    }
    console.log(`\nDone — updated ${ok}, failed ${fail}.`);
} else if (!apply && updates.length) {
    console.log(`\nDry-run only. Re-run with --apply to write to ${dbName}.`);
}

await mongoose.disconnect();

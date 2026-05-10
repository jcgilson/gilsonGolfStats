/**
 * Find course sheets in a Golf workbook that don't have a matching `courseInfo`
 * doc in the connected Mongo DB, parse each into the courseInfo shape the app
 * expects, and (optionally) insert them.
 *
 * Connection: same fallback as server.js — uri.js (gitignored) → MONGO_URI env.
 *
 * Usage (from server/):
 *   node scripts/addMissingCoursesToStaging.js "C:\Users\Jack Gilson\Desktop\Golf (36).xlsx"
 *   node scripts/addMissingCoursesToStaging.js "C:\Users\Jack Gilson\Desktop\Golf (36).xlsx" --apply
 *
 * Default = dry-run (no writes). --apply performs inserts.
 */

import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import dns from 'dns';
import CourseInfoCollection from '../models/CourseInfo.js';

// Same workaround as server.js: c-ares can fail SRV lookups for Atlas on Windows.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const filePath = process.argv[2];
const apply = process.argv.includes('--apply');

if (!filePath) {
    console.error('Pass the .xlsx path as the first arg.');
    process.exit(1);
}

// ---- Mongo connect (mirrors server.js logic) ----
let mongoURI;
try {
    const uriModule = await import('../uri.js');
    mongoURI = uriModule.uri ?? uriModule.default;
} catch { /* not present */ }
mongoURI = mongoURI ?? process.env.MONGO_URI;
if (!mongoURI) {
    console.error('MONGO_URI not set. Either export `uri` from server/uri.js or set MONGO_URI.');
    process.exit(1);
}
await mongoose.connect(mongoURI);

const dbName = mongoose.connection.db.databaseName;
console.log(`Connected to DB: ${dbName}${apply ? ' (APPLY mode — will write)' : ' (dry-run — no writes)'}\n`);

// ---- Read existing courses from Mongo ----
const existing = await CourseInfoCollection.find({}, { displayName: 1, courseKey: 1 }).lean();
const existingNames = new Set(existing.map(c => c.displayName));
const existingKeys = new Set(existing.map(c => c.courseKey));
console.log(`Existing courseInfo docs: ${existing.length}`);

// ---- Read workbook ----
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(filePath);

// Skip "Legacy Rounds"; everything else is a course sheet.
const courseSheets = wb.worksheets.filter(ws => ws.name !== 'Legacy Rounds');
console.log(`Course sheets in workbook: ${courseSheets.length}\n`);

// Manual per-course corrections applied after parsing the sheet.
// Reason: some workbook cells are blank/wrong; user supplies the right value.
const manualOverrides = {
    'Murphy Creek': { hole18: { handicap: 6 } },
};

// ---- Helpers ----
function deriveCourseKey(displayName, takenKeys) {
    // Strip non-alphanumeric (keep spaces), camelCase, ensure unique.
    const words = displayName
        .replace(/[^A-Za-z0-9 ]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
    let base = words.map((w, i) =>
        i === 0
            ? w.charAt(0).toLowerCase() + w.slice(1)
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join('');
    if (!base) base = 'course';
    let key = base;
    let n = 1;
    while (takenKeys.has(key)) {
        n++;
        key = `${base}${n}`;
    }
    return key;
}

// Mirrors the per-hole parse loop in ImportFileHelper.js (lines 56-89) but
// stripped of the `courses[]`-driven indirection — works directly on a sheet.
function parseCourseSheet(ws, courseKey, displayName) {
    const row2 = ws.getRow(2).values; // par/distance/handicap row
    const row3 = ws.getRow(3).values; // header row
    // Detect hole count by finding the highest "Hole N" header in row 3.
    // Some 9-hole sheets have an "Additional Hole #1 Course" marker at col 65,
    // but not all (e.g. Stanley - Blue is barebones 9-hole), so we can't rely on that alone.
    let maxHole = 0;
    for (const v of row3) {
        if (typeof v === 'string') {
            const m = v.match(/^Hole (\d+)$/);
            if (m) maxHole = Math.max(maxHole, parseInt(m[1]));
        }
    }
    const holeCount = maxHole >= 18 ? 18 : 9;
    const is9HoleCourse = holeCount === 9;

    const doc = { courseKey, displayName };
    let column = 2;
    let f9Par = 0, f9Yardage = 0, b9Par = 0, b9Yardage = 0;
    for (let hole = 1; hole <= holeCount; hole++) {
        const par = parseInt(row2[column]);
        const distance = parseInt(row2[column + 1]);
        const handicap = parseInt(row2[column + 2]);
        if (Number.isNaN(par)) {
            return { error: `Sheet "${ws.name}" hole ${hole} has non-numeric par at col ${column} (got: ${row2[column]})` };
        }
        doc[`hole${hole}`] = { hole, par, distance, handicap };
        if (hole <= 9) { f9Par += par; f9Yardage += distance || 0; }
        else { b9Par += par; b9Yardage += distance || 0; }
        column += 7;
    }
    doc.f9Par = f9Par;
    doc.f9Yardage = f9Yardage;
    if (!is9HoleCourse) {
        doc.b9Par = b9Par;
        doc.b9Yardage = b9Yardage;
    }
    doc.par = f9Par + b9Par;
    doc.yardage = f9Yardage + b9Yardage;
    doc._is9HoleCourse = is9HoleCourse; // strip before insert
    return { doc };
}

// ---- Find missing & parse ----
const missing = [];
const skipped = [];
const errors = [];
const takenKeys = new Set(existingKeys);
for (const ws of courseSheets) {
    if (existingNames.has(ws.name)) {
        skipped.push(ws.name);
        continue;
    }
    const courseKey = deriveCourseKey(ws.name, takenKeys);
    takenKeys.add(courseKey);
    const result = parseCourseSheet(ws, courseKey, ws.name);
    if (result.error) {
        errors.push(result.error);
        continue;
    }
    const overrides = manualOverrides[ws.name];
    if (overrides) {
        for (const [holeKey, fields] of Object.entries(overrides)) {
            result.doc[holeKey] = { ...result.doc[holeKey], ...fields };
        }
    }
    missing.push(result.doc);
}

console.log(`Already in Mongo (skipped): ${skipped.length}`);
console.log(`Missing from Mongo (will ${apply ? 'INSERT' : 'preview'}): ${missing.length}`);
if (errors.length) {
    console.log(`\nParse errors (skipped): ${errors.length}`);
    errors.forEach(e => console.log(`  - ${e}`));
}

console.log('\n=== Missing courses preview ===');
for (const doc of missing) {
    const hf = doc._is9HoleCourse ? '9-hole' : '18-hole';
    console.log(`\n• ${doc.displayName}  [courseKey=${doc.courseKey}, ${hf}, par=${doc.par}, yardage=${doc.yardage}]`);
    for (let h = 1; h <= (doc._is9HoleCourse ? 9 : 18); h++) {
        const hi = doc[`hole${h}`];
        console.log(`    hole${h}: par=${hi.par}, distance=${hi.distance}, handicap=${hi.handicap}`);
    }
}

// ---- Apply ----
if (apply && missing.length) {
    console.log(`\n=== Inserting ${missing.length} courseInfo docs ===`);
    let ok = 0, fail = 0;
    for (const doc of missing) {
        const { _is9HoleCourse, ...clean } = doc;
        try {
            await new CourseInfoCollection(clean).save();
            console.log(`  ✓ inserted ${clean.displayName} (${clean.courseKey})`);
            ok++;
        } catch (err) {
            console.log(`  ✗ FAILED ${clean.displayName}: ${err.message}`);
            fail++;
        }
    }
    console.log(`\nDone — inserted ${ok}, failed ${fail}.`);
} else if (!apply && missing.length) {
    console.log(`\nDry-run only. Re-run with --apply to insert these into ${dbName}.`);
}

await mongoose.disconnect();

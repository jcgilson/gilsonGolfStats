/**
 * One-shot: dump the structure of the user's Golf workbook so we can
 * see how each sheet (course) is laid out, especially the legacy first
 * sheet, and decide whether/how to import its rows.
 *
 * Usage (from server/):
 *   node scripts/inspectExcel.js "C:\\Users\\Jack Gilson\\Downloads\\Golf (34).xlsx"
 */

import ExcelJS from 'exceljs';

const filePath = process.argv[2];
if (!filePath) {
    console.error('Pass the .xlsx path as the first arg.');
    process.exit(1);
}

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(filePath);

console.log(`Workbook: ${filePath}`);
console.log(`Sheet count: ${wb.worksheets.length}`);
console.log('');

for (const ws of wb.worksheets) {
    console.log(`--- Sheet: "${ws.name}" | rows: ${ws.rowCount} | cols: ${ws.columnCount}`);
}

console.log('\n=== FIRST SHEET (legacy) detail ===');
const first = wb.worksheets[0];
console.log(`Name: ${first.name}`);
const headerRow1 = first.getRow(1).values;
const headerRow2 = first.getRow(2).values;
const headerRow3 = first.getRow(3).values;
console.log('Row 1:', JSON.stringify(headerRow1));
console.log('Row 2:', JSON.stringify(headerRow2));
console.log('Row 3:', JSON.stringify(headerRow3));
console.log('');
console.log('All Legacy data rows (row 4+) — non-empty only:');
let legacyCount = 0;
const yearCounts = {};
const courseCounts = {};
let withPutts = 0;
let withoutPutts = 0;
let firstDate = null;
let lastDate = null;
const allLegacy = [];
for (let r = 4; r <= first.rowCount; r++) {
    const vals = first.getRow(r).values;
    if (!vals || vals.length === 0 || (!vals[2] && !vals[3])) continue;
    legacyCount++;
    const year = vals[1];
    const date = vals[2];
    const course = vals[3];
    const par = vals[4];
    const score = vals[5];
    const putts = vals[6];
    const fir = vals[7];
    const gir = vals[8];
    const notes = vals[9];
    yearCounts[year] = (yearCounts[year] || 0) + 1;
    courseCounts[course] = (courseCounts[course] || 0) + 1;
    if (putts) withPutts++; else withoutPutts++;
    if (!firstDate || date < firstDate) firstDate = date;
    if (!lastDate || date > lastDate) lastDate = date;
    allLegacy.push({ row: r, year, date, course, par, score, putts, fir, gir, notes });
}
console.log(`Legacy round count: ${legacyCount}`);
console.log(`Date span: ${firstDate} -> ${lastDate}`);
console.log(`With putts data: ${withPutts}, without putts: ${withoutPutts}`);
console.log(`Year breakdown:`, yearCounts);
console.log(`Course breakdown:`, Object.fromEntries(Object.entries(courseCounts).sort((a,b)=>b[1]-a[1])));
console.log(`\nFirst 10:`); allLegacy.slice(0,10).forEach(r => console.log(JSON.stringify(r)));
console.log(`\nLast 10:`); allLegacy.slice(-10).forEach(r => console.log(JSON.stringify(r)));
console.log(`\nSample of undefined-year rows (first 10):`);
allLegacy.filter(r => r.year === undefined).slice(0,10).forEach(r => console.log(JSON.stringify(r)));
console.log(`\nUnique course names in Legacy not matching modern sheet names:`);
const sheetNames = new Set(wb.worksheets.map(s => s.name));
const unmatched = [...new Set(allLegacy.map(r => r.course))].filter(c => c && !sheetNames.has(c));
console.log(unmatched);

console.log('\n=== SECOND SHEET (modern format) header for comparison ===');
if (wb.worksheets[1]) {
    const second = wb.worksheets[1];
    console.log(`Name: ${second.name}`);
    console.log('Row 1:', JSON.stringify(second.getRow(1).values));
    console.log('Row 2:', JSON.stringify(second.getRow(2).values));
    console.log('Row 3:', JSON.stringify(second.getRow(3).values));
    console.log(`Total rows: ${second.rowCount}`);
}

// Parser for the "Legacy Rounds" sheet of the Golf workbook. Returns an array
// of round documents shaped to fit the existing golfrounds collection — flagged
// `nonGhinRounds.legacyRound = true` so the rest of the app (handicap calc,
// per-hole metric helpers, etc.) already excludes them via existing guards.
//
// Used by both the browser-side importer and the server-side backfill script.

export const LEGACY_COURSE_KEY = 'Legacy';

const isPar3Course = (course) => typeof course === 'string' && /Par\s*3/i.test(course);

const formatExcelDate = (d) => {
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const y = String(d.getFullYear()).slice(-2);
    return `${m}/${day}/${y}`;
};

// "70" -> 70, "70*" -> 70 (with marker), "Unknown" / "8 thru 8" -> null (raw kept as note)
const parseStarSuffixNumber = (raw, recordMarker) => {
    if (typeof raw === 'number') return { value: raw, markers: [] };
    if (typeof raw !== 'string') return { value: null, markers: [] };
    const trimmed = raw.trim();
    if (trimmed.endsWith('*')) {
        const n = parseInt(trimmed.slice(0, -1));
        if (!Number.isNaN(n)) return { value: n, markers: [recordMarker] };
        return { value: null, rawNote: trimmed, markers: [] };
    }
    const n = parseInt(trimmed);
    if (!Number.isNaN(n) && String(n) === trimmed) return { value: n, markers: [] };
    // Non-numeric (e.g. "8 thru 8", "Unknown")
    return { value: null, rawNote: trimmed, markers: [] };
};

export const parseLegacyRounds = (sheet) => {
    const rounds = [];
    if (!sheet) return rounds;
    let legacySequence = 1;
    for (let rowNumber = 4; rowNumber <= sheet.rowCount; rowNumber++) {
        const row = sheet.getRow(rowNumber).values;
        if (!row || row.length === 0) continue;
        const yearRaw = row[1];
        const dateRaw = row[2];
        const course = row[3];
        const parRaw = row[4];
        const scoreRaw = row[5];
        const puttsRaw = row[6];
        const firRaw = row[7];
        const girRaw = row[8];
        const noteRaw = row[9];
        // Skip blank rows: no course AND no date AND no score
        if (!course && !dateRaw && scoreRaw == null) continue;

        // ---- Date / display label / year-for-filter ----
        let date = null;
        let dateLabel = null;
        if (dateRaw instanceof Date) {
            date = formatExcelDate(dateRaw);
            dateLabel = date;
        } else if (typeof dateRaw === 'string' && dateRaw.trim()) {
            dateLabel = dateRaw.trim(); // "Undated"
        }

        let yearForFilter = null;
        if (typeof yearRaw === 'number') {
            yearForFilter = yearRaw;
        } else if (typeof yearRaw === 'string') {
            const range = yearRaw.match(/(\d{4})\s*-\s*(\d{4})/);
            if (range) {
                yearForFilter = Math.floor((parseInt(range[1]) + parseInt(range[2])) / 2);
                if (!date) dateLabel = `~${range[1].slice(-2)}-${range[2].slice(-2)}`;
            } else {
                const single = yearRaw.match(/(\d{4})/);
                if (single) {
                    yearForFilter = parseInt(single[1]);
                    if (!date && !dateLabel) dateLabel = yearRaw.trim(); // "est. 2015"
                }
            }
        }
        if (date && yearForFilter == null) {
            yearForFilter = 2000 + parseInt(date.split('/')[2]);
        }
        if (!dateLabel) dateLabel = 'Undated';

        // ---- Score ----
        const scoreParsed = parseStarSuffixNumber(scoreRaw, 'Record');
        const score = scoreParsed.value;
        const extraNotes = [...scoreParsed.markers];
        if (scoreParsed.rawNote) extraNotes.push(`Score: ${scoreParsed.rawNote}`);

        // ---- FIR / GIR aggregates ----
        const firParsed = parseStarSuffixNumber(firRaw, 'All-F');
        const girParsed = parseStarSuffixNumber(girRaw, 'All-G');
        if (firParsed.markers.length) extraNotes.push(...firParsed.markers);
        if (girParsed.markers.length) extraNotes.push(...girParsed.markers);

        // ---- Par ----
        const par = typeof parRaw === 'number' ? parRaw : parseInt(parRaw);
        const parClean = Number.isNaN(par) ? null : par;

        // ---- Putts ----
        const putts = typeof puttsRaw === 'number' ? puttsRaw : null;

        // ---- Round key (Par3 suffix lets existing handicap filter exclude) ----
        const par3 = isPar3Course(course);
        const key = par3 ? `LegacyPar3${legacySequence}` : `Legacy${legacySequence}`;

        const baseNote = (typeof noteRaw === 'string' && noteRaw.trim()) ? noteRaw.trim() : '';
        const combinedNotes = [baseNote, ...extraNotes].filter(Boolean).join(' | ');

        rounds.push({
            roundInfo: {
                key,
                course: course || 'Unknown',
                courseKey: LEGACY_COURSE_KEY,
                date,
                dateLabel,
                yearForFilter,
                legacySequence,
                roundNotes: combinedNotes,
                numHoles: 0,
                fullFront9: false,
                fullBack9: false,
                partialFront9: false,
                partialBack9: false,
            },
            nonGhinRounds: {
                legacyRound: true,
                scrambleRound: false,
                leagueRound: false,
                boozeRound: false,
            },
            scoring: {
                coursePar: parClean,
                total: score,
                scoreToPar: (score != null && parClean != null) ? score - parClean : null,
                in: 0, out: 0,
                numEagles: 0, numBirdies: 0, numPars: 0, numBogey: 0, numBogeyPlus: 0,
                underParRound: false,
            },
            putting: { putts },
            fairways: { f: firParsed.value },
            greens: { g: girParsed.value, gur: 0 },
        });
        legacySequence++;
    }
    return rounds;
};

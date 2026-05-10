import { useState, useMemo } from 'react';
import {
    Table, TableBody, TableHead, TableRow, TableCell, TableSortLabel,
    Button, IconButton, Collapse, Box, Chip,
} from '@mui/material';
import { ExpandMore, ExpandLess, Add, Edit } from '@mui/icons-material';
import AddCourseForm from './AddCourseForm';
import { isLocalhost } from '../helpers/GolfConsts';

// Parse "MM/DD/YY" -> millis. Used for first/last played and best-round date display.
const parseDate = (s) => {
    if (!s || typeof s !== 'string') return 0;
    const [m, d, y] = s.split('/').map(n => parseInt(n));
    if (Number.isNaN(m) || Number.isNaN(d) || Number.isNaN(y)) return 0;
    return new Date(2000 + y, m - 1, d).getTime();
};

// Real-round filters. Full-18 is the default record source; 9-hole records are
// used as a fallback when a course has never been played for a full 18 — the
// table would otherwise show '—' for best/avg score on a course Jack has only
// ever played 9 holes at.
const isExcludedRound = (r) =>
    r.nonGhinRounds?.scrambleRound ||
    r.nonGhinRounds?.leagueRound ||
    r.nonGhinRounds?.boozeRound ||
    r.nonGhinRounds?.legacyRound;
const isRecordRound = (r) =>
    r.roundInfo?.fullFront9 && r.roundInfo?.fullBack9 && !isExcludedRound(r);
const is9HoleRecord = (r) =>
    !isExcludedRound(r) &&
    ((r.roundInfo?.fullFront9 && !r.roundInfo?.fullBack9) ||
     (!r.roundInfo?.fullFront9 && r.roundInfo?.fullBack9));
const nineHoleSide = (r) => r.roundInfo?.fullFront9 ? 'F9' : 'B9';

const minBy = (arr, key) => arr.reduce((best, r) => (best == null || r[key] < best[key]) ? r : best, null);
const maxBy = (arr, key) => arr.reduce((best, r) => (best == null || r[key] > best[key]) ? r : best, null);

const summarize = (course, rounds) => {
    const byCourse = rounds.filter(r => r.roundInfo?.courseKey === course.courseKey);
    const full18 = byCourse.filter(isRecordRound);
    const full9 = byCourse.filter(is9HoleRecord);

    // Fallback: if no full-18 rounds, drive best/worst/avg from full-9 rounds.
    // Records list is homogeneous (all 18 OR all 9) so averages stay coherent.
    const is9HoleOnly = full18.length === 0 && full9.length > 0;
    const recordable = is9HoleOnly ? full9 : full18;
    const holesPerRecord = is9HoleOnly ? 9 : 18;

    // For the 9-hole case, "possible fairways" depends on which 9 was played.
    // Use the most-recent record's possibleFairways as a representative figure;
    // it's the cleanest single number for the "out of N" FIR label.
    let numFairways = 0;
    if (is9HoleOnly) {
        numFairways = recordable[0]?.fairways?.possibleFairways ?? 0;
    } else {
        for (let h = 1; h <= 18; h++) {
            const hole = course[`hole${h}`];
            if (hole && hole.par != null && hole.par !== 3) numFairways++;
        }
    }

    const summary = {
        ...course,
        numRounds: byCourse.length,
        numFullRounds: recordable.length,
        is9HoleOnly,
        numFairways,
        firstPlayed: null,
        lastPlayed: null,
        avgScore: null,
        avgScoreToPar: null,
        best: { score: null, putts: null, fir: null, gir: null },
        worst: { score: null, putts: null, fir: null, gir: null },
        totals: { eagles: 0, birdies: 0, pars: 0, bogey: 0, bogeyPlus: 0, num3Putts: 0 },
    };

    if (byCourse.length > 0) {
        const dates = byCourse.map(r => r.roundInfo.date).filter(Boolean).map(d => ({ d, t: parseDate(d) })).filter(x => x.t > 0);
        if (dates.length > 0) {
            dates.sort((a, b) => a.t - b.t);
            summary.firstPlayed = dates[0].d;
            summary.lastPlayed = dates[dates.length - 1].d;
        }
    }

    if (recordable.length > 0) {
        // Flatten metrics on each round to make min/max convenient.
        const aug = recordable.map(r => ({
            round: r,
            score: r.scoring?.total ?? null,
            scoreToPar: r.scoring?.scoreToPar ?? 0,
            putts: r.putting?.putts ?? null,
            fir: r.fairways?.f ?? 0,
            gir: (r.greens?.g ?? 0) + (r.greens?.gur ?? 0),
            side: is9HoleOnly ? nineHoleSide(r) : null,
        })).filter(x => x.score != null);

        if (aug.length > 0) {
            summary.avgScore = (aug.reduce((s, x) => s + x.score, 0) / aug.length).toFixed(1);
            summary.avgScoreToPar = (aug.reduce((s, x) => s + x.scoreToPar, 0) / aug.length).toFixed(1);

            const bestScore = minBy(aug, 'score');
            const worstScore = maxBy(aug, 'score');
            const bestPutts = minBy(aug.filter(x => x.putts != null), 'putts');
            const worstPutts = maxBy(aug.filter(x => x.putts != null), 'putts');
            const bestFIR = maxBy(aug, 'fir');
            const worstFIR = minBy(aug, 'fir');
            const bestGIR = maxBy(aug, 'gir');
            const worstGIR = minBy(aug, 'gir');

            summary.best.score = bestScore ? { value: bestScore.score, scoreToPar: bestScore.scoreToPar, date: bestScore.round.roundInfo.date, side: bestScore.side } : null;
            summary.worst.score = worstScore ? { value: worstScore.score, scoreToPar: worstScore.scoreToPar, date: worstScore.round.roundInfo.date, side: worstScore.side } : null;
            summary.best.putts = bestPutts ? { value: bestPutts.putts, date: bestPutts.round.roundInfo.date, side: bestPutts.side } : null;
            summary.worst.putts = worstPutts ? { value: worstPutts.putts, date: worstPutts.round.roundInfo.date, side: worstPutts.side } : null;
            summary.best.fir = bestFIR ? { value: bestFIR.fir, date: bestFIR.round.roundInfo.date, side: bestFIR.side } : null;
            summary.worst.fir = worstFIR ? { value: worstFIR.fir, date: worstFIR.round.roundInfo.date, side: worstFIR.side } : null;
            summary.best.gir = bestGIR ? { value: bestGIR.gir, date: bestGIR.round.roundInfo.date, side: bestGIR.side } : null;
            summary.worst.gir = worstGIR ? { value: worstGIR.gir, date: worstGIR.round.roundInfo.date, side: worstGIR.side } : null;
        }

        for (const r of recordable) {
            summary.totals.eagles += r.scoring?.numEagles ?? 0;
            summary.totals.birdies += r.scoring?.numBirdies ?? 0;
            summary.totals.pars += r.scoring?.numPars ?? 0;
            summary.totals.bogey += r.scoring?.numBogey ?? 0;
            summary.totals.bogeyPlus += r.scoring?.numBogeyPlus ?? 0;
            summary.totals.num3Putts += r.putting?.num3Putts ?? 0;
        }
    }

    // Distribution denominators scale to record length (9 or 18).
    summary.totalHolesPlayed = summary.numFullRounds * holesPerRecord;
    summary.avg3PuttsPerRound = summary.numFullRounds > 0
        ? summary.totals.num3Putts / summary.numFullRounds
        : null;
    summary.holesPerRecord = holesPerRecord;

    return summary;
};

const HEADERS = [
    { key: 'sequence', label: '#', numeric: true, align: 'right' },
    { key: 'displayName', label: 'Course', numeric: false },
    { key: 'firstPlayedSort', label: 'First played', numeric: false, render: (s) => s.firstPlayed ?? '—' },
    { key: 'lastPlayedSort', label: 'Last played', numeric: false, render: (s) => s.lastPlayed ?? '—' },
    { key: 'numRounds', label: 'Rounds', numeric: true, align: 'right' },
    { key: 'bestScoreNum', label: 'Best score', numeric: true, align: 'right', render: (s) => s.best.score ? formatBestScoreCell(s.best.score) : '—' },
    { key: 'avgScoreNum', label: 'Avg score', numeric: true, align: 'right', render: (s) => s.avgScore ?? '—' },
    { key: 'birdiesPlusTotal', label: 'Birdies+', numeric: true, align: 'right' },
    { key: 'bogeyPlusTotal', label: 'Bogey+', numeric: true, align: 'right' },
];

const CoursesPage = ({ courseInfo, allRounds, apiUrl, onRefreshCourseInfo }) => {
    const [view, setView] = useState('list'); // 'list' | 'add' | 'edit'
    const [editingCourseKey, setEditingCourseKey] = useState(null);
    const [sortKey, setSortKey] = useState('sequence');
    const [sortOrder, setSortOrder] = useState('asc');
    const [expandedKey, setExpandedKey] = useState(null);

    const editingCourse = useMemo(
        () => editingCourseKey ? courseInfo.find(c => c.courseKey === editingCourseKey) : null,
        [editingCourseKey, courseInfo]
    );

    const summaries = useMemo(() => {
        const out = courseInfo.map(c => {
            const s = summarize(c, allRounds);
            // Numeric fields used purely for sorting.
            s.firstPlayedSort = parseDate(s.firstPlayed);
            s.lastPlayedSort = parseDate(s.lastPlayed);
            s.bestScoreNum = s.best.score?.scoreToPar ?? Number.POSITIVE_INFINITY;
            s.avgScoreNum = s.avgScore != null ? parseFloat(s.avgScore) : Number.POSITIVE_INFINITY;
            s.birdiesPlusTotal = (s.totals?.birdies ?? 0) + (s.totals?.eagles ?? 0);
            s.bogeyPlusTotal = s.totals?.bogeyPlus ?? 0;
            return s;
        });
        return out;
    }, [courseInfo, allRounds]);

    const sorted = useMemo(() => {
        const arr = [...summaries];
        const dir = sortOrder === 'asc' ? 1 : -1;
        arr.sort((a, b) => {
            const av = a[sortKey] ?? 0;
            const bv = b[sortKey] ?? 0;
            if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir;
            if (av < bv) return -1 * dir;
            if (av > bv) return 1 * dir;
            return 0;
        });
        return arr;
    }, [summaries, sortKey, sortOrder]);

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    if (view === 'add' || view === 'edit') {
        const goBack = () => {
            setView('list');
            setEditingCourseKey(null);
        };
        return (
            <div>
                <div className="flexRow alignCenter" style={{ gap: '16px', marginLeft: '5vw', marginTop: '24px' }}>
                    <Button onClick={goBack} sx={ghostBtnSx}>← Back to courses</Button>
                </div>
                <AddCourseForm
                    courseInfo={courseInfo}
                    apiUrl={apiUrl}
                    editingCourse={view === 'edit' ? editingCourse : null}
                    onCreated={() => { if (onRefreshCourseInfo) onRefreshCourseInfo(); }}
                    onUpdated={() => {
                        if (onRefreshCourseInfo) onRefreshCourseInfo();
                        goBack();
                    }}
                />
            </div>
        );
    }

    return (
        <div className="width90Percent flexColumn marginTopMedium" style={{ marginLeft: '5vw' }}>
            <div className="flexRow alignCenter justifySpaceBetween" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 className="strongFont whiteFont" style={{ margin: 0, fontSize: '28px', letterSpacing: '0.5px' }}>Courses ({summaries.length})</h2>
                {isLocalhost && (
                    <Button variant="contained" disableElevation startIcon={<Add />} onClick={() => setView('add')} sx={primaryBtnSx}>
                        Add new course
                    </Button>
                )}
            </div>

            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell style={{ width: '60px' }}><b>Expand</b></TableCell>
                        {HEADERS.map(h => (
                            <TableCell key={h.key} align={h.align ?? 'left'}>
                                <TableSortLabel
                                    active={sortKey === h.key}
                                    direction={sortKey === h.key ? sortOrder : 'asc'}
                                    onClick={() => handleSort(h.key)}
                                    className={sortKey === h.key ? 'sortLabelActive' : ''}
                                >
                                    <b>{h.label}</b>
                                </TableSortLabel>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sorted.map(s => {
                        const isOpen = expandedKey === s.courseKey;
                        return (
                            <CourseRow
                                key={s.courseKey}
                                summary={s}
                                isOpen={isOpen}
                                onToggle={() => setExpandedKey(isOpen ? null : s.courseKey)}
                                onEdit={() => {
                                    setEditingCourseKey(s.courseKey);
                                    setView('edit');
                                }}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

const CourseRow = ({ summary: s, isOpen, onToggle, onEdit }) => {
    return (
        <>
            <TableRow className="expandRow" hover>
                <TableCell className="expandCell" onClick={onToggle}>
                    <IconButton size="small" className="expandIcon" sx={{ color: 'inherit' }}>{isOpen ? <ExpandLess /> : <ExpandMore />}</IconButton>
                </TableCell>
                <TableCell align="right">{s.sequence ?? '—'}</TableCell>
                <TableCell>
                    <span style={{ fontWeight: 500 }}>{s.displayName}</span>
                    {s.flagKey && <span className="whiteFont" style={{ marginLeft: '14px', fontSize: '11px', opacity: 0.7 }}>({s.flagKey})</span>}
                </TableCell>
                <TableCell>{s.firstPlayed ?? '—'}</TableCell>
                <TableCell>{s.lastPlayed ?? '—'}</TableCell>
                <TableCell align="right">{s.numRounds || 0}</TableCell>
                <TableCell align="right">{s.best.score ? formatBestScoreCell(s.best.score) : '—'}</TableCell>
                <TableCell align="right">{s.avgScore != null ? `${s.avgScore}${s.is9HoleOnly ? ' (9)' : ''}` : '—'}</TableCell>
                <TableCell align="right">{s.birdiesPlusTotal ?? 0}</TableCell>
                <TableCell align="right">{s.bogeyPlusTotal ?? 0}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={HEADERS.length + 1} style={{ paddingTop: 0, paddingBottom: 0, border: isOpen ? undefined : 'none' }}>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <CourseDetail summary={s} onEdit={onEdit} />
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

const sectionLabelStyle = { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px' };
const subLineStyle = { fontSize: '12px', marginTop: '2px' };
const chipSx = { color: '#fff', borderColor: 'rgba(255,255,255,0.4)', fontFamily: 'var(--fontFamily-Regular)' };

// Branded button styles. Primary = hero green pill with eagle-yellow hover accent.
// Secondary = ghost pill (transparent, white border) for back / cancel.
const primaryBtnSx = {
    backgroundColor: '#026647',
    color: '#fff',
    fontFamily: 'var(--fontFamily-Regular)',
    fontWeight: 700,
    textTransform: 'none',
    letterSpacing: '0.3px',
    borderRadius: '48px',
    padding: '8px 18px',
    boxShadow: '0 4px 2px -2px rgba(0,0,0,.4)',
    border: '1px solid rgba(255,255,255,0.15)',
    '&:hover': {
        backgroundColor: '#014A33',
        boxShadow: '0 4px 12px -2px rgba(0,0,0,.4)',
    },
    '&:hover .MuiButton-startIcon, &:hover .MuiSvgIcon-root': {
        color: '#FECD31',
    },
};
const ghostBtnSx = {
    color: '#fff',
    fontFamily: 'var(--fontFamily-Regular)',
    fontWeight: 600,
    textTransform: 'none',
    letterSpacing: '0.3px',
    borderRadius: '48px',
    padding: '6px 16px',
    border: '1px solid rgba(255,255,255,0.4)',
    '&:hover': { borderColor: '#FECD31', color: '#FECD31' },
};

const formatScoreToPar = (n) => (n > 0 ? `+${n}` : n < 0 ? `${n}` : 'E');

// Best-score cell: "39 (+3) F9" when the underlying record is a 9-hole round,
// "73 (+1)" when it's a full 18.
const formatBestScoreCell = (best) =>
    `${best.value} (${formatScoreToPar(best.scoreToPar)})${best.side ? ` ${best.side}` : ''}`;

const ChipPair = ({ label, labelSuffix, best, worst, suffix = '' }) => {
    const formatChip = (prefix, m) => {
        if (!m) return `${prefix}: —`;
        const par = m.scoreToPar != null ? ` (${formatScoreToPar(m.scoreToPar)})` : '';
        const side = m.side ? ` ${m.side}` : '';
        return `${prefix}: ${m.value}${suffix}${par}${side}`;
    };
    const bestLabel = formatChip('Best', best);
    const worstLabel = formatChip('Worst', worst);
    return (
        <div className="flexColumn" style={{ minWidth: '160px', marginRight: '24px', marginBottom: '8px' }}>
            <span className="whiteFont serifFont" style={sectionLabelStyle}>
                {label}{labelSuffix != null && <span style={{ marginLeft: '24px', opacity: 0.75 }}>({labelSuffix})</span>}
            </span>
            <div className="flexRow alignCenter" style={{ gap: '6px', marginTop: '4px' }}>
                <Chip
                    size="small"
                    label={worstLabel}
                    title={worst ? worst.date : ''}
                    variant="outlined"
                    sx={chipSx}
                />
                <Chip
                    size="small"
                    label={bestLabel}
                    title={best ? best.date : ''}
                    variant="outlined"
                    sx={chipSx}
                />
            </div>
        </div>
    );
};

const CourseDetail = ({ summary: s, onEdit }) => (
    <Box className="whiteFont" style={{ padding: '16px 24px 24px 24px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '6px', margin: '8px 0' }}>
        <div className="flexRow alignCenter justifySpaceBetween" style={{ marginBottom: '12px' }}>
            <span className="whiteFont serifFont" style={sectionLabelStyle}>Course detail</span>
            <Button size="small" variant="outlined" startIcon={<Edit />} onClick={(e) => { e.stopPropagation(); onEdit(); }} sx={ghostBtnSx}>
                Edit course
            </Button>
        </div>
        <div className="flexRow" style={{ flexWrap: 'wrap', gap: '24px', marginBottom: '16px' }}>
            <div className="flexColumn">
                <span className="whiteFont serifFont" style={sectionLabelStyle}>Course</span>
                <span style={{ marginTop: '2px' }}>
                    <b>Par {s.par ?? '—'}</b> &middot; {s.yardage ?? '—'} yd
                </span>
                <span className="whiteFont serifFont" style={subLineStyle}>
                    F9: par {s.f9Par ?? '—'} / {s.f9Yardage ?? '—'} yd
                    {s.b9Par != null && (<>&nbsp;&middot; B9: par {s.b9Par} / {s.b9Yardage} yd</>)}
                </span>
            </div>
            <div className="flexColumn">
                <span className="whiteFont serifFont" style={sectionLabelStyle}>Activity</span>
                <span style={{ marginTop: '2px' }}>
                    <b>{s.numRounds}</b> total rounds &middot; <b>{s.numFullRounds}</b> {s.is9HoleOnly ? 'full-9 rounds' : 'full-18 rounds'}
                </span>
                <span className="whiteFont serifFont" style={subLineStyle}>
                    First {s.firstPlayed ?? '—'} &middot; Last {s.lastPlayed ?? '—'}
                </span>
            </div>
            <div className="flexColumn">
                <span className="whiteFont serifFont" style={sectionLabelStyle}>Scoring average{s.is9HoleOnly ? ' (9 holes)' : ''}</span>
                <span style={{ marginTop: '2px' }}>
                    {s.avgScore != null ? <b>{s.avgScore} ({s.avgScoreToPar > 0 ? '+' : ''}{s.avgScoreToPar})</b> : '—'}
                </span>
            </div>
        </div>

        <div className="flexRow" style={{ flexWrap: 'wrap' }}>
            <ChipPair label="Score" best={s.best.score} worst={s.worst.score} />
            <ChipPair label="Putts" best={s.best.putts} worst={s.worst.putts} />
            <ChipPair label="FIR" labelSuffix={`out of ${s.numFairways}`} best={s.best.fir} worst={s.worst.fir} />
            <ChipPair label="GIR" best={s.best.gir} worst={s.worst.gir} />
        </div>

        <div className="flexColumn" style={{ marginTop: '12px', gap: '6px' }}>
            <span className="whiteFont serifFont" style={sectionLabelStyle}>
                Total holes played <span style={{ marginLeft: '24px', opacity: 0.75 }}>({s.totalHolesPlayed})</span>
            </span>
            <div className="flexRow" style={{ flexWrap: 'wrap', gap: '20px' }}>
                {[
                    ['Eagles',  s.totals.eagles],
                    ['Birdies', s.totals.birdies],
                    ['Pars',    s.totals.pars],
                    ['Bogeys',  s.totals.bogey],
                    ['Bogey+',  s.totals.bogeyPlus],
                ].map(([label, n]) => (
                    <span key={label}>
                        <b>{label}:</b> {n}
                        {s.totalHolesPlayed > 0 && (
                            <span style={{ marginLeft: '24px', opacity: 0.75 }}>
                                ({((n / s.totalHolesPlayed) * 100).toFixed(1)}%)
                            </span>
                        )}
                    </span>
                ))}
                <span>
                    <b>3-putts:</b> {s.totals.num3Putts}
                    {s.avg3PuttsPerRound != null && (
                        <span style={{ marginLeft: '24px', opacity: 0.75 }}>
                            ({s.avg3PuttsPerRound.toFixed(2)} / {s.holesPerRecord ?? 18})
                        </span>
                    )}
                </span>
            </div>
        </div>
    </Box>
);

export default CoursesPage;

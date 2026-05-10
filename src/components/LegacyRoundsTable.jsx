import { useMemo, useState } from 'react';
import {
    Table, TableHead, TableBody, TableRow, TableCell, TableSortLabel,
} from '@mui/material';

// "MM/DD/YY" -> millis. Returns 0 for null/undated rows so they sort to the
// bottom of date-asc and top of date-desc — but the dateLabel column shows
// the truth either way.
const dateToMillis = (s) => {
    if (!s || typeof s !== 'string') return 0;
    const [m, d, y] = s.split('/').map(n => parseInt(n));
    if (Number.isNaN(m) || Number.isNaN(d) || Number.isNaN(y)) return 0;
    return new Date(2000 + y, m - 1, d).getTime();
};

const HEADERS = [
    { key: 'sortDate', label: 'Date', align: 'left' },
    { key: 'course', label: 'Course', align: 'left' },
    { key: 'par', label: 'Par', align: 'right' },
    { key: 'score', label: 'Score', align: 'right' },
    { key: 'scoreToPar', label: '+/-', align: 'right' },
    { key: 'putts', label: 'Putts', align: 'right' },
    { key: 'fir', label: 'FIR', align: 'right' },
    { key: 'gir', label: 'GIR', align: 'right' },
    { key: 'notes', label: 'Notes', align: 'left' },
];

const formatPlusMinus = (n) => {
    if (n == null) return '—';
    if (n > 0) return `+${n}`;
    if (n < 0) return `${n}`;
    return 'E';
};

const LegacyRoundsTable = ({ allRounds }) => {
    const [sortKey, setSortKey] = useState('sortDate');
    const [sortOrder, setSortOrder] = useState('desc'); // newest-first by default

    const rows = useMemo(() => {
        return allRounds
            .filter(r => r.nonGhinRounds?.legacyRound)
            .map(r => ({
                key: r.roundInfo.key,
                sequence: r.roundInfo.legacySequence,
                date: r.roundInfo.dateLabel ?? r.roundInfo.date ?? '—',
                course: r.roundInfo.course,
                par: r.scoring?.coursePar ?? null,
                score: r.scoring?.total ?? null,
                scoreToPar: r.scoring?.scoreToPar ?? null,
                putts: r.putting?.putts ?? null,
                fir: r.fairways?.f ?? null,
                gir: r.greens?.g ?? null,
                notes: r.roundInfo?.roundNotes ?? '',
                // Sort helpers — concrete date if we have one, else year midpoint, else 0.
                sortDate: dateToMillis(r.roundInfo.date) || (r.roundInfo.yearForFilter ? new Date(r.roundInfo.yearForFilter, 0, 1).getTime() : 0),
            }));
    }, [allRounds]);

    const sorted = useMemo(() => {
        const arr = [...rows];
        const dir = sortOrder === 'asc' ? 1 : -1;
        const isNumericKey = ['sortDate', 'par', 'score', 'scoreToPar', 'putts', 'fir', 'gir'].includes(sortKey);
        arr.sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            // Push nulls to the bottom regardless of direction.
            if (av == null && bv == null) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            if (isNumericKey) return (av - bv) * dir;
            return String(av).localeCompare(String(bv)) * dir;
        });
        return arr;
    }, [rows, sortKey, sortOrder]);

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            // Date defaults newest-first; everything else defaults asc.
            setSortOrder(key === 'sortDate' ? 'desc' : 'asc');
        }
    };

    return (
        <div className="width90Percent flexColumn marginTopMedium" style={{ marginLeft: '5vw' }}>
            <div style={{ marginBottom: '12px' }}>
                <h2 className="strongFont whiteFont" style={{ margin: 0, fontSize: '28px', letterSpacing: '0.5px' }}>Legacy Rounds ({rows.length})</h2>
                <p className="whiteFont" style={{ margin: '6px 0 0 0', fontSize: '14px', opacity: 0.85 }}>
                    Pre-detailed-stats rounds preserved as much as possible. Some entries have approximate or missing dates,
                    aggregate FIR/GIR counts (no per-hole detail), or non-numeric scores — those columns show "—" when unavailable.
                </p>
            </div>

            <Table size="small">
                <TableHead>
                    <TableRow>
                        {HEADERS.map(h => (
                            <TableCell key={h.key} align={h.align}>
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
                    {sorted.map(row => (
                        <TableRow key={row.key} hover>
                            <TableCell>{row.date}</TableCell>
                            <TableCell>{row.course}</TableCell>
                            <TableCell align="right">{row.par ?? '—'}</TableCell>
                            <TableCell align="right">{row.score ?? '—'}</TableCell>
                            <TableCell align="right">{formatPlusMinus(row.scoreToPar)}</TableCell>
                            <TableCell align="right">{row.putts ?? '—'}</TableCell>
                            <TableCell align="right">{row.fir ?? '—'}</TableCell>
                            <TableCell align="right">{row.gir ?? '—'}</TableCell>
                            <TableCell className="whiteFont" style={{ maxWidth: '320px', whiteSpace: 'normal', fontSize: '13px', opacity: 0.9 }}>
                                {row.notes || ''}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default LegacyRoundsTable;

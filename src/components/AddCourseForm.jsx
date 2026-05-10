import { useState, useMemo, useEffect } from 'react';
import {
    Table, TableBody, TableHead, TableRow, TableCell,
    TextField, FormControlLabel, Checkbox, Button, Snackbar, Alert, MenuItem,
} from '@mui/material';
import axios from 'axios';
import { flagImages } from '../helpers/FlagConsts';

// camelCase the displayName: "Pole Creek - Ridge" -> "poleCreekRidge"
const deriveCourseKey = (displayName) => {
    const words = displayName
        .replace(/[^A-Za-z0-9 ]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
    return words.map((w, i) =>
        i === 0
            ? w.charAt(0).toLowerCase() + w.slice(1)
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join('');
};

const blankHoleState = () => {
    const out = {};
    for (let h = 1; h <= 18; h++) {
        out[`hole${h}`] = { hole: h, par: 4, distance: 0, handicap: h };
    }
    return out;
};

// Seed state for edit mode from an existing courseInfo doc.
const stateFromCourse = (course) => {
    const holes = blankHoleState();
    const is9 = course.b9Par == null;
    for (let h = 1; h <= 18; h++) {
        const src = course[`hole${h}`];
        if (src) {
            holes[`hole${h}`] = {
                hole: h,
                par: src.par ?? 4,
                distance: src.distance ?? 0,
                handicap: src.handicap ?? h,
            };
        }
    }
    return {
        displayName: course.displayName ?? '',
        courseKey: course.courseKey ?? '',
        is9HoleCourse: is9,
        scoreCardHoleAbbreviation: course.scoreCardHoleAbbreviation ?? '',
        flagKey: course.flagKey ?? '',
        holes,
    };
};

const AddCourseForm = ({ courseInfo, apiUrl, onCreated, onUpdated, editingCourse }) => {
    const isEdit = !!editingCourse;

    const [displayName, setDisplayName] = useState(isEdit ? editingCourse.displayName : '');
    const [courseKeyOverride, setCourseKeyOverride] = useState(isEdit ? editingCourse.courseKey : null);
    const [is9HoleCourse, setIs9HoleCourse] = useState(isEdit ? editingCourse.b9Par == null : false);
    const [abbreviation, setAbbreviation] = useState(isEdit ? (editingCourse.scoreCardHoleAbbreviation ?? '') : '');
    const [flagKey, setFlagKey] = useState(isEdit ? (editingCourse.flagKey ?? '') : '');
    const [holes, setHoles] = useState(isEdit ? stateFromCourse(editingCourse).holes : blankHoleState());
    const [submitting, setSubmitting] = useState(false);
    const [snack, setSnack] = useState(null);

    // If the parent swaps editingCourse to a different doc, reseed state.
    useEffect(() => {
        if (isEdit) {
            const seed = stateFromCourse(editingCourse);
            setDisplayName(seed.displayName);
            setCourseKeyOverride(seed.courseKey);
            setIs9HoleCourse(seed.is9HoleCourse);
            setAbbreviation(seed.scoreCardHoleAbbreviation);
            setFlagKey(seed.flagKey);
            setHoles(seed.holes);
        }
    }, [editingCourse, isEdit]);

    // For new courses: auto-derive courseKey from displayName until user edits it.
    // For edit mode: courseKey is locked to the original (it's the document identifier).
    const courseKey = isEdit
        ? editingCourse.courseKey
        : (courseKeyOverride ?? deriveCourseKey(displayName));
    const lastHole = is9HoleCourse ? 9 : 18;

    const existingKeys = useMemo(() => new Set(courseInfo.map(c => c.courseKey)), [courseInfo]);
    const existingNames = useMemo(() => new Set(courseInfo.map(c => c.displayName)), [courseInfo]);
    const nextSequence = useMemo(() => {
        const max = courseInfo.reduce((m, c) => Math.max(m, c.sequence ?? 0), 0);
        return max + 1;
    }, [courseInfo]);

    const updateHole = (hole, field, value) => {
        setHoles(prev => ({
            ...prev,
            [`hole${hole}`]: { ...prev[`hole${hole}`], [field]: value }
        }));
    };

    const handleHoleNumChange = (hole, field, e) => {
        const raw = e.target.value;
        const parsed = raw === '' ? '' : parseInt(raw);
        updateHole(hole, field, Number.isNaN(parsed) ? '' : parsed);
    };

    const f9Par = useMemo(() => {
        let s = 0;
        for (let h = 1; h <= 9; h++) s += parseInt(holes[`hole${h}`].par) || 0;
        return s;
    }, [holes]);
    const b9Par = useMemo(() => {
        if (is9HoleCourse) return 0;
        let s = 0;
        for (let h = 10; h <= 18; h++) s += parseInt(holes[`hole${h}`].par) || 0;
        return s;
    }, [holes, is9HoleCourse]);
    const f9Yardage = useMemo(() => {
        let s = 0;
        for (let h = 1; h <= 9; h++) s += parseInt(holes[`hole${h}`].distance) || 0;
        return s;
    }, [holes]);
    const b9Yardage = useMemo(() => {
        if (is9HoleCourse) return 0;
        let s = 0;
        for (let h = 10; h <= 18; h++) s += parseInt(holes[`hole${h}`].distance) || 0;
        return s;
    }, [holes, is9HoleCourse]);

    const validationIssues = [];
    const trimmedName = displayName.trim();
    if (!trimmedName) validationIssues.push('Display name is required.');
    if (!courseKey) validationIssues.push('Course key cannot be empty.');
    // Name-collision check skips the doc being edited.
    if (existingNames.has(trimmedName) && !(isEdit && trimmedName === editingCourse.displayName)) {
        validationIssues.push(`A course named "${trimmedName}" already exists.`);
    }
    // Key-collision check only applies on create.
    if (!isEdit && existingKeys.has(courseKey)) {
        validationIssues.push(`Course key "${courseKey}" is already in use.`);
    }

    const handleSubmit = async () => {
        if (validationIssues.length) {
            setSnack({ severity: 'error', message: validationIssues[0] });
            return;
        }
        setSubmitting(true);

        const doc = {
            displayName: trimmedName,
            scoreCardHoleAbbreviation: abbreviation || '',
            flagKey: flagKey || null,
            f9Par, f9Yardage,
            par: f9Par + b9Par,
            yardage: f9Yardage + b9Yardage,
        };
        if (!is9HoleCourse) {
            doc.b9Par = b9Par;
            doc.b9Yardage = b9Yardage;
        } else {
            // Editing 18 -> 9 should clear stale back-9 fields. Allowed handler treats null as $unset.
            if (isEdit) {
                doc.b9Par = null;
                doc.b9Yardage = null;
            }
        }
        for (let h = 1; h <= lastHole; h++) {
            doc[`hole${h}`] = {
                hole: h,
                par: parseInt(holes[`hole${h}`].par) || 0,
                distance: parseInt(holes[`hole${h}`].distance) || 0,
                handicap: parseInt(holes[`hole${h}`].handicap) || 0,
            };
        }
        // When editing 18 -> 9, also unset hole10..18.
        if (is9HoleCourse && isEdit) {
            for (let h = 10; h <= 18; h++) doc[`hole${h}`] = null;
        }

        try {
            if (isEdit) {
                await axios.put(`${apiUrl}/update-courseInfo/${editingCourse.courseKey}`, doc);
                setSnack({ severity: 'success', message: `Updated "${doc.displayName}".` });
                if (onUpdated) onUpdated();
            } else {
                doc.courseKey = courseKey;
                doc.sequence = nextSequence;
                await axios.post(`${apiUrl}/add-courseInfo`, doc);
                setSnack({ severity: 'success', message: `Saved "${doc.displayName}" to courseInfo.` });
                // Reset for next entry on create flow only.
                setDisplayName('');
                setCourseKeyOverride(null);
                setIs9HoleCourse(false);
                setAbbreviation('');
                setFlagKey('');
                setHoles(blankHoleState());
                if (onCreated) onCreated();
            }
        } catch (err) {
            setSnack({ severity: 'error', message: `${isEdit ? 'Update' : 'Save'} failed: ${err.message}` });
        } finally {
            setSubmitting(false);
        }
    };

    const renderHoleTable = (start, end, label) => {
        const holesInRange = [];
        for (let h = start; h <= end; h++) holesInRange.push(h);
        const subtotalPar = holesInRange.reduce((s, h) => s + (parseInt(holes[`hole${h}`].par) || 0), 0);
        const subtotalYardage = holesInRange.reduce((s, h) => s + (parseInt(holes[`hole${h}`].distance) || 0), 0);
        return (
            <Table size="small" style={{ marginBottom: '24px' }}>
                <TableHead>
                    <TableRow>
                        <TableCell><b>{label}</b></TableCell>
                        {holesInRange.map(h => (
                            <TableCell key={`h${h}`} style={{ minWidth: '60px', textAlign: 'center' }}><b>{h}</b></TableCell>
                        ))}
                        <TableCell style={{ textAlign: 'center' }}><b>{label === 'Front 9' ? 'OUT' : 'IN'}</b></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell><b>Par</b></TableCell>
                        {holesInRange.map(h => (
                            <TableCell key={`p${h}`}>
                                <TextField
                                    size="small"
                                    value={holes[`hole${h}`].par}
                                    onChange={(e) => handleHoleNumChange(h, 'par', e)}
                                    inputProps={{ style: { textAlign: 'center', padding: '4px' }, type: 'number', min: 1, max: 7 }}
                                />
                            </TableCell>
                        ))}
                        <TableCell style={{ textAlign: 'center' }}><b>{subtotalPar}</b></TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><b>Distance</b></TableCell>
                        {holesInRange.map(h => (
                            <TableCell key={`d${h}`}>
                                <TextField
                                    size="small"
                                    value={holes[`hole${h}`].distance}
                                    onChange={(e) => handleHoleNumChange(h, 'distance', e)}
                                    inputProps={{ style: { textAlign: 'center', padding: '4px' }, type: 'number', min: 0 }}
                                />
                            </TableCell>
                        ))}
                        <TableCell style={{ textAlign: 'center' }}><b>{subtotalYardage}</b></TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><b>Handicap</b></TableCell>
                        {holesInRange.map(h => (
                            <TableCell key={`hc${h}`}>
                                <TextField
                                    size="small"
                                    value={holes[`hole${h}`].handicap}
                                    onChange={(e) => handleHoleNumChange(h, 'handicap', e)}
                                    inputProps={{ style: { textAlign: 'center', padding: '4px' }, type: 'number', min: 1, max: 18 }}
                                />
                            </TableCell>
                        ))}
                        <TableCell />
                    </TableRow>
                </TableBody>
            </Table>
        );
    };

    return (
        <div className="width90Percent flexColumn marginTopMedium" style={{ marginLeft: '5vw' }}>
            <h2 className="strongFont">{isEdit ? `Edit course: ${editingCourse.displayName}` : 'Add new course'}</h2>

            {isEdit && (
                <p style={{ marginTop: 0, color: '#666', fontSize: '13px' }}>
                    Heads up: changing par values will retroactively affect derived metrics (score-to-par, eagle/birdie counts, etc.) for past rounds at this course on the next data refresh.
                </p>
            )}

            <div className="flexRow alignCenter" style={{ gap: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <TextField
                    label="Course display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{ minWidth: '280px' }}
                    size="small"
                />
                <TextField
                    label="Course key"
                    value={courseKey}
                    onChange={(e) => !isEdit && setCourseKeyOverride(e.target.value)}
                    helperText={isEdit ? 'locked (document identifier)' : (courseKeyOverride === null ? 'auto-derived from display name' : '')}
                    size="small"
                    disabled={isEdit}
                    style={{ minWidth: '220px' }}
                />
                <TextField
                    label="Scorecard abbreviation"
                    value={abbreviation}
                    onChange={(e) => setAbbreviation(e.target.value)}
                    helperText='used on additional-hole markers (e.g. "AG", "GH")'
                    size="small"
                    style={{ minWidth: '180px' }}
                />
                <TextField
                    label="Flag"
                    select
                    value={flagKey}
                    onChange={(e) => setFlagKey(e.target.value)}
                    helperText="for international courses (optional)"
                    size="small"
                    style={{ minWidth: '160px' }}
                >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {Object.keys(flagImages).map(key => (
                        <MenuItem key={key} value={key}>{key}</MenuItem>
                    ))}
                </TextField>
                <FormControlLabel
                    control={<Checkbox checked={is9HoleCourse} onChange={(e) => setIs9HoleCourse(e.target.checked)} />}
                    label="9-hole course"
                />
            </div>

            {renderHoleTable(1, 9, 'Front 9')}
            {!is9HoleCourse && renderHoleTable(10, 18, 'Back 9')}

            <div className="flexRow alignCenter" style={{ gap: '24px', marginBottom: '16px' }}>
                <span><b>Total par:</b> {f9Par + b9Par}</span>
                <span><b>Total yardage:</b> {f9Yardage + b9Yardage}</span>
                {!isEdit && <span style={{ color: '#666' }}>(will be assigned sequence #{nextSequence})</span>}
                {isEdit && <span style={{ color: '#666' }}>sequence #{editingCourse.sequence ?? '—'}</span>}
            </div>

            {validationIssues.length > 0 && (
                <ul style={{ color: 'var(--color-flag-red, #c33)', marginTop: 0 }}>
                    {validationIssues.map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
            )}

            <div>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={submitting || validationIssues.length > 0}
                >
                    {submitting ? 'Saving…' : (isEdit ? 'Update course' : 'Save course')}
                </Button>
            </div>

            <Snackbar
                open={!!snack}
                autoHideDuration={4500}
                onClose={() => setSnack(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {snack ? (
                    <Alert severity={snack.severity} onClose={() => setSnack(null)} variant="filled">
                        {snack.message}
                    </Alert>
                ) : null}
            </Snackbar>
        </div>
    );
};

export default AddCourseForm;

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
// Components
import GolfUploadButton from '../components/GolfUploadButton';
import GolfTable from '../components/GolfTable';
import PageLinks from '../components/PageLinks';
import ScorecardEntry from '../components/ScorecardEntry';
import ScorecardHelpModal from '../components/ScorecardHelpModal';
import CoursesPage from '../components/CoursesPage';
import LegacyRoundsTable from '../components/LegacyRoundsTable';
// MUI
import {
    TableBody, TableRow, TableCell, FormControl, CircularProgress, InputLabel, MenuItem, Select,
    ListItemText, Checkbox, Modal, Card, CardContent, Snackbar
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
// Tools
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
// CSS
import "../shared.css"
// Helpers
import { golfRoundMetricHelper } from "../helpers/GolfRoundMetricHelper";
import { importFile } from "../helpers/ImportFileHelper";
import { createScorecard, calculateStats, courseSummary } from "../helpers/GolfFormatHelper";

const currentYear = new Date().getFullYear();
const API_URL = process.env.REACT_APP_API_URL || 'https://worldofjack-server.onrender.com';

const Golf = () => {

    /**
     * Start scripts
     * npm start
     * 
     * Server:
     * cd server
     * node server.js
     * 
     * Redeploy:
     * npm run deploy
     * 
     */


    //  Configurable state
    const [activePage, setActivePage] = useState("Golf Rounds");
    const [yearFilter, setYearFilter] = useState(currentYear);

    // Internal state
    const [displayUploadButton, setDisplayUploadButton] = useState(true);
    const [filters, setFilters] = useState([String(currentYear)]);
    const [courseTours, setCourseTours] = useState(["CommonGround"]); // "Course Tour" tab shows "hole course by default"
    const [isLoading, setIsLoading] = useState(false);
    const [allRounds, setAllRounds] = useState([]);
    const [displayedRounds, setDisplayedRounds] = useState([]);
    const [courseInfo, setCourseInfo] = useState([]);
    const [roundYears, setRoundYears] = useState([]);
    const [tableSort, setTableSort] = useState({ method: 'date', order: 'descending' });
    const [activeRounds, setActiveRounds] = useState([]);
    const [activeScorecardEntry, setActiveScorecardEntry] = useState("southSuburban"); // Should make a variable "home course" to be reused in a number of places including scorecard entry, course tour
    const [activeScorecardEntryCourseInfo, setActiveScorecardEntryCourseInfo] = useState({});
    const [scorecardEntryData, setScorecardEntryData] = useState({});
    const [expandScorecard, setExpandScorecard] = useState(true);
    const [toggleCourseInfo, setToggleCourseInfo] = useState(false);
    const [expandSingleHoleMetric, setExpandSingleHoleMetric] = useState({ hole: "", expanded: false });
    const [puttingData, setPuttingData] = useState({});
    const [displayHelpModal, setDisplayHelpModal] = useState(false);
    const [handicap, setHandicap] = useState(0);
    const [handicapMetrics, setHandicapMetrics] = useState({});
    const [displayedRoundsToggle, setDisplayedRoundsToggle] = useState(false);
    const [approachView, setApproachView] = useState("distribution");
    const [handicapCutoffRoundKey, setHandicapCutoffRoundKey] = useState("");
    const [filterableCourses, setFilterableCourses] = useState(['CommonGround']);
    const [editingExistingScorecard, setEditingExistingScorecard] = useState(false);

    const [displayedNumberOfRounds, setDisplayedNumberOfRounds] = useState(0);
    const [displayedHoles, setDisplayedHoles] = useState(0);
    const [displayedCourses, setDisplayedCourses] = useState(0);
    const [displayedScoringAverage, setDisplayedScoringAverage] = useState("");
    const [displayedPutts, setDisplayedPutts] = useState(0);
    const [displayedF, setDisplayedF] = useState("");
    const [displayedG, setDisplayedG] = useState("");
    const [displayedFPM, setDisplayedFPM] = useState("");
    const [displayedBirdies, setDisplayedBirdies] = useState("");
    const [displayedBogeyPlus, setDisplayedBogeyPlus] = useState("");
    const [scorecardRoundConfig, setScorecardRoundConfig] = useState("");
    const [selectedScorecardOptions, setSelectedScorecardOptions] = useState([{title: "18 Holes"}]);
    const [previouslySelectedScorecardOptions, setPreviouslySelectedScorecardOptions] = useState([]);
    const [displayScorecard9HoleRemovalModal, setDisplayScorecard9HoleRemovalModal] = useState(false);
    const [displayNumberHolesRemovedWarningSnackbar, setDisplayNumberHolesRemovedWarningSnackbar] = useState(false);
    const [displayScorecardSubmissionSnackbar, setDisplayScorecardSubmissionSnackbar] = useState(false);
    const [displayDeleteConfirmModal, setDisplayDeleteConfirmModal] = useState(false);
    const [fileUploadComplete, setFileUploadComplete] = useState(false);

    const pinnedCourse = "South Suburban"; // Course pinned atop scorecard entry
    const includePartialRounds = true; // Displays partial rounds

    /**
     * HOOK: useEffect fetches rounds + course info from the API on mount.
     * On success, the Excel upload button is hidden. On failure, falls back
     * to showing the upload button so the user can still bootstrap from Excel.
     */
    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            axios.get(`${API_URL}/golfrounds`),
            axios.get(`${API_URL}/courseinfo`)
        ])
        .then(([roundsRes, courseRes]) => {
            setCourseInfo(courseRes.data);
            setDisplayedRounds(roundsRes.data);
            setAllRounds(roundsRes.data);
            setDisplayUploadButton(false);
        })
        .catch((err) => {
            console.error('Failed to fetch from API; falling back to Excel upload:', err.message);
            setIsLoading(false);
        });
    }, []);

    // Refresh just the courseInfo collection from Mongo. Called after the user
    // creates a new course via the Courses page so the dropdown picks it up
    // without a full page reload.
    const refreshCourseInfo = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/courseinfo`);
            setCourseInfo(res.data);
        } catch (err) {
            console.error('Failed to refresh courseInfo:', err.message);
        }
    }, []);

    /**
     * HOOK: useEffect sets filter method when round data is fetched or a new round is added
     *
     *
     */
    useEffect(() => {
        changeSortMethod("sequence", "roundInfo");
        setIsLoading(false);

        // Set available round years (used for Annual Summaries). Legacy rounds
        // are intentionally excluded from this dropdown — only years where full
        // detailed-stat data was tracked should appear as filter options.
        let tempRoundYears = [];
        for (let round of allRounds) {
            if (round.nonGhinRounds?.legacyRound) continue;
            if (!round.roundInfo?.date) continue;
            let splitRoundDate = round.roundInfo.date.split("/");
            let roundYear = splitRoundDate[2];
            if (!tempRoundYears.includes(roundYear)) tempRoundYears.push(roundYear);
        }
        setRoundYears(tempRoundYears);
    }, [allRounds]);
    
    const fileInputRef = useRef(null);

    // Set active scorecard course info
    useEffect(() => {
        if (courseInfo.length !== 0) {
            const tempActiveScorecardEntryCourseInfo = courseInfo.find(info => info.courseKey === activeScorecardEntry);
            setActiveScorecardEntryCourseInfo(tempActiveScorecardEntryCourseInfo)
        }
    }, [courseInfo, activeScorecardEntry])

    /**
     * HOOK: useEffect controls setting initial scorecardEntryData
     * 
     * Called by:
     * activeScoreCardEntryCourseInfo - Updated once course info is fetched
     * activePage - When user returns to Enter Scorecard page, reset scorecardEntryData
     */
    useEffect(() => {
        if (activeScorecardEntryCourseInfo && Object.keys(activeScorecardEntryCourseInfo).length !== 0 && !editingExistingScorecard) {
            const scorecardData = {
                date: new Date().toDateString()
            };
            for (let hole = 1; hole <= 18; hole++) {
                if (activeScorecardEntryCourseInfo[`hole${hole}`]) {
                    scorecardData[`hole${hole}`] = {
                        score: activeScorecardEntry === "" ? 100 : activeScorecardEntryCourseInfo[`hole${hole}`].par,
                        putts: 2,
                        fir: activeScorecardEntryCourseInfo[`hole${hole}`].par === 3 ? "NA" : "F",
                        gir: "G",
                        dtg: 1000,
                        dtg2: activeScorecardEntryCourseInfo[`hole${hole}`].par === 5 ? 1000 : undefined,
                        dth: 1000,
                        puttLength: 1000,
                        fpm: 0,
                        notes: ""
                    };
                }
            }
            setScorecardEntryData(scorecardData);
        }
    }, [activeScorecardEntryCourseInfo, activePage]);
    // Similar to above, when entering scorecard and back 9 is added, populate default round info
    const addActiveScorecardEntry9 = (addOrRemove9, which9) => {
        let tempScorecardEntryData = { ...scorecardEntryData };
        
        let startingHoleBeingAdded = 1;
        let endingHoleBeingAdded = 18;
        if (addOrRemove9 === "add") {
            if (which9 === "front9") {
                startingHoleBeingAdded = 1;
                endingHoleBeingAdded = 9;
            } else if (which9 === "back9") {
                startingHoleBeingAdded = 10;
                endingHoleBeingAdded = 18;
            }
        }

        if (Object.keys(activeScorecardEntryCourseInfo).length !== 0) {
            for (let hole = startingHoleBeingAdded; hole <= endingHoleBeingAdded; hole++) {
                tempScorecardEntryData[`hole${hole}`] = {
                    score: activeScorecardEntry === "" ? 100 : activeScorecardEntryCourseInfo[`hole${hole}`].par,
                    putts: 2,
                    fir: activeScorecardEntryCourseInfo[`hole${hole}`].par === 3 ? "NA" : "F",
                    gir: "G",
                    dtg: 1000,
                    dtg2: activeScorecardEntryCourseInfo[`hole${hole}`].par === 5 ? 1000 : undefined,
                    dth: 1000,
                    puttLength: 1000,
                    fpm: 0,
                    notes: ""
                };
            }
            setScorecardEntryData(tempScorecardEntryData);
        }
    }


    const getPuttingData = () => {
        const allPutts = [];

        (displayedRoundsToggle ? displayedRounds : allRounds).forEach(round => {
            const courseData = courseInfo.find(info => info.courseKey === round.roundInfo.courseKey);
            if (courseData && !round.nonGhinRounds.scrambleRound && Object.keys(courseData).length > 0) {
                for (let i = 1; i <= 18; i++) {
                    if (round[`hole${i}`] && round[`hole${i}`].putts) {
                        allPutts.push({
                            round: round.roundInfo.key,
                            date: round.roundInfo.date,
                            putts: round[`hole${i}`].putts,
                            dth: round[`hole${i}`].dth,
                            fpm: round[`hole${i}`].puttLength,
                            gir: round[`hole${i}`].gir,
                            scoreToPar: round[`hole${i}`].score - courseData[`hole${i}`].par // score
                        });
                    }
                }
            }
        })

        setPuttingData(allPutts)
    }

    /**
     * HOOK: useEffect updates metric calculations
     * 
     * Updates the following:
     * puttingData 
     * 
     * Called by:
     * displayedRoundsToggle - User toggling between displayedRounds and allRounds OR allRounds being updated
     */
    useEffect(() => {
        getPuttingData();
    }, [allRounds, displayedRoundsToggle]);

    // Summary round for displayed rounds, function handles fetching new values when filters/date field is edited
    const handleUpdateSummaryRow = (summaryRowRounds) => {
        let uniqueCourses = [];
        let tempDisplayedHoles = 0;
        let tempDisplayedScoringTally = 0;
        let tempDisplayedPutts = 0;
        let tempDisplayed3Putts = 0;
        let tempDisplayedF = 0;
        let tempPar3 = 0
        let tempDisplayedG = 0;
        let tempDisplayedFPM = 0;
        let tempDisplayedBirdies = 0;
        let tempDisplayedBogeyPlus = 0;

        for (let round of summaryRowRounds) {
            if (!uniqueCourses.includes(round.roundInfo.courseKey)) uniqueCourses.push(round.roundInfo.courseKey);
            tempDisplayedHoles = tempDisplayedHoles + round.roundInfo.numHoles;
            tempDisplayedScoringTally = tempDisplayedScoringTally + round.scoring.scoreToPar;
            tempDisplayedPutts = tempDisplayedPutts + round.putting.putts;
            tempDisplayed3Putts = tempDisplayed3Putts + round.putting.num3Putts;
            tempDisplayedF = tempDisplayedF + round.fairways.f;
            tempPar3 = tempPar3 + round.fairways.na;
            tempDisplayedG = tempDisplayedG + round.greens.g;
            tempDisplayedFPM = tempDisplayedFPM + round.putting.fpmTotal;
            tempDisplayedBirdies = tempDisplayedBirdies + round.scoring.numBirdies;
            tempDisplayedBogeyPlus = tempDisplayedBogeyPlus + round.scoring.numBogeyPlus;
        }

        setDisplayedNumberOfRounds(summaryRowRounds.length);
        setDisplayedHoles(tempDisplayedHoles);
        setDisplayedCourses(uniqueCourses.length);
        setDisplayedScoringAverage(`${(72 + tempDisplayedScoringTally / tempDisplayedHoles * 18).toFixed(2)} (+${(tempDisplayedScoringTally / tempDisplayedHoles * 18).toFixed(2)})`);
        setDisplayedPutts(`${(tempDisplayedPutts / tempDisplayedHoles * 18).toFixed(2)} (${(tempDisplayed3Putts / tempDisplayedHoles * 18).toFixed(2)}, ${(tempDisplayed3Putts / tempDisplayedHoles * 100).toFixed(0)}%)`);
        setDisplayedF(`${(tempDisplayedF / (tempDisplayedHoles - tempPar3) * 14).toFixed(2)} (${(tempDisplayedF / (tempDisplayedHoles - tempPar3) * 100).toFixed(0)}%)`);
        setDisplayedG(`${(tempDisplayedG / tempDisplayedHoles * 18).toFixed(2)} (${(tempDisplayedG / tempDisplayedHoles * 100).toFixed(0)}%)`);
        setDisplayedFPM((tempDisplayedFPM / tempDisplayedHoles * 18).toFixed(2));
        setDisplayedBirdies(`${(tempDisplayedBirdies / tempDisplayedHoles * 18).toFixed(2)} (${(tempDisplayedBirdies / tempDisplayedHoles * 100).toFixed(0)}%)`);
        setDisplayedBogeyPlus(`${(tempDisplayedBogeyPlus / tempDisplayedHoles * 18).toFixed(2)} (${(tempDisplayedBogeyPlus / tempDisplayedHoles * 100).toFixed(0)}%)`);
    }

    /**
     * HOOK: useEffect controls setting initial filters/after new round is added to allRounds
     * 
     * TODO: fill out rest of this documentation, and this needs to actually filter data
     */
    useEffect(() => {
        // Strip legacy rounds out of every flow downstream of allRounds — they
        // surface only on the dedicated Legacy Rounds tab. This keeps date-driven
        // helpers (which assume MM/DD/YY strings) from crashing on null dates.
        let tempRounds = allRounds.filter(r => !r.nonGhinRounds?.legacyRound);
        if (tempRounds.length > 0) {
            if (filters.includes(mostRecentRoundYear) && !filters.includes("All Years")) {
                tempRounds = tempRounds.filter(round => round.roundInfo.date && round.roundInfo.date.substring(round.roundInfo.date.length - 1, round.roundInfo.date.length) === mostRecentRoundYear.substring(mostRecentRoundYear.length - 1, mostRecentRoundYear));
            } else {
                setYearFilter("");
            }
            if (filters.includes("Full Rounds")) {
                tempRounds = tempRounds.filter(round => round.roundInfo.fullFront9 && round.roundInfo.fullBack9 && !round.roundInfo.key.includes("Par3") && !round.nonGhinRounds.boozeRound);
            }
            if (filters.includes("Handicap Rounds")) {
                tempRounds = tempRounds.filter(round => round.handicapRound);
            }
            
            // filterableCourses set in state, if filter is applied add to list below
            const coursesFiltered = [];
            for (let course of filterableCourses) {
                if (filters.includes(course)) coursesFiltered.push(course);
            }
            // If course filter is applied and current round course is not in that list then hide it
            if (coursesFiltered.length > 0) tempRounds = tempRounds.filter(round => coursesFiltered.includes(round.roundInfo.course));

            setDisplayedRounds(tempRounds);
        }
        handleUpdateSummaryRow(tempRounds); // Triggers update to summary row
    }, [allRounds, filters]);

    const handleSetYearFilter = (filter) => {
        const emptyYear = filter === '';
        const filterYear = parseInt(filter);
        if (filterYear >= 2022 && filterYear < 2100 && filterYear !== yearFilter) {
            let newRounds = [];
            for (let round of allRounds) {
                if (!round.roundInfo?.date) continue; // legacy / undated rounds excluded from year filter
                const yearSuffix = round.roundInfo.date.split("/")[2]
                if ((2000 + parseInt(yearSuffix)) == filterYear) {
                    newRounds.push(round);
                }
            }
            if (filters.includes(mostRecentRoundYear) && !filters.includes("All Years")) {
                newRounds = newRounds.filter(round => round.roundInfo.date && round.roundInfo.date.substring(round.roundInfo.date.length - 1, round.roundInfo.date.length) === mostRecentRoundYear.substring(mostRecentRoundYear.length - 1, mostRecentRoundYear));
            }
            if (filters.includes("Full Rounds")) {
                newRounds = newRounds.filter(round => round.roundInfo.fullFront9 && round.roundInfo.fullBack9 && !round.roundInfo.key.includes("Par3") && !round.nonGhinRounds.boozeRound);
            }
            if (filters.includes("Handicap Rounds")) {
                newRounds = newRounds.filter(round => round.handicapRound);
            }
            setDisplayedRounds(newRounds);
            console.log("2 calling handleUpdateSummaryRow")
            handleUpdateSummaryRow(newRounds);
        } else {
            if (filter === "") {
                setDisplayedRounds(allRounds);
                setDisplayedRounds(allRounds); // Triggers update to summary row
            }
        }
        
        setYearFilter(emptyYear ? "" : filterYear);
    }
    
    const editScorecard = (activeRound) => {
        setEditingExistingScorecard(true);
        setActivePage("Enter Scorecard");
        setActiveScorecardEntry(activeRound.roundInfo.courseKey);
        setScorecardEntryData(activeRound);
    }

    useEffect(() => {
        if (allRounds.length > 0) {
            
        }
    }, [fileUploadComplete])

    const handleImportFile = (e) => {
        importFile(
            e.target.files[0],
            setIsLoading,
            courseInfo,
            yearFilter,
            setRoundYears,
            setHandicapCutoffRoundKey,
            setHandicap,
            setHandicapMetrics,
            setCourseInfo,
            setPuttingData,
            setAllRounds,
            setDisplayedRounds,
            handleUpdateSummaryRow,
            setTableSort,
            setDisplayUploadButton
        );

        setFileUploadComplete(true);
    }

    const displayDefaultPage = displayedRounds.length !== 0;

    const handleActivePageChange = (e = null) => {
        setActivePage(e && e.target && e.target.value ? e.target.value : "Golf Rounds");
    }

    const handleSetActiveRounds = (roundKey) => {
        let tempActiveRounds = [...activeRounds];
        if (activeRounds.includes(roundKey)) {
            let activeRoundsWithoutCurrentlyDeselectedRound = [];
            tempActiveRounds.forEach((round) => {
                if (round !== roundKey) activeRoundsWithoutCurrentlyDeselectedRound.push(round);
            })
            tempActiveRounds = activeRoundsWithoutCurrentlyDeselectedRound;
        } else {
            tempActiveRounds.push(roundKey);
        }
        setActiveRounds(tempActiveRounds);
    }

    const changeSortMethod = (method, readingObjectPath, preventReorderingUponScorecardSubmission = false) => {
        let newSortOrder = "ascending";
        if (method === tableSort.method && !preventReorderingUponScorecardSubmission) {
            if (tableSort.order === "ascending") {
                newSortOrder = "descending";
            } else {
                newSortOrder = "ascending";
            }
        }
        const sortableRounds = [...displayedRounds];

        // GIR sort matches what's displayed in the column: g (in regulation) + gur (G-1).
        const getSortValue = (r) => {
            if (readingObjectPath === 'greens' && method === 'g') {
                return (r.greens?.g ?? 0) + (r.greens?.gur ?? 0);
            }
            return r[readingObjectPath]?.[method];
        };

        const sortedRounds = newSortOrder === "ascending" ?
            sortableRounds.sort(function(a,b) { const av = getSortValue(a), bv = getSortValue(b); return (av < bv) ? 1 : ((bv < av) ? -1 : 0); }) :
            sortableRounds.sort(function(a,b) { const av = getSortValue(a), bv = getSortValue(b); return (av < bv) ? -1 : ((bv < av) ? 1 : 0); });

        setTableSort({ method, order: newSortOrder });
        setDisplayedRounds(sortedRounds);
    }

    const handleSetExpandSingleHoleMetric = (hole) => {
        if (expandSingleHoleMetric.expanded) {
            if (hole === expandSingleHoleMetric.hole) setExpandSingleHoleMetric({ hole: "", expanded: false });
            else setExpandSingleHoleMetric({ hole: hole, expanded: true });
        } else {
            setExpandSingleHoleMetric({ hole: hole, expanded: true });
        }
    }

    const updateScorecardEntryData = (value, field, hole) => {
        if (field === "date") {
            setScorecardEntryData({
                ...scorecardEntryData,
                date: value
            })
        } else {
            let tempScorecardEntryData = scorecardEntryData;

            tempScorecardEntryData = {
                ...scorecardEntryData,
                [`${hole}`]: {
                    ...scorecardEntryData[hole],
                    [`${field}`]: value
                }
            }

            tempScorecardEntryData = golfRoundMetricHelper(tempScorecardEntryData, value, field, hole, allRounds, editingExistingScorecard, activeScorecardEntryCourseInfo)

            setScorecardEntryData(tempScorecardEntryData)
        }
    }

    const setPlayingPartners = (partners) => {
        setScorecardEntryData({
            ...scorecardEntryData,
            roundInfo: {
                ...(scorecardEntryData.roundInfo || {}),
                playingPartners: partners,
            }
        });
    };

    const setExcludeRound = (excluded, reason) => {
        const nonGhinRounds = {
            boozeRound:    excluded && reason === "boozeRound",
            scrambleRound: excluded && reason === "scrambleRound",
            leagueRound:   excluded && reason === "leagueRound",
            legacyRound:   scorecardEntryData?.nonGhinRounds?.legacyRound || false,
        };
        let temp = { ...scorecardEntryData, nonGhinRounds };
        temp = golfRoundMetricHelper(temp, null, null, null, allRounds, editingExistingScorecard, activeScorecardEntryCourseInfo);
        setScorecardEntryData(temp);
    };

    const deleteScorecard = () => {
        const key = scorecardEntryData?.roundInfo?.key;
        if (!key) {
            setDisplayDeleteConfirmModal(false);
            return;
        }
        axios.delete(`${API_URL}/round/${encodeURIComponent(key)}`)
            .then(() => {
                setAllRounds(allRounds.filter(r => r.roundInfo.key !== key));
                setDisplayedRounds(displayedRounds.filter(r => r.roundInfo.key !== key));
                setScorecardEntryData({});
                setEditingExistingScorecard(false);
                setDisplayDeleteConfirmModal(false);
                setActivePage("Golf Rounds");
                setDisplayScorecardSubmissionSnackbar("delete-success");
            })
            .catch((err) => {
                setDisplayDeleteConfirmModal(false);
                setDisplayScorecardSubmissionSnackbar("delete-error");
                console.error('Error deleting round', err);
            });
    };

    const validateScorecard = (editingExistingScorecard) => {
        const isValid = true;

        if (isValid) submitScorecard(editingExistingScorecard);
    }
    
    const submitScorecard = (editingExistingScorecard) => {
        let tempScorecardEntryData = { ...scorecardEntryData };

        // Sanitize sentinel values (1000) before submission
        for (let hole = 1; hole <= 18; hole++) {
            if (tempScorecardEntryData[`hole${hole}`]) {
                const holeData = tempScorecardEntryData[`hole${hole}`];
                if (holeData.dtg === 1000) holeData.dtg = 0;
                if (holeData.dtg2 === 1000) holeData.dtg2 = 0;
                if (holeData.dth === 1000) holeData.dth = 0;
                if (holeData.puttLength === 1000) holeData.puttLength = 0;
            }
        }

        // Strip empty playing-partner slots so only filled names persist
        if (tempScorecardEntryData.roundInfo?.playingPartners) {
            tempScorecardEntryData.roundInfo = {
                ...tempScorecardEntryData.roundInfo,
                playingPartners: tempScorecardEntryData.roundInfo.playingPartners
                    .map(p => (p || '').trim())
                    .filter(Boolean),
            };
        }

        setScorecardEntryData({});
        handleActivePageChange();

        if (editingExistingScorecard) {
            setEditingExistingScorecard(false);
            // Update existing round in Mongo
            axios.put(`${API_URL}/updateround`, tempScorecardEntryData)
            .then(() => {
                setDisplayScorecardSubmissionSnackbar("success")
            })
            .catch((error) => {
                setDisplayScorecardSubmissionSnackbar("error")
                console.error('Error updating golf round', error)
            })

            // Remove round being edited from allRounds, then re-add
            let tempAllRounds = allRounds.filter(round => round.roundInfo.key !== tempScorecardEntryData.roundInfo.key)
            tempAllRounds.push(tempScorecardEntryData)
            setAllRounds(tempAllRounds)
            // Same as above with displayed rounds
            let tempDisplayedRounds = displayedRounds.filter(round => round.roundInfo.key !== tempScorecardEntryData.roundInfo.key)
            tempDisplayedRounds.push(tempScorecardEntryData)
            setDisplayedRounds(tempDisplayedRounds)
        } else {
            // Save new round to Mongo
            axios.post(`${API_URL}/add-round`, tempScorecardEntryData)
            .then(() => {
                setDisplayScorecardSubmissionSnackbar("success")
            })
            .catch((error) => {
                setDisplayScorecardSubmissionSnackbar("error")
                console.error('Error adding golf round', error)
            })

            // Push to allRounds locally (this will automatically recalculate stats)
            let newAllRounds = [...allRounds, tempScorecardEntryData];
            setAllRounds(newAllRounds);
            let newDisplayedRounds = [...displayedRounds, tempScorecardEntryData];
            setDisplayedRounds(newDisplayedRounds);
            changeSortMethod("sequence", "roundInfo", true);
        }
    }

    const filterOptions = [];
    // O(n log n) date sort across allRounds — only redo when allRounds itself changes.
    // Legacy rounds with null dates are excluded so this can be used for "most recent
    // round" / year-filter UI without crashing.
    const roundsSortedByDate = useMemo(() => {
        if (allRounds.length === 0) return null;
        const datable = allRounds.filter(r => r.roundInfo?.date && !r.nonGhinRounds?.legacyRound);
        return datable.sort(function(a, b){
            const aDate = a.roundInfo.date.split('/');
            const aYear = parseInt(aDate[2]);
            const aMonth = parseInt(aDate[0]);
            const aDay = parseInt(aDate[1]);

            const bDate = b.roundInfo.date.split('/');
            const bYear = parseInt(bDate[2]);
            const bMonth = parseInt(bDate[0]);
            const bDay = parseInt(bDate[1]);

            let order = 0;
            if (aYear > bYear) {
                order = -1;
            } else if (aYear === bYear) {
                if (aMonth > bMonth) {
                    order = -1;
                } else if (aMonth === bMonth) {
                    if (aDay > bDay) {
                        order = -1;
                    }
                }
            }
            return order;
        });
    }, [allRounds]);

    // Heavy aggregations — only re-run when their data inputs change.
    // Skip when data hasn't loaded yet (initial puttingData is `{}`, allRounds is `[]`),
    // otherwise the helpers iterate empty/wrong shapes and throw.
    // Setter functions from useState are stable across renders, so they're
    // intentionally omitted from the dep arrays.
    const dataLoaded = allRounds.length > 0 && Array.isArray(puttingData);
    // Defer the heavy aggregations until the user is actually viewing the
    // tab that needs them. calculateStats walks 9 sub-helpers across all rounds;
    // computing it eagerly stalls the Golf Rounds tab too.
    const statsView = useMemo(
        () => (dataLoaded && activePage === "Metrics")
            ? calculateStats(courseInfo, allRounds, puttingData, displayedRounds, handicap, displayedRoundsToggle, setDisplayedRoundsToggle, approachView, setApproachView)
            : null,
        [dataLoaded, activePage, courseInfo, allRounds, puttingData, displayedRounds, handicap, displayedRoundsToggle, approachView]
    );

    const courseSummaryView = useMemo(
        () => (dataLoaded && activePage === "Course Tour")
            ? courseSummary(courseInfo, allRounds, expandSingleHoleMetric, handleSetExpandSingleHoleMetric, courseTours, displayedRounds, displayedRoundsToggle, setDisplayedRoundsToggle)
            : null,
        [dataLoaded, activePage, courseInfo, allRounds, expandSingleHoleMetric, handleSetExpandSingleHoleMetric, courseTours, displayedRounds, displayedRoundsToggle]
    );

    const mostRecentRoundDate = allRounds.length > 0 ? roundsSortedByDate[0].roundInfo.date.split("/") : [];
    const mostRecentRoundYear = `20${mostRecentRoundDate[2]}`;
    if (mostRecentRoundDate.length !== 0) filterOptions.push(mostRecentRoundYear);
    filterOptions.push(
        'All Years',
        'Full Rounds',
        'Handicap Rounds',
        'Annual Summaries'
    );
    // filterableCourses contains list of courses that appear in filter
    filterableCourses.forEach(filterableCourse => {
        filterOptions.push(filterableCourse);
    })
    
    const courseTourOptions = [
        "South Suburban",
        "Gilead Highlands",
        "Anderson Glen",
        "Signature Holes"
    ];

    const handleFilterChange = (event: SelectChangeEvent<typeof filters>) => {
        const { target: { value } } = event;
        // When "Annual Summaries" is selected
        if (value.includes("Annual Summaries")) {
            // If currently being added, should remove all other filters
            if (!filters.includes("Annual Summaries")) {
                setFilters(["Annual Summaries"]);
                changeSortMethod("sequence", "roundInfo");
            } else {
                // When Annual Summaries was already selected and a new filter is being applied, remove "Annual Summaries"
                const tempFilters = [];
                for (let i of value) {
                    if (!(i === "Annual Summaries")) tempFilters.push(i);
                }
                setFilters(tempFilters);
            }
        } else {
            setFilters(value);
        }
    };

    const handleCourseTourChange = (event: SelectChangeEvent<typeof courseTours>) => {
        const { target: { value } } = event;
        setCourseTours(value);
    };

    const getRoundTableClassName = useCallback((round, i) => {
        let className = "hideTableBottomBorderLastChildCell";
        if (round.scoring.underParRound) className += " backgroundColorEagleRow";
        if (activeRounds.includes(round.roundInfo.key)) className += " hideBorderBottom";
        if ((tableSort.method === 'sequence' && tableSort.order === 'descending') && (displayedRounds.length > 20) && (round.roundInfo.key === handicapCutoffRoundKey)) className += " handicapCutoffRoundBottomBorder";
        return className;
    }, [activeRounds, tableSort, displayedRounds.length, handicapCutoffRoundKey]);

    const getAnnualSummaryRows = () => {
        let tempSummaries = []
        for (let year of roundYears) {
            tempSummaries.push({
                year: year,
                yearDisplay: `20${year}`,
                sequence: parseInt(year),
                rounds: 0,
                uniqueCourses: [],
                tempDisplayedHoles: 0,
                tempDisplayedScoringTally: 0,
                tempDisplayedPutts: 0,
                tempDisplayed3Putts: 0,
                tempDisplayedF: 0,
                tempPar3: 0,
                tempDisplayedG: 0,
                tempDisplayedFPM: 0,
                tempDisplayedBirdies: 0,
                tempDisplayedBogeyPlus: 0,
            });
        }
        allRounds.forEach((round) => {
            if (round.nonGhinRounds?.legacyRound || !round.roundInfo?.date) return;
            const roundYear = round.roundInfo.date.split("/");
            if (round.roundInfo.fullFront9 && round.roundInfo.fullBack9 && !round.nonGhinRounds.boozeRound && !round.nonGhinRounds.scrambleRound) {
                const year = tempSummaries.findIndex(summaryYear => summaryYear.year === roundYear[2]);
                tempSummaries[year] = {
                    ...tempSummaries[year],
                    rounds: tempSummaries[year].rounds + 1,
                    uniqueCourses: !tempSummaries[year].uniqueCourses.includes(round.roundInfo.courseKey) ? [...tempSummaries[year].uniqueCourses, round.roundInfo.courseKey] : tempSummaries[year].uniqueCourses,
                    tempDisplayedHoles: tempSummaries[year].tempDisplayedHoles + round.roundInfo.numHoles,
                    tempDisplayedScoringTally: tempSummaries[year].tempDisplayedScoringTally + round.scoring.scoreToPar,
                    tempDisplayedPutts: tempSummaries[year].tempDisplayedPutts + round.putting.putts,
                    tempDisplayed3Putts: tempSummaries[year].tempDisplayed3Putts + round.putting.num3Putts,
                    tempDisplayedF: tempSummaries[year].tempDisplayedF + round.fairways.f,
                    tempPar3: tempSummaries[year].tempPar3 + round.fairways.na,
                    tempDisplayedG: tempSummaries[year].tempDisplayedG + round.greens.g,
                    tempDisplayedFPM: tempSummaries[year].tempDisplayedFPM + round.putting.fpmTotal,
                    tempDisplayedBirdies: tempSummaries[year].tempDisplayedBirdies + round.scoring.numBirdies,
                    tempDisplayedBogeyPlus: tempSummaries[year].tempDisplayedBogeyPlus + round.scoring.numBogeyPlus
                }
            }
        });
        
        // Apply sort method for existing table headers
        for (let i = 0; i < tempSummaries.length; i++) {
            tempSummaries[i] = {
                ...tempSummaries[i],
                scoreToPar: tempSummaries[i].tempDisplayedScoringTally / tempSummaries[i].tempDisplayedHoles,
                course: tempSummaries[i].uniqueCourses.length,
                putts: tempSummaries[i].tempDisplayedPutts / tempSummaries[i].tempDisplayedHoles,
                f: tempSummaries[i].tempDisplayedF / (tempSummaries[i].tempDisplayedHoles - tempSummaries[i].tempPar3),
                g: tempSummaries[i].tempDisplayedG / tempSummaries[i].tempDisplayedHoles,
                puttLengthTotal: tempSummaries[i].tempDisplayedFPM / tempSummaries[i].tempDisplayedHoles,
                numBirdies: tempSummaries[i].tempDisplayedBirdies / tempSummaries[i].tempDisplayedHoles,
                numBogeyPlus: tempSummaries[i].tempDisplayedBogeyPlus / tempSummaries[i].tempDisplayedHoles
            }
        }
        tempSummaries = tableSort.order === "ascending"
            ? tempSummaries.sort(function(a,b) { return (a[tableSort.method] < b[tableSort.method]) ? 1 : ((b[tableSort.method] < a[tableSort.method]) ? -1 : 0); })
            : tempSummaries.sort(function(a,b) { return (a[tableSort.method] < b[tableSort.method]) ? -1 : ((b[tableSort.method] < a[tableSort.method]) ? 1 : 0);} )

        return (
            <TableBody>
                {tempSummaries.map((year) => {
                    return (
                        <TableRow key={year.year}>
                            <TableCell key={1}>{year.yearDisplay} Rounds: <b>{year.rounds}</b></TableCell>
                            <TableCell key={2}>Total Holes: <b>{year.tempDisplayedHoles}</b></TableCell>
                            <TableCell key={3}>Total Courses: <b>{year.uniqueCourses.length}</b></TableCell>
                            <TableCell key={4}><b>{`${(72 + year.scoreToPar * 18).toFixed(2)} (+${(year.scoreToPar * 18).toFixed(2)})`}</b></TableCell>
                            <TableCell key={5}><b>{`${(year.tempDisplayedPutts / year.tempDisplayedHoles * 18).toFixed(2)} (${(year.tempDisplayed3Putts / year.tempDisplayedHoles * 18).toFixed(2)}, ${(year.tempDisplayed3Putts / year.tempDisplayedHoles * 100).toFixed(0)}%)`}</b></TableCell>
                            <TableCell key={6}><b>{`${(year.tempDisplayedF / (year.tempDisplayedHoles - year.tempPar3) * 14).toFixed(2)} (${(year.tempDisplayedF / (year.tempDisplayedHoles - year.tempPar3) * 100).toFixed(0)}%)`}</b></TableCell>
                            <TableCell key={7}><b>{`${(year.tempDisplayedG / year.tempDisplayedHoles * 18).toFixed(2)} (${(year.tempDisplayedG / year.tempDisplayedHoles * 100).toFixed(0)}%)`}</b></TableCell>
                            <TableCell key={8}><b>{(year.tempDisplayedFPM / year.tempDisplayedHoles * 18).toFixed(2)}</b></TableCell>
                            <TableCell key={9}><b>{`${(year.tempDisplayedBirdies / year.tempDisplayedHoles * 18).toFixed(2)} (${(year.tempDisplayedBirdies / year.tempDisplayedHoles * 100).toFixed(0)}%)`}</b></TableCell>
                            <TableCell key={10}><b>{`${(year.tempDisplayedBogeyPlus / year.tempDisplayedHoles * 18).toFixed(2)} (${(year.tempDisplayedBogeyPlus / year.tempDisplayedHoles * 100).toFixed(0)}%)`}</b></TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        )
    }

    const removeUnusedActiveScorecardEntryData = () => {
        const scorecardOptionTitles = selectedScorecardOptions.map(option => option.title)
        let tempScorecardEntryData = { ...scorecardEntryData };
        if (scorecardOptionTitles.includes("Front 9")) {
            for (let hole = 10; hole <= 18; hole++) {
                delete tempScorecardEntryData[`hole${hole}`];
            }
            setScorecardEntryData(tempScorecardEntryData);
            if (!tempScorecardEntryData.hole1) addActiveScorecardEntry9("add", "front9")
        } else if (scorecardOptionTitles.includes("Back 9")) {
            for (let hole = 1; hole < 10; hole++) {
                delete tempScorecardEntryData[`hole${hole}`];
            }
            setScorecardEntryData(tempScorecardEntryData);
            if (!tempScorecardEntryData.hole10) addActiveScorecardEntry9("add", "back9")
        }
    }


    return (
		<div className="flexColumn alignCenter golf paddingBottomLarge">

            {/*
                COMPONENT: Page Links

                Displays all pages atop page

                props:
                    activePage      (string)    Current page
                    setActivePage   (function)  Handles navigation change
            */}
            {!displayUploadButton &&
                <PageLinks
                    activePage={activePage}
                    setActivePage={setActivePage}
                    filters={filters}
                    handleFilterChange={handleFilterChange}
                    filterOptions={filterOptions}
                    courseTours={courseTours}
                    handleCourseTourChange={handleCourseTourChange}
                    courseTourOptions={courseTourOptions}
                />
            }

            {/*
                COMPONENT: Golf Table

                Displays sortable (filtered) round info, renders scorecards

                props:

            */}
            {displayDefaultPage && activePage === "Golf Rounds" &&
                <GolfTable
                    yearFilter={yearFilter}
                    handleSetYearFilter={handleSetYearFilter}
                    tableSort={tableSort}
                    changeSortMethod={changeSortMethod}
                    filters={filters}
                    getAnnualSummaryRows={getAnnualSummaryRows}
                    displayedNumberOfRounds={displayedNumberOfRounds}
                    displayedHoles={displayedHoles}
                    displayedCourses={displayedCourses}
                    displayedScoringAverage={displayedScoringAverage}
                    displayedPutts={displayedPutts}
                    displayedF={displayedF}
                    displayedG={displayedG}
                    displayedFPM={displayedFPM}
                    displayedBirdies={displayedBirdies}
                    displayedBogeyPlus={displayedBogeyPlus}
                    activePage={activePage}
                    displayedRounds={displayedRounds}
                    includePartialRounds={includePartialRounds}
                    getRoundTableClassName={getRoundTableClassName}
                    handleSetActiveRounds={handleSetActiveRounds}
                    createScorecard={createScorecard}
                    courseInfo={courseInfo}
                    expandScorecard={expandScorecard}
                    setExpandScorecard={setExpandScorecard}
                    toggleCourseInfo={toggleCourseInfo}
                    setToggleCourseInfo={setToggleCourseInfo}
                    handicap={handicap}
                    handicapMetrics={handicapMetrics}
                    activeRounds={activeRounds}
                    editScorecard={editScorecard}
                />
            }

            {/* Metrics */}
            {!displayUploadButton && activePage === "Metrics" &&
                <div className="marginTopMedium" style={{ maxWidth: "90vw", marginLeft: "5vw" }}>
                    {statsView}
                </div>
            }

            {/* Course Tour */}
            {!displayUploadButton && activePage === "Course Tour" &&
                <div className="flexColumn marginTopMedium">
                    {/* Each hole summary, best score */}
                    {courseSummaryView}
                    {/* YouTube tour */}
                </div>
            }

            {!displayUploadButton && activePage === "Enter Scorecard" &&
                <ScorecardEntry
                    activeScorecardEntry={activeScorecardEntry}
                    activeScorecardEntryCourseInfo={activeScorecardEntryCourseInfo}
                    setActiveScorecardEntry={setActiveScorecardEntry}
                    courseInfo={courseInfo}
                    pinnedCourse={pinnedCourse}
                    scorecardEntryData={scorecardEntryData}
                    updateScorecardEntryData={updateScorecardEntryData}
                    selectedScorecardOptions={selectedScorecardOptions}
                    setSelectedScorecardOptions={setSelectedScorecardOptions}
                    setDisplayNumberHolesRemovedWarningSnackbar={setDisplayNumberHolesRemovedWarningSnackbar}
                    addActiveScorecardEntry9={addActiveScorecardEntry9}
                    setPreviouslySelectedScorecardOptions={setPreviouslySelectedScorecardOptions}
                    setDisplayScorecard9HoleRemovalModal={setDisplayScorecard9HoleRemovalModal}
                    setDisplayHelpModal={setDisplayHelpModal}
                    validateScorecard={validateScorecard}
                    editingExistingScorecard={editingExistingScorecard}
                    onDeleteScorecard={() => setDisplayDeleteConfirmModal(true)}
                    setExcludeRound={setExcludeRound}
                    setPlayingPartners={setPlayingPartners}
                />
            }

            {!displayUploadButton && activePage === "Courses" &&
                <CoursesPage
                    courseInfo={courseInfo}
                    allRounds={allRounds}
                    apiUrl={API_URL}
                    onRefreshCourseInfo={refreshCourseInfo}
                />
            }

            {/*
                COMPONENT: Help modal displayed when entering scorecard
            */}
            {
                <ScorecardHelpModal
                    displayHelpModal={displayHelpModal}
                    setDisplayHelpModal={setDisplayHelpModal}
                />
            }

            {/*
                Modal to handle when scorecard entry switches from 18 Holes or swaps 9 holes
                Intent is to avoid accidentally removing 9 holes already entered
            */}
            <Modal
                open={displayScorecard9HoleRemovalModal}
                style={{width: "100%", margin: "auto"}}
            >
                <div className="backgroundColorWhite margin0Auto" style={{height: "200px", width: "200px"}}>
                    <p>This may delete current scores entered. Are you sure you would like to update round info?</p>
                    <button
                        onClick={() => {
                            setSelectedScorecardOptions(previouslySelectedScorecardOptions);
                            setDisplayScorecard9HoleRemovalModal(false);
                        }}
                    >
                        Revert Changes
                    </button>
                    <button 
                        onClick={() => {
                            removeUnusedActiveScorecardEntryData();
                            setDisplayScorecard9HoleRemovalModal(false);
                        }}
                    >
                        Continue
                    </button>
                </div>
            </Modal>

            <Snackbar
                open={displayNumberHolesRemovedWarningSnackbar}
                autoHideDuration={6000}
                onClose={() => setDisplayNumberHolesRemovedWarningSnackbar(false)}
                message='Cannot Remove "Front 9", "Back 9", and "18 Holes", retaining last selected option'
            />

            <Snackbar
                open={["success", "error", "delete-success", "delete-error"].includes(displayScorecardSubmissionSnackbar)}
                autoHideDuration={6000}
                onClose={() => setDisplayScorecardSubmissionSnackbar(null)}
                message={
                    displayScorecardSubmissionSnackbar === "success" ? "Scorecard saved" :
                    displayScorecardSubmissionSnackbar === "delete-success" ? "Round deleted" :
                    displayScorecardSubmissionSnackbar === "delete-error" ? "Error deleting round. See console for more details" :
                    "Error saving scorecard. See console for more details"
                }
            />

            {/* Confirm-delete modal */}
            <Modal
                open={displayDeleteConfirmModal}
                style={{width: "100%", margin: "auto"}}
            >
                <div className="backgroundColorWhite margin0Auto paddingLargeMedium" style={{maxWidth: "360px", marginTop: "30vh", padding: "16px", borderRadius: "8px"}}>
                    <h3 className="strongFont blackFont marginBottomSmall">Delete this round?</h3>
                    <p className="blackFont marginBottomMedium">
                        {scorecardEntryData?.roundInfo?.course} on {scorecardEntryData?.roundInfo?.date}.
                        This permanently removes it from staging — you cannot undo it.
                    </p>
                    <div className="flexRow justifyEnd">
                        <button onClick={() => setDisplayDeleteConfirmModal(false)} className="marginRightMedium">Cancel</button>
                        <button onClick={deleteScorecard} style={{backgroundColor: "var(--color-flag-red)", color: "white"}}>Delete</button>
                    </div>
                </div>
            </Modal>


            {/*
                Legacy Rounds — pre-detailed-stats rounds. Stored in the same
                golfrounds collection but flagged via nonGhinRounds.legacyRound
                so they're hidden from every other view that operates on rounds.
            */}
            {!displayUploadButton && activePage === "Legacy Rounds" &&
                <LegacyRoundsTable allRounds={allRounds} />
            }

            {/*
                COMPONENT: Golf Upload Button

                Responsible for uploading Excel file when not fetching from DB

                props:
                    onClick             (function)  resposible for opening fileInputRef
                    ref                 (ref)       opens file explorer
                    onChange            (function)  responsible for fetching golf data upon upload 
                
            */}
            {displayUploadButton &&
                <GolfUploadButton
                    onClickFunction={() => fileInputRef.current.click()}
                    fileInputRef={fileInputRef}
                    onChange={handleImportFile}
                />
            }

            {/* Loader */}
            {isLoading && <div className="alignCenter" style={{ marginTop: "40vh" }}><CircularProgress /></div>}
		</div>
    )
}

export default Golf;
import React, { useState, useEffect, useRef } from "react";
// Components
import GolfUploadButton from '../components/GolfUploadButton';
import GolfTable from '../components/GolfTable';
import PageLinks from '../components/PageLinks';
import ScorecardEntry from '../components/ScorecardEntry';
import ScorecardHelpModal from '../components/ScorecardHelpModal';
// MUI
import {
    TableBody, TableRow, TableCell, FormControl, CircularProgress, InputLabel, MenuItem, Select,
    ListItemText, Checkbox, Modal, Paper, Card, CardContent, Snackbar
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { Close } from '@mui/icons-material';
// Tools
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
// CSS
import "../shared.css"
// Helpers
import { golfRoundMetricHelper } from "../helpers/GolfRoundMetricHelper";
import { importFile } from "../helpers/ImportFileHelper";
import { createScorecard, calculateStats, courseSummary } from "../helpers/GolfFormatHelper";
import { courses } from "../helpers/GolfConsts";
const Excel = require('exceljs');

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
    const [yearFilter, setYearFilter] = useState(2025); // Can set default year here

    // Internal state
    const [displayUploadButton, setDisplayUploadButton] = useState(true);
    const [filters, setFilters] = useState(["2025"]);
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
    const [displayLegacyFilterWarning, setDisplayLegacyFilterWarning] = useState(false);
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
    const [fileUploadComplete, setFileUploadComplete] = useState(false);

    const pinnedCourse = "South Suburban"; // Course pinned atop scorecard entry
    const includePartialRounds = true; // Displays partial rounds

    /**
     * HOOK: useEffect sets filter method when round data is fetched or a new round is added
     * 
     * 
     */
    useEffect(() => {
        changeSortMethod("sequence", "roundInfo");
        setIsLoading(false);

        // Set available round years (used for Annual Summaries)
        let tempRoundYears = [];
        for (let round of allRounds) {
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
        let tempRounds = allRounds;
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
            courses,
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
        let sortableRounds = displayedRounds.filter(round => !round.nonGhinRounds.legacyRound);

        if (displayedRounds.length !== sortableRounds.length) {
            setDisplayLegacyFilterWarning(true);
        }
        
        const sortedRounds = newSortOrder === "ascending" ?
            sortableRounds.sort(function(a,b) { return (a[readingObjectPath][method] < b[readingObjectPath][method]) ? 1 : ((b[readingObjectPath][method] < a[readingObjectPath][method]) ? -1 : 0); }) :
            sortableRounds.sort(function(a,b) { return (a[readingObjectPath][method] < b[readingObjectPath][method]) ? -1 : ((b[readingObjectPath][method] < a[readingObjectPath][method]) ? 1 : 0);} )

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

        setScorecardEntryData({});
        handleActivePageChange();

        if (editingExistingScorecard) {
            setEditingExistingScorecard(false);
            // Update existing round in Mongo
            axios.put('https://worldofjack-server.onrender.com/updateround', tempScorecardEntryData)
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
            axios.post('https://worldofjack-server.onrender.com/add-round', tempScorecardEntryData)
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
    const roundsSortedByDate = allRounds.length > 0 ? allRounds.sort(function(a, b){
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

        return order
    }) : null;

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

    let getRoundTableClassName = (round, i) => {
        let className = "hideTableBottomBorderLastChildCell";
        if (round.scoring.underParRound) className += " backgroundColorEagleRow";
        if (activeRounds.includes(round.roundInfo.key)) className += " hideBorderBottom";
        if ((tableSort.method === 'sequence' && tableSort.order === 'descending') && (displayedRounds.length > 20) && (round.roundInfo.key === handicapCutoffRoundKey)) className += " handicapCutoffRoundBottomBorder";
        return className;
    }

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

            {displayLegacyFilterWarning &&
                <Paper className="flexRow justifySpaceBetween alignCenter marginTopMedium" style={{width: "75vw", padding: "8px 12px"}}>
                    <div className="flexColumn">
                        <b className="blackFont">Warning</b>
                        <span className="blackFont">Legacy rounds have been omitted from filtered results</span>
                    </div>
                    <Close className="blackFont" onClick={() => setDisplayLegacyFilterWarning(false)}/>
                </Paper>
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
                    {calculateStats(courseInfo, allRounds, puttingData, displayedRounds, handicap, displayedRoundsToggle, setDisplayedRoundsToggle, approachView, setApproachView)}
                </div>        
            }

            {/* Course Tour */}
            {!displayUploadButton && activePage === "Course Tour" &&
                <div className="flexColumn marginTopMedium">
                    {/* Each hole summary, best score */}
                    {courseSummary(courseInfo, allRounds, expandSingleHoleMetric, handleSetExpandSingleHoleMetric, courseTours, displayedRounds, displayedRoundsToggle, setDisplayedRoundsToggle)}
                    {/* YouTube tour */}
                </div>
            }

            {!displayUploadButton && activePage === "Enter Scorecard" &&
                <ScorecardEntry
                    activeScorecardEntry={activeScorecardEntry}
                    activeScorecardEntryCourseInfo={activeScorecardEntryCourseInfo}
                    setActiveScorecardEntry={setActiveScorecardEntry}
                    courses={courses}
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
                open={["success", "error"].includes(displayScorecardSubmissionSnackbar)}
                autoHideDuration={6000}
                onClose={() => setDisplayScorecardSubmissionSnackbar(null)}
                message={displayScorecardSubmissionSnackbar === "success" ? "Scorecard saved" : "Error saving scorecard. See console for more details"}
            />


            {/*
                Historic Rounds 
                Summary of all years prior to keeping detailed metrics
            */}
            {!displayUploadButton && activePage === "Historic Rounds" &&
                <div className="">
                    <Card sx={{ minWidth: 275 }}>
                        <CardContent>
                            <h1>hello</h1>
                        </CardContent>
                    </Card>
                </div>
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
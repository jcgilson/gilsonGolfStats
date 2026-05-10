import * as moment from 'moment'

import {
    calculateFairways, calculateGreens
} from "./GolfFormatHelper"


export const golfRoundMetricHelper = (roundData, value, field, hole, allRounds, editingExistingScorecard, activeScorecardEntryCourseInfo, currentCourseKey = null) => {
    let tempScorecardEntryData = roundData;

    // When putts == 0, set dth/puttLength to 0
    if (value && field && hole) {
        if (field === "putts") {
            if (value == 0) {
                // Zero putts should automatically set dth and puttLength
                tempScorecardEntryData[hole].dth = 0;
                tempScorecardEntryData[hole].puttLength = 0;
            } else if (value == 1) {
                // One putts should set puttLength equal to dth
                tempScorecardEntryData[hole].puttLength = tempScorecardEntryData[hole].dth;
            }
        }

        // For one putts, dth updates should also update puttLength
        if (field === "dth" && tempScorecardEntryData[hole].putts == 1) tempScorecardEntryData[hole].puttLength = value;
    }


    // ROUND INFO - 1/2
    // Should already contain roundInfo if roundNotes have been added - to avoid overwriting, setting here
    if (!tempScorecardEntryData.roundInfo) tempScorecardEntryData.roundInfo = { roundNotes: "" };
    if (!tempScorecardEntryData.roundInfo.roundNotes) tempScorecardEntryData.roundInfo.roundNotes = "";

    // Get round metrics
    // FIR
    let fairways = calculateFairways(tempScorecardEntryData)
    tempScorecardEntryData.fairways = fairways;
    // GIR
    let greens = calculateGreens(tempScorecardEntryData)
    tempScorecardEntryData.greens = greens;

    // Prevent manipulating existing scorecards roundInfo
    if (!editingExistingScorecard) {
        let numRoundsAtCourse = 0;
        if (allRounds.length > 0) {
            for (let round of allRounds) {
                if (round.roundInfo.courseKey === activeScorecardEntryCourseInfo.courseKey) numRoundsAtCourse++;
            }
        }
        tempScorecardEntryData.roundInfo.key = currentCourseKey ? currentCourseKey : `${activeScorecardEntryCourseInfo.courseKey}${numRoundsAtCourse + 1}`
        // Sequence
        tempScorecardEntryData.roundInfo.sequence = allRounds.length + 1;
        // Date — transfer from top-level date (set by DatePicker) to roundInfo before deleting
        const tempDate = tempScorecardEntryData.date || tempScorecardEntryData.roundInfo.date;
        const tempFormattedDate = tempDate ? moment(tempDate).format('MM/DD/YY') : moment().format('MM/DD/YY');
        tempScorecardEntryData.roundInfo.date = tempFormattedDate;
        delete tempScorecardEntryData.date;
        // Course info
        tempScorecardEntryData.roundInfo.course = activeScorecardEntryCourseInfo.displayName;
        tempScorecardEntryData.roundInfo.courseKey = activeScorecardEntryCourseInfo.courseKey;
    }
    tempScorecardEntryData.roundInfo.f9Holes = 0;
    tempScorecardEntryData.roundInfo.b9Holes = 0;

    // Eventually sets: numHoles, partialFront9, partialBack9, fullFront9, fullBack9
    // SCORING - 1/2
    tempScorecardEntryData.scoring = {
        numEagles: 0,
        numBirdies: 0,
        numPars: 0,
        numBogey: 0,
        numBogeyPlus: 0,
        scoreToPar: 0,
        in: 0,
        out: 0
    }

    // APPROACH - 1/2
    tempScorecardEntryData.approach = {
        dtgF9: 0,
        dtgB9: 0,
        dtgF9Par5: 0,
        dtgB9Par5: 0,
        dtg2F9Par5: 0,
        dtg2B9Par5: 0,
        dtgF9Gur: 0,
        dtgB9Gur: 0,
        f9Par5s: 0,
        b9Par5s: 0
    }

    // PUTTING INFO - 1/2
    tempScorecardEntryData.putting = {
        // Putt Totals
        putts: 0,
        num3Putts: 0,
        num3PuttsF9: 0,
        num3PuttsB9: 0,
        f9Putts: 0,
        b9Putts: 0,
        // DTH
        dthF9Total: 0,
        dthB9Total: 0,
        dthTotal: 0,
        dthF9: 0,
        dthB9: 0,
        // PuttLength
        puttLengthF9: 0,
        puttLengthB9: 0,
        puttLengthTotal: 0,
        // FPM
        fpmF9Total: 0,
        fpmB9Total: 0,
        fpmTotal: 0,

        // The following stats are calculated below
        // dthF9Average, dthB9Average, dthTotalAverage, fpmF9Average, fpmB9Average, fpmTotalAverage
    }
    
    // Begin iterating every holes and calculate above metrics
    for (let hole = 1; hole <= 18; hole++) {
        // TODO: probably should redefine check below based on holes that are not being entered
        if (Object.keys(tempScorecardEntryData).includes(`hole${hole}`) && tempScorecardEntryData[`hole${hole}`].score > 0) {
            // Scoring
            const tempScorecardEntryDataHole = tempScorecardEntryData[`hole${hole}`]
            const holeScore = tempScorecardEntryDataHole.score;
            
            // Putting
            const holePutts = tempScorecardEntryDataHole.putts;
            const puttLength = tempScorecardEntryDataHole.puttLength || 0;
            const fpm = tempScorecardEntryDataHole.fpm || 0;
            tempScorecardEntryData.putting.putts = tempScorecardEntryData.putting.putts + holePutts;
            if (holePutts > 2) tempScorecardEntryData.putting.num3Putts = tempScorecardEntryData.putting.num3Putts + 1;
            // DTH
            const rawDth = tempScorecardEntryDataHole.dth;
            const rawPuttLength = tempScorecardEntryDataHole.puttLength;
            const holeDth = tempScorecardEntryData[`hole${hole}`].putts == 0 ?
                0 :
                tempScorecardEntryData[`hole${hole}`].putts == 1 ?
                    (rawPuttLength >= 1000 ? 0 : rawPuttLength) :
                    (rawDth >= 1000 ? 0 : rawDth);
            tempScorecardEntryData.putting.dthTotal = tempScorecardEntryData.putting.dthTotal + holeDth;
            // Approach — skip sentinel values (1000 = not entered)
            let holeDtg = tempScorecardEntryDataHole.dtg >= 1000 ? 0 : (tempScorecardEntryDataHole.dtg || 0);
            let holeDtg2 = (tempScorecardEntryDataHole.dtg2 && tempScorecardEntryDataHole.dtg2 < 1000) ? parseInt(tempScorecardEntryDataHole.dtg2) : 0;

            if (hole < 10) { // Front 9
                if (activeScorecardEntryCourseInfo[`hole${hole}`].par == 5) {
                    tempScorecardEntryData.approach.f9Par5s = parseInt(tempScorecardEntryData.approach.f9Par5s) + 1;
                    tempScorecardEntryData.approach.dtgF9Par5 = parseInt(tempScorecardEntryData.approach.dtgF9Par5) + holeDtg;
                    if (tempScorecardEntryDataHole.gir !== "G-1") {
                        tempScorecardEntryData.approach.dtg2F9Par5 = parseInt(tempScorecardEntryData.approach.dtg2F9Par5) + holeDtg2;
                        tempScorecardEntryData.approach.dtgF9Gur = parseInt(tempScorecardEntryData.approach.dtgF9Gur) + 1;
                    }
                } else {
                    tempScorecardEntryData.approach.dtgF9 = parseInt(tempScorecardEntryData.approach.dtgF9) + holeDtg;
                }
                if (holePutts > 2) tempScorecardEntryData.putting.num3PuttsF9 = tempScorecardEntryData.putting.num3PuttsF9 + 1;
                tempScorecardEntryData.scoring.out = tempScorecardEntryData.scoring.out + holeScore;
                tempScorecardEntryData.roundInfo.f9Holes++;
                tempScorecardEntryData.putting.dthF9Total = tempScorecardEntryData.putting.dthF9Total + holeDth;
                tempScorecardEntryData.putting.dthF9 = tempScorecardEntryData.putting.dthF9 + holeDth;
                tempScorecardEntryData.putting.f9Putts = tempScorecardEntryData.putting.f9Putts + holePutts;
                tempScorecardEntryData.putting.puttLengthF9 = tempScorecardEntryData.putting.puttLengthF9 + puttLength;
                tempScorecardEntryData.putting.dthF9Total = tempScorecardEntryData.putting.dthF9Total + holeDth;
                tempScorecardEntryData.putting.fpmF9Total = tempScorecardEntryData.putting.fpmF9Total + fpm;
            } else { // Back 9
                if (activeScorecardEntryCourseInfo[`hole${hole}`].par == 5) {
                    tempScorecardEntryData.approach.b9Par5s = parseInt(tempScorecardEntryData.approach.b9Par5s) + 1;
                    tempScorecardEntryData.approach.dtgB9Par5 = parseInt(tempScorecardEntryData.approach.dtgB9Par5) + holeDtg;
                    if (tempScorecardEntryDataHole.gir !== "G-1") {
                        tempScorecardEntryData.approach.dtg2B9Par5 = parseInt(tempScorecardEntryData.approach.dtg2B9Par5) + holeDtg2;
                        tempScorecardEntryData.approach.dtgB9Gur = parseInt(tempScorecardEntryData.approach.dtgB9Gur) + 1;
                    }
                } else {
                    tempScorecardEntryData.approach.dtgB9 = parseInt(tempScorecardEntryData.approach.dtgB9) + holeDtg;
                }
                if (holePutts > 2) tempScorecardEntryData.putting.num3PuttsB9 = tempScorecardEntryData.putting.num3PuttsB9 + 1;
                tempScorecardEntryData.scoring.in = tempScorecardEntryData.scoring.in + holeScore;
                tempScorecardEntryData.roundInfo.b9Holes++;
                tempScorecardEntryData.putting.dthB9Total = tempScorecardEntryData.putting.dthB9Total + holeDth;
                tempScorecardEntryData.putting.dthB9 = tempScorecardEntryData.putting.dthB9 + holeDth;
                tempScorecardEntryData.putting.b9Putts = tempScorecardEntryData.putting.b9Putts + holePutts;
                tempScorecardEntryData.putting.puttLengthB9 = tempScorecardEntryData.putting.puttLengthB9 + puttLength;
                tempScorecardEntryData.putting.dthB9Total = tempScorecardEntryData.putting.dthB9Total + holeDth;
                tempScorecardEntryData.putting.fpmB9Total = tempScorecardEntryData.putting.fpmB9Total + fpm;
            }

            // Scoring
            if (holeScore - activeScorecardEntryCourseInfo[`hole${hole}`].par == -2) {
                tempScorecardEntryData.scoring.numEagles++;
            } else if (holeScore - activeScorecardEntryCourseInfo[`hole${hole}`].par == -1) {
                tempScorecardEntryData.scoring.numBirdies++;
            } else if (holeScore == activeScorecardEntryCourseInfo[`hole${hole}`].par) {
                tempScorecardEntryData.scoring.numPars++;
            } else if (holeScore - activeScorecardEntryCourseInfo[`hole${hole}`].par == 1) {
                tempScorecardEntryData.scoring.numBogey++;
            } else {
                tempScorecardEntryData.scoring.numBogeyPlus++;
            }
            tempScorecardEntryData.scoring.scoreToPar = tempScorecardEntryData.scoring.scoreToPar + holeScore - activeScorecardEntryCourseInfo[`hole${hole}`].par;
            tempScorecardEntryData.putting.puttLengthTotal = tempScorecardEntryData.putting.puttLengthTotal + puttLength;
            // Currently not calculating scramble stats // TODO: remove all scramble stats
        }
    }

    // ROUND INFO - 2/2
    // Number of holes played, partial/full 9's
    tempScorecardEntryData.roundInfo = {
        ...tempScorecardEntryData.roundInfo,
        numHoles: tempScorecardEntryData.roundInfo.f9Holes + tempScorecardEntryData.roundInfo.b9Holes,
        partialFront9: tempScorecardEntryData.roundInfo.f9Holes > 0 && tempScorecardEntryData.roundInfo.f9Holes < 9,
        partialBack9: tempScorecardEntryData.roundInfo.b9Holes > 0 && tempScorecardEntryData.roundInfo.b9Holes < 9,
        fullFront9: tempScorecardEntryData.roundInfo.f9Holes == 9,
        fullBack9: tempScorecardEntryData.roundInfo.b9Holes == 9
    }
    delete tempScorecardEntryData.scoring.f9Holes;
    delete tempScorecardEntryData.scoring.b9Holes;

    // APPROACH - 1/2
    tempScorecardEntryData.approach = {
        ...tempScorecardEntryData.approach,
        dtgF9Average: (9 - tempScorecardEntryData.approach.f9Par5s) > 0 ? parseInt((tempScorecardEntryData.approach.dtgF9 / (9 - tempScorecardEntryData.approach.f9Par5s)).toFixed(0)) : 0,
        dtgB9Average: (9 - tempScorecardEntryData.approach.b9Par5s) > 0 ? parseInt((tempScorecardEntryData.approach.dtgB9 / (9 - tempScorecardEntryData.approach.b9Par5s)).toFixed(0)) : 0,
        dtgTotal: tempScorecardEntryData.approach.dtgF9 + tempScorecardEntryData.approach.dtgB9,
        dtgTotalAverage: (18 - tempScorecardEntryData.approach.f9Par5s - tempScorecardEntryData.approach.b9Par5s) > 0 ? parseInt(((tempScorecardEntryData.approach.dtgF9 + tempScorecardEntryData.approach.dtgB9) / (18 - tempScorecardEntryData.approach.f9Par5s - tempScorecardEntryData.approach.b9Par5s)).toFixed(0)) : 0,

        dtgF9Par5Average: tempScorecardEntryData.approach.f9Par5s > 0 ? parseInt((tempScorecardEntryData.approach.dtgF9Par5 / tempScorecardEntryData.approach.f9Par5s).toFixed(0)) : 0,
        dtgB9Par5Average: tempScorecardEntryData.approach.b9Par5s > 0 ? parseInt((tempScorecardEntryData.approach.dtgB9Par5 / tempScorecardEntryData.approach.b9Par5s).toFixed(0)) : 0,

        // DTG2 averages use non-G-1 par 5 count since G-1 holes have no second approach shot
        dtg2F9Par5Average: tempScorecardEntryData.approach.dtgF9Gur > 0 ? parseInt((tempScorecardEntryData.approach.dtg2F9Par5 / tempScorecardEntryData.approach.dtgF9Gur).toFixed(0)) : 0,
        dtg2B9Par5Average: tempScorecardEntryData.approach.dtgB9Gur > 0 ? parseInt((tempScorecardEntryData.approach.dtg2B9Par5 / tempScorecardEntryData.approach.dtgB9Gur).toFixed(0)) : 0,

        dtgTotalPar5Average: (tempScorecardEntryData.approach.f9Par5s + tempScorecardEntryData.approach.b9Par5s) > 0 ? parseInt(((tempScorecardEntryData.approach.dtgF9Par5 + tempScorecardEntryData.approach.dtgB9Par5) / (tempScorecardEntryData.approach.f9Par5s + tempScorecardEntryData.approach.b9Par5s)).toFixed(0)) : 0,
        dtg2TotalPar5Average: (tempScorecardEntryData.approach.dtgF9Gur + tempScorecardEntryData.approach.dtgB9Gur) > 0 ? parseInt(((tempScorecardEntryData.approach.dtg2F9Par5 + tempScorecardEntryData.approach.dtg2B9Par5) / (tempScorecardEntryData.approach.dtgF9Gur + tempScorecardEntryData.approach.dtgB9Gur)).toFixed(0)) : 0
    }


    // PUTTING 2/2 (reference below stats in PUTTING 1/2)
    const f9Holes = tempScorecardEntryData.roundInfo.f9Holes;
    const b9Holes = tempScorecardEntryData.roundInfo.b9Holes;
    const totalHoles = f9Holes + b9Holes;
    tempScorecardEntryData.putting = {
        ...tempScorecardEntryData.putting,
        dthF9Average: f9Holes > 0 ? parseInt((tempScorecardEntryData.putting.dthF9 / f9Holes).toFixed(1)) : 0,
        dthB9Average: b9Holes > 0 ? parseInt((tempScorecardEntryData.putting.dthB9 / b9Holes).toFixed(1)) : 0,
        dthTotalAverage: totalHoles > 0 ? parseInt((tempScorecardEntryData.putting.dthTotal / totalHoles).toFixed(1)) : 0,
        fpmTotalAverage: totalHoles > 0 ? parseInt((tempScorecardEntryData.putting.fpmTotal / totalHoles).toFixed(1)) : 0,
    }

    // SCORING
    // Set course par based on holes played
    let courseParBasedOnHolesPlayed = 0;
    // Full front 9
    if (tempScorecardEntryData.roundInfo.fullFront9) {
        if (tempScorecardEntryData.roundInfo.fullBack9) {
            courseParBasedOnHolesPlayed = activeScorecardEntryCourseInfo.par;
        } else {
            courseParBasedOnHolesPlayed = activeScorecardEntryCourseInfo.f9Par;
        }
    } else {
        courseParBasedOnHolesPlayed = activeScorecardEntryCourseInfo.b9Par;
    }
    tempScorecardEntryData.scoring = {
        ...tempScorecardEntryData.scoring,
        coursePar: courseParBasedOnHolesPlayed,
        underParRound: tempScorecardEntryData.scoring.scoreToPar < 0,
        total: tempScorecardEntryData.scoring.out + tempScorecardEntryData.scoring.in
    }

    // NON GHIN ROUNDS
    // Flags are set explicitly via the "Exclude round" checkbox + reason dropdown in ScorecardEntry,
    // or carried over from imported rounds. Default to all-false on new rounds.
    if (!tempScorecardEntryData.nonGhinRounds) {
        tempScorecardEntryData.nonGhinRounds = {
            scrambleRound: false,
            leagueRound: false,
            legacyRound: false,
            boozeRound: false,
        };
    }

    return tempScorecardEntryData;
}
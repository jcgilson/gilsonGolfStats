import React from "react";

export const calculateConsecutiveOnePutts = (allRounds) => {
    let mostConsecutiveOnePutts = 0;
    let tempMostConsecutiveOnePutts = 0;
    let consecutiveOnePutts = 0;
    
    let finalStartDateOfStreak = "";
    let finalStartCourseOfStreak = "";
    let finalStartHoleOfStreak = 0;

    let finalEndDateOfStreak = "";
    let finalEndCourseOfStreak = "";
    let finalEndHoleOfStreak = 0;

    let tempStartDateOfStreak = "";
    let tempStartCourseOfStreak = "";
    let tempStartHoleOfStreak = 0;
    
    let tempEndDateOfStreak = "";
    let tempEndCourseOfStreak = "";
    let tempEndHoleOfStreak = 0;

    for (let round of allRounds) {
        for (let hole = 1; hole <= 18; hole++ ) {
            if (round[`hole${hole}`]) {
                // One putt or chip in occurred
                if (round[`hole${hole}`].putts === 0 || round[`hole${hole}`].putts === 1) {
                    // Adding to streak
                    consecutiveOnePutts++;
    
                    // Set start streak when empty
                    if (tempStartDateOfStreak === "") {
                        tempStartDateOfStreak = round.roundInfo.date;
                        tempStartCourseOfStreak = round.roundInfo.course;
                        tempStartHoleOfStreak = hole;
                        tempEndDateOfStreak = round.roundInfo.date;
                        tempEndCourseOfStreak = round.roundInfo.course;
                        tempEndHoleOfStreak = hole;
                    } else {
                        // Set only end streak when start streak exists
                        tempEndDateOfStreak = round.roundInfo.date;
                        tempEndCourseOfStreak = round.roundInfo.course;
                        tempEndHoleOfStreak = hole;
                    }
    
                    // Set most consecutive one putts when streak is made
                    if (consecutiveOnePutts > tempMostConsecutiveOnePutts) {
                        tempMostConsecutiveOnePutts = consecutiveOnePutts;
                    }
                } else {
                    // When streak is set, save values
                    if (tempMostConsecutiveOnePutts > mostConsecutiveOnePutts) {
                        finalStartDateOfStreak = tempStartDateOfStreak;
                        finalStartCourseOfStreak = tempStartCourseOfStreak;
                        finalStartHoleOfStreak = tempStartHoleOfStreak;
                        finalEndDateOfStreak = tempEndDateOfStreak;
                        finalEndCourseOfStreak = tempEndCourseOfStreak;
                        finalEndHoleOfStreak = tempEndHoleOfStreak;
                        mostConsecutiveOnePutts = tempMostConsecutiveOnePutts;
                    }
                    // Reset temporarily values when streak is over
                    tempStartDateOfStreak = "";
                    tempStartCourseOfStreak = "";
                    tempStartHoleOfStreak = 0;
                    tempEndDateOfStreak = "";
                    tempEndCourseOfStreak = "";
                    tempEndHoleOfStreak = 0;
                    tempMostConsecutiveOnePutts = 0;
                    consecutiveOnePutts = 0;
                }
            }
        }
    }

    return <h3 className="strongFont">{mostConsecutiveOnePutts} holes: {finalStartDateOfStreak} {finalStartCourseOfStreak} {finalStartHoleOfStreak} - {finalStartDateOfStreak === finalEndDateOfStreak ? "" : finalEndDateOfStreak} {finalStartCourseOfStreak === finalEndCourseOfStreak ? "" : finalEndCourseOfStreak} {finalEndHoleOfStreak}</h3>;
}

export const calculateMostPutts = (allRounds) => {
    let mostPutts9 = 0;
    let mostPuttsDate9 = "";
    let mostPuttsCourse9 = "";
    let mostPuttFrontOrBack9 = ""
    
    let mostPutts18 = 0;
    let mostPuttsDate18 = "";
    let mostPuttsCourse18 = "";

    for (let round of allRounds) {
        if (round.putting.f9Putts > mostPutts9) {
            mostPutts9 = round.putting.f9Putts;
            mostPuttsDate9 = round.roundInfo.date;
            mostPuttsCourse9 = round.roundInfo.course;
            mostPuttFrontOrBack9 = "Front 9";
        }
        if (round.putting.b9Putts > mostPutts9) {
            mostPutts9 = round.putting.b9Putts;
            mostPuttsDate9 = round.roundInfo.date;
            mostPuttsCourse9 = round.roundInfo.course;
            mostPuttFrontOrBack9 = "Back 9";
        }
        if (round.putting.putts > mostPutts18) {
            mostPutts18 = round.putting.putts;
            mostPuttsDate18 = round.roundInfo.date;
            mostPuttsCourse18 = round.roundInfo.course;
        }
    }

    return <h3 className="strongFont">9 holes: {mostPutts9} ({mostPuttsDate9} {mostPuttsCourse9} {mostPuttFrontOrBack9}) - 18 holes: {mostPutts18} ({mostPuttsDate18} {mostPuttsCourse18})</h3>;
}

export const calculateLeastPutts = (allRounds) => {
    let leastPutts9 = 100;
    let leastPuttsDate9 = "";
    let leastPuttsCourse9 = "";
    let leastPuttFrontOrBack9 = ""
    
    let leastPutts18 = 100;
    let leastPuttsDate18 = "";
    let leastPuttsCourse18 = "";

    for (let round of allRounds) {
        if (round.roundInfo.fullFront9 && round.putting.f9Putts !== 0 && round.putting.f9Putts < leastPutts9 && !round.nonGhinRounds.scrambleRound) {
            leastPutts9 = round.putting.f9Putts;
            leastPuttsDate9 = round.roundInfo.date;
            leastPuttsCourse9 = round.roundInfo.course;
            leastPuttFrontOrBack9 = "Front 9";
        }
        if (round.roundInfo.fullBack9 && round.putting.b9Putts !== 0 && round.putting.b9Putts < leastPutts9 && !round.nonGhinRounds.scrambleRound) {
            leastPutts9 = round.putting.b9Putts;
            leastPuttsDate9 = round.roundInfo.date;
            leastPuttsCourse9 = round.roundInfo.course;
            leastPuttFrontOrBack9 = "Back 9";
        }
        if (round.roundInfo.fullFront9 && round.roundInfo.fullBack9 && round.roundInfo.numHoles === 18 && round.putting.putts < leastPutts18 && !round.nonGhinRounds.scrambleRound) {
            leastPutts18 = round.putting.putts;
            leastPuttsDate18 = round.roundInfo.date;
            leastPuttsCourse18 = round.roundInfo.course;
        }
    }

    return <h3 className="strongFont">9 holes: {leastPutts9} ({leastPuttsDate9} {leastPuttsCourse9} {leastPuttFrontOrBack9}) - 18 holes: {leastPutts18} ({leastPuttsDate18} {leastPuttsCourse18})</h3>;
}

export const calculateLargestScoreDisparity = (allRounds) => {
    let largestDisparity = 0;
    let largestDisparityDate = "";
    let largestDisparityCourse = "";
    let largestDisparityOut = 0;
    let largestDisparityIn = 0;
    
    for (let round of allRounds) {
        if (round.roundInfo.numHoles === 18 && (round.scoring.in - round.scoring.out > largestDisparity || round.scoring.out - round.scoring.in > largestDisparity)) {
            if (round.scoring.out - round.scoring.out > round.scoring.out - round.scoring.in) {
                largestDisparity = round.scoring.in - round.scoring.out;
            } else {
                largestDisparity = round.scoring.out - round.scoring.in;
            }
            largestDisparityDate = round.roundInfo.date;
            largestDisparityCourse = round.roundInfo.course;
            largestDisparityOut = round.scoring.out;
            largestDisparityIn = round.scoring.in;
        }
    }

    return <h3 className="strongFont">{largestDisparity} strokes: {largestDisparityOut} - {largestDisparityIn} ({largestDisparityDate} {largestDisparityCourse})</h3>;
}

const scoringMap = [
    { description: "eagle", scoreToPar: -2 },
    { description: "birdie", scoreToPar: -1 },
    { description: "par", scoreToPar: 0 },
    { description: "bogey", scoreToPar: 1 },
    { description: "double", scoreToPar: 2 },
    { description: "triple", scoreToPar: 3 },
    { description: "quad", scoreToPar: 4 }
];

export const calculateScoringAverageMetrics = (courseInfo, allRounds) => {

    let scoringAveragesInfo = [
        { key: "3", header: "Par 3" },
        { key: "4", header: "Par 4" },
        { key: "5", header: "Par 5" },
        { key: "total", header: "Total" }
    ]
    
    let scoringAverages = [];
    scoringAveragesInfo.forEach(info => {
        scoringAverages.push({
            ...info,
            numHoles: 0,
            scoreToPar: 0,
            threePutts: 0,
            scoring: {
                eagle: 0,
                birdie: 0,
                par: 0,
                bogey: 0,
                double: 0,
                triple: 0,
                quad: 0,
            }
        })
    });

    for (let round of allRounds) {
        if (!round.nonGhinRounds.leagueRound && !round.nonGhinRounds.scrambleRound && !round.nonGhinRounds.legacyRound) {
            const singleCourseInfo = courseInfo.find(info => info.courseKey === round.roundInfo.courseKey)
            for (let hole = 1; hole <= 18; hole++ ) {
                if (round[`hole${hole}`]) {
                    const holePar = singleCourseInfo[`hole${hole}`].par;
                    const holeScoreToPar = round[`hole${hole}`].score - holePar;
                    const hole3Putt = round[`hole${hole}`].putts >= 3;
                    let scoringTypeIndex = scoringMap.findIndex(score => score.scoreToPar === holeScoreToPar);
                    if (scoringTypeIndex == -1) scoringTypeIndex = scoringMap.length - 1; // Record quad+ as quad
                    const scoringTypeDescription = scoringMap[scoringTypeIndex].description;
                    const scoringAverageIndex = scoringAverages.findIndex(average => average.key === holePar.toString());
                    scoringAverages[scoringAverageIndex] = {
                        ...scoringAverages[scoringAverageIndex],
                        scoreToPar: scoringAverages[scoringAverageIndex].scoreToPar + holeScoreToPar,
                        threePutts: hole3Putt ? scoringAverages[scoringAverageIndex].threePutts + 1 : scoringAverages[scoringAverageIndex].threePutts,
                        numHoles: scoringAverages[scoringAverageIndex].numHoles + 1,
                        scoring: {
                            ...scoringAverages[scoringAverageIndex].scoring,
                            [scoringTypeDescription]: scoringAverages[scoringAverageIndex].scoring[scoringTypeDescription] + 1
                        }
                    }
                    const totalRowIndex = scoringAverages.length - 1;
                    scoringAverages[totalRowIndex] = {
                        ...scoringAverages[totalRowIndex],
                        scoreToPar: scoringAverages[totalRowIndex].scoreToPar + holeScoreToPar,
                        threePutts: hole3Putt ? scoringAverages[totalRowIndex].threePutts + 1 : scoringAverages[totalRowIndex].threePutts,
                        numHoles: scoringAverages[totalRowIndex].numHoles + 1,
                        scoring: {
                            ...scoringAverages[totalRowIndex].scoring,
                            [scoringTypeDescription]: scoringAverages[totalRowIndex].scoring[scoringTypeDescription] + 1
                        }
                    }
                }
            }
        }
    }

    return scoringAverages;
}

export const calculateSingleHoleMetrics = (courseInfo, allRounds) => {
    let singleHoleMetrics = {
        bestCumulativeScoreSingle: {
            cumulativeScoreToPar: 100,
            course: "",
            par: 0,
            hole: 0,
            rounds: 0
        },
        worstCumulativeScoreSingle: {
            cumulativeScoreToPar: 0,
            course: "",
            par: 0,
            hole: 0,
            rounds: 0
        },
        birdies: {
            mostBirdies: 0,
            mostBirdiesCourse: "",
            mostBirdiesPar: 0,
            mostBirdiesHole: 0,
            mostBirdiesRounds: 0,
            notBirdied: []
        },
        bogeyPlus: {
            mostBogeyPlus: 0,
            mostBogeyPlusCourse: "",
            mostBogeyPlusPar: 0,
            mostBogeyPlusHole: 0,
            mostBogeyPlusRounds: 0,
            leastBogeyPlus: 100,
            leastBogeyPlusCourse: "",
            leastBogeyPlusPar: 0,
            leastBogeyPlusHole: 0,
            leastBogeyPlusRounds: 0
        },
        mostPutts: {
            // Most number of putts 9
            highestPuttAverage9Date: "",
            highestPuttAverage9Course: "",
            highestPuttAverage9InOrOut: "",
            highestPuttAverage9: 0,
            // Most number of putts 18
            highestPuttAverage18Date: "",
            highestPuttAverage18Course: "",
            highestPuttAverage18InOrOut: "",
            highestPuttAverage18: 0,
            highestPuttAverage18Front9: 0,
            highestPuttAverage18Back9: 0,

            // Least number of putts 9
            lowestPuttAverage9Date: "",
            lowestPuttAverage9Course: "",
            lowestPuttAverage9InOrOut: "",
            lowestPuttAverage9: 0,

            // Least number of putts 18
            lowestPuttAverage18Date: "",
            lowestPuttAverage18Course: "",
            lowestPuttAverage18InOrOut: "",
            lowestPuttAverage18: 0,
            lowestPuttAverage18Front9: 0,
            lowestPuttAverage18Back9: 0,
        },
        ctp: {},
        longestDrive: {}
    };
    
    for (let round of allRounds) {
        const singleCourseInfo = courseInfo.find(info => info.courseKey === round.roundInfo.courseKey)
        for (let hole = 1; hole <= 18; hole++ ) {
            if (round[`hole${hole}`]) {
                if (singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`] === undefined) {
                    singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`] = { // Initial fields for hole
                        course: round.roundInfo.course,
                        courseKey: round.roundInfo.courseKey,
                        par: singleCourseInfo[`hole${hole}`].par,
                        hole: hole,
                        distance: singleCourseInfo[`hole${hole}`].distance,
                        rounds: 1,
                        cumulativeScore: round[`hole${hole}`].score,
                        cumulativeScoreToPar: round[`hole${hole}`].score - singleCourseInfo[`hole${hole}`].par,
                        best: round[`hole${hole}`].score,
                        bestScoreToPar: round[`hole${hole}`].score - singleCourseInfo[`hole${hole}`].par,
                        worst: round[`hole${hole}`].score,
                        worstScoreToPar: round[`hole${hole}`].score - singleCourseInfo[`hole${hole}`].par,
                        numEagles: 0,
                        numBirdies: 0,
                        numPars: 0,
                        numBogeys: 0,
                        numBogeyPlus: 0,
                        putts: round[`hole${hole}`].putts,
                        putts0: round[`hole${hole}`].putts === 0 ? 1 : 0,
                        putts1: round[`hole${hole}`].putts === 1 ? 1 : 0,
                        putts2: round[`hole${hole}`].putts === 2 ? 1 : 0,
                        putts3: round[`hole${hole}`].putts === 3 ? 1 : 0,
                        dth: round[`hole${hole}`].dth ? round[`hole${hole}`].dth : null, // dth not captured for all rounds
                        fairways: { l: 0, r: 0, f: 0, x: 0, na: 0, lScoreToPar: 0, rScoreToPar: 0, fScoreToPar: 0 },
                        greens: { g: 0, x: 0, gur: 0, gScoreToPar: 0, xScoreToPar: 0, gurScoreToPar: 0 },
                        puttLength: round[`hole${hole}`].puttLength,
                        handicap: singleCourseInfo[`hole${hole}`].handicap,
                        roundsData: []
                    }
                } else { // Metric is already defined
                    singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].rounds++; // Add round
                    singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].cumulativeScore = singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].cumulativeScore + round[`hole${hole}`].score; // Add score to cumulative score
                    singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].cumulativeScoreToPar = singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].cumulativeScoreToPar + round[`hole${hole}`].score - singleCourseInfo[`hole${hole}`].par; // Add score to cumulative score to par
                
                    singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].putts = singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].putts + round[`hole${hole}`].putts; // Add putts to cumulative putts
                    singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`][`putts${round[`hole${hole}`].putts}`] = singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`][`putts${round[`hole${hole}`].putts}`] + 1; // Add 1 to putts0, putts1, etc.

                    if (round[`hole${hole}`].score < singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].best) { // Best score for hole is set
                        singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].best = round[`hole${hole}`].score;
                        singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].bestScoreToPar = round[`hole${hole}`].score - singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].par;
                    }
                    if (round[`hole${hole}`].score > singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].worst) { // Worst score for hole is set
                        singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].worst = round[`hole${hole}`].score;
                        singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].worstScoreToPar = round[`hole${hole}`].score - singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].par;
                    }
                }
                // Add to score distribution
                if (round[`hole${hole}`].score <= singleCourseInfo[`hole${hole}`].par - 2) singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].numEagles++
                if (round[`hole${hole}`].score === singleCourseInfo[`hole${hole}`].par - 1) singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].numBirdies++;
                if (round[`hole${hole}`].score === singleCourseInfo[`hole${hole}`].par) singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].numPars++;
                if (round[`hole${hole}`].score === singleCourseInfo[`hole${hole}`].par + 1) singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].numBogeys++;
                if (round[`hole${hole}`].score >= singleCourseInfo[`hole${hole}`].par + 2) singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].numBogeyPlus++;
                singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].roundsData.push({
                    sequence: round.roundInfo.sequence,
                    date: round.roundInfo.date,
                    score: round[`hole${hole}`].score,
                    putts: round[`hole${hole}`].putts,
                    fir: round[`hole${hole}`].fir,
                    gir: round[`hole${hole}`].gir,
                    dtg: round[`hole${hole}`].dtg,
                    dth: round[`hole${hole}`].dth,
                    puttLength: round[`hole${hole}`].puttLength,
                    notes: round[`hole${hole}`].notes,
                });
                // Fairways
                if (round[`hole${hole}`].fir === 'L') {
                    singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].fairways.l++; // Left of fairway
                    singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].fairways.lScoreToPar = singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].fairways.lScoreToPar + round[`hole${hole}`].score - singleCourseInfo[`hole${hole}`].par;
                } else {
                    if (round[`hole${hole}`].fir === 'R') {
                        singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].fairways.r++; // Right of fairway
                        singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].fairways.rScoreToPar = singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].fairways.rScoreToPar + round[`hole${hole}`].score - singleCourseInfo[`hole${hole}`].par;
                    } else {
                        if (round[`hole${hole}`].fir === 'F') { // Fairway in regulation
                            singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].fairways.f++;
                            singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].fairways.fScoreToPar = singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].fairways.fScoreToPar + round[`hole${hole}`].score - singleCourseInfo[`hole${hole}`].par;
                        }
                        else {
                            if (round[`hole${hole}`].fir === 'X') singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].fairways.x++; // Short of fairway/topped/out of bounds
                            else {
                                if (round[`hole${hole}`].fir === 'NA') singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].fairways.na++;
                            }
                        }
                    }
                }
                // Greens
                if (round[`hole${hole}`].gir === 'G') { // Green in regulation
                    singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].greens.g++;
                    singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].greens.gScoreToPar = singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].greens.gScoreToPar + round[`hole${hole}`].score - singleCourseInfo[`hole${hole}`].par;
                } else {
                    if (round[`hole${hole}`].gir === 'X') { // Green missed
                        singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].greens.x++;
                        singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].greens.xScoreToPar = singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].greens.xScoreToPar + round[`hole${hole}`].score - singleCourseInfo[`hole${hole}`].par;
                    } else {
                        if (round[`hole${hole}`].gir === 'G-1') {
                            singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].greens.gur++; // Green under regulation
                            singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].greens.gurScoreToPar = singleHoleMetrics[`${round.roundInfo.courseKey}Hole${hole}`].greens.gurScoreToPar + round[`hole${hole}`].score - singleCourseInfo[`hole${hole}`].par;
                        }
                    }
                }
                // CTP
                if (
                    round[`hole${hole}`].dth && // DTH value must exist
                    singleCourseInfo[`hole${hole}`].par === 3 && // Must be par 3
                    (round[`hole${hole}`].gir === "G" || round[`hole${hole}`].gir === "G-1") && // Must be GIR or GUR
                    (round.sequence >= 9 || // Started capturing DTH after 9 rounds
                        (round[`hole${hole}`].putts === 0 || round[`hole${hole}`].putts === 1) // Chip-in or 1-putt counts towards CTP if sequence is < 9
                    )
                ) {
                    if (!singleHoleMetrics.ctp[`${round.roundInfo.courseKey}Hole${hole}`] || (round[`hole${hole}`].dth < singleHoleMetrics.ctp[`${round.roundInfo.courseKey}Hole${hole}`].dth)) {
                        singleHoleMetrics.ctp[`${round.roundInfo.courseKey}Hole${hole}`] = {
                            date: round.roundInfo.date,
                            course: round.roundInfo.course,
                            hole: hole,
                            dth: round[`hole${hole}`].dth,
                            score: round[`hole${hole}`].score,
                            distance: singleCourseInfo[`hole${hole}`].distance
                        }
                    }
                }
                // Longest Drive and Shortest DTG
                if (
                    round[`hole${hole}`].dtg && // DTG value must exist
                    singleCourseInfo[`hole${hole}`].par !== 3 // Must not be par 3
                    ) {
                    let holeDtg = round[`hole${hole}`].dtg;
                    if (typeof holeDtg !== "number") {
                        const initialDtg = holeDtg.split(", ")
                        holeDtg = initialDtg[0];
                    }
                    if (!singleHoleMetrics.longestDrive[`${round.roundInfo.courseKey}Hole${hole}`] || (round[`hole${hole}`].dtg < singleHoleMetrics.longestDrive[`${round.roundInfo.courseKey}Hole${hole}`].dtg)) {
                        singleHoleMetrics.longestDrive[`${round.roundInfo.courseKey}Hole${hole}`] = {
                            date: round.roundInfo.date,
                            course: round.roundInfo.course,
                            hole: hole,
                            dtg: round[`hole${hole}`].dtg,
                            longestDrive: singleCourseInfo[`hole${hole}`].distance - holeDtg,
                            score: round[`hole${hole}`].score,
                            distance: singleCourseInfo[`hole${hole}`].distance
                        }
                    }
                }
            }
        }
    }

    for (let hole in Object.keys(singleHoleMetrics)) {
        const nonHoleMetrics = ["bestCumulativeScoreSingle", "worstCumulativeScoreSingle", "birdies", "bogeyPlus", "mostPutts", "ctp", "longestDrive"];
        if (!nonHoleMetrics.includes(Object.keys(singleHoleMetrics)[hole])) { // Not actually holes
            // Determine which hole had best cumulative total
            if (singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].cumulativeScoreToPar < singleHoleMetrics.bestCumulativeScoreSingle.cumulativeScoreToPar) { // Store cumulative total to par when lowest
                singleHoleMetrics.bestCumulativeScoreSingle = singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]]; // Save best metrics
            }

            // Determine which hole had worst cumulative total
            if (singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].cumulativeScoreToPar > singleHoleMetrics.worstCumulativeScoreSingle.cumulativeScoreToPar) { // Store cumulative total to par when highest
                singleHoleMetrics.worstCumulativeScoreSingle = singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]]; // Save best metrics
            }
            // Determine which hole has most birdies
            if (singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].numBirdies > singleHoleMetrics.birdies.mostBirdies) {
                singleHoleMetrics.birdies = {
                    ...singleHoleMetrics.birdies,
                    mostBirdies: singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].numBirdies,
                    mostBirdiesCourse: singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].course,
                    mostBirdiesPar: singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].par,
                    mostBirdiesHole: singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].hole,
                    mostBirdiesRounds: singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].rounds
                }
            }
            // Determine which hole has most bogey plus
            if (singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].numBogeyPlus > singleHoleMetrics.bogeyPlus.mostBogeyPlus) {
                singleHoleMetrics.bogeyPlus = {
                    ...singleHoleMetrics.bogeyPlus,
                    mostBogeyPlus: singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].numBogeyPlus,
                    mostBogeyPlusCourse: singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].course,
                    mostBogeyPlusPar: singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].par,
                    mostBogeyPlusHole: singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].hole,
                    mostBogeyPlusRounds: singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].rounds
                }
            }
            // Determine which hole has least bogey plus
            if (singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].numBogeyPlus < singleHoleMetrics.bogeyPlus.leastBogeyPlus) {
                singleHoleMetrics.bogeyPlus = {
                    ...singleHoleMetrics.bogeyPlus,
                    leastBogeyPlus: singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].numBogeyPlus,
                    leastBogeyPlusCourse: singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].course,
                    leastBogeyPlusPar: singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].par,
                    leastBogeyPlusHole: singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].hole,
                    leastBogeyPlusRounds: singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].rounds
                }
            }
            // Determine which hole has least birdies - There are a number of hole not birdied
            if (singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]].numBirdies === 0) {
                singleHoleMetrics.birdies.notBirdied.push(singleHoleMetrics[Object.keys(singleHoleMetrics)[hole]]);
            }
        }
    }

    return singleHoleMetrics;
}

export const calculateCourseMetrics = (courseInfo, allRounds) => {
    let courseMetrics = {};
    for (let course of courseInfo) {
        courseMetrics[course.courseKey] = {
            inDate: "",
            in: 100,
            inPutts: 0,

            outDate: "",
            out: 100,
            outPutts: 0,

            totalDate: "",
            total: 200,
            totalPutts: 0,
            totalIn: 100,
            totalOut: 100,
        }
    }

    for (let round of allRounds) {
        // Best IN round
        if (courseMetrics[round.roundInfo.courseKey].in > round.scoring.in && round.scoring.in !== 0 && round.roundInfo.fullBack9 && !round.nonGhinRounds.scrambleRound) {
            courseMetrics[round.roundInfo.courseKey] = {
                ...courseMetrics[round.roundInfo.courseKey],
                inDate: round.roundInfo.date,
                in: round.scoring.in,
                inPutts: round.putting.f9Putts
            }
        }
        // Best OUT round
        if (courseMetrics[round.roundInfo.courseKey].out > round.scoring.out && round.scoring.out !== 0 && round.roundInfo.fullFront9 && !round.nonGhinRounds.scrambleRound) {
            courseMetrics[round.roundInfo.courseKey] = {
                ...courseMetrics[round.roundInfo.courseKey],
                outDate: round.roundInfo.date,
                out: round.scoring.out,
                outPutts: round.putting.b9Putts
            }
        }
        // Best total round
        if (courseMetrics[round.roundInfo.courseKey].total > round.scoring.total && round.roundInfo.fullBack9 && round.roundInfo.fullFront9 && !round.nonGhinRounds.scrambleRound) {
            courseMetrics[round.roundInfo.courseKey] = {
                ...courseMetrics[round.roundInfo.courseKey],
                totalDate: round.roundInfo.date,
                total: round.scoring.total,
                totalPutts: round.putting.putts,
                totalIn: round.in,
                totalOut: round.scoring.out,
            }
        }
    }

    return courseMetrics;
}

export const calculateLostBallMetrics = (courseInfo, displayedRounds) => {

    // TODO: lost ball calculation: most number of holes played without a lost ball

    let lostBallMetrics = {
        totalLostBalls: 0,
        par3LostBalls: 0,
        par4LostBalls: 0,
        par5LostBalls: 0,
        lostBallsByDate: [],
        longestStreakWithoutLostBall: {}
    }

    let bestStreakWithoutLostBall = {
        numHoles: 0,
        startDate: "",
        endDate: ""
    }
    
    const initialStreakWithoutLostBall = {
        numHoles: 0,
        startDate: "",
    }
    
    let currentStreakWithoutLostBall = initialStreakWithoutLostBall;

    for (let round of displayedRounds) {
        const singleCourseInfo = courseInfo.find(info => info.courseKey === round.roundInfo.courseKey)
        if (!round.nonGhinRounds.leagueRound && !round.nonGhinRounds.scrambleRound) { // Do not include League & Scramble rounds because of hole distances
            for (let hole = 1; hole <= 18; hole++) {
                if (round[`hole${hole}`]) {
                    if (round[`hole${hole}`].notes && typeof round[`hole${hole}`].notes === "string" && round[`hole${hole}`].notes.includes("LB")) {
                        // Total lost ball count
                        if (round[`hole${hole}`].notes.includes("2LB")) {
                            lostBallMetrics.totalLostBalls = lostBallMetrics.totalLostBalls + 2;
                        } else {
                            lostBallMetrics.totalLostBalls++;
                        }

                        // Create date map
                        const existingRoundIndex = lostBallMetrics.lostBallsByDate.findIndex(lostBallRound => lostBallRound.roundKey === round.roundInfo.key);
                        if (existingRoundIndex !== -1) {
                            lostBallMetrics.lostBallsByDate[existingRoundIndex].lostBallHoles[`hole${hole}`] = round[`hole${hole}`].notes.includes("2LB") ? 2 : 1;
                            if (round[`hole${hole}`].notes.includes("2LB")) {
                                lostBallMetrics.lostBallsByDate[existingRoundIndex].total = lostBallMetrics.lostBallsByDate[existingRoundIndex].total + 2;
                            } else {
                                lostBallMetrics.lostBallsByDate[existingRoundIndex].total = lostBallMetrics.lostBallsByDate[existingRoundIndex].total + 1;
                            }
                        } else {
                            let tempHole = {
                                roundKey: round.roundInfo.key,
                                date: round.roundInfo.date,
                                course: round.roundInfo.course,
                                total: round[`hole${hole}`].notes.includes("2LB") ? 2 : 1,
                                lostBallHoles: {
                                    [`hole${hole}`]: round[`hole${hole}`].notes.includes("2LB") ? 2 : 1
                                }
                            }
                            lostBallMetrics.lostBallsByDate.push(tempHole)
                        }

                        // Lost balls by par
                        lostBallMetrics[`par${singleCourseInfo[`hole${hole}`].par}LostBalls`]++;

                        // Store current streaks end date (streak is broken)
                        currentStreakWithoutLostBall.endDate = round.roundInfo.date;
                        // Update best streak if broken
                        if (bestStreakWithoutLostBall.numHoles < currentStreakWithoutLostBall.numHoles) bestStreakWithoutLostBall = currentStreakWithoutLostBall;
                        // Reset current streak
                        currentStreakWithoutLostBall = initialStreakWithoutLostBall;
                    } else {
                        currentStreakWithoutLostBall.numHoles = currentStreakWithoutLostBall.numHoles + 1;
                        if (currentStreakWithoutLostBall.startDate === "") currentStreakWithoutLostBall.startDate = round.roundInfo.date;
                    }
                }
            }
        }
    }

    lostBallMetrics.longestStreakWithoutLostBall = bestStreakWithoutLostBall;

    return lostBallMetrics;
}

export const calculateDrivingMetrics = (courseInfo, allRounds) => {
    let tempDrivingMetrics = [
        { lowerBound: 0, upperBound: 199, customTitle: "< 200" }, // Tops & lay-ups
        { lowerBound: 200, upperBound: 220 },
        { lowerBound: 221, upperBound: 240 },
        { lowerBound: 241, upperBound: 260 },
        { lowerBound: 261, upperBound: 280 },
        { lowerBound: 281, upperBound: 300 },
        { lowerBound: 300, upperBound: 1000, customTitle: "300+" },
        { lowerBound: 1000, upperBound: 1000, customTitle: "Total" }
    ];

    let drivingMetrics = [];
    for (let i = 0; i < tempDrivingMetrics.length; i++) {
        drivingMetrics.push({
            ...tempDrivingMetrics[i],
            f: 0,
            l: 0,
            r: 0,
            x: 0,
            fg: 0,
            lg: 0,
            rg: 0,
            xg: 0,
            fgur: 0,
            lgur: 0,
            rgur: 0,
            xgur: 0,
            total: 0,
            fTotalDtg: 0,
            lTotalDtg: 0,
            rTotalDtg: 0,
            xTotalDtg: 0,
            fgTotalDtg: 0,
            lgTotalDtg: 0,
            rgTotalDtg: 0,
            xgTotalDtg: 0,
            fgurTotalDtg: 0,
            lgurTotalDtg: 0,
            rgurTotalDtg: 0,
            xgurTotalDtg: 0,
            fDrivingDistance: 0,
            lDrivingDistance: 0,
            rDrivingDistance: 0,
            xDrivingDistance: 0,
            fgDrivingDistance: 0,
            lgDrivingDistance: 0,
            rgDrivingDistance: 0,
            xgDrivingDistance: 0,
            fgurDrivingDistance: 0,
            lgurDrivingDistance: 0,
            rgurDrivingDistance: 0,
            xgurDrivingDistance: 0,
            totalDtg: 0
        });
    }

    for (let round of allRounds) {
        if (!round.nonGhinRounds.leagueRound && !round.nonGhinRounds.scrambleRound && !round.nonGhinRounds.legacyRound) { // Do not include League, Scramble, and Legacy rounds
            const singleCourseInfo = courseInfo.find(info => info.courseKey === round.roundInfo.courseKey)
            for (let hole = 1; hole <= 18; hole++) {
                if (round[`hole${hole}`]) {
                    if (singleCourseInfo[`hole${hole}`].par !== 3) { // Exclude par 3's
                        // Hole/scorecard info
                        const holeFirValue = round[`hole${hole}`].fir.toLowerCase();
                        if (holeFirValue === "na") console.log("Invalid FIR value for round", round.roundInfo.key, "hole", hole, "round", round);
                        const holeGirValue = round[`hole${hole}`].gir === "G-1" ? "gur" : round[`hole${hole}`].gir.toLowerCase();
                        const holeDtg = round[`hole${hole}`].dtg;
                        const holeDistance = singleCourseInfo[`hole${hole}`].distance;
                        const driveDistance = holeDistance - holeDtg;
                        const drivingMetricsTotalRowIndex = drivingMetrics.findIndex(metric => (driveDistance >= metric.lowerBound) && (driveDistance <= metric.upperBound));

                        // Distance-specific row
                        // FIR value
                        drivingMetrics[drivingMetricsTotalRowIndex][holeFirValue] = drivingMetrics[drivingMetricsTotalRowIndex][holeFirValue] + 1;
                        // FIR/GIR value
                        if (["g", "gur"].includes(holeGirValue)) drivingMetrics[drivingMetricsTotalRowIndex][`${holeFirValue}${holeGirValue}`] = drivingMetrics[drivingMetricsTotalRowIndex][`${holeFirValue}${holeGirValue}`] + 1;
                        // Distance total
                        drivingMetrics[drivingMetricsTotalRowIndex].total = drivingMetrics[drivingMetricsTotalRowIndex].total + 1;

                        // Total row
                        const totalRowIndex = drivingMetrics.length - 1;
                        // FIR value
                        drivingMetrics[totalRowIndex][holeFirValue] = drivingMetrics[totalRowIndex][holeFirValue] + 1;
                        // FIR/GIR value
                        if (["g", "gur"].includes(holeGirValue)) drivingMetrics[totalRowIndex][`${holeFirValue}${holeGirValue}`] = drivingMetrics[totalRowIndex][`${holeFirValue}${holeGirValue}`] + 1;
                        // Distance total
                        drivingMetrics[totalRowIndex].total = drivingMetrics[totalRowIndex].total + 1;

                        // Average driving distance for l holes
                        drivingMetrics[totalRowIndex][`${holeFirValue}DrivingDistance`] = drivingMetrics[totalRowIndex][`${holeFirValue}DrivingDistance`] + driveDistance;
                        // Average driving distance for r holes
                        if (["g", "gur"].includes(holeGirValue)) drivingMetrics[totalRowIndex][`${holeFirValue}${holeGirValue}DrivingDistance`] = drivingMetrics[totalRowIndex][`${holeFirValue}${holeGirValue}DrivingDistance`] + driveDistance;
                        // Average driving distance for fg holes
                        drivingMetrics[totalRowIndex].drivingDistance = drivingMetrics[totalRowIndex].drivingDistance + driveDistance;
                    }
                }
            }
        }
    }

    return drivingMetrics;
}

export const calculateApproachMetrics = (courseInfo, allRounds) => {
    let ranges = [
        { info: { lowerBound: 0, upperBound: 50, club: "52°", customTitle: "< 50" }},
        { info: { lowerBound: 51, upperBound: 90, club: "52°" }},
        { info: { lowerBound: 91, upperBound: 130, club: "PW" }},
        { info: { lowerBound: 131, upperBound: 145, club: "9i" }},
        { info: { lowerBound: 146, upperBound: 155, club: "8i" }},
        { info: { lowerBound: 156, upperBound: 170, club: "7i" }},
        { info: { lowerBound: 171, upperBound: 180, club: "6i" }},
        { info: { lowerBound: 181, upperBound: 190, club: "5i" }},
        { info: { lowerBound: 191, upperBound: 210, club: "4i" }},
        { info: { lowerBound: 211, upperBound: 230, club: "2i" }},
        { info: { lowerBound: 231, upperBound: 250, club: "4w" }},
        { info: { lowerBound: 251, upperBound: 499, club: "4w" }},
        { info: { lowerBound: 500, upperBound: 500, customTitle: "Total", club: "-"  }}
    ];

    let approachMetrics = [];
    for (let range of ranges) {
        let tempApproachMetrics = range;
        for (let firValue of ["l", "f", "r", "na", "x", "total"]) {
            tempApproachMetrics = {
                ...tempApproachMetrics,
                [firValue]: {
                    totals: {
                        g: 0,
                        x: 0,
                        gur: 0,
                        total: 0
                    },
                    differentials: {
                        g: 0,
                        x: 0,
                        gur: 0,
                        total: 0
                    },
                    // Later calculate GIR %
                }
            }
        }
        approachMetrics.push(tempApproachMetrics)
    }

    for (let round of allRounds) {
        const singleCourseInfo = courseInfo.find(info => info.courseKey === round.roundInfo.courseKey);
        if (!singleCourseInfo) continue;
        if (!round.nonGhinRounds.leagueRound && !round.nonGhinRounds.scrambleRound && !round.nonGhinRounds.legacyRound) {
            for (let hole = 1; hole <= 18; hole++) {
                if (round[`hole${hole}`]) {
                    const dtgValue = round[`hole${hole}`].dtg;
                    // Skip holes with invalid DTG (sentinel value or missing)
                    if (!dtgValue || dtgValue >= 1000 || isNaN(dtgValue)) continue;

                    const holePar = singleCourseInfo[`hole${hole}`] ? singleCourseInfo[`hole${hole}`].par : 0;
                    // Par 3 holes use "na" FIR since there's no fairway
                    const firValue = holePar === 3 ? "na" : (round[`hole${hole}`].fir).toLowerCase();
                    const girValue = round[`hole${hole}`].gir.toUpperCase() === "G-1" ? "gur" : (round[`hole${hole}`].gir.toString()[0]).toLowerCase();
                    if (!["gur", "g", "x"].includes(girValue)) continue;
                    let index = approachMetrics.findIndex(metric => ((metric.info.lowerBound < dtgValue) && (metric.info.upperBound >= dtgValue) || (metric.info.lowerBound <= dtgValue) && (metric.info.upperBound > dtgValue)))
                    if (index === -1) continue;

                    const holePlusMinus = round[`hole${hole}`].score - singleCourseInfo[`hole${hole}`].par;
                    approachMetrics[index] = {
                        ...approachMetrics[index],
                        [firValue]: {
                            ...approachMetrics[index][firValue],
                            totals: {
                                ...approachMetrics[index][firValue].totals,
                                [girValue]: approachMetrics[index][firValue].totals[girValue] + 1,
                                total: approachMetrics[index][firValue].totals.total + 1
                            },
                            differentials: {
                                ...approachMetrics[index][firValue].differentials,
                                [girValue]: approachMetrics[index][firValue].differentials[girValue] + holePlusMinus,
                                total: approachMetrics[index][firValue].differentials.total + holePlusMinus
                            }
                        },
                        total: {
                            ...approachMetrics[index].total,
                            totals: {
                                ...approachMetrics[index].total.totals,
                                [girValue]: approachMetrics[index].total.totals[girValue] + 1,
                                total: approachMetrics[index].total.totals.total + 1
                            },
                            differentials: {
                                ...approachMetrics[index].total.differentials,
                                [girValue]: approachMetrics[index].total.differentials[girValue] + holePlusMinus,
                                total: approachMetrics[index].total.differentials.total + holePlusMinus
                            }
                        }
                    }
                    approachMetrics[approachMetrics.length - 1] = {
                        ...approachMetrics[approachMetrics.length - 1],
                        [firValue]: {
                            ...approachMetrics[approachMetrics.length - 1][firValue],
                            totals: {
                                ...approachMetrics[approachMetrics.length - 1][firValue].totals,
                                [girValue]: approachMetrics[approachMetrics.length - 1][firValue].totals[girValue] + 1,
                                total: approachMetrics[approachMetrics.length - 1][firValue].totals.total + 1
                            },
                            differentials: {
                                ...approachMetrics[approachMetrics.length - 1][firValue].differentials,
                                [girValue]: approachMetrics[approachMetrics.length - 1][firValue].differentials[girValue] + holePlusMinus,
                                total: approachMetrics[approachMetrics.length - 1][firValue].differentials.total + holePlusMinus
                            }
                        },
                        total: {
                            ...approachMetrics[approachMetrics.length - 1].total,
                            totals: {
                                ...approachMetrics[approachMetrics.length - 1].total.totals,
                                [girValue]: approachMetrics[approachMetrics.length - 1].total.totals[girValue] + 1,
                                total: approachMetrics[approachMetrics.length - 1].total.totals.total + 1
                            },
                            differentials: {
                                ...approachMetrics[approachMetrics.length - 1].total.differentials,
                                [girValue]: approachMetrics[approachMetrics.length - 1].total.differentials[girValue] + holePlusMinus,
                                total: approachMetrics[approachMetrics.length - 1].total.differentials.total + holePlusMinus
                            }
                        }
                    }
                }
            }
        }
    }

    return approachMetrics;
}

export const calculatePuttingMetrics = (puttingData, displayedRounds) => {
    let displayedRoundKeys = [];
    for (let round of displayedRounds) displayedRoundKeys.push(round.roundInfo.key);

    let puttingMetrics = {
        totalPutts: 0,
        allPutts: {
            totalByScore: {
                num0Putts: { total: 0, scoreMinus2: 0, scoreMinus1: 0, score0: 0, score1: 0, score2: 0, score3: 0, score4: 0, score5: 0, score6: 0 },
                num1Putts: { total: 0, scoreMinus2: 0, scoreMinus1: 0, score0: 0, score1: 0, score2: 0, score3: 0, score4: 0, score5: 0, score6: 0 },
                num2Putts: { total: 0, scoreMinus2: 0, scoreMinus1: 0, score0: 0, score1: 0, score2: 0, score3: 0, score4: 0, score5: 0, score6: 0 },
                num3Putts: { total: 0, scoreMinus2: 0, scoreMinus1: 0, score0: 0, score1: 0, score2: 0, score3: 0, score4: 0, score5: 0, score6: 0 },
                byScore: { total: 0, scoreMinus2: 0, scoreMinus1: 0, score0: 0, score1: 0, score2: 0, score3: 0, score4: 0, score5: 0, score6: 0 }
            },
            gir: {
                num0Putts: { total: 0, scoreMinus2: 0, scoreMinus1: 0, score0: 0, score1: 0, score2: 0, score3: 0, score4: 0, score5: 0, score6: 0 },
                num1Putts: { total: 0, scoreMinus2: 0, scoreMinus1: 0, score0: 0, score1: 0, score2: 0, score3: 0, score4: 0, score5: 0, score6: 0 },
                num2Putts: { total: 0, scoreMinus2: 0, scoreMinus1: 0, score0: 0, score1: 0, score2: 0, score3: 0, score4: 0, score5: 0, score6: 0 },
                num3Putts: { total: 0, scoreMinus2: 0, scoreMinus1: 0, score0: 0, score1: 0, score2: 0, score3: 0, score4: 0, score5: 0, score6: 0 },
                byScore: { total: 0, scoreMinus2: 0, scoreMinus1: 0, score0: 0, score1: 0, score2: 0, score3: 0, score4: 0, score5: 0, score6: 0 }
            },
            nonGir: {
                num0Putts: { total: 0, scoreMinus2: 0, scoreMinus1: 0, score0: 0, score1: 0, score2: 0, score3: 0, score4: 0, score5: 0, score6: 0 },
                num1Putts: { total: 0, scoreMinus2: 0, scoreMinus1: 0, score0: 0, score1: 0, score2: 0, score3: 0, score4: 0, score5: 0, score6: 0 },
                num2Putts: { total: 0, scoreMinus2: 0, scoreMinus1: 0, score0: 0, score1: 0, score2: 0, score3: 0, score4: 0, score5: 0, score6: 0 },
                num3Putts: { total: 0, scoreMinus2: 0, scoreMinus1: 0, score0: 0, score1: 0, score2: 0, score3: 0, score4: 0, score5: 0, score6: 0 },
                byScore: { total: 0, scoreMinus2: 0, scoreMinus1: 0, score0: 0, score1: 0, score2: 0, score3: 0, score4: 0, score5: 0, score6: 0 }
            }
        },
        makeByDistance: {},
        threePuttByDistance: {},
        longestPutts: {},
    };

    for (let putt of puttingData) {
        if (putt.dth > 60) putt.dth = 60; // Reduce width of putting table, anything 60+ feet in one column
        const currentPutts = putt.putts > 3 ? 3 : putt.putts
            if (displayedRoundKeys.includes(putt.round)) { // Additional filter for only displayed rounds
                if (puttingMetrics.makeByDistance[`from${putt.dth}`]) {
                    puttingMetrics.makeByDistance[`from${putt.dth}`][`num${currentPutts}Putts`]++;
                    puttingMetrics.makeByDistance[`from${putt.dth}`].totalPutts++;
                } else { // Add putt by distance
                    puttingMetrics.makeByDistance[`from${putt.dth}`] = {
                        distance: putt.dth,
                        totalPutts: 1,
                        num0Putts: currentPutts === 0 ? 1 : 0,
                        num1Putts: currentPutts === 1 ? 1 : 0,
                        num2Putts: currentPutts === 2 ? 1 : 0,
                        num3Putts: currentPutts === 3 ? 1 : 0,
                        num4Putts: currentPutts > 3 ? 1 : 0
                    }
                }
                if (putt.gir === "G" || putt.gir === "G-1") {
                    puttingMetrics.allPutts.gir.byScore.total++;
                    puttingMetrics.allPutts.gir[`num${currentPutts}Putts`].total++;
                    puttingMetrics.allPutts.gir[`num${currentPutts}Putts`][`score${putt.scoreToPar < 0 ? "Minus" : ""}${Math.abs(putt.scoreToPar)}`]++;
                } else {
                    puttingMetrics.allPutts.nonGir.byScore.total++;
                    puttingMetrics.allPutts.nonGir[`num${currentPutts}Putts`].total++;
                    puttingMetrics.allPutts.nonGir[`num${currentPutts}Putts`][`score${putt.scoreToPar < 0 ? "Minus" : ""}${Math.abs(putt.scoreToPar)}`]++;
                }
                puttingMetrics.allPutts.totalByScore.total++;
                puttingMetrics.allPutts.totalByScore[`num${currentPutts}Putts`].total++;
                puttingMetrics.totalPutts++;
                puttingMetrics.allPutts.totalByScore.byScore[`score${putt.scoreToPar < 0 ? "Minus" : ""}${Math.abs(putt.scoreToPar)}`]++;
                puttingMetrics.allPutts.totalByScore[`num${currentPutts}Putts`][`score${putt.scoreToPar < 0 ? "Minus" : ""}${Math.abs(putt.scoreToPar)}`]++;
            }
    }

    return puttingMetrics;
}

export const calculateSandMetrics = (courseInfo, displayedRounds) => {
    let sandMetrics = {
        totalHoleCount: 0,
        sandCount: 0,
        totalScoreToPar: 0,
        putting: [
            { description: "Chip In", numPutts: 0, count: 0 },
            { description: "1 putt", numPutts: 1, count: 0 },
            { description: "2 Putt", numPutts: 2, count: 0 },
            { description: "3 Putt", numPutts: 3, count: 0 }
        ],
        nonSandPutting: [
            { description: "Chip In", numPutts: 0, count: 0 },
            { description: "1 putt", numPutts: 1, count: 0 },
            { description: "2 Putt", numPutts: 2, count: 0 },
            { description: "3 Putt", numPutts: 3, count: 0 }
        ],
        scoring: {}
    }
    for (let score of scoringMap) sandMetrics.scoring[score.description] = 0;

    for (let round of displayedRounds) {
        const singleCourseInfo = courseInfo.find(info => info.courseKey === round.roundInfo.courseKey);
        if (!round.nonGhinRounds.leagueRound && !round.nonGhinRounds.scrambleRound && !round.nonGhinRounds.legacyRound) {
            for (let hole = 1; hole <= 18; hole++) {
                if (round[`hole${hole}`]) {
                    sandMetrics.totalHoleCount = sandMetrics.totalHoleCount + 1;
                    const holePutts = round[`hole${hole}`].putts > 3 ? 3 : round[`hole${hole}`].putts;
                    if (round[`hole${hole}`].notes) {
                        const holeNotes = round[`hole${hole}`].notes
                        if (holeNotes && holeNotes.includes("S")) {
                            sandMetrics.sandCount++;
                            const puttingIndex = sandMetrics.putting.findIndex(putting => putting.numPutts == holePutts);
                            sandMetrics.putting[puttingIndex].count = sandMetrics.putting[puttingIndex].count + 1;
                            
                            const holeScoreToPar = round[`hole${hole}`].score - singleCourseInfo[`hole${hole}`].par;
                            const scoringIndex = scoringMap.findIndex(score => score.scoreToPar == holeScoreToPar);
                            sandMetrics.scoring[scoringMap[scoringIndex].description] = sandMetrics.scoring[scoringMap[scoringIndex].description] + 1;
                            sandMetrics.totalScoreToPar = sandMetrics.totalScoreToPar + holeScoreToPar;
                        } else {
                            const nonSandPuttingIndex = sandMetrics.nonSandPutting.findIndex(putting => putting.numPutts == holePutts);
                            sandMetrics.nonSandPutting[nonSandPuttingIndex].count = sandMetrics.nonSandPutting[nonSandPuttingIndex].count + 1;
                        }
                    } else {
                        const nonSandPuttingIndex = sandMetrics.nonSandPutting.findIndex(putting => putting.numPutts == holePutts);
                        sandMetrics.nonSandPutting[nonSandPuttingIndex].count = sandMetrics.nonSandPutting[nonSandPuttingIndex].count + 1;
                    }
                }
            }
        }
    }

    sandMetrics.averageScoreToPar = (sandMetrics.totalScoreToPar / sandMetrics.sandCount).toFixed(2);

    return sandMetrics;
}

export const calculateBrMetrics = (courseInfo, displayedRounds) => {
    let brMetrics = {
        totalHoleCount: 0,
        brCount: 0,
        totalScoreToPar: 0,
        putting: [
            { description: "Chip In", numPutts: 0, count: 0 },
            { description: "1 putt", numPutts: 1, count: 0 },
            { description: "2 Putt", numPutts: 2, count: 0 },
            { description: "3 Putt", numPutts: 3, count: 0 }
        ],
        nonBrPutting: [
            { description: "Chip In", numPutts: 0, count: 0 },
            { description: "1 putt", numPutts: 1, count: 0 },
            { description: "2 Putt", numPutts: 2, count: 0 },
            { description: "3 Putt", numPutts: 3, count: 0 }
        ],
        scoring: {}
    }
    for (let score of scoringMap) brMetrics.scoring[score.description] = 0;

    for (let round of displayedRounds) {
        const singleCourseInfo = courseInfo.find(info => info.courseKey === round.roundInfo.courseKey);
        if (!round.nonGhinRounds.leagueRound && !round.nonGhinRounds.scrambleRound && !round.nonGhinRounds.legacyRound) {
            for (let hole = 1; hole <= 18; hole++) {
                if (round[`hole${hole}`]) {
                    brMetrics.totalHoleCount = brMetrics.totalHoleCount + 1;
                    const holePutts = round[`hole${hole}`].putts > 3 ? 3 : round[`hole${hole}`].putts;
                    if (round[`hole${hole}`].notes) {
                        const holeNotes = round[`hole${hole}`].notes
                        if (holeNotes && holeNotes.includes("BR")) {
                            brMetrics.brCount++;
                            
                            const puttingIndex = brMetrics.putting.findIndex(putting => putting.numPutts == holePutts);
                            brMetrics.putting[puttingIndex].count = brMetrics.putting[puttingIndex].count + 1;
                            
                            const holeScoreToPar = round[`hole${hole}`].score - singleCourseInfo[`hole${hole}`].par;
                            const scoringIndex = scoringMap.findIndex(score => score.scoreToPar == holeScoreToPar);
                            brMetrics.scoring[scoringMap[scoringIndex].description] = brMetrics.scoring[scoringMap[scoringIndex].description] + 1;
                            brMetrics.totalScoreToPar = brMetrics.totalScoreToPar + holeScoreToPar;
                        } else {
                            const nonBrPuttingIndex = brMetrics.nonBrPutting.findIndex(putting => putting.numPutts == holePutts);
                            brMetrics.nonBrPutting[nonBrPuttingIndex].count = brMetrics.nonBrPutting[nonBrPuttingIndex].count + 1;
                        }
                    } else {
                        const nonBrPuttingIndex = brMetrics.nonBrPutting.findIndex(putting => putting.numPutts == holePutts);
                        brMetrics.nonBrPutting[nonBrPuttingIndex].count = brMetrics.nonBrPutting[nonBrPuttingIndex].count + 1;
                    }
                }
            }
        }
    }

    return brMetrics;
}
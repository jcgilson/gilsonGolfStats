import {
    Table, TableHead, TableBody, TableRow, TableCell, TextField,
} from '@mui/material';
import { courses } from '../helpers/GolfConsts'

const internationalFlag = (round) => {
    const courseIndex = courses.findIndex(course => course.courseKey === round.roundInfo.courseKey)
    if (courses[courseIndex].internationalFlag) {
        return (
            <div className="marginRightSmall noMarginTop noMarginBottom alignCenter">
              <img src={courses[courseIndex].internationalFlag} style={{ height: "12px", width: "18px", border: "1px solid white" }} alt={`${courses[courseIndex].internationalFlag} international flag`} />
            </div>
        );
    }
    
    return null;
}

const GolfTable = (props) => {
    const {
        yearFilter,
        handleSetYearFilter,
        tableSort,
        changeSortMethod,
        filters,
        getAnnualSummaryRows,
        displayedNumberOfRounds,
        displayedHoles,
        displayedCourses,
        displayedScoringAverage,
        displayedPutts,
        displayedF,
        displayedG,
        displayedFPM,
        displayedBirdies,
        displayedBogeyPlus,
        activePage,
        displayedRounds,
        includePartialRounds,
        getRoundTableClassName,
        handleSetActiveRounds,
        createScorecard,
        courseInfo,
        expandScorecard,
        setExpandScorecard,
        toggleCourseInfo,
        setToggleCourseInfo,
        handicap,
        handicapMetrics,
        activeRounds,
        editScorecard
    } = props;

    return (
        <Table style={{ maxWidth: "80vw" }} className="golfTable">
            <TableHead className="stickyGolfTableHeader">
                <TableRow className="flexRow">
                    <TableCell key={1} className="distribute10 altActionFont">
                        <TextField
                            id="standard-basic"
                            value={yearFilter}
                            label="Year"
                            variant="standard"
                            size="small"
                            style={{ width: "50px" }}
                            onChange={(e) => {
                                handleSetYearFilter(e.target.value)
                            }}
                        />
                    </TableCell>
                    <TableCell key={2} className={`altActionFont ${tableSort.method === "sequence" ? tableSort.order === "ascending" || tableSort.order === "" ? "displayDownArrowAfter" : "displayUpArrowAfter" : ""}`} onClick={() => changeSortMethod("sequence", "roundInfo")} style={{ width: "70px" }}><h3>Date</h3></TableCell>
                    <TableCell key={3} className={`altActionFont ${tableSort.method === "course" ? tableSort.order === "ascending" ? "displayDownArrowAfter" : "displayUpArrowAfter" : ""}`} onClick={() => changeSortMethod("course", "roundInfo")} style={{ minWidth: "120px" }}><h3>Course</h3></TableCell>
                    <TableCell key={4} className={`distribute10 altActionFont ${tableSort.method === "scoreToPar" ? tableSort.order === "ascending" ? "displayDownArrowAfter" : "displayUpArrowAfter" : ""}`} onClick={() => changeSortMethod("scoreToPar", "scoring")}><h3>Score</h3></TableCell>
                    <TableCell key={5} className={`distribute10 altActionFont ${tableSort.method === "putts" ? tableSort.order === "ascending" ? "displayDownArrowAfter" : "displayUpArrowAfter" : ""}`} onClick={() => changeSortMethod("putts", "putting")}><h3>Putts</h3></TableCell>
                    <TableCell key={6} className={`distribute10 altActionFont ${tableSort.method === "f" ? tableSort.order === "ascending" ? "displayDownArrowAfter" : "displayUpArrowAfter" : ""}`} onClick={() => changeSortMethod("f", "fairways")}><h3>FIR</h3></TableCell>
                    <TableCell key={7} className={`distribute10 altActionFont ${tableSort.method === "g" ? tableSort.order === "ascending" ? "displayDownArrowAfter" : "displayUpArrowAfter" : ""}`} onClick={() => changeSortMethod("g", "greens")}><h3>GIR</h3></TableCell>
                    <TableCell key={10} className={`distribute10 altActionFont ${tableSort.method === "puttLengthTotal" ? tableSort.order === "ascending" ? "displayDownArrowAfter" : "displayUpArrowAfter" : ""}`} onClick={() => changeSortMethod("puttLengthTotal", "putting")}><h3>FPM</h3></TableCell>
                    <TableCell key={11} className={`distribute10 altActionFont ${tableSort.method === "numBirdies" ? tableSort.order === "ascending" ? "displayDownArrowAfter" : "displayUpArrowAfter" : ""}`} onClick={() => changeSortMethod("numBirdies", "scoring")}><h3>Birdies</h3></TableCell>
                    <TableCell key={12} className={`distribute10 altActionFont ${tableSort.method === "numBogeyPlus" ? tableSort.order === "ascending" ? "displayDownArrowAfter" : "displayUpArrowAfter" : ""}`} onClick={() => changeSortMethod("numBogeyPlus", "scoring")}><h3>Bogey+</h3></TableCell>
                </TableRow>
            </TableHead>
            {filters.includes('Annual Summaries') ?
                getAnnualSummaryRows()
                :
                <TableBody>
                    {/* Summary Row */}
                    <TableRow className="summaryRowBoxShadow">
                        <TableCell key={1}>Rounds: <b>{displayedNumberOfRounds}</b></TableCell>
                        <TableCell key={2}>Holes: <b>{displayedHoles}</b></TableCell>
                        <TableCell key={3}>Courses: <b>{displayedCourses}</b></TableCell>
                        <TableCell key={4}><b>{displayedScoringAverage}</b></TableCell>
                        <TableCell key={5}><b>{displayedPutts}</b></TableCell>
                        <TableCell key={6}><b>{displayedF}</b></TableCell>
                        <TableCell key={7}><b>{displayedG}</b></TableCell>
                        <TableCell key={8}><b>{displayedFPM}</b></TableCell>
                        <TableCell key={9}><b>{displayedBirdies}</b></TableCell>
                        <TableCell key={10}><b>{displayedBogeyPlus}</b></TableCell>
                    </TableRow>
                    {activePage === "Golf Rounds" && displayedRounds.map((round, i) => {
                        let displayRound = (activePage === "Golf Rounds" || activePage === round.roundInfo.course) && (includePartialRounds || (!round.roundInfo.partialFront9 && !round.roundInfo.partialBack9)) && !round.nonGhinRounds.scrambleRound && !round.additionalHoles;

                        if (displayRound) {
                            const roundTotalDisplay = round.nonGhinRounds.scrambleRound ? 
                                `${round.scoring.total}*` : 
                                ((round.roundInfo.fullFront9 || round.roundInfo.fullBack9) && !(round.roundInfo.partialFront9 || round.roundInfo.partialBack9)) ? 
                                    round.scoring.total :
                                    null;
                            return (
                                <>
                                    <TableRow className={getRoundTableClassName(round, i)} key={i}>
                                        <TableCell key={`${round.roundInfo.key}1`}><span className={round.scoring.underParRound ? "blackFont" : ""} style={{ textDecoration: "underline"}} onClick={() => handleSetActiveRounds(round.roundInfo.key)}>{activeRounds.includes(round.roundInfo.key) ? "Collapse" : "Scorecard"}</span></TableCell>

                                        <TableCell key={`${round.roundInfo.key}2`}>{round.roundInfo.date}</TableCell>
                                        <TableCell key={`${round.roundInfo.key}3`}>
                                                <div className="flexRow alignCenter">
                                                    {internationalFlag(round)}
                                                    {round.roundInfo.course}
                                                </div>
                                        </TableCell>
                                        <TableCell key={`${round.roundInfo.key}4`}><span className={round.handicapRound ? " handicapScoreBackground" : ""}>{roundTotalDisplay}<small className={`marginBottomSmall${roundTotalDisplay ? " paddingLeftExtraSmall" : null}`}>({round.scoring.scoreToPar > 0 ? `+${round.scoring.scoreToPar}` : round.scoring.scoreToPar < 0 ? round.scoring.scoreToPar : "E"}{!roundTotalDisplay && ` THRU ${round.roundInfo.numHoles}`})</small></span></TableCell>
                                        <TableCell key={`${round.roundInfo.key}5`}>{round.putting.putts || <small>-</small>}{(round.putting.putts && round.putting.num3Putts > 0) && <small className="marginLeftSmall">({round.putting.num3Putts})</small>}</TableCell>
                                        <TableCell key={`${round.roundInfo.key}6`}>{round.fairways && round.fairways.f ? round.fairways.f : <small>-</small>}</TableCell>
                                        <TableCell key={`${round.roundInfo.key}7`}>{round.greens ? round.greens.g + round.greens.gur : <small>-</small>}</TableCell>
                                        <TableCell key={`${round.roundInfo.key}10`}>{round.putting.puttLengthTotal || <small>-</small>}</TableCell>
                                        <TableCell key={`${round.roundInfo.key}11`}>{round.scoring.numBirdies + round.scoring.numEagles}{round.scoring.numEagles > 0 ? "*" : null}</TableCell>
                                        <TableCell key={`${round.roundInfo.key}12`}>{round.scoring.numBogeyPlus || <small>-</small>}</TableCell>
                                    </TableRow>
                                    {(activeRounds.includes(round.roundInfo.key)) && 
                                        <TableRow key={`subTable${i}`} className={`hideTableBottomBorderLastChildCell ${activeRounds.includes(round.roundInfo.key) ? " active" : ""}`}>
                                            <TableCell colSpan={"10"}>
                                                {createScorecard(courseInfo, round, expandScorecard, setExpandScorecard, toggleCourseInfo, setToggleCourseInfo, editScorecard)}
                                            </TableCell>
                                        </TableRow>
                                    }
                                </>
                            )
                        } else return null;
                    })}
                    {filters.includes("Handicap Rounds") && <TableRow className="hideTableBottomBorderChildCell">
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell>Handicap: <b>{handicap}</b></TableCell>
                        <TableCell>{(handicapMetrics.handicapRoundScoresToPar / 8).toFixed(2)}</TableCell>
                        <TableCell>{(handicapMetrics.handicapRoundPutts / 8).toFixed(2)}</TableCell>
                        <TableCell>{(handicapMetrics.handicapRoundFirs / 8).toFixed(2)}</TableCell>
                        <TableCell>{(handicapMetrics.handicapRoundGirs / 8).toFixed(2)}</TableCell>
                        <TableCell>{(handicapMetrics.handicapRoundFpm / 8).toFixed(2)}</TableCell>
                        <TableCell>{(handicapMetrics.handicapRoundBirdies / 8).toFixed(2)}</TableCell>
                        <TableCell>{(handicapMetrics.handicapRoundBogeyPlus / 8).toFixed(2)}</TableCell>
                    </TableRow>}
                </TableBody>
            }
        </Table>
    )
}

export default GolfTable
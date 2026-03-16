import { TableBody, TableRow, TableCell, TextField } from '@mui/material';
import { Check, Close, TurnSlightLeft, TurnSlightRight, RemoveCircle, AddCircle } from '@mui/icons-material';
import { createPlusMinusRow } from "./GolfFormatHelper";

export const ScorecardEntryDataRows = (frontOrBack9, scorecardEntryData, updateScorecardEntryData, activeScorecardEntryCourseInfo) => {

    const defaultRows = [
        {
            title: "Score",
            value: "score",
            valueType: "plusMinus",
            summarySection: "scoring", // scorecardEntryData Object
            outSummaryValue: "out", // scorecardEntryData Value
            inSummaryValue: "in",
            totalSummaryValue: "total"
        },
        {
            title: "Putts",
            value: "putts",
            valueType: "plusMinus",
            summarySection: "putting",
            outSummaryValue: "f9Putts",
            outSummaryValue2: "num3PuttsF9",
            inSummaryValue: "b9Putts",
            inSummaryValue2: "num3PuttsB9",
            totalSummaryValue: "putts",
            totalSummaryValue2: "num3Putts",
        },
        {
            title: "FIR",
            value: "fir",
            summarySection: "fairways",
            outSummaryValue: "f9",
            outSummaryValue2: "possibleFairwaysF9",
            inSummaryValue: "b9",
            inSummaryValue2: "possibleFairwaysB9",
            totalSummaryValue: "f",
            totalSummaryValue2: "possibleFairways",
        },
        {
            title: "GIR",
            value: "gir",
            summarySection: "greens",
            outSummaryValue: "f9",
            outSummaryValue2: "gurF9",
            inSummaryValue: "b9",
            inSummaryValue2: "gurB9",
            totalSummaryValue: "g",
            totalSummaryValue2: "gur",
        },
        {
            title: "DTG",
            tooltip: "Distance to Green after first shot. In/Out/Total columns displays average for Par 3/4 only.", // TODO: Add tooltip
            value: "dtg",
            summarySection: "approach",
            summaryValuePrefix: "Par 4 Av.",
            outSummaryValue: "dtgF9Average",
            inSummaryValue: "dtgB9Average",
            totalSummaryValue: "dtgTotalAverage",
        },
        {
            title: "DTG2",
            tooltip: "Distance to Green after second shot on Par 5's. If G-1, hide value and cascade DTG1 value. In/Out/Total columns displays average distances for first and second shots on Par 5's.",
            value: "dtg2",
            summarySection: "approach",
            summaryValuePrefix: "Par 5's",
            outSummaryValue: "dtgF9Par5Average",
            outSummaryValueSlash2: "dtg2F9Par5Average",
            inSummaryValue: "dtgB9Par5Average",
            inSummaryValueSlash2: "dtg2B9Par5Average",
            totalSummaryValue: "dtgTotalPar5Average",
            totalSummaryValueSlash2: "dtg2TotalPar5Average",
        },
        {
            title: "DTH",
            value: "dth",
            summarySection: "putting",
            outSummaryValue: "dthF9Average",
            inSummaryValue: "dthB9Average",
            totalSummaryValue: "dthTotalAverage",
        },
        {
            title: "Putt Length",
            value: "puttLength",
            summarySection: "putting",
            outSummaryValue: "puttLengthF9",
            inSummaryValue: "puttLengthB9",
            totalSummaryValue: "puttLengthTotal",
        },
        {
            title: "Notes",
            value: "notes"
        },
        {
            title: "+/-",
            value: "+/-"
        }
    ];

    let holes = [];
    for (let hole = frontOrBack9 === "front" ? 1 : 10; (frontOrBack9 === "front" && hole <= 9) || (frontOrBack9 === "back" && hole <= 18); hole++) holes.push(hole);

    const handleChange = (event, valueUpdated, hole) => {
        const newValue = Number.isNaN(parseInt(event.target.value)) ? 0 : parseInt(event.target.value)
        updateScorecardEntryData(newValue, valueUpdated, `hole${hole}`)
    }

    const handleBlur = (event, valueUpdated, hole) => {
        if (event.target.value === '' || event.target.value === '-') {
            updateScorecardEntryData(0, valueUpdated, `hole${hole}`);
        }
    }

    const handleFocus = (event, valueUpdated, hole) => {
        if (parseInt(event.target.value) === 0) updateScorecardEntryData("", valueUpdated, `hole${hole}`)
    }

    return (
        <TableBody>
            {defaultRows.map((row) => {
                return (
                    <TableRow className="flexRow justifySpaceAround">
                        <TableCell className="" style={{ width: "96px", maxWidth: "96px", backgroundColor: "white", color: "black" }}> {/* Add background color here? */}
                            {row.title}
                        </TableCell>
                        {holes.map(hole => {
                            // Score background style
                            let scoreBackgroundColorClassName = "marginLeftSmall marginRightSmall scorecardHighlightPadding borderRadiusSmall";
                            if (scorecardEntryData[`hole${hole}`].score > activeScorecardEntryCourseInfo[`hole${hole}`].par + 1) scoreBackgroundColorClassName += " backgroundColorBogeyPlus blackFont";
                            if (scorecardEntryData[`hole${hole}`].score === activeScorecardEntryCourseInfo[`hole${hole}`].par + 1) scoreBackgroundColorClassName += " backgroundColorBogey blackFont";
                            if (scorecardEntryData[`hole${hole}`].score === activeScorecardEntryCourseInfo[`hole${hole}`].par - 1) scoreBackgroundColorClassName += " backgroundColorBirdie blackFont";
                            if (scorecardEntryData[`hole${hole}`].score < activeScorecardEntryCourseInfo[`hole${hole}`].par - 1) scoreBackgroundColorClassName += " backgroundColorEagle blackFont";
                            
                            // Putts background style
                            let puttsBackgroundColorClassName = "marginLeftSmall marginRightSmall scorecardHighlightPadding borderRadiusSmall";
                            if (scorecardEntryData[`hole${hole}`].putts > 2) puttsBackgroundColorClassName += " backgroundColorBogey blackFont";
                            if (scorecardEntryData[`hole${hole}`].putts === 1) puttsBackgroundColorClassName += " backgroundColorBirdie blackFont";
                            if (scorecardEntryData[`hole${hole}`].putts === 0) puttsBackgroundColorClassName += " backgroundColorEagle blackFont";
                            
                            return (
                                <>
                                    {/* Used for Score & Putts */}
                                    {row.valueType === "plusMinus" &&
                                        <TableCell style={{ width: "96px", maxWidth: "96px", marginTop: "auto" }} className="textCenter justifySpaceAround">
                                            <div className="alignCenter justifyCenter">
                                                <RemoveCircle className="cursorPointer" fontSize="small" onClick={() => updateScorecardEntryData(scorecardEntryData[`hole${hole}`][row.value] - 1, row.value, `hole${hole}`)} />
                                                <span
                                                    className={row.value === "score" ? scoreBackgroundColorClassName : puttsBackgroundColorClassName}
                                                >
                                                    {scorecardEntryData[`hole${hole}`][row.value]}
                                                </span>
                                                <AddCircle className="cursorPointer" fontSize="small" onClick={() => updateScorecardEntryData(scorecardEntryData[`hole${hole}`][row.value] + 1, row.value, `hole${hole}`)} />
                                            </div>
                                        </TableCell>
                                    }
                                    {/* Custom rows for FIR, GIR, DTG, DTH, Putt Length, Notes */}
                                    {row.value === "fir" &&
                                        <TableCell style={{ width: "96px", maxWidth: "96px" }} className="justifySpaceAround">
                                            {activeScorecardEntryCourseInfo[`hole${hole}`].par !== 3 ?
                                                <div className="flexFlowRowNoWrap justifySpaceAround alignCenter">
                                                    <Close onClick={() => updateScorecardEntryData("X", "fir", `hole${hole}`)} className={`cursorPointer whiteFont${scorecardEntryData[`hole${hole}`].fir === "X" ? " selected" : ""}`} />
                                                    <TurnSlightLeft onClick={() => updateScorecardEntryData("L", "fir", `hole${hole}`)} className={`cursorPointer whiteFont${scorecardEntryData[`hole${hole}`].fir === "L" ? " selected" : ""}`} />
                                                    <Check onClick={() => updateScorecardEntryData("F", "fir", `hole${hole}`)} className={`cursorPointer whiteFont${scorecardEntryData[`hole${hole}`].fir === "F" ? " selected" : ""}`} />
                                                    <TurnSlightRight onClick={() => updateScorecardEntryData("R", "fir", `hole${hole}`)} className={`cursorPointer whiteFont${scorecardEntryData[`hole${hole}`].fir === "R" ? " selected" : ""}`} />
                                                </div>
                                                :
                                                <span className="justifySpaceAround">—</span>
                                            }
                                        </TableCell>
                                    }
                                    {row.value === "gir" &&
                                        <TableCell style={{ width: "96px", maxWidth: "96px" }}>
                                            <div className="flexFlowRowNoWrap alignCenter justifySpaceAround">
                                                <Close onClick={() => updateScorecardEntryData("X", "gir", `hole${hole}`)} className={`cursorPointer whiteFont${scorecardEntryData[`hole${hole}`].gir === "X" ? " selected" : ""}`} />
                                                <Check onClick={() => updateScorecardEntryData("G", "gir", `hole${hole}`)} className={`cursorPointer whiteFont marginRightExtraSmall${scorecardEntryData[`hole${hole}`].gir === "G" ? " selected" : ""}`} />
                                                {activeScorecardEntryCourseInfo[`hole${hole}`].par !== 3 && <span onClick={() => updateScorecardEntryData("G-1", "gir", `hole${hole}`)} className={`cursorPointer whiteFont${scorecardEntryData[`hole${hole}`].gir === "G-1" ? " selected" : ""}`}>G⁻¹</span>}
                                            </div>
                                        </TableCell>
                                    }
                                    {row.value === "dtg" &&
                                        <TableCell style={{ width: "96px", maxWidth: "96px" }} className="verticalPaddingOverride">
                                            <form autoComplete="off">
                                                <div className="flexRow alignEnd justifyCenter" style={{ maxWidth: "170px", margin: "2px 0" }}>
                                                    <TextField
                                                        value={scorecardEntryData[`hole${hole}`].dtg !== 1000 ? scorecardEntryData[`hole${hole}`].dtg : ""}
                                                        helperText=""
                                                        id="dtg1"
                                                        label=""
                                                        variant="outlined"
                                                        size="small"
                                                        onChange={(e) => handleChange(e, row.value, hole)}
                                                        onBlur={(e) => handleBlur(e, row.value, hole)}
                                                        onFocus={(e) => handleFocus(e, row.value, hole)}
                                                    />
                                                </div>
                                            </form>
                                        </TableCell>
                                    }
                                    {row.value === "dtg2" &&
                                        <TableCell style={{ width: "96px", maxWidth: "96px" }} className="verticalPaddingOverride">
                                            <form autoComplete="off">
                                                <div className="flexRow alignEnd justifyCenter" style={{ maxWidth: "170px", margin: "2px 0" }}>
                                                    {scorecardEntryData[`hole${hole}`].gir !== "G-1" && activeScorecardEntryCourseInfo[`hole${hole}`].par == 5 &&
                                                        <TextField
                                                            value={scorecardEntryData[`hole${hole}`].dtg2 !== 1000 ? scorecardEntryData[`hole${hole}`].dtg2 : ""}
                                                            helperText=""
                                                            id="dtg2"
                                                            label=""
                                                            variant="outlined"
                                                            size="small"
                                                            onChange={(e) => handleChange(e, row.value, hole)}
                                                            onBlur={(e) => handleBlur(e, row.value, hole)}
                                                            onFocus={(e) => handleFocus(e, row.value, hole)}
                                                        />
                                                    }
                                                    {!(scorecardEntryData[`hole${hole}`].gir !== "G-1" && activeScorecardEntryCourseInfo[`hole${hole}`].par == 5) && <span className="textCenter">-</span>}
                                                </div>
                                            </form>
                                        </TableCell>
                                    }
                                    {row.value === "dth" &&
                                        <TableCell style={{ width: "96px", maxWidth: "96px" }} className="margin0Auto textCenter verticalPaddingOverride">
                                            <form autoComplete="off">
                                                {scorecardEntryData[`hole${hole}`].putts >= 1 &&
                                                    <TextField
                                                        value={scorecardEntryData[`hole${hole}`].dth !== 1000 ? scorecardEntryData[`hole${hole}`].dth : null}
                                                        helperText=""
                                                        id="dth"
                                                        label=""
                                                        variant="outlined"
                                                        size="small"
                                                        onChange={(e) => handleChange(e, row.value, hole)}
                                                        onBlur={(e) => handleBlur(e, row.value, hole)}
                                                        onFocus={(e) => handleFocus(e, row.value, hole)}
                                                    />
                                                }
                                                {scorecardEntryData[`hole${hole}`].putts == 0 && <span className="width100Percent textCenter">-</span>}
                                            </form>
                                        </TableCell>
                                    }
                                    {row.value === "puttLength" &&
                                        <TableCell style={{ width: "96px", maxWidth: "96px" }} className="verticalPaddingOverride">
                                            <form autoComplete="off">
                                                <div className="flexRow alignEnd justifyCenter" style={{ maxWidth: "170px" }}>
                                                    {scorecardEntryData[`hole${hole}`].putts > 1 &&
                                                        <TextField
                                                            value={scorecardEntryData[`hole${hole}`].puttLength !== 1000 ? scorecardEntryData[`hole${hole}`].puttLength : null}
                                                            helperText=""
                                                            id="puttLength"
                                                            label=""
                                                            variant="outlined"
                                                            size="small"
                                                            onChange={(e) => handleChange(e, row.value, hole)}
                                                            onBlur={(e) => handleBlur(e, row.value, hole)}
                                                            onFocus={(e) => handleFocus(e, row.value, hole)}
                                                        />
                                                    }
                                                    {scorecardEntryData[`hole${hole}`].putts == 1 && <span>{scorecardEntryData[`hole${hole}`].dth === 1000 ? "-" : scorecardEntryData[`hole${hole}`].dth}</span>}
                                                    {scorecardEntryData[`hole${hole}`].putts == 0 && <span className="width100Percent textCenter">-</span>}
                                                </div>
                                            </form>
                                        </TableCell>
                                    }
                                    {row.value === "notes" &&
                                        <TableCell style={{ width: "96px", maxWidth: "96px" }} className="verticalPaddingOverride">
                                            <form autoComplete="off">
                                                <TextField value={scorecardEntryData[`hole${hole}`].notes} helperText="" id="notes" label="" variant="outlined" size="small" onChange={(e) => updateScorecardEntryData(e.target.value, "notes", `hole${hole}`)} />
                                            </form>
                                        </TableCell>
                                    }
                                    {row.value === "+/-" && (hole == 1 || hole == 10) &&
                                        createPlusMinusRow(scorecardEntryData, activeScorecardEntryCourseInfo, frontOrBack9) // TODO: make this configurable based on 9 being played - also ensure this is working for back 9 as is in createPlusMinusRow function (including style)
                                    }
                                </>
                            )
                        })}
                        {/* IN column */}
                        {frontOrBack9 === "front" && row.value !== "+/-" &&
                            <TableCell className="textCenter" style={{ backgroundColor: "white", color: "black", width: "96px", maxWidth: "96px" }}>
                                {scorecardEntryData[row.summarySection] && scorecardEntryData[row.summarySection][row.outSummaryValue] ? scorecardEntryData[row.summarySection][row.outSummaryValue] : "-"}
                                {scorecardEntryData[row.summarySection] && scorecardEntryData[row.summarySection][row.outSummaryValue] && scorecardEntryData[row.summaryValuePrefix] ? scorecardEntryData[row.summaryValuePrefix] : null}
                                {scorecardEntryData[row.summarySection] && scorecardEntryData[row.summarySection][row.outSummaryValue2] ? ` (${scorecardEntryData[row.summarySection][row.outSummaryValue2]})` : null}
                                {scorecardEntryData[row.summarySection] && scorecardEntryData[row.summarySection][row.outSummaryValueSlash2] ? ` / ${scorecardEntryData[row.summarySection][row.outSummaryValueSlash2]}` : null}
                            </TableCell>
                        }
                        {/* OUT/TOTAL columns */}
                        {frontOrBack9 === "back" && row.value !== "+/-" &&
                            <>
                                <TableCell className="textCenter" style={{ backgroundColor: "white", color: "black", width: "96px", maxWidth: "96px" }}>
                                    {scorecardEntryData[row.summarySection] && scorecardEntryData[row.summarySection][row.inSummaryValue] ? scorecardEntryData[row.summarySection][row.inSummaryValue] : "-"}
                                    {scorecardEntryData[row.summarySection] && scorecardEntryData[row.summarySection][row.inSummaryValue] && scorecardEntryData[row.summaryValuePrefix] ? scorecardEntryData[row.summaryValuePrefix] : null}
                                    {scorecardEntryData[row.summarySection] && scorecardEntryData[row.summarySection][row.inSummaryValue2] ? ` (${scorecardEntryData[row.summarySection][row.inSummaryValue2]})` : null}
                                    {scorecardEntryData[row.summarySection] && scorecardEntryData[row.summarySection][row.inSummaryValueSlash2] ? ` / ${scorecardEntryData[row.summarySection][row.inSummaryValueSlash2]}` : null}
                                </TableCell>
                                {/* Need check to only display total colum when back 9 is played */}
                                <TableCell className="textCenter" style={{ backgroundColor: "white", color: "black", width: "96px", maxWidth: "96px" }}>
                                    {scorecardEntryData[row.summarySection] && scorecardEntryData[row.summarySection][row.totalSummaryValue] ? scorecardEntryData[row.summarySection][row.totalSummaryValue] : "-"}
                                    {scorecardEntryData[row.summarySection] && scorecardEntryData[row.summarySection][row.totalSummaryValue] && scorecardEntryData[row.summaryValuePrefix] ? scorecardEntryData[row.summaryValuePrefix] : null}
                                    {scorecardEntryData[row.summarySection] && scorecardEntryData[row.summarySection][row.totalSummaryValue2] ? ` (${scorecardEntryData[row.summarySection][row.totalSummaryValue2]})` : null}
                                    {scorecardEntryData[row.summarySection] && scorecardEntryData[row.summarySection][row.totalSummaryValueSlash2] ? ` / ${scorecardEntryData[row.summarySection][row.totalSummaryValueSlash2]}` : null}
                                </TableCell>
                            </>
                        }
                    </TableRow>
                )
            })}
        </TableBody>
    )
}
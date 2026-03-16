import { TableHead, TableRow, TableCell } from '@mui/material';

export const ScorecardEntryInfoRows = (frontOrBack9, activeScorecardEntryCourseInfo) => {

    const defaultRows = [
        {
            title: "HDCP",
            value: "handicap",
            outSummaryText: "OUT",
            inSummaryText: "IN",
            inSummaryText2: "TOTAL",
        },
        {
            title: "Distance",
            value: "distance",
            outSummaryValue: "f9Yardage",
            inSummaryValue: "b9Yardage",
            inSummaryValue2: "yardage",
            
        },
        {
            title: "Hole",
            value: "hole",
            highlightRow: true
        },
        {
            title: "Par",
            value: "par",
            outSummaryValue: "f9Par",
            inSummaryValue: "b9Par",
            inSummaryValue2: "par",
        }
    ]

    return (
        <TableHead>
            {defaultRows.map((row) => {
                return (
                    <TableRow style={{ backgroundColor: "white"}}>
                        <TableCell key={1} className="" style={{ width: "96px", maxWidth: "96px", color: "black" }}>{row.title}</TableCell>
                        {Object.keys(activeScorecardEntryCourseInfo).map(hole => {
                            // Need to do the same with back 9
                            if (hole.includes("hole") && ((frontOrBack9 === "front" && parseInt(hole.replace("hole", "")) <= 9) || (frontOrBack9 === "back" && parseInt(hole.replace("hole", "")) >= 10 && parseInt(hole.replace("hole", "")) <= 18))) {
                                return (
                                    <>
                                        <TableCell key={`hole${hole}`} style={{ width: "96px", maxWidth: "96px", textAlign: "center", color: "black" }}>{row.highlightRow ? <b>{activeScorecardEntryCourseInfo[hole][row.value]}</b> : activeScorecardEntryCourseInfo[hole][row.value]}</TableCell>
                                    </>
                                )
                            }
                        })}
                        <TableCell style={{ width: "96px", maxWidth: "96px", backgroundColor: "white", color: "black" }} className="textCenter">
                            {frontOrBack9 === "front"
                                ? row.outSummaryValue
                                    ? activeScorecardEntryCourseInfo[row.outSummaryValue]
                                    : row.outSummaryText
                                        ? row.outSummaryText :
                                        "-"
                                : row.inSummaryValue
                                    ? activeScorecardEntryCourseInfo[row.inSummaryValue]
                                    : row.inSummaryText
                                        ? row.inSummaryText :
                                        "-"
                            }
                        </TableCell>
                        {frontOrBack9 === "back" &&
                            <TableCell style={{ width: "96px", maxWidth: "96px", backgroundColor: "white", color: "black" }} className="textCenter">
                                {row.inSummaryValue2
                                    ? activeScorecardEntryCourseInfo[row.inSummaryValue2]
                                    : row.inSummaryText2
                                        ? row.inSummaryText2 :
                                        "-"
                                }
                            </TableCell>
                        }
                    </TableRow>
                )
            })}
        </TableHead>
    )
}
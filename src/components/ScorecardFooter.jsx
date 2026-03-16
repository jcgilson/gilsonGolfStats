import { Table, TableRow, TableCell } from '@mui/material';

const ScorecardFooter = (props) => {
    const {
        colSpan,
        editScorecard,
        activeRound,
        setToggleCourseInfo,
        toggleCourseInfo,
        expandScorecard,
        setExpandScorecard,
        renderExpandCollapse
    } = props;

    return (
        <TableRow key={11} className="noMarginTop noMarginBottom overridePaddingParent">
            <TableCell colSpan={colSpan} className="overridePaddingChild">
                <Table>
                    <TableRow>
                        <TableCell style={{ borderBottom : "none" }} className="overridePaddingChild">
                            <div className="flexRow justifySpaceBetween noPaddingTop noPaddingLeft noPaddingRight noPaddingBottom">
                                <div className="flexRow noPaddingTop noPaddingBottom">
                                    <div key={1} className="flexRow alignCenter marginRightExtraSmall noPaddingTop noPaddingBottom">
                                        <span className="chip backgroundColorEagle" />
                                        <small>EAGLE</small>
                                    </div>
                                    <div key={2} className="flexRow alignCenter marginRightExtraSmall noPaddingTop noPaddingBottom">
                                        <span className="chip backgroundColorBirdie" />
                                        <small>BIRDIE</small>
                                    </div>
                                    <div key={3} className="flexRow alignCenter marginRightExtraSmall noPaddingTop noPaddingBottom">
                                        <span className="chip backgroundColorBogey" />
                                        <small>BOGEY</small>
                                    </div>
                                    <div key={4} className="flexRow alignCenter noPaddingTop noPaddingBottom">
                                        <span className="chip backgroundColorBogeyPlus" />
                                        <small>BOGEY PLUS</small>
                                    </div>
                                </div>
                                <div className="flexRow noPaddingTop noPaddingBottom">
                                    <span className="actionFont" onClick={() => editScorecard(activeRound)}>Edit Scorecard</span>
                                    <span className="actionFont" onClick={() => setToggleCourseInfo(!toggleCourseInfo)}>Toggle Course Info</span>
                                    {renderExpandCollapse && <span className="actionFont" onClick={() => setExpandScorecard(!expandScorecard)}>{expandScorecard ? "Collapse" : "Expand"}</span>}
                                </div>
                            </div>
                        </TableCell>
                    </TableRow>
                </Table>
            </TableCell>
        </TableRow>
    )
}

export default ScorecardFooter;
import {
    Table, TableHead, TableBody, FormControl, TextField, InputLabel, MenuItem, Select, Autocomplete
} from '@mui/material';
import DatePicker from "react-datepicker";
import { PushPin } from '@mui/icons-material';
import { ScorecardEntryInfoRows } from "../helpers/ScorecardEntryInfoRows";
import { ScorecardEntryDataRows } from "../helpers/ScorecardEntryDataRows";

const ScorecardEntry = (props) => {
    const {
        activeScorecardEntry,
        setActiveScorecardEntry,
        activeScorecardEntryCourseInfo,
        courses,
        pinnedCourse,
        scorecardEntryData,
        updateScorecardEntryData,
        selectedScorecardOptions,
        setSelectedScorecardOptions,
        setDisplayNumberHolesRemovedWarningSnackbar,
        addActiveScorecardEntry9,
        setPreviouslySelectedScorecardOptions,
        setDisplayScorecard9HoleRemovalModal,
        setDisplayHelpModal,
        validateScorecard,
        editingExistingScorecard,
    } = props;

    return (
        <>
            <div className="scorecardEntry width90Percent flexRow justifySpaceBetween alignCenter">
                {/* Course Selection */}
                <div className="marginTopMassive marginBottomMedium">
                    <FormControl>
                        <InputLabel>Course</InputLabel>
                        <Select
                            id="courseSelection"
                            value={activeScorecardEntry}
                            label="Course"
                            onChange={(e) => setActiveScorecardEntry(e.target.value)}
                            style={{width: "300px"}}
                        >
                            {/* Sort by display name */}
                            {courses.sort((a,b) => ((a.displayName === pinnedCourse) ? -1 : (b.displayName === pinnedCourse) ? 1 : (a.displayName > b.displayName) ? 1 : -1)).map(course => {
                                return (
                                    <MenuItem className="width100Percent flexRow justifySpaceBetween" value={course.courseKey} key={course.courseKey}>
                                        <span>{course.displayName}</span>
                                        {course.displayName === pinnedCourse && activeScorecardEntry !== course.courseKey && <PushPin />}
                                    </MenuItem>
                                )
                            })}
                        </Select>
                    </FormControl>
                </div>

                {/* Scorecard date picker */}
                {activeScorecardEntry &&
                    <div>
                        <DatePicker
                            selected={scorecardEntryData.date}
                            onChange={(date) => {
                                updateScorecardEntryData(date, "date", "date")
                            }}
                        />
                    </div>
                }

                {/* Controls 9/18 hole selection, other round notes */}
                {activeScorecardEntry &&
                    <div>
                        <TextField
                            id="standard-basic"
                            value={scorecardEntryData.roundInfo && scorecardEntryData.roundInfo.roundNotes ? scorecardEntryData.roundInfo.roundNotes : null}
                            label="Round Notes"
                            variant="standard"
                            size="small"
                            onChange={(e) => { 
                                updateScorecardEntryData(e.target.value, "roundNotes", "roundInfo")
                            }}
                        />
                    </div>
                }

                {/* Controls displaying modals when some holes may be removed from scorecard */}
                {activeScorecardEntry &&
                    <div style={{ width: "400px" }}>
                        <Autocomplete
                            multiple
                            id="tags-outlined"
                            options={[{title: "Front 9"}, {title: "Back 9"}, {title: "18 Holes"}]}
                            getOptionLabel={(option) => option.title}
                            value={selectedScorecardOptions}
                            filterSelectedOptions
                            onChange={(event, newValue) => {
                                const tempNewValueTitles = newValue.map(value => value.title);                                        
                                const tempSelectedScorecardOptionsTitles = selectedScorecardOptions.map(option => option.title);
                                // Prevent deseletion of Front 9, Back 9, 18 Holes all at once, display Toast when this occurs
                                if (!tempNewValueTitles.includes("18 Holes") && !tempNewValueTitles.includes("Front 9") && !tempNewValueTitles.includes("Back 9")) {
                                    for (let title of tempSelectedScorecardOptionsTitles) {
                                        if (["18 Holes", "Front 9", "Back 9"].includes(title)) {
                                            const omittedValue = {title: title};
                                            let tempListWithoutRetainingValue = newValue;
                                            tempListWithoutRetainingValue.push(omittedValue);
                                            setSelectedScorecardOptions(tempListWithoutRetainingValue);
                                            setDisplayNumberHolesRemovedWarningSnackbar(true);
                                            break;
                                        }
                                    }
                                } else {
                                    let newSelectedTitle = "";
                                    for (let option of tempNewValueTitles) {
                                        if (!tempSelectedScorecardOptionsTitles.includes(option)) {
                                            newSelectedTitle = option
                                            break;
                                        }
                                    }
                                    let newSelectedOptions = [];
                                    if (newSelectedTitle === "Front 9") {
                                        for (let value of newValue) {
                                            if (value.title !== "18 Holes" && value.title !== "Back 9") {
                                                newSelectedOptions.push(value);
                                            }
                                        }
                                    } else if (newSelectedTitle === "Back 9") {
                                        for (let value of newValue) {
                                            if (value.title !== "18 Holes" && value.title !== "Front 9") {
                                                newSelectedOptions.push(value);
                                            }
                                        }
                                    } else if (newSelectedTitle === "18 Holes") {
                                        for (let value of newValue) {
                                            if (value.title !== "Front 9" && value.title !== "Back 9") {
                                                newSelectedOptions.push(value);
                                            }
                                        }
                                        if (tempSelectedScorecardOptionsTitles.includes("Back 9")) {
                                            addActiveScorecardEntry9("add", "front9")
                                        } else if (tempSelectedScorecardOptionsTitles.includes("Front 9")) {
                                            addActiveScorecardEntry9("add", "back9")
                                        }
                                    }

                                    setSelectedScorecardOptions(newSelectedOptions);
                                    if (["Front 9", "Back 9"].includes(newSelectedTitle)) {
                                        // Save previous round info in case reverted in setDisplayScorecard9HoleRemovalModal
                                        let tempPreviouslySelectedScorecardOptions = [];
                                        for (let value of newValue) {
                                            if (newSelectedTitle !== value.title) {
                                                tempPreviouslySelectedScorecardOptions.push(value);
                                            }
                                        }
                                        setPreviouslySelectedScorecardOptions(tempPreviouslySelectedScorecardOptions)
                                        if (newSelectedTitle === "Front 9") {
                                            if (scorecardEntryData.hole10) setDisplayScorecard9HoleRemovalModal(true);
                                        }
                                        if (newSelectedTitle === "Back 9") {
                                            if (scorecardEntryData.hole1) setDisplayScorecard9HoleRemovalModal(true);
                                        }
                                    }
                                    }}
                                }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Round Info"
                                    placeholder=""
                                />
                            )}
                        />
                    </div>
                }
            </div>

            {/* Render separate tables for F9/B9 */}
            <Table style={{ maxWidth: "80vw" }} className="scorecardTable marginBottomMassive">
                <TableHead className="">
                    {ScorecardEntryInfoRows("front", activeScorecardEntryCourseInfo)}
                </TableHead>
                <TableBody>
                    {ScorecardEntryDataRows("front", scorecardEntryData, updateScorecardEntryData, activeScorecardEntryCourseInfo)}
                </TableBody>
            </Table>
            <Table style={{ maxWidth: "80vw" }} className="scorecardTable marginBottomMassive">
                <TableHead className="">
                    {ScorecardEntryInfoRows("back", activeScorecardEntryCourseInfo)}
                </TableHead>
                <TableBody>
                    {ScorecardEntryDataRows("back", scorecardEntryData, updateScorecardEntryData, activeScorecardEntryCourseInfo)}
                </TableBody>
            </Table>

            {/* Buttons to Inform and Submit */}
            {activeScorecardEntry !== "" &&
                <div className="flexColumn alignCenter">
                    <div className="width100Percent justifyCenter">
                        <button onClick={() => setDisplayHelpModal(true)} className="marginRightMedium">Help</button>
                        <button onClick={() => validateScorecard(editingExistingScorecard)}>{editingExistingScorecard ? "Update Scorecard" : "Submit"}</button>
                    </div>
                </div>
            }
        </>     
    )
}

export default ScorecardEntry
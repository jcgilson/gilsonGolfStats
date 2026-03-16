import { Modal } from '@mui/material';
import { Close } from '@mui/icons-material';

const ScorecardHelpModal = (props) => {
    const {
        displayHelpModal,
        setDisplayHelpModal
    } = props;

    return (
        <Modal
            open={displayHelpModal}
        >
            <div className="backgroundColorWhite flexColumn" style={{ margin: "25vh auto", width: "50%", padding: "16px", borderRadius: "8px" }}>
                <div className="flexRow justifySpaceBetween width100Percent">
                    <h2 className="marginBottomMedium strongFont">Scorecard help</h2>
                    <Close className="actionFont blackFont marginRightMedium" onClick={() => setDisplayHelpModal(false)} />
                </div>
                <p className="flexColumn">
                    <span className="marginBottomMedium"><b>DTG:</b> Distance to Green. After a tee shot, enter distance to green remaining (avoid values over 250 yards unless the green is hit on the next shot). For Par 5's, enter 2 values separated by a comma and a space. Example: "250, 75"</span>
                    <span className="marginBottomMedium"><b>DTH:</b> Distance to Hole. Once putting, enter distance (in increments of 3 feet until approach shot is within 3 feet) to the hole and number of feet of putt made separated by a comma and a space. Example: "39, 6"</span>
                    <span className="marginBottomMedium"><b>Notes:</b> Enter any miscues or shot selections, separated by a comma and a space. Example: "LB, BR, 3P"</span>
                    <b>Notes examples:</b>
                    <table className="marginLeftMedium">
                        <tr><td style={{ width: "84px" }}>BB:</td><td>Breakfast ball</td></tr>
                        <tr><td>M:</td><td>Mulligan</td></tr>
                        <tr><td>T:</td><td>Topped drive</td></tr>
                        <tr><td>LB:</td><td>Lost ball</td></tr>
                        <tr><td>P:</td><td>Punch shot</td></tr>
                        <tr><td>S:</td><td>Sand shot</td></tr>
                        <tr><td>CC:</td><td>Double chip</td></tr>
                        <tr><td>CCC:</td><td>Triple chip</td></tr>
                        <tr><td>BR:</td><td>Bump and run</td></tr>
                        <tr><td>2BR:</td><td>Double bump and run</td></tr>
                        <tr><td>3P:</td><td>3 putt</td></tr>
                        <tr><td>4P:</td><td>4 putt</td></tr>
                        <tr><td>NO GREEN:</td><td>Exempts hole from being counted in Eagle Summary</td></tr>
                        <tr><td>TEMP HOLE:</td><td>Exempts hole from being counted in Eagle Summary</td></tr>
                    </table>
                </p>
            </div>
        </Modal>
    )
}

export default ScorecardHelpModal
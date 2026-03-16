const GolfUploadButton = (props) => {
    const {onClickFunction, fileInputRef, onChange} = props;

    return (
      <>
            <button
                onClick={onClickFunction}
                style={{ marginTop: "45vh" }}
                className="massiveButton"
            >
                Upload Golf Stats
            </button>
            <input
                ref={fileInputRef}
                type="file"
                hidden
                onChange={onChange}
            />
        </>
    )
}

export default GolfUploadButton;
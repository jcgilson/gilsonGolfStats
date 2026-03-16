import { FormControl, InputLabel, MenuItem, Select,ListItemText, Checkbox } from '@mui/material';

const GolfRoundsFilter = (props) => {
    const {filters, handleFilterChange, filterOptions} = props;

    return (
        <div className="filterDropdownContainer margin0Auto justifyCenter">
            <FormControl sx={{ m: 1, width: 300 }} variant="filled">
                <InputLabel id="demo-multiple-checkbox-label">Select Filters</InputLabel>
                <Select
                    labelId="demo-multiple-checkbox-label"
                    id="demo-multiple-checkbox"
                    multiple
                    value={filters}
                    onChange={handleFilterChange}
                    renderValue={(selected) => selected.join(', ')}
                >
                    {filterOptions.map((filter) => (
                        <MenuItem key={filter} value={filter}>
                            <Checkbox checked={filters.indexOf(filter) > -1} />
                            <ListItemText primary={filter} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    )
}

export default GolfRoundsFilter;
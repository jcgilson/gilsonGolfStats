import { useState, useEffect, useRef } from 'react';
import { FormControl, InputLabel, MenuItem, Select, ListItemText, Checkbox } from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { pageLinks } from "../helpers/GolfConsts";

const PageLinks = (props) => {
    const {
        activePage, setActivePage,
        filters, handleFilterChange, filterOptions,
        courseTours, handleCourseTourChange, courseTourOptions
    } = props;

    const showRoundsFilter = activePage !== "Enter Scorecard" && activePage !== "Course Tour";
    const showCourseFilter = activePage === "Course Tour";

    const [headerVisible, setHeaderVisible] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const lastScrollY = useRef(0);
    const headerRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY < 10) {
                setHeaderVisible(true);
            } else if (currentScrollY < lastScrollY.current) {
                setHeaderVisible(true);
            } else {
                setHeaderVisible(false);
                setMobileMenuOpen(false);
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const height = headerRef.current ? headerRef.current.offsetHeight : 0;
        document.documentElement.style.setProperty(
            '--siteHeader-offset',
            headerVisible ? `${height}px` : '0px'
        );
    }, [headerVisible]);

    const handlePageSelect = (page) => {
        setActivePage(page);
        setMobileMenuOpen(false);
    };

    const filterControl = (
        <>
            {showRoundsFilter &&
                <FormControl sx={{ minWidth: 200 }} variant="filled" size="small">
                    <InputLabel>Filters</InputLabel>
                    <Select
                        multiple
                        value={filters}
                        onChange={handleFilterChange}
                        renderValue={(selected) => selected.join(', ')}
                    >
                        {filterOptions.map((filter) => (
                            <MenuItem key={filter} value={filter}>
                                <Checkbox checked={filters.indexOf(filter) > -1} size="small" />
                                <ListItemText primary={filter} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            }
            {showCourseFilter &&
                <FormControl sx={{ minWidth: 200 }} variant="filled" size="small">
                    <InputLabel>Course</InputLabel>
                    <Select
                        multiple
                        value={courseTours}
                        onChange={handleCourseTourChange}
                        renderValue={(selected) => selected.join(', ')}
                    >
                        {courseTourOptions.map((courseTour) => (
                            <MenuItem key={courseTour} value={courseTour}>
                                <Checkbox checked={courseTours.indexOf(courseTour) > -1} size="small" />
                                <ListItemText primary={courseTour} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            }
        </>
    );

    return (
        <header ref={headerRef} className={`siteHeader${headerVisible ? " siteHeader-visible" : " siteHeader-hidden"}`}>
            <span className="siteHeader-brand serifFont">
                Jack <a href="https://worldofjackgilson.com" className="siteHeader-brandLink">Gilson</a>
            </span>

            {/* Desktop: nav links in center, filter on right */}
            <nav className="siteHeader-nav siteHeader-desktop">
                {pageLinks.map((page, i) => (
                    <a key={i} onClick={() => setActivePage(page)} className={`cursorPointer pageLinkFont${page === activePage ? " active" : ""}`}>{page}</a>
                ))}
            </nav>
            <div className="siteHeader-filter siteHeader-desktop">
                {filterControl}
            </div>

            {/* Mobile: filter in center, hamburger on right */}
            <div className="siteHeader-filter siteHeader-mobile">
                {filterControl}
            </div>
            <button
                className="siteHeader-hamburger siteHeader-mobile"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation"
            >
                {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>

            {/* Mobile dropdown menu */}
            {mobileMenuOpen &&
                <nav className="siteHeader-mobileMenu">
                    {pageLinks.map((page, i) => (
                        <a key={i} onClick={() => handlePageSelect(page)} className={`cursorPointer pageLinkFont${page === activePage ? " active" : ""}`}>{page}</a>
                    ))}
                </nav>
            }
        </header>
    )
}

export default PageLinks

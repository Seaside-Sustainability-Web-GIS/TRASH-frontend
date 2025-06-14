import {useEffect, useState} from 'react';
import {
    Typography,
    Button,
    Paper,
    Box,
    IconButton,
    FormControl,
    InputLabel,
    OutlinedInput, InputAdornment
} from '@mui/material';
import {ChevronLeft, ChevronRight, Clear, Room} from '@mui/icons-material';
import GroupsIcon from '@mui/icons-material/Groups';
import {useAuthStore} from "../src/store/useAuthStore.js";
import useStore from '../src/store/useStore';
import PropTypes from "prop-types";
import AdoptAreaFormModal from "./AdoptAreaFormModal.jsx";
import TeamsDashboardModal from "./TeamsDashboardModal.jsx";
import CreateTeamModal from "./CreateTeamModal.jsx";

const apiEndpoint = 'http://localhost:8000';

function Sidebar({setMapCenter}) {
    const {isAuthenticated, setAuthOpen} = useAuthStore();
    const [searchText, setSearchText] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const setIsSelecting = useStore((state) => state.setIsSelecting);
    const showSnackbar = useStore((state) => state.showSnackbar);
    const sessionToken = useAuthStore.getState().sessionToken;
    const setBounds = useStore(state => state.setBounds)
    const [teamsModalOpen, setTeamsModalOpen] = useState(false);
    const setSelectTarget = useStore((state) => state.setSelectTarget);
    const setAdoptAreaModalOpen = useStore((state) => state.setAdoptAreaModalOpen);
    const adoptModalOpen = useStore((s) => s.adoptModalOpen);
    const setAdoptModalOpen = useStore((s) => s.setAdoptModalOpen);
    const selectedPoint = useStore((s) => s.selectedPoint);
    const setSelectedPoint = useStore((state) => state.setSelectedPoint);
    const setLocationMetadata = useStore((state) => state.setLocationMetadata);
    const createTeamModalOpen = useStore((s) => s.createTeamModalOpen);
    const setCreateTeamModalOpen = useStore((s) => s.setCreateTeamModalOpen);

    const handleAdoptSubmit = async (rawFormData, {onSuccess} = {}) => {
        const {lat, lng, ...rest} = rawFormData;

        const payload = {
            ...rest,
            location: {
                type: "Point",
                coordinates: [parseFloat(lng), parseFloat(lat)]
            }
        };
        try {
            const response = await fetch(`${apiEndpoint}/api/adopt-area/`, {

                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Token': sessionToken,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Submission failed (${response.status}): ${errorText}`);
            }

            const result = await response.json();
            showSnackbar(result.message || 'Area adopted successfully!', 'success');

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Adoption error:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleFormSubmit = (event) => {
        event.preventDefault();
    };

    const handleSearch = async () => {
        if (!searchText.trim()) return;

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    searchText
                )}`
            );
            const results = await response.json();
            if (results.length > 0) {
                const {lat, lon} = results[0];
                setMapCenter([parseFloat(lat), parseFloat(lon)]);
                const {boundingbox} = results[0]
                const [south, north, west, east] = boundingbox.map(parseFloat)
                setBounds([[south, west], [north, east]])
            } else {
                alert('Location not found.');
            }
        } catch (error) {
            console.error('Error fetching location:', error);
        }
    };

    return (
        <Box sx={{display: 'flex', height: '100%'}}>
            <Paper
                sx={{
                    width: isCollapsed ? '50px' : '300px',
                    transition: 'width 0.3s',
                    padding: isCollapsed ? 1 : 2,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <IconButton
                    onClick={() => setIsCollapsed((prev) => !prev)}
                    sx={{alignSelf: 'flex-end', marginBottom: 2}}
                >
                    {isCollapsed ? <ChevronRight/> : <ChevronLeft/>}
                </IconButton>

                {!isCollapsed && (
                    <Box sx={{width: '100%'}}>
                        <Box>
                            <Typography variant="h6">Go to Location</Typography>
                            <Box
                                component="form"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSearch();
                                }}
                            >
                                <FormControl fullWidth size="small" sx={{marginBottom: 1}}>
                                    <InputLabel htmlFor="location-input">Type Location...</InputLabel>
                                    <OutlinedInput
                                        id="location-input"
                                        label="Type Location..."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        endAdornment={
                                            searchText && (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setSearchText('')}
                                                        edge="end"
                                                        aria-label="clear input"
                                                    >
                                                        <Clear fontSize="small"/>
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }
                                    />
                                </FormControl>
                                <Box sx={{display: 'flex', gap: 1}}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                    >
                                        Go
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        color="secondary"
                                        fullWidth
                                        onClick={() => setSearchText('')}
                                    >
                                        Clear
                                    </Button>
                                </Box>
                                <Box sx={{marginTop: 2}}>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        fullWidth
                                        startIcon={<Room/>}
                                        onClick={() => {
                                            if (!isAuthenticated) {
                                                setAuthOpen(true);
                                                return;
                                            }

                                            setSelectTarget((lat, lng, metadata) => {
                                                setSelectedPoint([lng, lat]);
                                                setLocationMetadata(metadata);
                                                setAdoptModalOpen(true);
                                            });

                                            setIsSelecting(true);
                                            showSnackbar('Click on the map to select the area you want to adopt.', 'info', {autoHideDuration: null});
                                        }}
                                        sx={{
                                            marginTop: 1,
                                            fontWeight: 'bold',
                                            paddingY: 1.2,
                                            textTransform: 'none',
                                        }}
                                    >
                                        Adopt an Area
                                    </Button>
                                </Box>
                                <Box sx={{marginTop: 2}}>
                                    <Button
                                        variant="contained"
                                        color="info"
                                        fullWidth
                                        startIcon={<GroupsIcon/>}
                                        onClick={() => setTeamsModalOpen(true)}
                                        sx={{
                                            marginTop: 1,
                                            fontWeight: 'bold',
                                            paddingY: 1.2,
                                            textTransform: 'none',
                                        }}
                                    >
                                        View Teams
                                    </Button>
                                </Box>

                                <TeamsDashboardModal open={teamsModalOpen} onClose={() => setTeamsModalOpen(false)}/>

                                <Typography variant="h6" sx={{mt: 2}}>Query Data</Typography>
                                <Box
                                    onSubmit={handleFormSubmit}
                                    sx={{display: 'flex', flexDirection: 'column', gap: 2}}
                                >
                                    <Box sx={{display: 'flex', flexDirection: 'row', gap: 1}}>
                                        <Button type="submit" variant="contained" color="primary">
                                            Submit
                                        </Button>
                                        <Button type="reset" variant="contained" color="secondary">
                                            Reset
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                )}
                <AdoptAreaFormModal
                    open={adoptModalOpen}
                    onClose={() => setAdoptModalOpen(false)}
                    onSubmit={handleAdoptSubmit}
                    selectedPoint={selectedPoint}
                />
                <CreateTeamModal
                    open={createTeamModalOpen}
                    onClose={() => setCreateTeamModalOpen(false)}
                />
            </Paper>
        </Box>
    );
}

Sidebar.propTypes = {
    setMapCenter: PropTypes.func.isRequired,
    setAuthOpen: PropTypes.func,
    isAuthenticated: PropTypes.bool,
};

export default Sidebar;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Typography, Grid, Paper, CircularProgress, Alert, List, ListItem, ListItemText, ListItemIcon, Divider, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import TimelineIcon from '@mui/icons-material/Timeline';
import StatCard from '../components/StatCard';

const CitizenProfile = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/analytics/citizen/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data);
            } catch (err) {
                console.error('Error fetching citizen profile:', err);
                setError('Failed to load profile data.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
    if (error) return <Container sx={{ mt: 5 }}><Alert severity="error">{error}</Alert></Container>;
    if (!data) return null;

    const { stats, contributionScore, avgResponseTime, recentActivity } = data;

    const successRate = stats.total_reported > 0
        ? ((stats.closed_issues / stats.total_reported) * 100).toFixed(1)
        : 0;

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
                My Citizen Impact Profile
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* A. Reporting Stats */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Reported" value={stats.total_reported} color="#2196f3" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Resolved" value={stats.closed_issues} color="#4caf50" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Active" value={stats.active_issues} color="#ff9800" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Score" value={contributionScore} subtext="Impact Points" color="#9c27b0" />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Resolution Success</Typography>
                        <Box display="flex" alignItems="center" justifyContent="center" height="100px">
                            <Typography variant="h2" color="success.main">{successRate}%</Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary" align="center">
                            Rate of issues resolved successfully
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Avg Response Time</Typography>
                        <Box display="flex" alignItems="center" justifyContent="center" height="100px">
                            <Typography variant="h2" color="info.main">{avgResponseTime || 0}h</Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary" align="center">
                            Average time to resolve your reports
                        </Typography>
                    </Paper>
                </Grid>

                {/* E. Recent Activity Timeline */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <TimelineIcon sx={{ mr: 1 }} /> Recent Activity
                        </Typography>
                        <List>
                            {recentActivity.map((item) => (
                                <React.Fragment key={item.id}>
                                    <ListItem>
                                        <ListItemIcon>
                                            {item.status === 'Closed' ? <CheckCircleIcon color="success" /> : <ReportProblemIcon color="warning" />}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`Issue #${item.id}: ${item.category}`}
                                            secondary={`Status: ${item.status} | Reported: ${new Date(item.created_at).toLocaleDateString()}`}
                                        />
                                    </ListItem>
                                    <Divider variant="inset" component="li" />
                                </React.Fragment>
                            ))}
                            {recentActivity.length === 0 && <Typography sx={{ p: 2 }}>No recent activity.</Typography>}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default CitizenProfile;

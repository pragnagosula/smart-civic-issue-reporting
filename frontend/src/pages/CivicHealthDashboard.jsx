
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Typography, Grid, Paper, Box, CircularProgress, Alert } from '@mui/material';
import StatCard from '../components/StatCard';

const CivicHealthDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/analytics/admin/civic-health`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data);
            } catch (err) {
                console.error('Error fetching civic health:', err);
                setError('Failed to load civic health data.');
            } finally {
                setLoading(false);
            }
        };
        fetchHealth();
    }, []);

    if (loading) return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
    if (error) return <Container sx={{ mt: 5 }}><Alert severity="error">{error}</Alert></Container>;
    if (!data) return null;

    const { totalActive, avgResolutionTime, topRecurringRaw, satisfactionScore, duplicateRate } = data;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h3" gutterBottom fontWeight="bold" textAlign="center" color="primary">
                Civic Health Dashboard
            </Typography>
            <Typography variant="subtitle1" textAlign="center" color="textSecondary" sx={{ mb: 4 }}>
                Real-time System Intelligence & City-Wide Metrics
            </Typography>

            <Grid container spacing={4}>
                {/* A. Total Active Issues - Big Card */}
                <Grid item xs={12} md={4}>
                    <StatCard
                        title="Total Active Issues"
                        value={totalActive}
                        subtext="Issues currently in progress or reported"
                        color="#d32f2f"
                    />
                </Grid>

                {/* B. Average Resolution Time */}
                <Grid item xs={12} md={4}>
                    <StatCard
                        title="Avg Resolution Time"
                        value={`${avgResolutionTime || 0} hrs`}
                        subtext="City-wide average"
                        color="#1976d2"
                    />
                </Grid>

                {/* D. Citizen Satisfaction Index */}
                <Grid item xs={12} md={4}>
                    <StatCard
                        title="Citizen Satisfaction"
                        value={`${satisfactionScore || 0} / 5`}
                        subtext="Based on feedback ratings"
                        color="#388e3c"
                    />
                </Grid>

                {/* C. Top Recurring Issue Category */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 4, textAlign: 'center', height: '100%', borderTop: '5px solid #ffa000' }}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            Top Recurring Issue Category
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                            {topRecurringRaw ? topRecurringRaw.category : 'None'}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>
                            {topRecurringRaw ? `${topRecurringRaw.count} reports` : 'No data'}
                        </Typography>
                    </Paper>
                </Grid>

                {/* E. Duplicate Rate */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 4, textAlign: 'center', height: '100%', borderTop: '5px solid #7b1fa2' }}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            Duplicate Report Rate
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                            {duplicateRate}%
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>
                            Percentage of reports identified as duplicates
                        </Typography>
                    </Paper>
                </Grid>

            </Grid>
        </Container>
    );
};

export default CivicHealthDashboard;

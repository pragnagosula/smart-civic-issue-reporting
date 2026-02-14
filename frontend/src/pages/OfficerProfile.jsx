import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Typography, Grid, Box, Paper, CircularProgress, Alert } from '@mui/material';
import StatCard from '../components/StatCard';
import { CustomLineChart, CustomBarChart } from '../components/CustomCharts';
import { useTranslation } from 'react-i18next'; // Assuming i18n is used

const OfficerProfile = () => {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/analytics/officer/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data);
            } catch (err) {
                console.error('Error fetching officer profile:', err);
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

    const { workload, performance, impact, charts } = data;

    // Prepare chart data
    const lineChartData = {
        labels: charts.resolutionTrend.map(d => d.date),
        datasets: [
            {
                label: 'Avg Resolution Time (Hours)',
                data: charts.resolutionTrend.map(d => d.avg_hours),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
        ],
    };

    const barChartData = {
        labels: charts.ratingDistribution.map(d => `${d.rating} Stars`),
        datasets: [
            {
                label: 'Count',
                data: charts.ratingDistribution.map(d => d.count),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
        ],
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
                Officer Performance Profile
            </Typography>

            {/* A. Workload Metrics */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Workload Metrics</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                    <StatCard title="Total Assigned" value={workload.total_assigned} color="#1976d2" />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard title="Active Issues" value={workload.active_issues} color="#ff9800" />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard title="Resolved Issues" value={workload.total_resolved} color="#4caf50" />
                </Grid>
            </Grid>

            {/* B. Performance Metrics */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Performance Metrics</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={3}>
                    <StatCard title="Avg Resolution Time" value={`${performance.avg_resolution_hours || 0} hrs`} subtext="From assignment to resolution" color="#9c27b0" />
                </Grid>
                <Grid item xs={12} sm={3}>
                    <StatCard title="Average Rating" value={`${performance.avg_rating || 0} / 5`} subtext="Citizen Feedback" color="#f44336" />
                </Grid>
                <Grid item xs={12} sm={3}>
                    <StatCard title="Reopen Rate" value={`${parseFloat(performance.reopen_rate || 0).toFixed(1)}%`} subtext="Issues reopened" color="#ff5722" />
                </Grid>
                <Grid item xs={12} sm={3}>
                    <StatCard title="SLA Compliance" value={`${parseFloat(performance.sla_compliance || 0).toFixed(1)}%`} subtext="Resolved on time" color="#009688" />
                </Grid>
            </Grid>

            {/* C. Impact Metrics + Charts */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <StatCard title="Total Citizens Impacted" value={impact.total_impacted_citizens} color="#673ab7" />
                        <StatCard title="Highest Impact Issue" value={impact.highest_impact_issue || 0} subtext="Citizens affected in single issue" color="#3f51b5" />
                    </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                        <CustomLineChart data={lineChartData} title="Resolution Time Trend" />
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <CustomBarChart data={barChartData} title="Rating Distribution" />
                    </Paper>
                </Grid>
            </Grid>

        </Container>
    );
};

export default OfficerProfile;

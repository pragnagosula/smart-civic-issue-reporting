
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Typography, Grid, Paper, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Alert } from '@mui/material';
import { CustomBarChart, CustomPieChart } from '../components/CustomCharts';

const DepartmentAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/analytics/admin/department-analytics`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data);
            } catch (err) {
                console.error('Error fetching analytics:', err);
                setError('Failed to load department analytics.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <Container sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Container>;
    if (error) return <Container sx={{ mt: 5 }}><Alert severity="error">{error}</Alert></Container>;
    if (!data) return null;

    const { issuesByCategory, resolutionByDept, pendingVsResolved, highImpact, officerRanking } = data;

    // Chart Configs
    const categoryChartData = {
        labels: issuesByCategory.map(item => item.category),
        datasets: [{
            label: 'Issues Count',
            data: issuesByCategory.map(item => item.count),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
        }]
    };

    const resolutionChartData = {
        labels: resolutionByDept.map(item => item.department || 'Unassigned'),
        datasets: [{
            label: 'Avg Resolution Time (Hours)',
            data: resolutionByDept.map(item => item.avg_resolution_hours),
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
        }]
    };

    const statusChartData = {
        labels: ['Pending', 'Resolved'],
        datasets: [{
            data: [pendingVsResolved.pending, pendingVsResolved.resolved],
            backgroundColor: ['#ffcd56', '#4bc0c0'],
        }]
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
                Department Analytics
            </Typography>

            <Grid container spacing={3}>
                {/* A. Issues by Category */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Issues by Category</Typography>
                        <CustomBarChart data={categoryChartData} />
                    </Paper>
                </Grid>

                {/* B. Resolution Time Per Department */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Resolution Time (Avg Hours)</Typography>
                        <CustomBarChart data={resolutionChartData} horizontal={true} />
                    </Paper>
                </Grid>

                {/* C. Pending vs Resolved */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Status Ratio</Typography>
                        <CustomPieChart data={statusChartData} />
                    </Paper>
                </Grid>

                {/* D. High Impact Issues */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>High Impact Issues</Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Issue ID</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell align="right">Affected Citizens</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {highImpact.map((issue) => (
                                    <TableRow key={issue.id}>
                                        <TableCell>{issue.id}</TableCell>
                                        <TableCell>{issue.category}</TableCell>
                                        <TableCell align="right">{issue.impacted_citizens}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>

                {/* E. Officer Ranking Table */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Officer Performance Ranking</Typography>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Officer</TableCell>
                                    <TableCell>Department</TableCell>
                                    <TableCell align="right">Avg Rating</TableCell>
                                    <TableCell align="right">Avg Time (Hrs)</TableCell>
                                    <TableCell align="right">Total Resolved</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {officerRanking.map((officer, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{officer.name}</TableCell>
                                        <TableCell>{officer.department}</TableCell>
                                        <TableCell align="right">{officer.avg_rating || 'N/A'}</TableCell>
                                        <TableCell align="right">{officer.avg_resolution_hours || 'N/A'}</TableCell>
                                        <TableCell align="right">{officer.total_resolved}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default DepartmentAnalytics;

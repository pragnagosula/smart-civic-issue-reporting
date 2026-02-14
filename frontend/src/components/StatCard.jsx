import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const StatCard = ({ title, value, subtext, icon, color = 'primary.main' }) => {
    return (
        <Card sx={{ height: '100%', boxShadow: 3, borderLeft: `5px solid`, borderColor: color }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography color="textSecondary" gutterBottom variant="subtitle2">
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div" fontWeight="bold">
                            {value}
                        </Typography>
                        {subtext && (
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                {subtext}
                            </Typography>
                        )}
                    </Box>
                    {icon && (
                        <Box sx={{ color: color, opacity: 0.8 }}>
                            {icon}
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default StatCard;

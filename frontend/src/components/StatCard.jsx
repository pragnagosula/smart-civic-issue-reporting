import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, subtext, icon, color = '#1565c0', trend, trendValue }) => {
    return (
        <div className="stat-card" style={{ '--card-color': color }}>
            <div className="stat-card-header">
                <div className="stat-card-title-section">
                    <h3 className="stat-card-title">{title}</h3>
                    {trend && (
                        <span className={`stat-trend stat-trend-${trend}`}>
                            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
                        </span>
                    )}
                </div>
                {icon && (
                    <div className="stat-card-icon" style={{ color: color }}>
                        {icon}
                    </div>
                )}
            </div>
            <div className="stat-card-value">{value}</div>
            {subtext && <div className="stat-card-subtext">{subtext}</div>}
            <div className="stat-card-accent"></div>
        </div>
    );
};

export default StatCard;
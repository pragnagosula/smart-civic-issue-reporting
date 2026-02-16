import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/OfficerProfile.css';

const OfficerProfile = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/officer/login');
                    return;
                }

                const response = await axios.get('http://localhost:5000/api/analytics/officer/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data);
            } catch (err) {
                console.error('Error fetching officer profile:', err);
                if (err.response?.status === 401) {
                    navigate('/officer/login');
                } else {
                    setError('Failed to load profile data.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleBack = () => {
        navigate('/officer/dashboard');
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p style={{ marginTop: '1.5rem', color: '#616161', fontSize: '1rem' }}>Loading Profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="officer-profile">
                <header className="gov-header">
                    <div className="gov-header-content">
                        <div className="gov-emblem">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                                <path d="M2 17L12 22L22 17" />
                                <path d="M2 12L12 17L22 12" />
                            </svg>
                        </div>
                        <div className="gov-header-title-section">
                            <h1 className="gov-title">CivicFix Officer Portal</h1>
                            <p className="gov-subtitle">Performance Profile</p>
                        </div>
                        <div className="gov-header-actions">
                            <button className="btn btn-secondary" onClick={handleBack}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                                </svg>
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </header>
                <div className="error-container">
                    <div className="error-card">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <h3>Error Loading Profile</h3>
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={() => window.location.reload()}>
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { workload, performance, impact, charts } = data;

    return (
        <div className="officer-profile">
            {/* Official Government Header */}
            <header className="gov-header">
                <div className="gov-header-content">
                    <div className="gov-emblem">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                            <path d="M2 17L12 22L22 17" />
                            <path d="M2 12L12 17L22 12" />
                        </svg>
                    </div>
                    
                    <div className="gov-header-title-section">
                        <h1 className="gov-title">CivicFix Officer Portal</h1>
                        <p className="gov-subtitle">Government of India | Officer Performance Profile</p>
                    </div>
                    
                    <div className="gov-header-actions">
                        <button className="btn btn-secondary no-print" onClick={handleBack}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </header>

            <main className="profile-container">
                {/* Workload Metrics */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">Workload Overview</h2>
                        <p className="section-subtitle">Current issue assignment and resolution statistics</p>
                    </div>

                    <div className="stats-grid">
                        <article className="stat-card stat-card-primary">
                            <div className="stat-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{workload.total_assigned || 0}</div>
                                <div className="stat-label">Total Assigned</div>
                                <div className="stat-meta">all time issues</div>
                            </div>
                        </article>

                        <article className="stat-card stat-card-warning">
                            <div className="stat-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 6v6l4 2" />
                                </svg>
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{workload.active_issues || 0}</div>
                                <div className="stat-label">Active Issues</div>
                                <div className="stat-meta">currently assigned</div>
                            </div>
                        </article>

                        <article className="stat-card stat-card-success">
                            <div className="stat-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{workload.total_resolved || 0}</div>
                                <div className="stat-label">Resolved</div>
                                <div className="stat-meta">completed issues</div>
                            </div>
                        </article>
                    </div>
                </section>

                {/* Performance Metrics */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">Performance Metrics</h2>
                        <p className="section-subtitle">Your efficiency and quality indicators</p>
                    </div>

                    <div className="metrics-grid-4">
                        <div className="metric-card">
                            <div className="metric-icon metric-icon-purple">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 6v6l4 2" />
                                </svg>
                            </div>
                            <div className="metric-content">
                                <div className="metric-value">{performance.avg_resolution_hours || 0}h</div>
                                <div className="metric-label">Avg Resolution Time</div>
                                <div className="metric-sublabel">from assignment to closure</div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon metric-icon-red">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            </div>
                            <div className="metric-content">
                                <div className="metric-value">{parseFloat(performance.avg_rating || 0).toFixed(1)}/5</div>
                                <div className="metric-label">Average Rating</div>
                                <div className="metric-sublabel">citizen feedback score</div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon metric-icon-orange">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 4v6h6M23 20v-6h-6"/>
                                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                                </svg>
                            </div>
                            <div className="metric-content">
                                <div className="metric-value">{parseFloat(performance.reopen_rate || 0).toFixed(1)}%</div>
                                <div className="metric-label">Reopen Rate</div>
                                <div className="metric-sublabel">issues reopened</div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon metric-icon-teal">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>
                            </div>
                            <div className="metric-content">
                                <div className="metric-value">{parseFloat(performance.sla_compliance || 0).toFixed(1)}%</div>
                                <div className="metric-label">SLA Compliance</div>
                                <div className="metric-sublabel">resolved on time</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Impact & Charts */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">Citizen Impact & Trends</h2>
                        <p className="section-subtitle">Your contribution to community improvement</p>
                    </div>

                    <div className="charts-grid">
                        {/* Impact Card */}
                        <div className="impact-card">
                            <div className="impact-header">
                                <h3 className="impact-title">Citizen Impact</h3>
                                <span className="badge badge-purple">Community Service</span>
                            </div>
                            <div className="impact-stats">
                                <div className="impact-stat-item">
                                    <div className="impact-stat-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                            <circle cx="9" cy="7" r="4"/>
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                        </svg>
                                    </div>
                                    <div className="impact-stat-content">
                                        <div className="impact-stat-value">{impact.total_impacted_citizens || 0}</div>
                                        <div className="impact-stat-label">Total Citizens Impacted</div>
                                    </div>
                                </div>
                                <div className="impact-stat-divider"></div>
                                <div className="impact-stat-item">
                                    <div className="impact-stat-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                        </svg>
                                    </div>
                                    <div className="impact-stat-content">
                                        <div className="impact-stat-value">{impact.highest_impact_issue || 0}</div>
                                        <div className="impact-stat-label">Highest Impact Issue</div>
                                        <div className="impact-stat-sublabel">citizens affected by single issue</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resolution Trend Chart */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3 className="chart-title">Resolution Time Trend</h3>
                                <span className="badge badge-info">Last 7 Days</span>
                            </div>
                            <div className="chart-container">
                                {charts && charts.resolutionTrend && charts.resolutionTrend.length > 0 ? (
                                    <svg viewBox="0 0 400 200" className="line-chart">
                                        {/* Grid lines */}
                                        <line x1="40" y1="20" x2="40" y2="180" stroke="#e0e0e0" strokeWidth="1"/>
                                        <line x1="40" y1="180" x2="380" y2="180" stroke="#e0e0e0" strokeWidth="1"/>
                                        
                                        {/* Data line */}
                                        <polyline
                                            points={charts.resolutionTrend.map((d, i) => {
                                                const x = 40 + (i * (340 / (charts.resolutionTrend.length - 1)));
                                                const maxHours = Math.max(...charts.resolutionTrend.map(p => p.avg_hours));
                                                const y = 180 - ((d.avg_hours / maxHours) * 160);
                                                return `${x},${y}`;
                                            }).join(' ')}
                                            fill="none"
                                            stroke="#1565c0"
                                            strokeWidth="3"
                                        />
                                        
                                        {/* Data points */}
                                        {charts.resolutionTrend.map((d, i) => {
                                            const x = 40 + (i * (340 / (charts.resolutionTrend.length - 1)));
                                            const maxHours = Math.max(...charts.resolutionTrend.map(p => p.avg_hours));
                                            const y = 180 - ((d.avg_hours / maxHours) * 160);
                                            return (
                                                <circle key={i} cx={x} cy={y} r="4" fill="#1565c0" />
                                            );
                                        })}
                                    </svg>
                                ) : (
                                    <div className="chart-empty">
                                        <p>No trend data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Rating Distribution */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">Rating Distribution</h2>
                        <p className="section-subtitle">Breakdown of citizen satisfaction ratings</p>
                    </div>

                    <div className="rating-card">
                        {charts && charts.ratingDistribution && charts.ratingDistribution.length > 0 ? (
                            <div className="rating-bars">
                                {charts.ratingDistribution.map((item) => {
                                    const maxCount = Math.max(...charts.ratingDistribution.map(r => r.count));
                                    const percentage = (item.count / maxCount) * 100;
                                    return (
                                        <div key={item.rating} className="rating-bar-item">
                                            <div className="rating-label">
                                                <span className="rating-stars">{'⭐'.repeat(item.rating)}</span>
                                                <span className="rating-text">{item.rating} Stars</span>
                                            </div>
                                            <div className="rating-bar-container">
                                                <div 
                                                    className="rating-bar" 
                                                    style={{
                                                        width: `${percentage}%`,
                                                        background: item.rating >= 4 ? '#2e7d32' : item.rating >= 3 ? '#f57c00' : '#c62828'
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="rating-count">{item.count}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-state-card">
                                <p>No rating data available</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default OfficerProfile;
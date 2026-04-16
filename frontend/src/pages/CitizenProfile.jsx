import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/CitizenProfile.css';

const CitizenProfile = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                
                const response = await axios.get(${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/analytics/citizen/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data);
            } catch (err) {
                console.error('Error fetching citizen profile:', err);
                if (err.response?.status === 401) {
                    navigate('/login');
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
        navigate('/dashboard');
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
            <div className="citizen-profile">
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
                            <h1 className="gov-title">CivicFix Citizen Portal</h1>
                            <p className="gov-subtitle">Citizen Impact Profile</p>
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

    const { stats, contributionScore, avgResponseTime, recentActivity } = data;
    const totalReported = stats.total_reported || 0;
    const resolved = stats.closed_issues || 0;
    const active = stats.active_issues || 0;
    const pending = totalReported - resolved - active;
    const successRate = totalReported > 0 ? ((resolved / totalReported) * 100).toFixed(1) : 0;

    return (
        <div className="citizen-profile">
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
                        <h1 className="gov-title">CivicFix Citizen Portal</h1>
                        <p className="gov-subtitle">Government of India | Citizen Impact Profile</p>
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
                {/* Profile Overview Section */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">Citizen Impact Profile</h2>
                        <p className="section-subtitle">Your contribution to community improvement and civic engagement metrics</p>
                    </div>

                    {/* Statistics Grid */}
                    <div className="stats-grid">
                        <article className="stat-card stat-card-primary">
                            <div className="stat-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{totalReported}</div>
                                <div className="stat-label">Total Reported</div>
                                <div className="stat-meta">all time issues</div>
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
                                <div className="stat-value">{resolved}</div>
                                <div className="stat-label">Resolved</div>
                                <div className="stat-meta">completed issues</div>
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
                                <div className="stat-value">{active}</div>
                                <div className="stat-label">Active Issues</div>
                                <div className="stat-meta">in progress</div>
                            </div>
                        </article>

                        <article className="stat-card stat-card-info">
                            <div className="stat-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{contributionScore || 0}</div>
                                <div className="stat-label">Impact Score</div>
                                <div className="stat-meta">contribution points</div>
                            </div>
                        </article>
                    </div>
                </section>

                {/* Performance Metrics */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">Performance Metrics</h2>
                        <p className="section-subtitle">Your civic engagement statistics and success rates</p>
                    </div>

                    <div className="metrics-grid">
                        {/* Success Rate Card */}
                        <div className="metric-card">
                            <div className="metric-card-header">
                                <h3 className="metric-card-title">Resolution Success Rate</h3>
                                <span className="badge badge-success">{successRate}%</span>
                            </div>
                            <div className="metric-card-body">
                                <div className="progress-circle">
                                    <svg viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" strokeWidth="8"/>
                                        <circle 
                                            cx="50" 
                                            cy="50" 
                                            r="45" 
                                            fill="none" 
                                            stroke="#2e7d32" 
                                            strokeWidth="8"
                                            strokeDasharray={`${successRate * 2.827} ${282.7 - (successRate * 2.827)}`}
                                            strokeLinecap="round"
                                            transform="rotate(-90 50 50)"
                                        />
                                    </svg>
                                    <div className="progress-text">
                                        <div className="progress-value">{successRate}%</div>
                                        <div className="progress-label">Success</div>
                                    </div>
                                </div>
                                <div className="metric-breakdown">
                                    <div className="breakdown-item">
                                        <span className="breakdown-dot" style={{background: '#2e7d32'}}></span>
                                        <span className="breakdown-label">Resolved</span>
                                        <span className="breakdown-value">{resolved}</span>
                                    </div>
                                    <div className="breakdown-item">
                                        <span className="breakdown-dot" style={{background: '#f57c00'}}></span>
                                        <span className="breakdown-label">Active</span>
                                        <span className="breakdown-value">{active}</span>
                                    </div>
                                    <div className="breakdown-item">
                                        <span className="breakdown-dot" style={{background: '#0288d1'}}></span>
                                        <span className="breakdown-label">Pending</span>
                                        <span className="breakdown-value">{pending}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Response Time Card */}
                        <div className="metric-card">
                            <div className="metric-card-header">
                                <h3 className="metric-card-title">Average Response Time</h3>
                                <span className="badge badge-info">{avgResponseTime || 0}h</span>
                            </div>
                            <div className="metric-card-body">
                                <div className="comparison-bars">
                                    <div className="comparison-item">
                                        <div className="comparison-label">Your Average</div>
                                        <div className="comparison-bar-container">
                                            <div 
                                                className="comparison-bar" 
                                                style={{
                                                    width: `${Math.min((avgResponseTime || 0) / 72 * 100, 100)}%`,
                                                    background: '#1565c0'
                                                }}
                                            ></div>
                                        </div>
                                        <div className="comparison-value">{avgResponseTime || 0}h</div>
                                    </div>
                                    <div className="comparison-item">
                                        <div className="comparison-label">City Average</div>
                                        <div className="comparison-bar-container">
                                            <div 
                                                className="comparison-bar" 
                                                style={{
                                                    width: '66.67%',
                                                    background: '#0288d1'
                                                }}
                                            ></div>
                                        </div>
                                        <div className="comparison-value">48h</div>
                                    </div>
                                </div>
                                <div className="metric-footer">
                                    {(avgResponseTime || 0) < 48 ? (
                                        <div className="performance-indicator performance-good">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 11l3 3L22 4"/>
                                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                                            </svg>
                                            Better than city average
                                        </div>
                                    ) : (
                                        <div className="performance-indicator performance-average">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"/>
                                                <line x1="12" y1="16" x2="12" y2="12"/>
                                                <line x1="12" y1="8" x2="12.01" y2="8"/>
                                            </svg>
                                            On par with city average
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Recent Activity */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">Recent Activity</h2>
                        <p className="section-subtitle">Your latest civic issue reports and their current status</p>
                    </div>

                    {!recentActivity || recentActivity.length === 0 ? (
                        <div className="empty-state-card">
                            <div className="empty-state-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                                </svg>
                            </div>
                            <h3 className="empty-state-title">No Recent Activity</h3>
                            <p className="empty-state-text">Your issue reports and updates will appear here</p>
                        </div>
                    ) : (
                        <div className="activity-timeline">
                            {recentActivity.map((item) => (
                                <article key={item.id} className="activity-item">
                                    <div className="activity-indicator">
                                        <div className={`activity-dot ${item.status === 'Closed' || item.status === 'Resolved' ? 'activity-dot-success' : 'activity-dot-warning'}`}></div>
                                        <div className="activity-line"></div>
                                    </div>
                                    <div className="activity-card">
                                        <div className="activity-header">
                                            <div className="activity-title">
                                                <span className="activity-id">#{item.id}</span>
                                                <span className="activity-category">{item.category}</span>
                                            </div>
                                            <span className={`status-badge status-${item.status.toLowerCase().replace(' ', '-')}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <div className="activity-meta">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M12 6v6l4 2" />
                                            </svg>
                                            <span>{new Date(item.created_at).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</span>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default CitizenProfile;
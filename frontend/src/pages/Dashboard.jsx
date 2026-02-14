import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const getLocalizedDescription = (issue) => {
        if (!issue.description) return issue.voice_text || t('no_description');
        if (typeof issue.description === 'string') return issue.description; // fallback for legacy
        return issue.description[i18n.language] || issue.description['en'] || issue.voice_text || t('no_description');
    };

    // State
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch issues on mount
    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/issues/my-issues', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setIssues(response.data);
            } catch (err) {
                console.error("Error fetching issues:", err);
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchIssues();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleReportIssue = () => {
        navigate('/report-issue');
    };

    const handleProfile = () => {
        navigate('/citizen/profile');
    };

    return (
        <div className="dashboard-container">
            {/* 3. Logout Element (placed in header for standard UI pattern) */}
            <header className="dashboard-header">
                <h1>{t('citizen_dashboard')}</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="logout-btn" onClick={handleProfile} style={{ backgroundColor: '#2196f3' }}>
                        {t('my_profile')}
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>
                        {t('logout')}
                    </button>
                </div>
            </header>

            <main>
                {/* 1. Report New Issue Element */}
                <section className="action-section">
                    <button className="report-btn-large" onClick={handleReportIssue}>
                        <span className="report-icon">+</span>
                        {t('report_new_issue')}
                    </button>
                </section>

                {/* 2. My Reported Issues Element */}
                <section className="issues-section">
                    <h2>{t('my_reported_issues')}</h2>

                    {loading ? (
                        <p>{t('loading_issues')}</p>
                    ) : issues.length === 0 ? (
                        <div className="empty-state">
                            <p>{t('no_issues')}</p>
                        </div>
                    ) : (
                        <div className="issues-list">
                            {issues.map((issue) => (
                                <div
                                    key={issue.id}
                                    className="issue-card"
                                    onClick={() => navigate(`/issue/${issue.id}`)}
                                    style={{ cursor: 'pointer' }}
                                    title="Click to view details"
                                >
                                    <div className="issue-info">
                                        <h3>{t('cat_' + (issue.category === 'Street Lighting' ? 'lighting' : issue.category === 'Water Supply' ? 'water' : issue.category.toLowerCase()), { defaultValue: issue.category })}</h3>
                                        <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                            {getLocalizedDescription(issue)}
                                        </p>
                                        <div className="issue-meta">
                                            <span>{new Date(issue.timestamp.endsWith('Z') ? issue.timestamp : issue.timestamp + 'Z').toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{new Date(issue.timestamp.endsWith('Z') ? issue.timestamp : issue.timestamp + 'Z').toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    <div className="issue-status">
                                        <span className={`status-badge status-${(issue.status || 'Reported').toLowerCase().replace(' ', '-')}`}>
                                            {t('status_' + (issue.status || 'Reported').toLowerCase().replace(' ', ''), { defaultValue: issue.status })}
                                        </span>
                                        {issue.ai_status && (
                                            <span className={`status-badge status-${issue.ai_status.toLowerCase()}`} style={{ marginLeft: '8px', background: issue.ai_status === 'Verified' ? '#dcfce7' : '#fee2e2', color: issue.ai_status === 'Verified' ? '#166534' : '#991b1b' }}>
                                                🤖 {issue.ai_status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();

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
                <h1>Citizen Dashboard</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="logout-btn" onClick={handleProfile} style={{ backgroundColor: '#2196f3' }}>
                        My Profile
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <main>
                {/* 1. Report New Issue Element */}
                <section className="action-section">
                    <button className="report-btn-large" onClick={handleReportIssue}>
                        <span className="report-icon">+</span>
                        Report New Issue
                    </button>
                </section>

                {/* 2. My Reported Issues Element */}
                <section className="issues-section">
                    <h2>My Reported Issues</h2>

                    {loading ? (
                        <p>Loading issues...</p>
                    ) : issues.length === 0 ? (
                        <div className="empty-state">
                            <p>You haven't reported any issues yet.</p>
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
                                        <h3>{issue.category}</h3>
                                        <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                            {issue.voice_text || 'No description provided'}
                                        </p>
                                        <div className="issue-meta">
                                            <span>{new Date(issue.timestamp.endsWith('Z') ? issue.timestamp : issue.timestamp + 'Z').toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{new Date(issue.timestamp.endsWith('Z') ? issue.timestamp : issue.timestamp + 'Z').toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    <div className="issue-status">
                                        <span className={`status-badge status-${(issue.status || 'reported').toLowerCase().replace(' ', '-')}`}>
                                            {issue.status}
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

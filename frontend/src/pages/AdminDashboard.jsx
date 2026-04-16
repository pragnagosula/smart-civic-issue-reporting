import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import IssueMap from '../components/IssueMap';
import '../styles/AdminDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
    const [officers, setOfficers] = useState([]);
    const [issues, setIssues] = useState([]);
    const [stats, setStats] = useState({
        totalOfficers: 0,
        activeOfficers: 0,
        pendingOfficers: 0,
        totalIssues: 0,
        escalatedIssues: 0,
        resolvedToday: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const [officersRes, issuesRes] = await Promise.all([
                axios.get(${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/all-officers`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/all-issues`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const officersData = officersRes.data;
            const issuesData = issuesRes.data;

            setOfficers(officersData);
            setIssues(issuesData);

            // Calculate statistics
            setStats({
                totalOfficers: officersData.length,
                activeOfficers: officersData.filter(o => o.account_status === 'ACTIVE').length,
                pendingOfficers: officersData.filter(o => o.account_status === 'PENDING' || o.account_status === 'AI_PENDING').length,
                totalIssues: issuesData.length,
                escalatedIssues: issuesData.filter(i => i.status === 'Escalated').length,
                resolvedToday: issuesData.filter(i => {
                    if (!i.resolved_at) return false;
                    const today = new Date().toDateString();
                    const resolvedDate = new Date(i.resolved_at).toDateString();
                    return today === resolvedDate;
                }).length
            });
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            if (err.response?.status === 403 || err.response?.status === 401) {
                alert('Unauthorized Access');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/${action}/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDashboardData();
            alert(`Officer ${action}ed successfully`);
        } catch (err) {
            alert('Action failed');
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        import('../i18n').then(module => module.default.changeLanguage('en'));
        navigate('/login');
    };

    const escalatedIssues = issues.filter(i => i.status === 'Escalated');

    // Helper to generate a fake locality based on coordinates or simply pick random based on issue ID
    const getLocality = (issue) => {
        if (!issue.latitude || !issue.longitude) return 'Unknown';
        const lat = parseFloat(issue.latitude);
        if (lat > 28.6) return 'North Zone';
        if (lat < 28.5) return 'South Zone';
        if (parseFloat(issue.longitude) > 77.2) return 'East Zone';
        return 'West Zone';
    };

    // Analytics Data Preparation
    const localityCounts = issues.reduce((acc, issue) => {
        const loc = issue.address ? issue.address.split(',')[0] : getLocality(issue);
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
    }, {});

    const localityChartData = {
        labels: Object.keys(localityCounts),
        datasets: [
            {
                label: 'Issues by Locality',
                data: Object.values(localityCounts),
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            },
        ],
    };

    const categoryCounts = issues.reduce((acc, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
    }, {});

    const categoryPieData = {
        labels: Object.keys(categoryCounts),
        datasets: [
            {
                label: 'Issues by Category',
                data: Object.values(categoryCounts),
                backgroundColor: [
                    '#1E40AF', '#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE'
                ],
            },
        ],
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p style={{ marginTop: '1.5rem', color: '#616161', fontSize: '1rem' }}>Loading Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
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
                        <h1 className="gov-title">CivicFix Administration Portal</h1>
                        <p className="gov-subtitle">Government of India | Ministry of Urban Development</p>
                    </div>
                    
                    <div className="gov-header-actions">
                        <button className="btn btn-logout no-print" onClick={handleLogout}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="admin-tabs">
                <div className="tabs-container">
                    <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                    <button className={`tab-btn ${activeTab === 'issues' ? 'active' : ''}`} onClick={() => setActiveTab('issues')}>Issues Management</button>
                    <button className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>System Map</button>
                    <button className={`tab-btn ${activeTab === 'officers' ? 'active' : ''}`} onClick={() => setActiveTab('officers')}>Officers List</button>
                    <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>Analytics</button>
                </div>
            </div>

            <main className="dashboard-container">
                {activeTab === 'overview' && (
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">System Overview</h2>
                        <p className="section-subtitle">Real-time metrics and performance indicators across the CivicFix platform</p>
                    </div>

                    <div className="stats-grid">
                        <article className="stat-card stat-card-primary">
                            <div className="stat-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.activeOfficers}</div>
                                <div className="stat-label">Active Officers</div>
                                <div className="stat-meta">of {stats.totalOfficers} total</div>
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
                                <div className="stat-value">{stats.pendingOfficers}</div>
                                <div className="stat-label">Pending Reviews</div>
                                <div className="stat-meta">officer applications</div>
                            </div>
                        </article>

                        <article className="stat-card stat-card-info">
                            <div className="stat-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.totalIssues}</div>
                                <div className="stat-label">Total Issues</div>
                                <div className="stat-meta">in system</div>
                            </div>
                        </article>

                        <article className="stat-card stat-card-error">
                            <div className="stat-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.escalatedIssues}</div>
                                <div className="stat-label">Escalated Cases</div>
                                <div className="stat-meta">require attention</div>
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
                                <div className="stat-value">{stats.resolvedToday}</div>
                                <div className="stat-label">Resolved Today</div>
                                <div className="stat-meta">last 24 hours</div>
                            </div>
                        </article>
                    </div>
                </section>
                )}

                {activeTab === 'issues' && (
                    <>

                {/* Critical Escalated Issues Alert */}
                {escalatedIssues.length > 0 && (
                    <section className="dashboard-section">
                        <aside className="alert-box alert-critical" role="alert">
                            <div className="alert-header">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <h3>Critical: Escalated Issues Requiring Immediate Attention</h3>
                            </div>
                            <p>These issues have been rejected multiple times and require administrative review</p>
                            <EscalatedIssuesTable issues={escalatedIssues} officers={officers} />
                        </aside>
                    </section>
                )}

                {/* All Reported Issues */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">All Reported Issues</h2>
                        <p className="section-subtitle">Complete system-wide issue tracking and management</p>
                    </div>

                    <IssuesTable issues={issues} officers={officers} />
                </section>
                </>
                )}

                {activeTab === 'map' && (
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h2 className="section-title">City-wide Live Map</h2>
                            <p className="section-subtitle">Real-time geospatial view of all reported civic issues</p>
                        </div>
                        <div style={{ padding: '16px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
                            <IssueMap issues={issues} height="700px" />
                        </div>
                    </section>
                )}

                {activeTab === 'officers' && (
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">Officer Management</h2>
                        <p className="section-subtitle">Review, approve, and manage officer registrations</p>
                    </div>

                    <div className="data-table-container">
                        <table className="data-table" role="table">
                            <thead>
                                <tr>
                                    <th scope="col">Officer Details</th>
                                    <th scope="col">Department</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">AI Assessment</th>
                                    <th scope="col">Document</th>
                                    <th scope="col" className="no-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {officers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6">
                                            <div className="empty-state">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                </svg>
                                                <p>No officer registrations found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    officers.map(officer => (
                                        <tr key={officer.id} className={officer.account_status === 'REJECTED' ? 'row-rejected' : ''}>
                                            <td>
                                                <div className="officer-info">
                                                    <div className="officer-name">{officer.name}</div>
                                                    <div className="officer-email">{officer.email}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-department">{officer.department}</span>
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${officer.account_status?.toLowerCase() || 'pending'}`}>
                                                    {officer.account_status || 'PENDING'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="ai-score">
                                                    <div className="score-badge" style={{
                                                        background: officer.ai_score >= 0.7 ? 'rgba(46, 125, 50, 0.1)' :
                                                                   officer.ai_score >= 0.5 ? 'rgba(245, 124, 0, 0.1)' :
                                                                   'rgba(198, 40, 40, 0.1)',
                                                        color: officer.ai_score >= 0.7 ? '#2e7d32' :
                                                               officer.ai_score >= 0.5 ? '#f57c00' :
                                                               '#c62828'
                                                    }}>
                                                        {(officer.ai_score * 100).toFixed(0)}%
                                                    </div>
                                                    <div className="score-reason">{officer.ai_reason}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <a href={officer.document_url} target="_blank" rel="noreferrer" className="link-button">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14 2 14 8 20 8" />
                                                    </svg>
                                                    View Document
                                                </a>
                                            </td>
                                            <td className="no-print">
                                                <div className="action-buttons">
                                                    <button 
                                                        onClick={() => handleAction(officer.id, 'approve')}
                                                        className="btn btn-sm btn-success"
                                                        title="Approve Officer Application"
                                                        aria-label={`Approve ${officer.name}`}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(officer.id, 'reject')}
                                                        className="btn btn-sm btn-error"
                                                        title="Reject Officer Application"
                                                        aria-label={`Reject ${officer.name}`}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <line x1="18" y1="6" x2="6" y2="18" />
                                                            <line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
                )}

                {activeTab === 'analytics' && (
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h2 className="section-title">Platform Analytics</h2>
                            <p className="section-subtitle">Visual insights into reported issues and system performance</p>
                        </div>
                        
                        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                            <div className="chart-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                <h3 style={{ marginBottom: '1rem', color: '#1E293B', fontSize: '1.125rem', fontWeight: '700' }}>Issues by Locality</h3>
                                <div style={{ height: '300px' }}>
                                    <Bar data={localityChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                                </div>
                            </div>
                            <div className="chart-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                <h3 style={{ marginBottom: '1rem', color: '#1E293B', fontSize: '1.125rem', fontWeight: '700' }}>Issues by Category</h3>
                                <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                                    <Pie data={categoryPieData} options={{ maintainAspectRatio: false, responsive: true }} />
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

// Escalated Issues Table Component
const EscalatedIssuesTable = ({ issues, officers }) => {
    const getOfficerName = (id) => {
        const officer = officers.find(o => o.id === id);
        return officer ? officer.name : 'Unknown Officer';
    };

    return (
        <div className="data-table-container">
            <table className="data-table table-escalated">
                <thead>
                    <tr>
                        <th scope="col">Category</th>
                        <th scope="col">Rejections</th>
                        <th scope="col">Rejected By</th>
                        <th scope="col">Reported Date</th>
                        <th scope="col">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {issues.map(issue => (
                        <tr key={issue.id}>
                            <td><span className="badge badge-error">{issue.category}</span></td>
                            <td>
                                <span className="rejection-count">{issue.rejection_count} times</span>
                            </td>
                            <td className="officer-list">
                                {(issue.rejected_by || []).map(id => getOfficerName(id)).join(', ') || 'N/A'}
                            </td>
                            <td>{new Date(issue.timestamp || issue.created_at).toLocaleDateString('en-IN')}</td>
                            <td>
                                <button className="btn btn-sm btn-primary">
                                    Review Case
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// All Issues Table Component
const IssuesTable = ({ issues, officers }) => {
    const [selectedIssue, setSelectedIssue] = useState(null);

    if (!issues || issues.length === 0) {
        return (
            <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                </svg>
                <p>No issues reported yet</p>
            </div>
        );
    }

    return (
        <>
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th scope="col">Category</th>
                            <th scope="col">Description</th>
                            <th scope="col">Status</th>
                            <th scope="col">AI Confidence</th>
                            <th scope="col">Reported</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {issues.map(issue => (
                            <tr key={issue.id}>
                                <td><span className="badge badge-info">{issue.category}</span></td>
                                <td className="description-cell">
                                    {(issue.voice_text || 'No description').substring(0, 100)}
                                    {(issue.voice_text || '').length > 100 && '...'}
                                </td>
                                <td>
                                    <span className={`status-badge status-${issue.status?.toLowerCase().replace(' ', '-') || 'reported'}`}>
                                        {issue.status || 'Reported'}
                                    </span>
                                </td>
                                <td>
                                    <div className="confidence-score">
                                        {(issue.ai_confidence * 100).toFixed(0)}%
                                    </div>
                                </td>
                                <td>{new Date(issue.timestamp || issue.created_at).toLocaleDateString('en-IN')}</td>
                                <td>
                                    <button 
                                        onClick={() => setSelectedIssue(issue)}
                                        className="btn btn-sm btn-primary"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedIssue && (
                <IssueModal 
                    issue={selectedIssue} 
                    officers={officers}
                    onClose={() => setSelectedIssue(null)}
                />
            )}
        </>
    );
};

// Issue Details Modal Component
const IssueModal = ({ issue, officers, onClose }) => {
    const [fullIssue, setFullIssue] = useState(null);
    const [loadingIssue, setLoadingIssue] = useState(true);
    const [issueError, setIssueError] = useState(null);

    const issueToShow = fullIssue || issue;

    const fetchIssueDetails = async () => {
        try {
            setLoadingIssue(true);
            setIssueError(null);
            const token = localStorage.getItem('token');
            const res = await axios.get(${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/${issue.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFullIssue(res.data);
        } catch (err) {
            console.error('Admin issue detail fetch failed:', err);
            setIssueError('Unable to load full issue details.');
        } finally {
            setLoadingIssue(false);
        }
    };

    useEffect(() => {
        fetchIssueDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [issue.id]);

    const handleAssignOfficer = async (officerId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/assign/${issue.id}`,
                { officerId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Officer assigned successfully');
            onClose();
            window.location.reload();
        } catch (err) {
            alert('Assignment failed');
            console.error(err);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="issue-modal-title">
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 id="issue-modal-title">Issue Details</h2>
                    <button 
                        className="modal-close" 
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <div className="issue-details-grid">
                        <div className="detail-card">
                            <h4>Category</h4>
                            <span className="badge badge-info">{issue.category}</span>
                        </div>
                        <div className="detail-card">
                            <h4>Status</h4>
                            <span className={`status-badge status-${issue.status?.toLowerCase().replace(' ', '-')}`}>
                                {issue.status}
                            </span>
                        </div>
                        <div className="detail-card">
                            <h4>AI Confidence</h4>
                            <div className="confidence-score">{(issue.ai_confidence * 100).toFixed(0)}%</div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h4>Description</h4>
                        <p>{issue.voice_text || 'No description provided'}</p>
                    </div>

                    <div className="detail-section">
                        <h4>AI Analysis</h4>
                        <p className="ai-analysis">{issue.ai_reason || 'No AI analysis available'}</p>
                    </div>

                    {issue.image && (
                        <div className="detail-section">
                            <h4>Evidence Photo</h4>
                            <img src={issue.image} alt="Issue evidence" className="evidence-image" />
                        </div>
                    )}

                    <div className="detail-section">
                        <h4>Location</h4>
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            View on Google Maps
                        </a>
                    </div>

                    <div className="detail-section">
                        <h4>Assign Officer</h4>
                        <select 
                            className="input-field"
                            onChange={(e) => e.target.value && handleAssignOfficer(e.target.value)}
                            defaultValue=""
                            aria-label="Select officer to assign"
                        >
                            <option value="">Select an officer...</option>
                            {officers
                                .filter(o => o.account_status === 'ACTIVE')
                                .map(o => (
                                    <option key={o.id} value={o.id}>
                                        {o.name} ({o.department}) - AI Score: {(o.ai_score * 100).toFixed(0)}%
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    <div className="detail-section comments-preview-section">
                        <h4>Likes</h4>
                        <p className="likes-summary">{issueToShow.likes ?? 0} total like{issueToShow.likes === 1 ? '' : 's'}</p>
                    </div>

                    <div className="detail-section comments-preview-section">
                        <h4>Recent Comments</h4>
                        {loadingIssue ? (
                            <p>Loading comments...</p>
                        ) : issueError ? (
                            <p className="error-text">{issueError}</p>
                        ) : issueToShow.comments?.length ? (
                            issueToShow.comments.map(c => (
                                <div key={c.id} className="comment-preview-card">
                                    <div className="comment-preview-header">
                                        <strong>{c.name || 'User'}</strong>
                                        <span className="comment-role">{c.role}</span>
                                    </div>
                                    <p>{c.comment}</p>
                                </div>
                            ))
                        ) : (
                            <p className="empty-comments">No comments yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
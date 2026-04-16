import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import IssueMap from '../components/IssueMap';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const getLocalizedDescription = (issue) => {
        if (!issue.description) return issue.voice_text || t('no_description');
        if (typeof issue.description === 'string') return issue.description;
        return issue.description[i18n.language] || issue.description['en'] || issue.voice_text || t('no_description');
    };

    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        resolved: 0,
        inProgress: 0,
        pending: 0
    });
    const [categoryStats, setCategoryStats] = useState({});

    const [mainTab, setMainTab] = useState('overview');
    const [tab, setTab] = useState('my');
    const [viewMode, setViewMode] = useState('list');
    const [allIssues, setAllIssues] = useState([]);
    const [allLoading, setAllLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [filters, setFilters] = useState({ search: '', status: '', category: '' });

    const statusOptions = ['', 'Reported', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    const categoryOptions = ['','Street Lighting', 'Water Supply', 'Road Damage', 'Garbage', 'Sanitation', 'Drainage', 'Parks', 'Solid Waste Management', 'Other'];

    useEffect(() => {
        fetchIssues();
        fetchAllIssues();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // Re-fetch issues when language changes
        fetchIssues();
        if (tab === 'all') {
            fetchAllIssues();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [i18n.language]);

    useEffect(() => {
        if (tab === 'all') {
            fetchAllIssues();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, tab]);

    const fetchIssues = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/my-issues`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const issuesData = response.data;
            setIssues(issuesData);

            setStats({
                total: issuesData.length,
                resolved: issuesData.filter(i => i.status === 'Resolved' || i.status === 'Closed').length,
                inProgress: issuesData.filter(i => i.status === 'In Progress' || i.status === 'Assigned').length,
                pending: issuesData.filter(i => i.status === 'Reported').length
            });

            const cats = {};
            issuesData.forEach(issue => {
                const cat = issue.category || 'Other';
                cats[cat] = (cats[cat] || 0) + 1;
            });
            setCategoryStats(cats);
        } catch (err) {
            console.error("Error fetching issues:", err);
            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAllIssues = async (activeFilters = filters) => {
        try {
            setAllLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (activeFilters.search) params.append('search', activeFilters.search);
            if (activeFilters.status) params.append('status', activeFilters.status);
            if (activeFilters.category) params.append('category', activeFilters.category);
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/all?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllIssues(response.data);
        } catch (err) {
            console.error('Error fetching all issues:', err);
            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setAllLoading(false);
        }
    };

    const handleApplyFilters = () => {
        const nextFilters = {
            search: searchText.trim(),
            status: selectedStatus,
            category: selectedCategory
        };
        setFilters(nextFilters);
        if (tab === 'all') {
            fetchAllIssues(nextFilters);
        }
    };

    const handleResetFilters = () => {
        setSearchText('');
        setSelectedStatus('');
        setSelectedCategory('');
        const resetFilters = { search: '', status: '', category: '' };
        setFilters(resetFilters);
        if (tab === 'all') {
            fetchAllIssues(resetFilters);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('language');
        i18n.changeLanguage('en');
        navigate('/login');
    };

    const handleReportIssue = () => {
        navigate('/report-issue');
    };

    const handleProfile = () => {
        navigate('/citizen/profile');
    };

    const isOverdue = (createdAt) => {
        const created = new Date(createdAt);
        const now = new Date();
        const diffDays = (now - created) / (1000 * 60 * 60 * 24);
        return diffDays > 7;
    };

    const getCategoryIcon = (category) => {
        switch(category) {
            case 'Street Lighting': return '💡';
            case 'Water Supply': return '💧';
            case 'Road Damage': return '🛣️';
            case 'Garbage': return '🗑️';
            case 'Roads': return '🛣️';
            case 'Sanitation': return '🧹';
            case 'Drainage': return '🌊';
            case 'Parks': return '🌳';
            case 'Solid Waste Management': return '♻️';
            default: return '📌';
        }
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p style={{ marginTop: '1.5rem', color: '#616161', fontSize: '1rem' }}>{t('loading_dashboard')}</p>
            </div>
        );
    }

    return (
        <div className="citizen-dashboard">
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
                        <h1 className="gov-title">{t('civicfix_portal')}</h1>
                        <p className="gov-subtitle">{t('gov_subtitle')}</p>
                    </div>
                    
                    <div className="gov-header-actions">
                        <button className="btn btn-profile no-print" onClick={handleProfile}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            {t('profile')}
                        </button>
                        <button className="btn btn-logout no-print" onClick={handleLogout}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            {t('logout')}
                        </button>
                    </div>
                </div>
            </header>

            <div className="citizen-tabs">
                <div className="tabs-container">
                    <button className={`tab-btn ${mainTab === 'overview' ? 'active' : ''}`} onClick={() => setMainTab('overview')}>{t('dashboard_overview') || 'Dashboard Overview'}</button>
                    {Object.keys(categoryStats).length > 0 && <button className={`tab-btn ${mainTab === 'categories' ? 'active' : ''}`} onClick={() => setMainTab('categories')}>{t('issues_by_category') || 'Issues by Category'}</button>}
                    <button className={`tab-btn ${mainTab === 'tracker' ? 'active' : ''}`} onClick={() => setMainTab('tracker')}>Citizen Issue Tracker</button>
                </div>
            </div>

            <main className="dashboard-container">
                {/* System Overview Statistics */}
                {mainTab === 'overview' && (
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">{t('dashboard_overview')}</h2>
                        <p className="section-subtitle">{t('summary_subtitle')}</p>
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
                                <div className="stat-value">{stats.total}</div>
                                <div className="stat-label">{t('total_issues')}</div>
                                <div className="stat-meta">{t('all_time')}</div>
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
                                <div className="stat-value">{stats.resolved}</div>
                                <div className="stat-label">{t('resolved')}</div>
                                <div className="stat-meta">{t('completed')}</div>
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
                                <div className="stat-value">{stats.inProgress}</div>
                                <div className="stat-label">{t('in_progress')}</div>
                                <div className="stat-meta">{t('active')}</div>
                            </div>
                        </article>

                        <article className="stat-card stat-card-info">
                            <div className="stat-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.pending}</div>
                                <div className="stat-label">{t('pending')}</div>
                                <div className="stat-meta">{t('awaiting')}</div>
                            </div>
                        </article>
                    </div>
                </section>
                )}

                {/* Category Breakdown */}
                {mainTab === 'categories' && Object.keys(categoryStats).length > 0 && (
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h2 className="section-title">{t('issues_by_category')}</h2>
                            <p className="section-subtitle">{t('breakdown_subtitle')}</p>
                        </div>

                        <div className="category-cards-grid">
                            {Object.entries(categoryStats).map(([cat, count]) => (
                                <div key={cat} className="category-card">
                                    <div className="category-card-icon">{getCategoryIcon(cat)}</div>
                                    <div className="category-card-content">
                                        <div className="category-card-name">{cat}</div>
                                        <div className="category-card-count">{count} {count === 1 ? t('issue') : t('issues')}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Report New Issue CTA */}
                {mainTab === 'tracker' && (
                <>
                <section className="dashboard-section">
                    <div className="cta-container">
                        <button className="btn-report-large" onClick={handleReportIssue}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Report New Issue
                        </button>
                    </div>
                </section>

                {/* Issue Lists */}
                <section className="dashboard-section">
                    <div className="section-header dashboard-tabs-header">
                        <div>
                            <h2 className="section-title">Citizen Issue Tracker</h2>
                            <p className="section-subtitle">Browse your reports or explore all civic issues in the area</p>
                        </div>
                        <div className="dashboard-tabs">
                            <button
                                className={`tab-button ${tab === 'my' ? 'tab-button-active' : ''}`}
                                onClick={() => setTab('my')}
                            >
                                My Issues
                            </button>
                            <button
                                className={`tab-button ${tab === 'all' ? 'tab-button-active' : ''}`}
                                onClick={() => setTab('all')}
                            >
                                All Issues
                            </button>
                        </div>
                        <div className="view-toggle" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button 
                                className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setViewMode('list')}
                            >
                                List View
                            </button>
                            <button 
                                className={`btn ${viewMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setViewMode('map')}
                            >
                                Map View
                            </button>
                        </div>
                    </div>

                    {tab === 'all' && (
                        <div className="filter-toolbar">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search by description, location, or reporter"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>{status || 'All Statuses'}</option>
                                ))}
                            </select>
                            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                {categoryOptions.map((category) => (
                                    <option key={category} value={category}>{category || 'All Categories'}</option>
                                ))}
                            </select>
                            <div className="filter-buttons">
                                <button className="btn btn-secondary" onClick={handleApplyFilters}>Apply</button>
                                <button className="btn btn-tertiary" onClick={handleResetFilters}>Reset</button>
                            </div>
                        </div>
                    )}

                    {(tab === 'my' ? loading : allLoading) ? (
                        <div className="loading-overlay small">
                            <div className="spinner"></div>
                            <p style={{ marginTop: '1rem', color: '#616161', fontSize: '0.95rem' }}>
                                {tab === 'my' ? 'Loading your issues...' : 'Loading all issues...'}
                            </p>
                        </div>
                    ) : (tab === 'my' ? issues : allIssues).length === 0 ? (
                        <div className="empty-state-card">
                            <div className="empty-state-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <h3 className="empty-state-title">
                                {tab === 'my' ? 'No Issues Reported Yet' : 'No Issues Found'}
                            </h3>
                            <p className="empty-state-text">
                                {tab === 'my'
                                    ? 'Start by reporting your first civic issue to help improve your community.'
                                    : 'Try adjusting the filters or search terms to find what you need.'}
                            </p>
                            {tab === 'my' && (
                                <button className="btn btn-primary" onClick={handleReportIssue}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Report Your First Issue
                                </button>
                            )}
                        </div>
                    ) : viewMode === 'map' ? (
                        <div style={{ marginTop: '20px' }}>
                            <IssueMap issues={tab === 'my' ? issues : allIssues} height="600px" />
                        </div>
                    ) : (
                        <div className="issues-grid">
                            {(tab === 'my' ? issues : allIssues).map((issue) => (
                                <article
                                    key={issue.id}
                                    className="issue-card"
                                    onClick={() => navigate(`/issue/${issue.id}`)}
                                >
                                    <div className="issue-card-header">
                                        <div className="issue-category">
                                            <span className="category-icon-small">{getCategoryIcon(issue.category)}</span>
                                            <span className="category-text">{issue.category}</span>
                                        </div>
                                        <div className="issue-id">#{issue.id}</div>
                                    </div>

                                    <div className="issue-description">
                                        {getLocalizedDescription(issue)}
                                    </div>

                                    <div className="issue-footer">
                                        <div className="issue-meta">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M12 6v6l4 2" />
                                            </svg>
                                            <span>{new Date(issue.timestamp?.endsWith('Z') ? issue.timestamp : issue.timestamp + 'Z').toLocaleDateString('en-IN')}</span>
                                        </div>
                                        <div className="issue-status-container">
                                            <span className={`status-badge ${issue.status === 'Reported' && isOverdue(issue.created_at || issue.timestamp)
                                                    ? 'status-overdue'
                                                    : `status-${(issue.status || 'Reported').toLowerCase().replace(' ', '-')}`}`}>
                                                {issue.status === 'Reported' && isOverdue(issue.created_at || issue.timestamp)
                                                    ? 'OVERDUE'
                                                    : (issue.status || 'Reported').toUpperCase()}
                                            </span>
                                            {issue.ai_status && (
                                                <span className={`ai-badge ai-${issue.ai_status.toLowerCase()}`}>
                                                    🤖 {issue.ai_status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
                </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
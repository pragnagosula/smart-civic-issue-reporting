import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import IssueMap from '../components/IssueMap';
import '../styles/Dashboard.css';
import {
    CalendarTodayRounded as DateIcon,
    AddRounded as AddIcon,
    SearchRounded as SearchIcon,
    MapRounded as MapIcon,
    ListRounded as ListIcon,
    SmartToyRounded as AIIcon,
    LightbulbCircleRounded as LightbulbIcon,
    WaterDropRounded as WaterIcon,
    ErrorRounded as RoadIcon,
    DeleteRounded as GarbageIcon,
    CleaningServicesRounded as SanitationIcon,
    WavesRounded as DrainageIcon,
    NaturePeopleRounded as ParksIcon,
    RecyclingRounded as WasteIcon,
    MyLocationRounded as OtherIcon,
    FilterList as FilterIcon,
    Sort as SortIcon,
    KeyboardArrowUp as ArrowUpIcon,
    KeyboardArrowDown as ArrowDownIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
    CheckCircle as ResolvedIcon,
    Error as EscalatedIcon,
    Build as InProgressIcon,
    Report as ReportedIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    FirstPage as FirstPageIcon,
    LastPage as LastPageIcon
} from '@mui/icons-material';

const Dashboard = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const [issues, setIssues] = useState([]);
    const [allIssues, setAllIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, resolved: 0, inProgress: 0, pending: 0 });
    const [categoryStats, setCategoryStats] = useState({});
    
    // NAVIGATION STATE
    const [mainTab, setMainTab] = useState('overview'); // 'overview', 'categories', 'tracker'
    const [tab, setTab] = useState('my'); // 'my' or 'all'
    const [viewMode, setViewMode] = useState('list'); 
    
    // ENHANCED FILTER STATE
    const [searchText, setSearchText] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortField, setSortField] = useState('timestamp');
    const [sortDirection, setSortDirection] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);

    const statusOptions = ['', 'Reported', 'Assigned', 'In Progress', 'Resolved'];
    const categoryOptions = ['', 'Roads', 'Water', 'Sanitation', 'Streetlight', 'Drainage', 'Parks', 'Waste', 'Other'];

    useEffect(() => {
        fetchIssues();
    }, [mainTab, tab, i18n.language]);

    const fetchIssues = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            // Fetch user's issues for overview and my issues tab
            const myIssuesResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/my-issues`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const myIssuesData = myIssuesResponse.data;
            setIssues(myIssuesData);

            // Fetch all issues if we're on tracker tab and all issues is selected
            if (mainTab === 'tracker' && tab === 'all') {
                const allIssuesResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/all`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAllIssues(allIssuesResponse.data);
            }

            // Calculate Stats (always from user's issues)
            setStats({
                total: myIssuesData.length,
                resolved: myIssuesData.filter(i => i.status === 'Resolved').length,
                inProgress: myIssuesData.filter(i => i.status === 'In Progress' || i.status === 'Assigned').length,
                pending: myIssuesData.filter(i => i.status === 'Reported').length
            });

            // Calculate Categories (always from user's issues)
            const cats = {};
            myIssuesData.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });
            setCategoryStats(cats);

        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Enhanced filtering and sorting logic
    const getCurrentIssues = () => {
        return tab === 'all' ? allIssues : issues;
    };

    const filteredAndSortedIssues = getCurrentIssues()
        .filter(issue => {
            const description = issue.description?.en || issue.voice_text || '';
            const matchesSearch = !searchText ||
                description.toLowerCase().includes(searchText.toLowerCase()) ||
                issue.category.toLowerCase().includes(searchText.toLowerCase()) ||
                (issue.address && issue.address.toLowerCase().includes(searchText.toLowerCase()));

            const matchesStatus = !selectedStatus || issue.status === selectedStatus;
            const matchesCategory = !selectedCategory || issue.category === selectedCategory;

            return matchesSearch && matchesStatus && matchesCategory;
        })
        .sort((a, b) => {
            let aValue, bValue;

            switch (sortField) {
                case 'category':
                    aValue = a.category;
                    bValue = b.category;
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'timestamp':
                default:
                    aValue = new Date(a.timestamp || a.created_at);
                    bValue = new Date(b.timestamp || b.created_at);
                    break;
            }

            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedIssues.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedIssues = filteredAndSortedIssues.slice(startIndex, startIndex + itemsPerPage);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (field) => {
        if (sortField !== field) return <SortIcon fontSize="small" style={{ opacity: 0.3 }} />;
        return sortDirection === 'asc' ?
            <ArrowUpIcon fontSize="small" /> :
            <ArrowDownIcon fontSize="small" />;
    };

    const resetFilters = () => {
        setSearchText('');
        setSelectedStatus('');
        setSelectedCategory('');
        setCurrentPage(1);
    };

    // Enhanced category icon function
    const getCategoryIcon = (cat) => {
        const style = { fontSize: 24 };
        if (cat?.includes('Road')) return <RoadIcon style={style} />;
        if (cat?.includes('Water')) return <WaterIcon style={style} />;
        if (cat?.includes('Light')) return <LightbulbIcon style={style} />;
        if (cat?.includes('Garbage') || cat?.includes('Waste')) return <WasteIcon style={style} />;
        if (cat?.includes('Sanitation')) return <SanitationIcon style={style} />;
        if (cat?.includes('Drainage')) return <DrainageIcon style={style} />;
        if (cat?.includes('Park')) return <ParksIcon style={style} />;
        return <OtherIcon style={style} />;
    };

    // Status icons for enhanced display
    const getStatusIcon = (status) => {
        const iconMap = {
            'Reported': <ReportedIcon fontSize="small" />,
            'Assigned': <PersonIcon fontSize="small" />,
            'In Progress': <InProgressIcon fontSize="small" />,
            'Resolved': <ResolvedIcon fontSize="small" />
        };
        return iconMap[status] || <ReportedIcon fontSize="small" />;
    };

    if (loading && mainTab === 'overview') return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="citizen-dashboard">
            {/* 🏛️ RESTORED GOVERNMENT HEADER */}
            <header className="gov-header">
                <div className="gov-header-content">
                    <div className="gov-emblem">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7L12 12L22 7L12 2Z" /><path d="M2 17L12 22L22 17" /><path d="M2 12L12 17L22 12" /></svg>
                    </div>
                    <div className="gov-header-title-section">
                        <h1 className="gov-title">CivicFix Portal</h1>
                        <p className="gov-subtitle">OFFICIAL CITIZEN REPORTING & MONITORING SYSTEM</p>
                    </div>
                    <div className="gov-header-actions">
                        <button className="btn-profile" onClick={() => navigate('/citizen/profile')}>MY PROFILE</button>
                        <button className="btn-logout" onClick={handleLogout}>LOGOUT</button>
                    </div>
                </div>
            </header>

            {/* 📑 RESTORED TABS NAVIGATION */}
            <div className="citizen-tabs">
                <div className="tabs-container">
                    <button className={`tab-btn ${mainTab === 'overview' ? 'active' : ''}`} onClick={() => setMainTab('overview')}>OVERVIEW</button>
                    <button className={`tab-btn ${mainTab === 'categories' ? 'active' : ''}`} onClick={() => setMainTab('categories')}>BY CATEGORY</button>
                    <button className={`tab-btn ${mainTab === 'tracker' ? 'active' : ''}`} onClick={() => setMainTab('tracker')}>ISSUE TRACKER</button>
                </div>
            </div>

            <main className="dashboard-container">
                {/* 1. OVERVIEW TAB */}
                {mainTab === 'overview' && (
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h2 className="section-title">Dashboard Overview</h2>
                            <p className="section-subtitle">Real-time summary of your reported civic issues</p>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-card stat-total">
                                <div className="stat-val">{stats.total}</div>
                                <div className="stat-lab">TOTAL ISSUES</div>
                            </div>
                            <div className="stat-card stat-resolved">
                                <div className="stat-val">{stats.resolved}</div>
                                <div className="stat-lab">RESOLVED</div>
                            </div>
                            <div className="stat-card stat-progress">
                                <div className="stat-val">{stats.inProgress}</div>
                                <div className="stat-lab">IN PROGRESS</div>
                            </div>
                            <div className="stat-card stat-pending">
                                <div className="stat-val">{stats.pending}</div>
                                <div className="stat-lab">PENDING</div>
                            </div>
                        </div>
                    </section>
                )}

                {/* 2. CATEGORIES TAB */}
                {mainTab === 'categories' && (
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h2 className="section-title">Issues by Category</h2>
                        </div>
                        <div className="category-cards-grid">
                            {Object.entries(categoryStats).map(([cat, count]) => (
                                <div key={cat} className="category-card">
                                    <div className="cat-icon-box">{getCategoryIcon(cat)}</div>
                                    <div className="cat-info">
                                        <div className="cat-name">{cat}</div>
                                        <div className="cat-count">{count} Reports</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 3. TRACKER TAB (ENHANCED) */}
                {mainTab === 'tracker' && (
                    <section className="dashboard-section">
                        {/* Enhanced Control Row */}
                        <div className="tracker-toolbar-v4">
                            <div className="toolbar-left-v4">
                                <div className="pill-toggle">
                                    <button className={tab === 'my' ? 'active' : ''} onClick={() => { setTab('my'); setCurrentPage(1); }}>MY ISSUES</button>
                                    <button className={tab === 'all' ? 'active' : ''} onClick={() => { setTab('all'); setCurrentPage(1); }}>ALL ISSUES</button>
                                </div>
                                <div className="pill-toggle">
                                    <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}><ListIcon style={{ fontSize: 18 }} /></button>
                                    <button className={viewMode === 'map' ? 'active' : ''} onClick={() => setViewMode('map')}><MapIcon style={{ fontSize: 18 }} /></button>
                                </div>
                            </div>
                            
                            <div className="toolbar-right-v4">
                                <button className="btn-report-v4" onClick={() => navigate('/report-issue')}>
                                    <AddIcon /> REPORT NEW ISSUE
                                </button>
                            </div>
                        </div>

                        {/* Enhanced Filter Strip */}
                        <div className="issues-controls">
                            <div className="search-filter-row">
                                <div className="search-input-wrapper">
                                    <SearchIcon className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search issues by description, category, or location..."
                                        value={searchText}
                                        onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                                        className="search-input"
                                    />
                                </div>

                                <div className="filter-row">
                                    <div className="filter-group">
                                        <FilterIcon fontSize="small" />
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                                            className="filter-select"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="Reported">Reported</option>
                                            <option value="Assigned">Assigned</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Resolved">Resolved</option>
                                        </select>
                                    </div>

                                    <div className="filter-group">
                                        <FilterIcon fontSize="small" />
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                                            className="filter-select"
                                        >
                                            <option value="">All Categories</option>
                                            <option value="Roads">Roads</option>
                                            <option value="Water">Water</option>
                                            <option value="Sanitation">Sanitation</option>
                                            <option value="Streetlight">Streetlight</option>
                                            <option value="Drainage">Drainage</option>
                                            <option value="Parks">Parks</option>
                                            <option value="Waste">Waste</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <button onClick={resetFilters} className="btn btn-sm btn-secondary">
                                        Clear Filters
                                    </button>
                                </div>
                            </div>

                            <div className="results-info">
                                Showing {paginatedIssues.length} of {filteredAndSortedIssues.length} issues
                                {(searchText || selectedStatus || selectedCategory) && (
                                    <span className="filter-active"> (filtered)</span>
                                )}
                            </div>
                        </div>

                        {/* Enhanced Grid/List View */}
                        {viewMode === 'map' ? (
                            <IssueMap issues={paginatedIssues} height="500px" />
                        ) : (
                            <>
                                <div className="grid-v4">
                                    {paginatedIssues.map(issue => (
                                        <div key={issue.id} className="card-v4" onClick={() => navigate(`/issue/${issue.id}`)}>
                                            <div className="card-top">
                                                <div className="category-with-icon">
                                                    <span className="category-icon-small">
                                                        {getCategoryIcon(issue.category)}
                                                    </span>
                                                    <span className="badge-category">{issue.category?.toUpperCase()}</span>
                                                </div>
                                                <span className="issue-id">#{issue.id}</span>
                                            </div>
                                            <h3 className="card-title">
                                                {issue.description?.en || issue.voice_text || 'Issue Record'}
                                            </h3>
                                            <div className="card-meta">
                                                <div className="meta-row">
                                                    <LocationIcon fontSize="small" />
                                                    <span>{issue.address || 'Location not specified'}</span>
                                                </div>
                                                <div className="meta-row">
                                                    <ScheduleIcon fontSize="small" />
                                                    <span>{new Date(issue.timestamp || issue.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="card-status-strip">
                                                <span className="ai-tag"><AIIcon style={{ fontSize: 12 }} /> VERIFIED</span>
                                                <div className="status-with-icon">
                                                    <span className="status-icon-small">
                                                        {getStatusIcon(issue.status)}
                                                    </span>
                                                    <span className={`status-tag status-${issue.status?.toLowerCase().replace(' ', '-')}`}>
                                                        {issue.status?.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="pagination">
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className="pagination-btn"
                                        >
                                            <FirstPageIcon />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="pagination-btn"
                                        >
                                            <ChevronLeftIcon />
                                        </button>

                                        <span className="pagination-info">
                                            Page {currentPage} of {totalPages}
                                        </span>

                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="pagination-btn"
                                        >
                                            <ChevronRightIcon />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="pagination-btn"
                                        >
                                            <LastPageIcon />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
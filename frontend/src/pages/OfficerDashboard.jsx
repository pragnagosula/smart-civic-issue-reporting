import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import IssueMap from '../components/IssueMap';
import '../styles/Dashboard.css'; // Inherit main gov styles
import '../styles/OfficerDashboard.css';

const OfficerDashboard = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list');
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [selectedIssueId, setSelectedIssueId] = useState(null);
    const [resolutionImage, setResolutionImage] = useState(null);
    const [resolving, setResolving] = useState(false);

    const getLocalizedDescription = (issue) => {
        if (!issue.description) return issue.voice_text || 'No description';
        if (typeof issue.description === 'string') return issue.description;
        return issue.description[i18n.language] || issue.description['en'] || issue.voice_text || 'No description';
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    const fetchIssues = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const res = await axios.get(${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/officer/my-department-issues`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIssues(res.data);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (id, newStatus) => {
        if (newStatus === 'Resolved') {
            setSelectedIssueId(id);
            setShowResolveModal(true);
        } else {
            updateStatus(id, newStatus);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setResolutionImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const confirmResolution = () => {
        if (!resolutionImage) {
            alert("Please upload a proof image.");
            return;
        }
        setResolving(true);
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            setResolving(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                updateStatus(selectedIssueId, 'Resolved', {
                    image: resolutionImage,
                    latitude,
                    longitude
                });
                setShowResolveModal(false);
                setResolutionImage(null);
                setSelectedIssueId(null);
                setResolving(false);
            },
            (err) => {
                console.error(err);
                alert("Unable to retrieve your location. Location is mandatory for resolution.");
                setResolving(false);
            }
        );
    };

    const updateStatus = async (id, newStatus, extraData = {}) => {
        try {
            const token = localStorage.getItem('token');
            const payload = { status: newStatus, ...extraData };
            await axios.patch(${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/officer/issue/${id}/status`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchIssues();
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    };

    return (
        <div className="citizen-dashboard">
            {/* Standard Government Header */}
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
                        <h1 className="gov-title">Officer Dashboard</h1>
                        <p className="gov-subtitle">CivicFix Administration • Department Control</p>
                    </div>
                    
                    <div className="gov-header-actions">
                        <button className="btn btn-profile no-print" onClick={() => navigate('/officer/profile')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            My Stats
                        </button>
                        <button className="btn btn-logout no-print" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>
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

            <main className="dashboard-container">
                <section className="dashboard-section">
                    <div className="section-header dashboard-tabs-header">
                        <div>
                            <h2 className="section-title">Assigned & Department Issues</h2>
                            <p className="section-subtitle">Manage and update issue statuses efficiently</p>
                        </div>
                        <div className="view-toggle" style={{ display: 'flex', gap: '0.5rem' }}>
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

                    {loading ? (
                        <div className="loading-state">Loading issues...</div>
                    ) : issues.length === 0 ? (
                        <div className="empty-state">No issues found for your department.</div>
                    ) : viewMode === 'map' ? (
                        <div style={{ marginTop: '20px' }}>
                            <IssueMap issues={issues} height="600px" />
                        </div>
                    ) : (
                        <div className="issues-grid">
                            {issues.map(issue => {
                                const isAssigned = issue.status === 'Assigned';
                                // Safely format coordinates
                                const lat = issue.latitude ? Number(issue.latitude) : null;
                                const lng = issue.longitude ? Number(issue.longitude) : null;
                                const locationStr = lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'N/A';
                                // Safely format AI confidence
                                const aiConfidence = issue.ai_confidence ? (Number(issue.ai_confidence) * 100).toFixed(0) : '0';

                                return (
                                    <div key={issue.id} className={`issue-card ${isAssigned ? 'assigned' : ''}`} onClick={() => navigate(`/issue/${issue.id}`)} style={{ cursor: 'pointer' }}>
                                        <div className="issue-card-header">
                                            <div className="issue-category">
                                                {t('cat_' + (issue.category === 'Street Lighting' ? 'lighting' : issue.category === 'Water Supply' ? 'water' : issue.category.toLowerCase()), { defaultValue: issue.category })}
                                                {isAssigned && <span className="assigned-badge">Assigned to you</span>}
                                            </div>
                                            <div className="issue-id">#{issue.id}</div>
                                        </div>

                                        <div className="issue-description">
                                            {getLocalizedDescription(issue)}
                                        </div>

                                        <div className="issue-meta-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--divider)' }}>
                                            <div className="issue-meta">
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📍 {locationStr}</span>
                                                <span className={`ai-badge ${Number(aiConfidence) > 70 ? 'ai-verified' : 'ai-flagged'}`}>🤖 {aiConfidence}% Match</span>
                                            </div>
                                            <div className="issue-status-container">
                                                <span className={`status-badge status-${issue.status.toLowerCase().replace(' ', '-')}`}>
                                                    {t('status_' + issue.status.toLowerCase().replace(' ', ''), { defaultValue: issue.status })}
                                                </span>
                                                {issue.image && (
                                                    <a href={issue.image} target="_blank" rel="noreferrer" className="evidence-link">📷</a>
                                                )}
                                            </div>
                                        </div>

                                        <div className="issue-actions">
                                            <select
                                                value={issue.status}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                                                className="status-select"
                                            >
                                                <option value="Reported">Reported</option>
                                                <option value="Assigned">Assigned (Self)</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Resolved">Resolved</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Resolution Modal */}
                {showResolveModal && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <h3 className="modal-title">✅ Verify Resolution</h3>
                            <p className="modal-subtitle">To mark this issue as Resolved, you must provide proof.</p>

                            <div className="modal-field">
                                <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.75rem', color: '#1e293b' }}>
                                    1. Upload Resolution Image (Required)
                                </label>
                                <div 
                                    style={{ 
                                        border: '2px dashed #93c5fd', 
                                        borderRadius: '12px', 
                                        padding: '1.5rem', 
                                        textAlign: 'center', 
                                        background: '#eff6ff', 
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }} 
                                    onClick={() => document.getElementById('resolution-upload').click()}
                                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#93c5fd'}
                                >
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px auto', display: 'block' }}>
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21 15 16 10 5 21" />
                                    </svg>
                                    <p style={{ color: '#1e3a8a', fontWeight: '600', margin: '0 0 0.25rem 0' }}>Click to Browse Image</p>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0' }}>JPG, PNG up to 5MB</p>
                                    <input 
                                        id="resolution-upload"
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageUpload} 
                                        style={{ display: 'none' }} 
                                    />
                                </div>
                                {resolutionImage && <img src={resolutionImage} alt="Preview" className="image-preview" style={{ marginTop: '1rem', width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0', objectFit: 'contain', maxHeight: '200px' }} />}
                            </div>

                            <div className="modal-field">
                                <label>2. GPS Location</label>
                                <p className="field-hint">We will automatically capture your current GPS location as proof of visit.</p>
                            </div>

                            <div className="modal-actions">
                                <button onClick={confirmResolution} disabled={resolving} className="btn btn-primary">
                                    {resolving ? 'Verifying...' : 'Submit Resolution'}
                                </button>
                                <button onClick={() => setShowResolveModal(false)} disabled={resolving} className="btn btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default OfficerDashboard;
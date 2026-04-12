import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import IssueMap from '../components/IssueMap';
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
            const res = await axios.get('http://localhost:5000/api/officer/my-department-issues', {
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
            await axios.patch(`http://localhost:5000/api/officer/issue/${id}/status`,
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
        <>
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <h1 className="profile-title">Officer Dashboard</h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-secondary" onClick={() => navigate('/officer/profile')}>
                            My Stats
                        </button>
                    </div>
                </header>

                <section className="issues-section">
                    <div className="section-header">
                        <h2 className="section-title">Assigned & Department Issues</h2>
                        <p className="section-subtitle">Manage and update issue status</p>
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

                    {loading ? (
                        <div className="loading-state">Loading issues...</div>
                    ) : issues.length === 0 ? (
                        <div className="empty-state">No issues found for your department.</div>
                    ) : viewMode === 'map' ? (
                        <div style={{ marginTop: '20px' }}>
                            <IssueMap issues={issues} height="600px" />
                        </div>
                    ) : (
                        <div className="issues-list">
                            {issues.map(issue => {
                                const isAssigned = issue.status === 'Assigned';
                                // Safely format coordinates
                                const lat = issue.latitude ? Number(issue.latitude) : null;
                                const lng = issue.longitude ? Number(issue.longitude) : null;
                                const locationStr = lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'N/A';
                                // Safely format AI confidence
                                const aiConfidence = issue.ai_confidence ? (Number(issue.ai_confidence) * 100).toFixed(0) : '0';

                                return (
                                    <div key={issue.id} className={`issue-card ${isAssigned ? 'assigned' : ''}`}>
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

                                        <div className="issue-meta-row">
                                            <div className="issue-meta">
                                                <span>📍 {locationStr}</span>
                                                <span>🤖 {aiConfidence}%</span>
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
                                <label>1. Upload Resolution Image (Required)</label>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input" />
                                {resolutionImage && <img src={resolutionImage} alt="Preview" className="image-preview" />}
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
            </div>
        </>
    );
};

export default OfficerDashboard;
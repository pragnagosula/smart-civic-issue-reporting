import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar'; // optional, if you want top navbar
import '../styles/IssueDetails.css'; // new dedicated styles

const IssueDetails = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    const getLocalizedDescription = (issue) => {
        if (!issue.description) return issue.voice_text || t('no_description');
        if (typeof issue.description === 'string') return issue.description;
        return issue.description[i18n.language] || issue.description['en'] || issue.voice_text || t('no_description');
    };

    useEffect(() => {
        const fetchIssueDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:5000/api/issues/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIssue(response.data);
            } catch (err) {
                console.error("Error fetching issue details:", err);
                setError("Failed to load issue details.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchIssueDetails();
    }, [id]);

    if (loading) return (
        <>
            <Navbar />
            <div className="issue-loading">Loading details...</div>
        </>
    );
    if (error) return (
        <>
            <Navbar />
            <div className="issue-error">{error}</div>
        </>
    );
    if (!issue) return (
        <>
            <Navbar />
            <div className="issue-error">Issue not found.</div>
        </>
    );

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const dateString = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
        return new Date(dateString).toLocaleString();
    };

    return (
        <>
            <Navbar />
            <div className="issue-detail-container">
                <button className="btn btn-secondary back-btn" onClick={() => navigate('/dashboard')}>
                    ← {t('back_dashboard', { defaultValue: 'Back to Dashboard' })}
                </button>

                <div className="issue-detail-card">
                    <div className="issue-detail-header">
                        <h1 className="issue-detail-title">
                            {t('cat_' + (issue.category === 'Street Lighting' ? 'lighting' : issue.category === 'Water Supply' ? 'water' : issue.category.toLowerCase()), { defaultValue: issue.category })}
                        </h1>
                        <span className={`status-badge status-${(issue.status || 'reported').toLowerCase().replace(' ', '-')}`}>
                            {t('status_' + (issue.status || 'Reported').toLowerCase().replace(' ', ''), { defaultValue: issue.status })}
                        </span>
                    </div>

                    <div className="issue-image-container">
                        <img src={issue.image} alt="Issue Evidence" className="issue-image" />
                    </div>

                    {issue.ai_status && (
                        <div className="ai-analysis-card">
                            <div className="ai-analysis-header">
                                <span className={`ai-badge ai-${issue.ai_status.toLowerCase()}`}>
                                    {issue.ai_status === 'Verified' ? '✅ Verified Issue' : '⚠️ Flagged for Review'}
                                </span>
                                <span className="ai-confidence">Confidence: {issue.ai_confidence ? (issue.ai_confidence * 100).toFixed(1) : 0}%</span>
                            </div>
                            <p className="ai-reason">"{issue.ai_reason}"</p>
                        </div>
                    )}

                    <div className="issue-description-box">
                        <h3 className="info-label">{t('description_voice', { defaultValue: 'DESCRIPTION (Voice Input)' })}</h3>
                        <p className="issue-description-text">{getLocalizedDescription(issue)}</p>
                    </div>

                    <div className="issue-meta-grid">
                        <div className="meta-item">
                            <span className="meta-label">{t('reported_on', { defaultValue: 'REPORTED ON' })}</span>
                            <span className="meta-value">{formatDate(issue.timestamp)}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">{t('location', { defaultValue: 'LOCATION' })}</span>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="location-link"
                            >
                                {Number(issue.latitude).toFixed(6)}, {Number(issue.longitude).toFixed(6)} ↗
                            </a>
                        </div>
                    </div>

                    {/* RESOLUTION PROOF SECTION */}
                    {(issue.status === 'Resolved' || issue.status === 'Closed') && (
                        <div className="resolution-section">
                            <h2 className="resolution-title">✅ Resolution Proof</h2>
                            <div className="resolution-card">
                                <div className="resolution-grid">
                                    <div className="resolution-meta">
                                        <span className="resolution-label">RESOLVED BY</span>
                                        <span className="resolution-value">{issue.officer_name || 'Officer'} ({issue.officer_department || 'Department'})</span>
                                    </div>
                                    <div className="resolution-meta">
                                        <span className="resolution-label">RESOLVED ON</span>
                                        <span className="resolution-value">{formatDate(issue.resolved_at)}</span>
                                    </div>
                                </div>

                                {issue.resolution_image_url && (
                                    <div className="resolution-image-container">
                                        <span className="resolution-label">PROOF OF WORK</span>
                                        <img src={issue.resolution_image_url} alt="Resolution Proof" className="resolution-image" />
                                    </div>
                                )}

                                <div className="resolution-meta">
                                    <span className="resolution-label">OFFICER LOCATION (GPS VERIFIED)</span>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${issue.resolution_lat},${issue.resolution_lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="location-link"
                                    >
                                        View on Map ({Number(issue.resolution_lat).toFixed(6)}, {Number(issue.resolution_lng).toFixed(6)})
                                    </a>
                                </div>

                                {issue.status === 'Resolved' && (
                                    <div className="resolution-verify">
                                        <p className="verify-prompt">Does this proof look correct? Please verify to close the issue.</p>
                                        <button className="btn btn-primary verify-btn" onClick={() => setShowFeedbackModal(true)}>
                                            Share Feedback & Verify
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* FEEDBACK MODAL */}
                {showFeedbackModal && (
                    <FeedbackModal
                        issueId={issue.id}
                        onClose={() => setShowFeedbackModal(false)}
                        onSuccess={() => {
                            setShowFeedbackModal(false);
                            window.location.reload();
                        }}
                    />
                )}
            </div>
        </>
    );
};

// Simple Feedback Modal Component within same file
const FeedbackModal = ({ issueId, onClose, onSuccess }) => {
    const [response, setResponse] = useState('Resolved');
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/feedback/${issueId}`,
                { response, comment, rating },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Feedback submitted!");
            onSuccess();
        } catch (err) {
            console.error(err);
            alert("Failed to submit feedback: " + (err.response?.data?.message || err.message));
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h3 className="modal-title">💬 Verify Resolution</h3>
                <p className="modal-subtitle">Based on the proof provided, is the issue resolved?</p>

                <div className="modal-response-btns">
                    <button
                        onClick={() => setResponse('Resolved')}
                        className={`response-btn ${response === 'Resolved' ? 'active-resolved' : ''}`}
                    >
                        YES, Resolved
                    </button>
                    <button
                        onClick={() => setResponse('Not Resolved')}
                        className={`response-btn ${response === 'Not Resolved' ? 'active-not-resolved' : ''}`}
                    >
                        NO, Reopen It
                    </button>
                </div>

                {response === 'Resolved' && (
                    <div className="rating-section">
                        <label className="rating-label">Efficiency Rating</label>
                        <div className="star-rating">
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`star ${star <= rating ? 'star-filled' : ''}`}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="comment-section">
                    <label className="comment-label">Comment (Optional)</label>
                    <textarea
                        rows="3"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Any additional details..."
                        className="comment-input"
                    />
                </div>

                <div className="modal-actions">
                    <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary submit-btn">
                        {submitting ? 'Submitting...' : 'Submit Choice'}
                    </button>
                    <button onClick={onClose} disabled={submitting} className="btn btn-secondary cancel-btn">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IssueDetails;
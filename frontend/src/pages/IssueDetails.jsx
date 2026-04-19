import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import QuestionAnswerRoundedIcon from '@mui/icons-material/QuestionAnswerRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import '../styles/Dashboard.css'; // Inherit gov styles
import '../styles/IssueDetails.css';

const IssueDetails = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [likes, setLikes] = useState(0);
    const [userLiked, setUserLiked] = useState(false);
    const [currentUser, setCurrentUser] = useState({ role: '', id: '' });
    const [actionLoading, setActionLoading] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);

    const canComment = ['citizen', 'officer'].includes(currentUser.role);
    const canDeleteComments = currentUser.role === 'admin';

    const decodeToken = () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setCurrentUser(decoded);
            } catch (err) {
                console.error('Token decode failed', err);
            }
        }
    };

    const fetchIssueDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const issueData = response.data;
            setIssue(issueData);
            setComments(issueData.comments || []);
            setLikes(issueData.likes || 0);
            setUserLiked(issueData.user_liked || false);
        } catch (err) {
            console.error('Error fetching issue details:', err);
            setError('Failed to load issue details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        decodeToken();
        if (id) fetchIssueDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleCommentSubmit = async () => {
        if (!commentText.trim()) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/${id}/comment`,
                { comment: commentText.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCommentText('');
            await fetchIssueDetails();
        } catch (err) {
            console.error('Failed to submit comment:', err);
            alert('Unable to post comment.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleLike = async () => {
        setLikeLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/${id}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.liked) {
                setLikes(prev => prev + 1);
                setUserLiked(true);
            } else {
                setLikes(prev => Math.max(0, prev - 1));
                setUserLiked(false);
            }
        } catch (err) {
            console.error('Unable to toggle like:', err);
            alert('Could not update like.');
        } finally {
            setLikeLoading(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Remove this comment?')) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/${id}/comment/${commentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchIssueDetails();
        } catch (err) {
            console.error('Error deleting comment:', err);
            alert('Could not remove comment.');
        } finally {
            setActionLoading(false);
        }
    };

    const getLocalizedDescription = (issue) => {
        if (!issue.description) return issue.voice_text || t('no_description');
        if (typeof issue.description === 'string') return issue.description;
        return issue.description[i18n.language] || issue.description['en'] || issue.voice_text || t('no_description');
    };

    useEffect(() => {
        const fetchIssueDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/${id}`, {
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
            <div className="issue-loading-state">
                <div className="loading-spinner"></div>
                <p>Loading issue details...</p>
            </div>
        </>
    );
    if (error) return (
        <>
            <Navbar />
            <div className="issue-error-state">
                <div className="error-icon">
                    <WarningAmberRoundedIcon />
                </div>
                <p>{error}</p>
            </div>
        </>
    );
    if (!issue) return (
        <>
            <Navbar />
            <div className="issue-error-state">
                <div className="error-icon">
                    <WarningAmberRoundedIcon />
                </div>
                <p>Issue not found.</p>
            </div>
        </>
    );

    const getDashboardPath = () => {
        if (currentUser.role === 'officer') return '/officer/dashboard';
        if (currentUser.role === 'admin') return '/admin/dashboard';
        return '/dashboard';
    };

    const getRoleTitle = () => {
        if (currentUser.role === 'officer') return 'Officer Command Center';
        if (currentUser.role === 'admin') return 'Administration Portal';
        return t('civicfix_portal') || 'CivicFix System';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const dateString = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="issue-detail-page">
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
                        <h1 className="gov-title">{getRoleTitle()}</h1>
                        <p className="gov-subtitle">Issue Investigation & Resolution Tracking</p>
                    </div>
                    <div className="gov-header-actions">
                        <button className="btn-back" onClick={() => navigate(getDashboardPath())}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                    </div>
                </div>
            </header>

            <main className="issue-detail-main">
                <div className="issue-detail-container">
                    <div className="issue-detail-header">
                        <div className="header-left">
                            <h1 className="issue-title">
                                Issue #{issue.id}
                            </h1>
                            <p className="issue-category-badge">
                                {t('cat_' + (issue.category === 'Street Lighting' ? 'lighting' : issue.category === 'Water Supply' ? 'water' : issue.category.toLowerCase()), { defaultValue: issue.category })}
                            </p>
                        </div>
                        <span className={`status-badge-large status-${(issue.status || 'reported').toLowerCase().replace(' ', '-')}`}>
                            {t('status_' + (issue.status || 'Reported').toLowerCase().replace(' ', ''), { defaultValue: issue.status })}
                        </span>
                    </div>

                    <div className="issue-image-showcase">
                        {issue.image && <img src={issue.image} alt="Issue Evidence" className="issue-image" />}
                    </div>

                    {issue.ai_status && (
                        <div className={`ai-analysis-section ai-status-${issue.ai_status.toLowerCase()}`}>
                            <div className="ai-header">
                                <div className="ai-badge-wrapper">
                                    {issue.ai_status === 'Verified' ? (
                                        <>
                                            <CheckCircleRoundedIcon className="ai-icon verified" />
                                            <div>
                                                <div className="ai-status">✓ Verified Issue</div>
                                                <div className="ai-confidence">Confidence: {issue.ai_confidence ? (issue.ai_confidence * 100).toFixed(1) : 0}%</div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <WarningAmberRoundedIcon className="ai-icon flagged" />
                                            <div>
                                                <div className="ai-status">⚠ Flagged for Review</div>
                                                <div className="ai-confidence">Confidence: {issue.ai_confidence ? (issue.ai_confidence * 100).toFixed(1) : 0}%</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            {issue.ai_reason && (
                                <div className="ai-reason-box">
                                    <p className="ai-reason-label">AI Analysis</p>
                                    <p className="ai-reason-text">"{issue.ai_reason}"</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="issue-description-section">
                        <h2 className="section-title">Issue Description</h2>
                        <div className="description-content">
                            <p>{getLocalizedDescription(issue)}</p>
                        </div>
                    </div>

                    <div className="issue-meta-section">
                        <div className="meta-grid">
                            <div className="meta-card">
                                <div className="meta-icon"><EventRoundedIcon /></div>
                                <div className="meta-content">
                                    <div className="meta-label">{t('reported_on', { defaultValue: 'Reported On' })}</div>
                                    <div className="meta-value">{formatDate(issue.timestamp)}</div>
                                </div>
                            </div>
                            <div className="meta-card">
                                <div className="meta-icon"><LocationOnRoundedIcon /></div>
                                <div className="meta-content">
                                    <div className="meta-label">{t('location', { defaultValue: 'Location' })}</div>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="location-link"
                                    >
                                        View on Map ↗
                                    </a>
                                    <div className="coordinates">{Number(issue.latitude).toFixed(4)}, {Number(issue.longitude).toFixed(4)}</div>
                                </div>
                            </div>
                            <div className="meta-card">
                                <div className="meta-icon"><LocalOfferRoundedIcon /></div>
                                <div className="meta-content">
                                    <div className="meta-label">Category</div>
                                    <div className="meta-value">{issue.category}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="issue-activity-card">
                        <div className="activity-header">
                            <div>
                                <span className="activity-title">Likes & Comments</span>
                                <span className="activity-subtitle">Track community responses for this issue</span>
                            </div>
                                <button
                                    type="button"
                                    className={`like-button ${userLiked ? 'liked' : ''}`}
                                    onClick={handleToggleLike}
                                    disabled={likeLoading || !canComment}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    {userLiked ? <FavoriteRoundedIcon fontSize="small" /> : <FavoriteBorderRoundedIcon fontSize="small" />} ({likes})
                                </button>
                        </div>

                        {canComment && (
                            <div className="comment-action-panel">
                                <textarea
                                    className="comment-input"
                                    rows="4"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Share your thoughts or update about this issue..."
                                />
                                <button
                                    type="button"
                                    className="btn btn-primary submit-comment-btn"
                                    onClick={handleCommentSubmit}
                                    disabled={actionLoading || !commentText.trim()}
                                >
                                    {actionLoading ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        )}

                        <div className="comments-section">
                            <h3 className="comments-heading">Comments</h3>
                            {comments.length === 0 ? (
                                <p className="empty-comments">No comments yet. Be the first to respond.</p>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="comment-card">
                                        <div className="comment-top-row">
                                            <div>
                                                <span className="comment-author">{comment.name || 'User'}</span>
                                                <span className="comment-role">{comment.role}</span>
                                            </div>
                                            <span className="comment-date">{formatDate(comment.created_at)}</span>
                                        </div>
                                        <p className="comment-text">{comment.comment}</p>
                                        {canDeleteComments && (
                                            <button
                                                type="button"
                                                className="btn btn-danger delete-comment-btn"
                                                onClick={() => handleDeleteComment(comment.id)}
                                                disabled={actionLoading}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RESOLUTION PROOF SECTION */}
                    {(issue.status === 'Resolved' || issue.status === 'Closed') && (
                        <div className="resolution-section">
                            <h2 className="resolution-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <CheckCircleRoundedIcon style={{ color: 'var(--success-color)' }} /> Resolution Proof
                            </h2>
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
            </main>
        </div>
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
            await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/feedback/${issueId}`,
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
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                    <QuestionAnswerRoundedIcon color="primary" /> Verify Resolution
                </h3>
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
                                    <StarRoundedIcon fontSize="inherit" />
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
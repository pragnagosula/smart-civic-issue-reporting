import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css'; // Reusing dashboard styles for consistency

import { useTranslation } from 'react-i18next';

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

    if (loading) return <div className="container text-center"><p>Loading details...</p></div>;
    if (error) return <div className="container text-center"><p style={{ color: 'red' }}>{error}</p></div>;
    if (!issue) return <div className="container text-center"><p>Issue not found.</p></div>;

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const dateString = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <button className="btn btn-secondary mb-4" onClick={() => navigate('/dashboard')}>
                &larr; {t('back_dashboard', { defaultValue: 'Back to Dashboard' })}
            </button>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1>{t('cat_' + (issue.category === 'Street Lighting' ? 'lighting' : issue.category === 'Water Supply' ? 'water' : issue.category.toLowerCase()), { defaultValue: issue.category })}</h1>
                    <span className={`status-badge status-${(issue.status || 'reported').toLowerCase().replace(' ', '-')}`}
                        style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                        {t('status_' + (issue.status || 'Reported').toLowerCase().replace(' ', ''), { defaultValue: issue.status })}
                    </span>
                </div>

                <div className="mb-4">
                    <img
                        src={issue.image}
                        alt="Issue Evidence"
                        style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
                    />
                </div>

                {issue.ai_status && (
                    <div className="mb-4">
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>AI ANALYSIS</h3>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 'bold', marginRight: '1rem', color: issue.ai_status === 'Verified' ? '#4ade80' : '#f87171' }}>
                                    {issue.ai_status === 'Verified' ? '✅ Verified Issue' : '⚠️ Flagged for Review'}
                                </span>
                                <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Confidence: {issue.ai_confidence ? (issue.ai_confidence * 100).toFixed(1) : 0}%</span>
                            </div>
                            <p style={{ margin: 0, fontStyle: 'italic', color: '#e2e8f0' }}>"{issue.ai_reason}"</p>
                        </div>
                    </div>
                )}

                <div className="mb-4">
                    <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t('description_voice', { defaultValue: 'DESCRIPTION (Voice Input)' })}</h3>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', fontSize: '1.1rem' }}>
                        {getLocalizedDescription(issue)}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{t('reported_on', { defaultValue: 'REPORTED ON' })}</h3>
                        <p>{formatDate(issue.timestamp)}</p>
                    </div>
                    <div>
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{t('location', { defaultValue: 'LOCATION' })}</h3>
                        <p>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link"
                            >
                                {Number(issue.latitude).toFixed(6)}, {Number(issue.longitude).toFixed(6)} ↗
                            </a>
                        </p>
                    </div>
                </div>

                {/* RESOLUTION PROOF SECTION */}
                {(issue.status === 'Resolved' || issue.status === 'Closed') && (
                    <div style={{ marginTop: '2rem', borderTop: '1px solid #334155', paddingTop: '2rem' }}>
                        <h2 style={{ color: '#4ade80', marginBottom: '1rem' }}>✅ Resolution Proof</h2>

                        <div style={{ background: 'rgba(22, 101, 52, 0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #166534' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>RESOLVED BY</h4>
                                    <p style={{ fontWeight: 'bold', color: 'white' }}>{issue.officer_name || 'Officer'} ({issue.officer_department || 'Department'})</p>
                                </div>
                                <div>
                                    <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>RESOLVED ON</h4>
                                    <p style={{ color: 'white' }}>{formatDate(issue.resolved_at)}</p>
                                </div>
                            </div>

                            {issue.resolution_image_url && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '0.5rem' }}>PROOF OF WORK</h4>
                                    <img
                                        src={issue.resolution_image_url}
                                        alt="Resolution Proof"
                                        style={{ width: '100%', borderRadius: '8px', border: '2px solid #22c55e' }}
                                    />
                                </div>
                            )}

                            <div>
                                <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>OFFICER LOCATION (GPS VERIFIED)</h4>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${issue.resolution_lat},${issue.resolution_lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#4ade80', textDecoration: 'underline' }}
                                >
                                    View on Map ({Number(issue.resolution_lat).toFixed(6)}, {Number(issue.resolution_lng).toFixed(6)})
                                </a>
                            </div>

                            {issue.status === 'Resolved' && (
                                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                                    <p style={{ marginBottom: '1rem', color: '#e2e8f0' }}>Does this proof look correct? Please verify to close the issue.</p>
                                    <button
                                        className="btn btn-primary"
                                        style={{ background: '#22c55e', border: 'none', padding: '12px 24px', fontSize: '1.1rem' }}
                                        onClick={() => setShowFeedbackModal(true)}
                                    >
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
                        window.location.reload(); // Refresh to see status update
                    }}
                />
            )}
        </div>
    );
};

// Simple Feedback Modal Component within same file for simplicity
const FeedbackModal = ({ issueId, onClose, onSuccess }) => {
    const [response, setResponse] = useState('Resolved');
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(5); // Default 5 stars
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
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                background: '#1e293b', padding: '2rem', borderRadius: '10px', width: '400px', color: 'white', border: '1px solid #475569'
            }}>
                <h3>💬 Verify Resolution</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Based on the proof provided, is the issue resolved?
                </p>

                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <button
                            onClick={() => setResponse('Resolved')}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #22c55e',
                                background: response === 'Resolved' ? '#22c55e' : 'transparent',
                                color: response === 'Resolved' ? 'white' : '#22c55e',
                                fontWeight: 'bold'
                            }}
                        >
                            YES, Resolved
                        </button>
                        <button
                            onClick={() => setResponse('Not Resolved')}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ef4444',
                                background: response === 'Not Resolved' ? '#ef4444' : 'transparent',
                                color: response === 'Not Resolved' ? 'white' : '#ef4444',
                                fontWeight: 'bold'
                            }}
                        >
                            NO, Reopen It
                        </button>
                    </div>

                    {/* Star Rating Section */}
                    {response === 'Resolved' && (
                        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>Efficiency Rating</label>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span
                                        key={star}
                                        onClick={() => setRating(star)}
                                        style={{
                                            fontSize: '1.5rem',
                                            cursor: 'pointer',
                                            color: star <= rating ? '#fbbf24' : '#475569',
                                            transition: 'color 0.2s'
                                        }}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Comment (Optional)</label>
                    <textarea
                        rows="3"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Any additional details..."
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '5px', background: '#0f172a', color: 'white', border: '1px solid #334155' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{ flex: 1, padding: '10px', background: '#3b82f6', border: 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        {submitting ? 'Submitting...' : 'Submit Choice'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #94a3b8', borderRadius: '5px', color: '#94a3b8', cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IssueDetails;

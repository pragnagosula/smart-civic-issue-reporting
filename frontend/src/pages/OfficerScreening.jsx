import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AuthStyles.css'; // reuse auth styles

const OfficerScreening = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const officer = state?.officer;

    const [screeningStatus, setScreeningStatus] = useState('PENDING');
    const [aiResult, setAiResult] = useState(null);

    useEffect(() => {
        if (!officer) {
            navigate('/officer/register');
            return;
        }

        if (officer.account_status === 'AI_PENDING') {
            setTimeout(() => {
                setScreeningStatus('COMPLETE');
                setAiResult({
                    score: officer.ai_score,
                    result: officer.ai_result,
                    reason: officer.ai_reason
                });
            }, 3000);
        } else {
            setScreeningStatus('COMPLETE');
            setAiResult({
                score: officer.ai_score,
                result: officer.ai_result,
                reason: officer.ai_reason
            });
        }
    }, [officer, navigate]);

    if (!officer) return null;

    return (
        <div className="auth-container">
            <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
                <div className="auth-header">
                    <h2>Officer Screening</h2>
                </div>
                <div className="auth-body">
                    {screeningStatus === 'PENDING' ? (
                        <div className="loading-state">
                            <div className="spinner" style={{ margin: '2rem auto', width: '40px', height: '40px' }}></div>
                            <p>AI Screening in Progress...</p>
                            <p className="section-subtitle">Analyzing document relevance for <strong>{officer.department}</strong> department.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                                {aiResult?.result === 'RELEVANT' ? '✅' : '⚠️'}
                            </div>
                            <h3 className="section-title">Screening Complete</h3>

                            <div className="info-card" style={{ background: 'rgba(0,0,0,0.03)', padding: '1.5rem', borderRadius: '12px', margin: '2rem 0', textAlign: 'left' }}>
                                <p><strong>Status:</strong> <span style={{ color: aiResult?.result === 'RELEVANT' ? '#2e7d32' : '#c62828' }}>{aiResult?.result}</span></p>
                                <p><strong>Relevance Score:</strong> {(aiResult?.score * 100).toFixed(1)}%</p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    <strong>AI Reason:</strong> "{aiResult?.reason}"
                                </p>
                            </div>

                            {aiResult?.result === 'RELEVANT' ? (
                                <div className="success-message" style={{ padding: '1rem' }}>
                                    <strong>Setup Successful!</strong><br />
                                    Your account is now <strong>PENDING ADMIN APPROVAL</strong>. You will be notified via email once authorized.
                                </div>
                            ) : (
                                <div className="error-message" style={{ padding: '1rem' }}>
                                    <strong>Verification Flagged</strong><br />
                                    Your document content does not sufficiently match your selected department. An admin will review your case manually.
                                </div>
                            )}

                            <button className="btn btn-secondary" style={{ marginTop: '2rem', width: '100%' }} onClick={() => navigate('/')}>
                                Return to Home
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OfficerScreening;
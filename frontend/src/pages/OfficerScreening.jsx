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
            <div className="card otp-wrapper-card" style={{ padding: '3rem 2rem', margin: '0 auto' }}>
                <div className="auth-header" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '2.2rem' }}>Officer Screening</h2>
                    <p>AI Verification Process</p>
                </div>
                <div className="auth-body">
                    {screeningStatus === 'PENDING' ? (
                        <div className="loading-state" style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <div className="loader" style={{ margin: '0 auto 1.5rem auto', width: '40px', height: '40px', border: '3px solid rgba(30, 58, 138, 0.2)', borderTopColor: '#1e3a8a' }}></div>
                            <p style={{ fontWeight: '600', color: '#1e293b', fontSize: '1.1rem' }}>AI Screening in Progress...</p>
                            <p className="section-subtitle" style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>Analyzing document relevance for <strong>{officer.department}</strong> department.</p>
                        </div>
                    ) : (
                        <div style={{ animation: 'fadeIn 0.5s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                {aiResult?.result === 'RELEVANT' ? (
                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ background: '#ecfdf5', padding: '12px', borderRadius: '50%' }}>
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                ) : (
                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ background: '#fef2f2', padding: '12px', borderRadius: '50%' }}>
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                    </svg>
                                )}
                            </div>
                            <h3 style={{ fontSize: '1.5rem', color: '#1e293b', marginBottom: '1.5rem', textAlign: 'center' }}>Screening Complete</h3>

                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'left' }}>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
                                    <strong style={{ color: '#64748b' }}>Status:</strong>{' '}
                                    <span style={{ color: aiResult?.result === 'RELEVANT' ? '#047857' : '#b91c1c', fontWeight: '700' }}>{aiResult?.result}</span>
                                </p>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
                                    <strong style={{ color: '#64748b' }}>Relevance Score:</strong>{' '}
                                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{(aiResult?.score * 100).toFixed(1)}%</span>
                                </p>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                                    <strong style={{ color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>AI Analysis:</strong> 
                                    "{aiResult?.reason}"
                                </p>
                            </div>

                            {aiResult?.result === 'RELEVANT' ? (
                                <div className="success-message" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                        Verification Authorized
                                    </div>
                                    <span style={{ color: '#065f46', lineHeight: 1.4 }}>
                                        Your account is now <strong>PENDING ADMIN APPROVAL</strong>. You will be notified via email once authorized.
                                    </span>
                                </div>
                            ) : (
                                <div className="error-message" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                        Verification Flagged
                                    </div>
                                    <span style={{ color: '#991b1b', lineHeight: 1.4 }}>
                                        Your document content does not sufficiently match your selected department. An admin will review your case manually.
                                    </span>
                                </div>
                            )}

                            <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/')}>
                                Return to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OfficerScreening;
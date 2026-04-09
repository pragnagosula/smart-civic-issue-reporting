import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/AuthStyles.css';

const SelectRole = () => {
    const navigate = useNavigate();

    return (
        <div className="auth-container">
            <div className="card" style={{ maxWidth: '850px', margin: '0 auto', overflow: 'visible', borderRadius: '24px' }}>
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                    <div style={{ marginBottom: '3rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', borderRadius: '16px', marginBottom: '1.5rem', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.1)' }}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '32px', height: '32px', color: '#1E40AF' }}>
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>Choose Your Role</h2>
                        <p style={{ color: '#6B7280', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>Select an account type to get started with CivicFix and begin improving your neighborhood.</p>
                    </div>

                    <div className="form-row" style={{ gap: '2rem', marginBottom: '3rem' }}>
                        {/* Citizen Card */}
                        <div 
                            className="role-selection-card" 
                            onClick={() => navigate('/citizen-signup')}
                            style={{ 
                                padding: '3rem 2rem',
                                border: '2px solid #E5E7EB',
                                borderRadius: '20px',
                                background: '#FFFFFF',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '80px', height: '80px', margin: '0 auto 1.5rem', background: '#F3F4F6', borderRadius: '50%', fontSize: '2.5rem' }}>
                                🧑‍🤝‍🧑
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1E40AF', marginBottom: '0.75rem', fontFamily: 'Outfit, sans-serif' }}>Citizen</h3>
                            <p style={{ color: '#4B5563', fontSize: '0.95rem', lineHeight: '1.6', margin: '0' }}>Register as a resident to report issues, track resolutions, and engage with community updates.</p>
                        </div>

                        {/* Officer Card */}
                        <div 
                            className="role-selection-card" 
                            onClick={() => navigate('/officer/register')}
                            style={{ 
                                padding: '3rem 2rem',
                                border: '2px solid #E5E7EB',
                                borderRadius: '20px',
                                background: '#FFFFFF',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '80px', height: '80px', margin: '0 auto 1.5rem', background: '#F3F4F6', borderRadius: '50%', fontSize: '2.5rem' }}>
                                👮‍♀️
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1E40AF', marginBottom: '0.75rem', fontFamily: 'Outfit, sans-serif' }}>Officer</h3>
                            <p style={{ color: '#4B5563', fontSize: '0.95rem', lineHeight: '1.6', margin: '0' }}>Register as a government official to manage tasks, review verification, and coordinate infrastructure fixes.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#6B7280', fontSize: '0.95rem' }}>
                        Already have an account? 
                        <Link to="/login" style={{ color: '#3B82F6', fontWeight: '700', textDecoration: 'none' }}>
                            Log in here →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectRole;
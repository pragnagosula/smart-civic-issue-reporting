import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/AuthStyles.css';

const SelectRole = () => {
    const navigate = useNavigate();

    return (
        <div className="auth-container">
            <div className="card" style={{ maxWidth: '850px', margin: '0 auto', overflow: 'visible', borderRadius: '24px', padding: '4rem 3rem', background: '#FFFFFF', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', borderRadius: '18px', marginBottom: '1.5rem', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)' }}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '32px', height: '32px', color: '#FFFFFF' }}>
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif', margin: '0 0 0.8rem 0', letterSpacing: '-0.02em' }}>Choose Your Role</h2>
                    <p style={{ color: '#6B7280', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>Select an account type to get started with CivicFix and begin improving your neighborhood.</p>
                </div>

                <div className="form-row" style={{ gap: '2rem', marginBottom: '3.5rem' }}>
                    {/* Citizen Card */}
                    <div 
                        className="role-selection-card" 
                        onClick={() => navigate('/citizen-signup')}
                    >
                        <div className="role-icon-container" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', color: '#3B82F6' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <h3>Citizen</h3>
                        <p>Register as a resident to report issues, track resolutions, and engage with community updates.</p>
                    </div>

                    {/* Officer Card */}
                    <div 
                        className="role-selection-card" 
                        onClick={() => navigate('/officer/register')}
                    >
                        <div className="role-icon-container" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', color: '#10B981' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="M12 8v4" />
                                <path d="M12 16h.01" />
                            </svg>
                        </div>
                        <h3>Officer</h3>
                        <p>Register as a government official to manage tasks, review verification, and coordinate infrastructure fixes.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', color: '#6B7280', fontSize: '1rem' }}>
                    Already have an account? 
                    <Link to="/login" style={{ color: '#1E40AF', fontWeight: '700', textDecoration: 'none', padding: '0.5rem 1rem', background: '#F3F4F6', borderRadius: '50px', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#E5E7EB'} onMouseOut={(e) => e.currentTarget.style.background = '#F3F4F6'}>
                        Log in here 
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SelectRole;
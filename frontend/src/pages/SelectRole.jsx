import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/AuthStyles.css';

const SelectRole = () => {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState('citizen');

    const roleOptions = [
        {
            key: 'citizen',
            title: 'Citizen',
            description: 'Register as a resident to report issues, track resolutions, and engage with community updates.',
            accent: '#3B82F6',
            accentBg: 'rgba(59, 130, 246, 0.12)',
            chips: ['Report issues', 'Track progress', 'Community feed']
        },
        {
            key: 'officer',
            title: 'Officer',
            description: 'Register as a government official to manage tasks, review verification, and coordinate infrastructure fixes.',
            accent: '#10B981',
            accentBg: 'rgba(16, 185, 129, 0.12)',
            chips: ['Manage tasks', 'Verify reports', 'Coordinate fixes']
        }
    ];

    return (
        <div className="auth-container">
            <div className="card" style={{ width: '100%', maxWidth: '820px', margin: '0 auto', borderRadius: '24px', padding: '2rem 2.5rem', background: '#FFFFFF', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', borderRadius: '16px', marginBottom: '1rem', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)' }}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '28px', height: '28px', color: '#FFFFFF' }}>
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', fontFamily: 'Outfit, sans-serif', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>Choose Your Role</h2>
                    <p style={{ color: '#6B7280', fontSize: '1rem', maxWidth: '480px', margin: '0 auto', lineHeight: '1.4' }}>Select an account type to get started with CivicFix and begin improving your neighborhood.</p>
                </div>

                <div className="role-selection-grid">
                    {roleOptions.map((role) => {
                        const isSelected = selectedRole === role.key;
                        return (
                            <div
                                key={role.key}
                                className={`role-selection-card ${isSelected ? 'selected' : ''} ${role.key}`}
                                onClick={() => setSelectedRole(role.key)}
                            >
                                <div className="role-icon-container" style={{ background: role.accentBg, color: role.accent }}>
                                    {role.key === 'citizen' ? (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '30px', height: '30px' }}>
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '30px', height: '30px' }}>
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                            <path d="M12 8v4" />
                                            <path d="M12 16h.01" />
                                        </svg>
                                    )}
                                </div>
                                <h3 className="role-title">{role.title}</h3>
                                <p className="role-desc">{role.description}</p>
                                <div className="role-chips">
                                    {role.chips.map((chip) => (
                                        <span key={chip} className={`role-chip ${role.key === 'officer' ? 'officer' : ''}`}>{chip}</span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="selection-cta">
                    <button
                        className={`btn btn-primary ${selectedRole}-btn`}
                        onClick={() => navigate(selectedRole === 'officer' ? '/officer/register' : '/citizen-signup')}
                    >
                        Continue as {selectedRole === 'officer' ? 'Officer' : 'Citizen'}
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', color: '#6B7280', fontSize: '0.95rem', marginTop: '1.2rem' }}>
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
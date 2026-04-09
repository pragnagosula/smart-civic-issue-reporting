import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { useTranslation } from 'react-i18next'; // Comment out if not needed
import { useNavigate, Link, useLocation } from 'react-router-dom';
import '../styles/AuthStyles.css';

const ADMIN_EMAIL = "sneha.amballa0804@gmail.com";

const Login = () => {
    // const { t } = useTranslation(); // Comment out if not used
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            // Clear the message from location state
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const isAdmin = email === ADMIN_EMAIL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            if (isAdmin) {
                const res = await axios.post('http://localhost:5000/api/auth/admin-login', {
                    email,
                    password
                });

                const { token, user } = res.data;
                localStorage.setItem('token', token);
                if (user.preferred_language) {
                    localStorage.setItem('language', user.preferred_language);
                }
                navigate('/admin/dashboard');
            } else {
                await axios.post('http://localhost:5000/api/auth/login', { email });
                navigate('/verify-otp', { state: { email, isSignup: false } });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="card split-card">
                <div className="auth-branding">
                    <div className="branding-content">
                        <div className="branding-logo">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <h2>CIVICFIX</h2>
                        </div>
                        <p>Streamlining urban governance with AI-powered reporting and transparent civic management.</p>
                        <Link to="/" className="branding-btn">Back to Home</Link>
                    </div>
                </div>
                
                <div className="auth-form-wrapper">
                    <div className="auth-header">
                        <h2>{isAdmin ? 'Admin Access' : 'Log in'}</h2>
                        <p>{isAdmin ? 'Secure admin portal' : 'Welcome back! Please enter your details.'}</p>
                    </div>
                
                <div className="auth-body">
                    {successMessage && (
                        <div className="success-message">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            {successMessage}
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                autoComplete="email"
                            />
                            {isAdmin && (
                                <span className="badge badge-primary" style={{ position: 'absolute', right: '1rem', top: '2.5rem' }}>
                                    Admin
                                </span>
                            )}
                        </div>

                        {isAdmin && (
                            <div className="input-group">
                                <label>Admin Secret Code</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter admin secret"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ width: '100%' }} 
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loader"></span>
                                    Processing...
                                </>
                            ) : (
                                isAdmin ? 'Access Admin Panel' : 'Continue with Email'
                            )}
                        </button>
                    </form>

                    {!isAdmin && (
                        <>
                            <div className="divider">New to our platform?</div>
                            
                            <div className="footer-links">
                                <Link to="/signup" className="btn btn-outline" style={{ textDecoration: 'none' }}>
                                    Create an Account
                                </Link>
                            </div>
                        </>
                    )}

                    {isAdmin && (
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <button
                                onClick={() => setEmail('')}
                                className="link"
                                style={{ fontSize: '0.875rem' }}
                            >
                                ← Back to user login
                            </button>
                        </div>
                    )}
                </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
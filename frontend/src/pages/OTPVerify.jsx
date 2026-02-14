import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n'; // Import i18n instance
import { useLocation, useNavigate } from 'react-router-dom';

const OTPVerify = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { email, isSignup } = location.state || {}; // Expect email passed from previous page

    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(300); // 5 minutes in seconds

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (!email) {
        navigate('/login');
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const endpoint = isSignup
            ? 'http://localhost:5000/api/auth/verify-otp'
            : 'http://localhost:5000/api/auth/login-verify';

        try {
            const response = await axios.post(endpoint, { email, otp });

            if (isSignup) {
                // Just verification, now go to login
                alert(t('signup_verified', { defaultValue: 'Account verified! Please login.' }));
                navigate('/login');
            } else {
                // Login success, store token
                const { token, user } = response.data;
                localStorage.setItem('token', token);
                if (user.preferred_language) {
                    localStorage.setItem('language', user.preferred_language);
                    i18n.changeLanguage(user.preferred_language);
                }
                if (user.role === "admin") {
                    navigate("/admin/dashboard");
                } else if (user.role === "officer") {
                    navigate("/officer/dashboard");
                } else {
                    navigate("/dashboard"); // Citizen dashboard
                }
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            setLoading(true);
            await axios.post('http://localhost:5000/api/auth/send-otp', { email });
            setTimer(300); // Reset timer
            alert(t('otp_sent'));
        } catch (err) {
            alert('Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="card auth-card">
                <h2 className="text-center mb-4">{isSignup ? t('verify_otp') : t('login')}</h2>
                <p className="text-center" style={{ color: '#94a3b8' }}>
                    {t('otp_sent')} <span style={{ color: 'white', fontWeight: 'bold' }}>{email}</span>
                </p>

                {error && <div className="text-center" style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="text"
                            name="otp"
                            className="input-field text-center"
                            placeholder={t('otp_placeholder') || 'Enter 6-digit OTP'}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                            maxLength="6"
                            required
                            style={{ letterSpacing: '0.5rem', fontSize: '1.5rem', marginTop: '1rem' }}
                        />
                    </div>

                    <div className="text-center mb-4" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                        {timer > 0 ? (
                            <span>Time remaining: {formatTime(timer)}</span>
                        ) : (
                            <span style={{ color: 'var(--error-color)' }}>OTP Expired</span>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Verifying...' : t('verify_otp')}
                    </button>
                </form>

                <p className="text-center mt-4">
                    <button
                        className="link"
                        onClick={handleResend}
                        disabled={timer > 0 || loading}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: (timer > 0 || loading) ? 'not-allowed' : 'pointer',
                            opacity: (timer > 0 || loading) ? 0.5 : 1,
                            color: 'var(--primary-color)'
                        }}
                    >
                        Resend OTP
                    </button>
                </p>
            </div>
        </div>
    );
};

export default OTPVerify;

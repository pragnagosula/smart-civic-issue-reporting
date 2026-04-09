import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useLocation, useNavigate, Link } from 'react-router-dom'; // Added Link import
import '../styles/AuthStyles.css';

const OTPVerify = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { email, isSignup } = location.state || {};
    
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(300);
    const inputRefs = useRef([]);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleChange = (index, value) => {
        if (value.length > 1) {
            value = value.charAt(0);
        }
        
        const newOtp = [...otp];
        newOtp[index] = value.replace(/[^0-9]/g, '');
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    if (!email) {
        navigate('/login');
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError(t('otp_incomplete') || 'Please enter complete 6-digit OTP');
            setLoading(false);
            return;
        }

        const endpoint = isSignup
            ? 'http://localhost:5000/api/auth/verify-otp'
            : 'http://localhost:5000/api/auth/login-verify';

        try {
            const response = await axios.post(endpoint, { email, otp: otpString });

            if (isSignup) {
                navigate('/login', { 
                    state: { 
                        message: t('account_verified') || 'Account verified successfully! Please login with your email.' 
                    } 
                });
            } else {
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
                    navigate("/dashboard");
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || t('invalid_otp') || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            setLoading(true);
            await axios.post('http://localhost:5000/api/auth/send-otp', { email });
            setTimer(300);
            setOtp(['', '', '', '', '', '']);
            setError('');
            if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
            }
        } catch (err) {
            setError(t('resend_failed') || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            
            // Focus last input after paste
            if (inputRefs.current[5]) {
                inputRefs.current[5].focus();
            }
        }
    };

    return (
        <div className="auth-container" style={{
            background: 'radial-gradient(circle at 50% 50%, #eff6ff 0%, #f3f4f6 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background elements for aesthetic */}
            <div style={{
                position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                filter: 'blur(40px)'
            }} />
            <div style={{
                position: 'absolute', bottom: '-10%', right: '-5%', width: '300px', height: '300px',
                background: 'radial-gradient(circle, rgba(30, 64, 175, 0.1) 0%, transparent 70%)',
                filter: 'blur(30px)'
            }} />
            
            <div className="card otp-wrapper-card">
                <div className="auth-header">
                    <h2>{isSignup ? t('verify_email') || 'Verify Email' : t('login')}</h2>
                    <p>{t('enter_verification_code') || 'Enter the verification code'}</p>
                </div>
                
                <div className="auth-body">
                    <p style={{ 
                        textAlign: 'center', 
                        marginBottom: '2rem',
                        color: 'var(--text-secondary)'
                    }}>
                        {t('otp_sent_message') || "We've sent a 6-digit code to"}<br />
                        <strong style={{ color: 'var(--primary)' }}>{email}</strong>
                    </p>

                    {error && (
                        <div className="error-message">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="otp-inputs" onPaste={handlePaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    className="otp-input"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    disabled={loading}
                                    autoComplete="off"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                />
                            ))}
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <span className={`timer ${timer === 0 ? 'expired' : ''}`}>
                                {timer > 0 ? (
                                    <>{t('time_remaining') || 'Time remaining'}: {formatTime(timer)}</>
                                ) : (
                                    t('code_expired') || 'Code expired'
                                )}
                            </span>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ width: '100%' }} 
                            disabled={loading || timer === 0}
                        >
                            {loading ? (
                                <>
                                    <span className="loader"></span>
                                    {t('verifying') || 'Verifying...'}
                                </>
                            ) : (
                                isSignup ? (t('verify_continue') || 'Verify & Continue') : (t('login') || 'Login')
                            )}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <button
                            className="link"
                            onClick={handleResend}
                            disabled={timer > 0 || loading}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '0.875rem',
                                opacity: (timer > 0 || loading) ? 0.5 : 1,
                                cursor: (timer > 0 || loading) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {t('didnt_receive') || "Didn't receive code?"} <strong>{t('resend') || 'Resend'}</strong>
                        </button>
                    </div>

                    <div className="footer-links">
                        <Link to="/login" className="link">
                            {t('back_to_login') || 'Back to Login'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OTPVerify;
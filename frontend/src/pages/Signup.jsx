import React, { useState } from 'react';
import axios from 'axios';
// import { useTranslation } from 'react-i18next'; // Comment out if not used
import { useNavigate, Link } from 'react-router-dom';
import '../styles/AuthStyles.css';

const Signup = () => {
    // const { t, i18n } = useTranslation(); // Comment out if not used
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        preferred_language: 'en' // Default to English
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLanguageChange = (e) => {
        const lang = e.target.value;
        setFormData({ ...formData, preferred_language: lang });
        // i18n.changeLanguage(lang); // Comment out if i18n not used
        localStorage.setItem('language', lang);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post('http://localhost:5000/api/auth/signup', formData);
            await axios.post('http://localhost:5000/api/auth/send-otp', { email: formData.email });
            navigate('/verify-otp', { state: { email: formData.email, isSignup: true } });
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="card">
                <div className="auth-header">
                    <h2>Create Account</h2>
                    <p>Join us to access government services</p>
                </div>
                
                <div className="auth-body">
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
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                className="input-field"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="input-field"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Phone Number (Optional)</label>
                            <input
                                type="tel"
                                name="phone"
                                className="input-field"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+91 98765 43210"
                            />
                        </div>

                        <div className="input-group">
                            <label>Preferred Language</label>
                            <select
                                name="preferred_language"
                                className="input-field"
                                value={formData.preferred_language}
                                onChange={handleLanguageChange}
                            >
                                <option value="en">English</option>
                                <option value="hi">हिन्दी (Hindi)</option>
                                <option value="te">తెలుగు (Telugu)</option>
                            </select>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ width: '100%' }} 
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loader"></span>
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="divider">OR</div>

                    <div className="footer-links">
                        <Link to="/login" className="link">
                            Already have an account?
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
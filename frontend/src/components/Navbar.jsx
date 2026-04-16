import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import jwtDecode from 'jwt-decode'; // npm install jwt-decode
import { useTranslation } from 'react-i18next';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const [role, setRole] = useState(null);
    const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem('language') || 'en');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setRole(decoded.role); // assumes token contains 'role'
            } catch (e) {
                console.error('Invalid token', e);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('language');
        i18n.changeLanguage('en');
        navigate('/login');
    };

    const handleLanguageChange = async (e) => {
        const newLang = e.target.value;
        setCurrentLanguage(newLang);
        localStorage.setItem('language', newLang);
        i18n.changeLanguage(newLang);

        // Update user's language preference in backend
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/update-language`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ language: newLang })
                });
                // Update token in localStorage with new language
                const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/update-language`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ language: newLang })
                });
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('token', data.token);
                }
            } catch (error) {
                console.error('Failed to update language:', error);
            }
        }
    };

    // Determine correct dashboard and profile links based on role
    const dashboardLink = role === 'officer' ? '/officer/dashboard' : '/dashboard';
    const profileLink = role === 'officer' ? '/officer/profile' : '/profile';

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <Link to={dashboardLink} className="brand-link">
                        🏛️ {t('civicfix_portal')}
                    </Link>
                </div>
                <ul className="navbar-menu">
                    <li className="nav-item">
                        <Link 
                            to={dashboardLink} 
                            className={`nav-link ${location.pathname === dashboardLink ? 'active' : ''}`}
                        >
                            {t('dashboard_nav')}
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link 
                            to={profileLink} 
                            className={`nav-link ${location.pathname === profileLink ? 'active' : ''}`}
                        >
                            {t('profile_nav')}
                        </Link>
                    </li>
                    <li className="nav-item">
                        <select 
                            value={currentLanguage} 
                            onChange={handleLanguageChange}
                            className="nav-link language-selector"
                        >
                            <option value="en">English</option>
                            <option value="hi">हिन्दी</option>
                            <option value="te">తెలుగు</option>
                        </select>
                    </li>
                    <li className="nav-item">
                        <button onClick={handleLogout} className="nav-link logout-btn">
                            Logout
                        </button>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
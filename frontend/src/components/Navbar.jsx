import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import jwtDecode from 'jwt-decode'; // npm install jwt-decode
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [role, setRole] = useState(null);

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
        navigate('/login');
    };

    // Determine correct dashboard and profile links based on role
    const dashboardLink = role === 'officer' ? '/officer/dashboard' : '/dashboard';
    const profileLink = role === 'officer' ? '/officer/profile' : '/profile';

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <Link to={dashboardLink} className="brand-link">
                        🏛️ CivicFix Citizen Portal
                    </Link>
                </div>
                <ul className="navbar-menu">
                    <li className="nav-item">
                        <Link 
                            to={dashboardLink} 
                            className={`nav-link ${location.pathname === dashboardLink ? 'active' : ''}`}
                        >
                            Dashboard
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link 
                            to={profileLink} 
                            className={`nav-link ${location.pathname === profileLink ? 'active' : ''}`}
                        >
                            My Profile
                        </Link>
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
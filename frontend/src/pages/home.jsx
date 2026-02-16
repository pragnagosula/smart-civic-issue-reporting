import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/home.css';

const Home = () => {
    return (
        <div className="home-page">
            {/* Government Official Navbar */}
            <nav className="navbar">
                <div className="nav-container">
                    <div className="nav-logo">
                        <div className="logo-icon">
                            <svg className="logo-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#1E3A8A" />
                                <path d="M2 17L12 22L22 17" stroke="#1E3A8A" strokeWidth="2" />
                                <path d="M2 12L12 17L22 12" stroke="#1E3A8A" strokeWidth="2" />
                            </svg>
                        </div>
                        <div className="logo-text-container">
                            <span className="logo-text">CivicFix</span>
                            <span className="logo-subtitle">Government of India</span>
                        </div>
                    </div>
                    <div className="nav-links">
                        <Link to="/" className="nav-link active">Home</Link>
                        <a href="#about" className="nav-link">About</a>
                        <a href="#features" className="nav-link">Features</a>
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/signup" className="nav-link signup-btn">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section with Government Branding */}
            <section id="home" className="hero-section">
                <div className="hero-container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                            </svg>
                            <span>Digital India Initiative</span>
                        </div>
                        <h1 className="hero-title">
                            Building Better Cities<br />
                            <span className="hero-highlight">Together</span>
                        </h1>
                        <p className="hero-subtitle">
                            Empowering citizens to report civic issues and track their resolution in real-time. 
                            A transparent, AI-powered platform connecting communities with local governance.
                        </p>
                        <div className="hero-stats">
                            <div className="hero-stat">
                                <div className="hero-stat-value">10K+</div>
                                <div className="hero-stat-label">Issues Resolved</div>
                            </div>
                            <div className="hero-stat">
                                <div className="hero-stat-value">5K+</div>
                                <div className="hero-stat-label">Active Citizens</div>
                            </div>
                            <div className="hero-stat">
                                <div className="hero-stat-value">50+</div>
                                <div className="hero-stat-label">Cities Covered</div>
                            </div>
                        </div>
                        <div className="hero-buttons">
    <Link to="/signup" className="btn btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
        Register as Citizen
    </Link>
    <Link to="/officer/register" className="btn btn-primary">   {/* Changed from btn-secondary */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Join as Officer
    </Link>
</div>
                    </div>
                    <div className="hero-visual">
    <div className="hero-card hero-card-1">
        <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        </div>
        <div className="card-title">Real-time Tracking</div>
        <div className="card-desc">GPS-verified issue reporting</div>
    </div>
    <div className="hero-card hero-card-2">
        <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m8.66-15.66-4.24 4.24m-8.48 8.48-4.24 4.24M23 12h-6m-6 0H1m20.66 8.66-4.24-4.24m-8.48-8.48-4.24-4.24" />
            </svg>
        </div>
        <div className="card-title">AI-Powered</div>
        <div className="card-desc">Smart issue categorization</div>
    </div>
    <div className="hero-card hero-card-3">
        <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
        </div>
        <div className="card-title">Transparent Process</div>
        <div className="card-desc">Track resolution status</div>
    </div>
</div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="section-container">
                    <div className="section-header-center">
                        <h2 className="section-title">Comprehensive Civic Management</h2>
                        <p className="section-description">A complete solution for modern urban governance</p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                            </div>
                            <h3 className="feature-title">Instant Issue Reporting</h3>
                            <p className="feature-description">
                                Capture photos, add voice descriptions, and auto-detect your location. 
                                Report civic issues in under 60 seconds.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M12 1v6m0 6v6m8.66-15.66-4.24 4.24m-8.48 8.48-4.24 4.24M23 12h-6m-6 0H1m20.66 8.66-4.24-4.24m-8.48-8.48-4.24-4.24" />
                                </svg>
                            </div>
                            <h3 className="feature-title">AI-Powered Verification</h3>
                            <p className="feature-description">
                                Advanced AI analyzes reports for authenticity, categorizes issues automatically, 
                                and routes to the right department.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                                    <path d="M2 17L12 22L22 17" />
                                    <path d="M2 12L12 17L22 12" />
                                </svg>
                            </div>
                            <h3 className="feature-title">Government Integration</h3>
                            <p className="feature-description">
                                Seamlessly connects with municipal departments. Officers receive 
                                smart assignments based on expertise and location.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <h3 className="feature-title">Resolution Proof</h3>
                            <p className="feature-description">
                                GPS-verified completion photos. Citizens verify work quality. 
                                Complete transparency from report to resolution.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                            </div>
                            <h3 className="feature-title">Multi-Language Support</h3>
                            <p className="feature-description">
                                Available in English, Hindi, and regional languages. 
                                Voice input in your preferred language.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            </div>
                            <h3 className="feature-title">Data Analytics</h3>
                            <p className="feature-description">
                                Advanced dashboards for administrators. Track trends, 
                                measure performance, and improve city services.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="about" className="how-it-works-section">
                <div className="section-container">
                    <div className="section-header-center">
                        <h2 className="section-title">How It Works</h2>
                        <p className="section-description">Simple process from report to resolution</p>
                    </div>

                    <div className="steps-container">
                        <div className="step">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <h3>Report Issue</h3>
                                <p>Capture photo, describe problem using voice or text, location auto-detected</p>
                            </div>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <h3>AI Verification</h3>
                                <p>System validates and categorizes, assigns confidence score, routes to department</p>
                            </div>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <h3>Officer Assigned</h3>
                                <p>Best-suited officer receives task, real-time status updates, transparent timeline</p>
                            </div>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-number">4</div>
                            <div className="step-content">
                                <h3>Resolution & Feedback</h3>
                                <p>Proof of completion uploaded, citizen verification, quality rating provided</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-container">
                    <div className="cta-content">
                        <h2 className="cta-title">Be Part of the Change</h2>
                        <p className="cta-subtitle">
                            Join thousands of citizens making their cities better, one report at a time.
                        </p>
                        <div className="cta-buttons">
                            <Link to="/signup" className="btn btn-primary btn-lg">
                                Start Reporting Issues
                            </Link>
                            <Link to="/login" className="btn btn-secondary btn-lg">
                                Login to Continue
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-container">
                    <div className="footer-grid">
                        <div className="footer-col">
                            <div className="footer-logo">
                                <svg className="logo-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#1E3A8A" />
                                    <path d="M2 17L12 22L22 17" stroke="#1E3A8A" strokeWidth="2" />
                                    <path d="M2 12L12 17L22 12" stroke="#1E3A8A" strokeWidth="2" />
                                </svg>
                                <span className="footer-logo-text">CivicFix</span>
                            </div>
                            <p className="footer-description">
                                A Digital India initiative connecting citizens with local governance 
                                for better civic infrastructure and services.
                            </p>
                        </div>
                        <div className="footer-col">
                            <h4 className="footer-title">Quick Links</h4>
                            <ul className="footer-links">
                                <li><a href="#features">Features</a></li>
                                <li><a href="#about">About Us</a></li>
                                <li><Link to="/signup">Register</Link></li>
                                <li><Link to="/login">Login</Link></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h4 className="footer-title">For Officers</h4>
                            <ul className="footer-links">
                                <li><Link to="/officer/register">Register as Officer</Link></li>
                                <li><Link to="/login">Officer Login</Link></li>
                                <li><a href="#faq">Guidelines</a></li>
                                <li><a href="#support">Support</a></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h4 className="footer-title">Legal</h4>
                            <ul className="footer-links">
                                <li><a href="#privacy">Privacy Policy</a></li>
                                <li><a href="#terms">Terms of Service</a></li>
                                <li><a href="#accessibility">Accessibility</a></li>
                                <li><a href="#contact">Contact Us</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p className="footer-copyright">
                            © 2026 CivicFix. Government of India | Ministry of Urban Development. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
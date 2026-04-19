import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/CitizenProfile.css';
import '../styles/GamifiedProfile.css';

// Material UI Icons
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';

const CitizenProfile = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ringAnimation, setRingAnimation] = useState(0);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                
                const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/analytics/citizen/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data);
                
                // Trigger animation after slightly delayed load
                setTimeout(() => setRingAnimation(100), 500);
            } catch (err) {
                console.error('Error fetching citizen profile:', err);
                if (err.response?.status === 401) {
                    navigate('/login');
                } else {
                    setError('Failed to load profile data.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    const handleBack = () => {
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p style={{ marginTop: '1.5rem', color: '#616161', fontSize: '1rem' }}>Loading Profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="gamified-dashboard">
                <div className="gamified-empty-state">
                    <div className="empty-state-emoji"><WarningAmberRoundedIcon sx={{ fontSize: 60, color: 'var(--error-color)' }} /></div>
                    <h3>Error Loading Profile</h3>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry Connection</button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { stats, contributionScore, avgResponseTime, recentActivity } = data;
    const totalReported = stats.total_reported || 0;
    const resolved = stats.closed_issues || 0;
    const active = stats.active_issues || 0;
    const successRate = totalReported > 0 ? ((resolved / totalReported) * 100).toFixed(1) : 0;

    // Gamification Logic
    const xp = contributionScore || (resolved * 20 + active * 5); // Fallback XP calc
    const isCivicHero = xp >= 100;
    const levelName = isCivicHero ? "Civic Hero" : "Starter Citizen";
    const xpTarget = isCivicHero ? xp : 100;
    const ringPercent = Math.min((xp / xpTarget) * 100, 100);

    // Badges array logic
    const badges = [
        { shortName: "Report", name: "First Report", desc: "Report your first civic issue.", req: 1, current: totalReported, icon: <CameraAltRoundedIcon fontSize="inherit" />, colorClass: "c-blue" },
        { shortName: "Eye", name: "Sharp Eye", desc: "Report 5 different issues.", req: 5, current: totalReported, icon: <SearchRoundedIcon fontSize="inherit" />, colorClass: "c-orange" },
        { shortName: "Fixer", name: "City Fixer", desc: "Have 3 reports successfully fixed.", req: 3, current: resolved, icon: <BuildRoundedIcon fontSize="inherit" />, colorClass: "c-green" },
        { shortName: "Leader", name: "Community Leader", desc: "Have 10 reports successfully fixed.", req: 10, current: resolved, icon: <EmojiEventsRoundedIcon fontSize="inherit" />, colorClass: "c-purple" },
        { shortName: "Pro", name: "Perfectionist", desc: "Maintain a 100% resolution success rate.", req: 100, current: successRate, isPercent: true, icon: <TrackChangesRoundedIcon fontSize="inherit" />, colorClass: "c-red" }
    ];

    // Find the next badge to unlock
    const nextGoal = badges.find(b => b.current < b.req) || badges[badges.length - 1];
    const taskText = nextGoal.isPercent 
        ? `Maintain your current rate to hit ${nextGoal.req}%` 
        : `Report ${nextGoal.req - nextGoal.current} more issue${nextGoal.req - nextGoal.current > 1 ? 's' : ''} to unlock ${nextGoal.name}`;


    return (
        <div className="gamified-dashboard">
            {/* Header */}
            <header className="gov-header">
                <div className="gov-header-content">
                    <div className="gov-emblem">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                            <path d="M2 17L12 22L22 17" />
                            <path d="M2 12L12 17L22 12" />
                        </svg>
                    </div>
                    <div className="gov-header-title-section">
                        <h1 className="gov-title">CivicFix Citizen Portal</h1>
                        <p className="gov-subtitle">Your Civic Impact Dashboard</p>
                    </div>
                    <div className="gov-header-actions">
                        <button className="btn btn-secondary no-print" onClick={handleBack}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px', width: '16px'}}>
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                            Back to Map
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ paddingTop: '2rem' }}>
                
                {/* 1. HERO SECTION: XP RING & BADGES PREVIEW */}
                <section className="xp-hero-section">
                    <div className="hero-layout">
                        {/* LEFT SIDE: XP & LEVEL */}
                        <div className="hero-xp-side">
                            <div className="xp-ring-container">
                                <svg className="xp-ring-svg">
                                    <circle className="xp-ring-bg" cx="70" cy="70" r="60" />
                                    <circle 
                                        className="xp-ring-fill" 
                                        cx="70" cy="70" r="60" 
                                        style={{ strokeDashoffset: 377 - (377 * ringPercent) / 100, strokeDasharray: 377 }}
                                    />
                                </svg>
                                <div className="xp-ring-content">
                                    <span className="xp-number">{xp}</span>
                                    <span className="xp-label">XP</span>
                                </div>
                            </div>
                            <div className="xp-details">
                                <h2 className="level-title">{levelName}</h2>
                                <p className="level-subtext">{taskText}</p>
                            </div>
                        </div>

                        <div className="hero-badges-side">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: 'var(--gov-navy)' }}>Impact Summary</h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <div className="stat-card" style={{ padding: '0.5rem 1rem', minHeight: 'auto' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>{totalReported} Reported</div>
                                    </div>
                                    <div className="stat-card" style={{ padding: '0.5rem 1rem', minHeight: 'auto' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>{resolved} Resolved</div>
                                    </div>
                                </div>
                            </div>
                            
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Unlocked Badges</h4>
                            <div className="badges-grid">
                                {badges.slice(0, 4).map((badge, idx) => {
                                    const isUnlocked = badge.current >= badge.req;
                                    return (
                                        <div key={idx} className={`badge-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                                            <div className={`badge-icon-large ${badge.colorClass}`}>{badge.icon}</div>
                                            <span className="badge-name">{badge.shortName}</span>
                                            <div className="badge-tooltip">{badge.desc}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {!isCivicHero && (
                                <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #eef2f6' }}>
                                        <RocketLaunchRoundedIcon style={{ color: 'var(--primary-color)' }} fontSize="small" />
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Next Goal</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--gov-navy)', fontWeight: 700 }}>{taskText}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 5. DYNAMIC MOTIVATION ENGINE */}
                {totalReported === 0 ? (
                    <div className="motivation-card">
                        <div className="motivation-icon"><RocketLaunchRoundedIcon fontSize="inherit" /></div>
                        <div className="motivation-text">
                            <h3>Ready to make an impact?</h3>
                            <p>Report your first civic issue today to earn your first 20 XP and unlock the "First Report" badge!</p>
                        </div>
                    </div>
                ) : (
                    <div className="motivation-card ai-highlight">
                        <div className="motivation-icon"><LocalFireDepartmentRoundedIcon fontSize="inherit" /></div>
                        <div className="motivation-text">
                            <h3>Personalized Insight</h3>
                            <p>
                                {successRate < 70 
                                    ? "Upload clearer, well-lit images of issues to help officers validate and resolve them faster." 
                                    : `You're close! ${taskText}. Every report helps the community grow.`}
                            </p>
                        </div>
                    </div>
                )}



                {/* 3. INTERACTIVE STAT CARDS */}
                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BarChartRoundedIcon color="primary" /> Activity Impact
                    </h3>
                    <div className="interactive-stats-grid">
                        <div className="gamified-stat-card reported">
                            <div className="g-stat-icon"><LocationOnRoundedIcon fontSize="inherit" /></div>
                            <div className="g-stat-content">
                                <div className="g-stat-value animate-number">{totalReported}</div>
                                <div className="g-stat-label">Reported Issues</div>
                                <div className="g-stat-trend trend-neutral">All time reports</div>
                            </div>
                        </div>

                        <div className="gamified-stat-card active">
                            <div className="g-stat-icon"><HourglassEmptyRoundedIcon fontSize="inherit" /></div>
                            <div className="g-stat-content">
                                <div className="g-stat-value animate-number">{active}</div>
                                <div className="g-stat-label">Active / Pending</div>
                                <div className="g-stat-trend trend-neutral">Awaiting review</div>
                            </div>
                        </div>

                        <div className="gamified-stat-card resolved">
                            <div className="g-stat-icon"><CheckCircleRoundedIcon fontSize="inherit" /></div>
                            <div className="g-stat-content">
                                <div className="g-stat-value animate-number">{resolved}</div>
                                <div className="g-stat-label">Resolved Issues</div>
                                <div className="g-stat-trend trend-up">Community improvement</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. PERFORMANCE METRICS (Visual Visuals) */}
                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <TrendingUpRoundedIcon style={{ color: 'var(--success-color)' }} /> Resolution Success
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'}}>
                        
                        {/* Circular Progress */}
                        <div className="gamified-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Success Rate</h4>
                            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                                <svg className="xp-ring-svg" viewBox="0 0 100 100">
                                    <circle className="xp-ring-bg" cx="50" cy="50" r="40" />
                                    <circle 
                                        className="progress-ring__circle" 
                                        cx="50" cy="50" r="40" 
                                        fill="none" stroke="var(--success-color)" strokeWidth="8"
                                        strokeDasharray={`${successRate * 2.51} 251`}
                                    />
                                </svg>
                                <div className="xp-ring-content">
                                    <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{successRate}%</span>
                                </div>
                            </div>
                            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                                {totalReported === 0 ? "Report an issue to improve" : "Issues successfully resolved"}
                            </p>
                        </div>

                        {/* Avg Time Bars */}
                        <div className="gamified-card" style={{ padding: '2rem' }}>
                            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Average Response Time</h4>
                            <div className="performance-bars">
                                <div className="bar-row">
                                    <div className="bar-labels">
                                        <span>Your Reports</span>
                                        <span style={{ color: 'var(--primary-color)' }}>{avgResponseTime || 0}h</span>
                                    </div>
                                    <div className="bar-track">
                                        <div className="bar-fill" style={{ width: `${Math.min(((avgResponseTime || 0) / 72) * 100, 100)}%`, background: 'var(--primary-color)' }}></div>
                                    </div>
                                </div>
                                <div className="bar-row">
                                    <div className="bar-labels">
                                        <span>City Average</span>
                                        <span>48h</span>
                                    </div>
                                    <div className="bar-track">
                                        <div className="bar-fill" style={{ width: '66%', background: 'var(--bg-tertiary)' }}></div>
                                    </div>
                                </div>
                            </div>
                            <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                                {(!avgResponseTime || avgResponseTime === 0) 
                                    ? "Wait for your first resolution" 
                                    : avgResponseTime < 48 ? "Faster than city average!" : "Average processing time"}
                            </p>
                        </div>

                    </div>
                </section>

                {/* 6. TIMELINE UI FOR RECENT ACTIVITY */}
                <section style={{ paddingBottom: '3rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <HistoryRoundedIcon color="info" /> Recent Activity
                    </h3>
                    
                    {!recentActivity || recentActivity.length === 0 ? (
                        <div className="gamified-empty-state">
                            <div className="empty-state-emoji"><RocketLaunchRoundedIcon sx={{ fontSize: 60, color: 'var(--primary-color)' }} /></div>
                            <h3>Start Your Journey</h3>
                            <p>No activity yet. Report your first issue to see your timeline build out.</p>
                            <button className="btn btn-primary" onClick={handleBack}>Go to Map</button>
                        </div>
                    ) : (
                        <div className="modern-timeline">
                            {recentActivity.map((item, index) => {
                                const st = item.status.toLowerCase();
                                const colorClass = (st === 'resolved' || st === 'closed') ? 'bg-green' 
                                                 : (st === 'assigned' || st === 'in progress') ? 'bg-yellow' 
                                                 : (st === 'flagged' || st === 'rejected') ? 'bg-red' 
                                                 : 'bg-blue';
                                                 
                                const icon = (st === 'resolved' || st === 'closed') ? <CheckCircleRoundedIcon fontSize="inherit" /> 
                                           : (st === 'assigned' || st === 'in progress') ? <BuildRoundedIcon fontSize="inherit" /> 
                                           : (st === 'flagged' || st === 'rejected') ? <WarningAmberRoundedIcon fontSize="inherit" /> 
                                           : <AssignmentRoundedIcon fontSize="inherit" />;
                                           
                                return (
                                    <div key={item.id} className="timeline-event">
                                        <div className="timeline-icon-wrap">
                                            <div className={`timeline-icon ${colorClass}`}>{icon}</div>
                                        </div>
                                        <div className="timeline-content">
                                            <div>
                                                <h4 className="event-title">{item.category} Issue #{item.id}</h4>
                                                <div className="event-meta">
                                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <span className={`badge ${st === 'resolved' || st === 'closed' ? 'badge-success' : 'badge-primary'}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
};

export default CitizenProfile;
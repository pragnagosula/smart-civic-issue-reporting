import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/OfficerProfile.css';
import '../styles/GamifiedProfile.css';

// Material UI Icons
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import AlarmRoundedIcon from '@mui/icons-material/AlarmRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';

const OfficerProfile = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [xpAnimation, setXpAnimation] = useState(0);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/officer/login');
                    return;
                }

                const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/analytics/officer/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data);
                
                // Trigger animation after load
                setTimeout(() => setXpAnimation(100), 500);
            } catch (err) {
                console.error('Error fetching officer profile:', err);
                if (err.response?.status === 401) {
                    navigate('/officer/login');
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
        navigate('/officer/dashboard');
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p style={{ marginTop: '1.5rem', color: '#616161', fontSize: '1rem' }}>Loading Dashboard...</p>
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

    const { workload, performance, impact, charts } = data;
    const totalResolved = workload.total_resolved || 0;
    const activeIssues = workload.active_issues || 0;
    
    // Gamification Logic
    const xpPoints = totalResolved * 50; 
    const isSenior = xpPoints >= 1000;
    const isElite = xpPoints >= 5000;
    const tierName = isElite ? "Elite Field Officer" : isSenior ? "Senior Officer" : "Field Officer";
    const nextTierXp = isElite ? xpPoints : isSenior ? 5000 : 1000;
    const xpPercentage = Math.min((xpPoints / nextTierXp) * 100, 100);

    const slaCompliance = parseFloat(performance.sla_compliance || 0);
    const avgRating = parseFloat(performance.avg_rating || 0);

    // Badges array logic
    const badges = [
        { shortName: "Closure", name: "First Closure", desc: "Resolve your first assigned issue.", req: 1, current: totalResolved, icon: <TrackChangesRoundedIcon fontSize="inherit" />, colorClass: "c-blue" },
        { shortName: "Reliable", name: "Reliable Officer", desc: "Successfully resolve 10 civic issues.", req: 10, current: totalResolved, icon: <EmojiEventsRoundedIcon fontSize="inherit" />, colorClass: "c-green" },
        { shortName: "Master", name: "Efficiency Master", desc: "Successfully resolve 50 civic issues.", req: 50, current: totalResolved, icon: <BoltRoundedIcon fontSize="inherit" />, colorClass: "c-orange" },
        { shortName: "5-Star", name: "5-Star Service", desc: "Keep average citizen rating above 4.5.", req: 4.5, current: avgRating, isRating: true, icon: <StarRoundedIcon fontSize="inherit" />, colorClass: "c-purple" },
        { shortName: "Alchemist", name: "Deadline Keeper", desc: "Maintain over 95% SLA compliance.", req: 95, current: slaCompliance, isPercent: true, icon: <AlarmRoundedIcon fontSize="inherit" />, colorClass: "c-red" }
    ];

    // Find the next badge to unlock
    const nextGoal = badges.find(b => b.current < b.req) || badges[badges.length - 1];
    const taskText = nextGoal.isPercent 
        ? `Increase your compliance rate to ${nextGoal.req}%` 
        : nextGoal.isRating 
            ? `Reach an average rating of ${nextGoal.req} from citizens`
            : `Resolve ${nextGoal.req - totalResolved} more issues to unlock ${nextGoal.name}`;


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
                        <h1 className="gov-title">CivicFix Officer Portal</h1>
                        <p className="gov-subtitle">Performance & Impact Dashboard</p>
                    </div>
                    <div className="gov-header-actions">
                        <button className="btn btn-secondary" onClick={handleBack}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px', width: '16px'}}>
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                            Back to Hub
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ paddingTop: '2rem' }}>
                
                {/* 1. HERO SECTION: XP & BADGES PREVIEW */}
                <section className="xp-hero-section">
                    <div className="hero-layout">
                        {/* LEFT SIDE: XP & TIER */}
                        <div className="hero-xp-side">
                            <div className="xp-ring-container">
                                <svg className="xp-ring-svg" viewBox="0 0 100 100">
                                    <circle className="xp-ring-bg" cx="50" cy="50" r="40" />
                                    <circle 
                                        className="progress-ring__circle" 
                                        cx="50" cy="50" r="40" 
                                        fill="none" stroke="url(#gradientXP)" strokeWidth="10"
                                        strokeDasharray={`${xpPercentage * 2.51} 251`}
                                    />
                                    <defs>
                                        <linearGradient id="gradientXP" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stroke="var(--gov-blue)" />
                                            <stop offset="100%" stroke="var(--gov-green)" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="xp-ring-content">
                                    <span className="xp-number" style={{ fontSize: '2rem' }}>{xpPoints}</span>
                                    <span className="xp-label">XP</span>
                                </div>
                            </div>
                            
                            <div className="xp-details">
                                <h2 className="level-title">{tierName}</h2>
                                <p className="level-subtext" style={{ marginBottom: '1rem' }}>
                                    {isElite ? "Maximum Rank Achieved!" : `${xpPercentage.toFixed(0)}% to next rank • ${nextTierXp - xpPoints} XP needed`}
                                </p>

                                <div className="hero-mini-stat">
                                    <LocalFireDepartmentRoundedIcon style={{ fontSize: '1.2rem', color: 'var(--warning-color)' }} />
                                    <span>Weekly Impact: {impact?.total_impacted_citizens || 0} Citizens</span>
                                </div>
                            </div>
                        </div>

                        <div className="hero-divider"></div>

                        {/* RIGHT SIDE: BADGES PREVIEW */}
                        <div className="hero-badges-side">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ color: 'var(--gov-navy)', margin: 0, fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <EmojiEventsRoundedIcon style={{ color: 'var(--warning-color)' }} /> Achievements
                                </h3>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{badges.filter(b => b.current >= b.req).length} / {badges.length} Unlocked</div>
                            </div>

                            <div className="badges-grid">
                                {badges.map((badge, idx) => {
                                    const isUnlocked = badge.current >= badge.req;
                                    const isStarted = badge.current > 0;
                                    const progress = isUnlocked ? 100 : Math.min((badge.current / badge.req) * 100, 100);
                                    const statusClass = isUnlocked ? 'unlocked' : isStarted ? 'in-progress' : 'locked';

                                    return (
                                        <div key={idx} className={`badge-card ${statusClass}`}>
                                            <div className="badge-tooltip">{badge.desc}</div>
                                            <div className={`badge-icon-large ${badge.colorClass}`}>{badge.icon}</div>
                                            <div className="badge-name">{badge.shortName}</div>
                                            <div className="badge-progress-wrap">
                                                <div className={`badge-status-text ${isUnlocked ? 'status-unlocked-text' : 'status-locked-text'}`}>
                                                    {isUnlocked ? "Unlocked" : `${badge.isPercent || badge.isRating ? badge.current.toFixed(1) : badge.current + '/' + badge.req}`}
                                                </div>
                                                <div className="mini-progress-bar">
                                                    <div 
                                                        className={`mini-progress-fill ${isUnlocked ? 'success' : ''}`} 
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* NEXT GOAL HIGHLIGHT */}
                            {!isElite && (
                                <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(21, 101, 192, 0.04)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(21, 101, 192, 0.1)' }}>
                                        <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
                                            <BoltRoundedIcon fontSize="small" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-color)', letterSpacing: '0.05em' }}>Next Priority: {nextGoal.name}</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{taskText}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 5. DYNAMIC INSIGHT SYSTEM */}
                {activeIssues > 0 && (
                    <div className="motivation-card ai-highlight">
                        <div className="motivation-icon">{slaCompliance < 85 ? <WarningAmberRoundedIcon fontSize="inherit" /> : <LocalFireDepartmentRoundedIcon fontSize="inherit" />}</div>
                        <div className="motivation-text">
                            <h3>Department Insight</h3>
                            <p>
                                {slaCompliance < 85 
                                    ? "Your SLA compliance is slipping. Focus on resolving assigned issues within the action deadline to maintain rank." 
                                    : `You're on fire! ${taskText}. Your efficiency is helping improve city infrastructure.`}
                            </p>
                        </div>
                    </div>
                )}



                {/* 3. WORKLOAD OVERVIEW */}
                <h3 style={{ marginBottom: '1rem', marginTop: '2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AssessmentRoundedIcon color="primary" /> Workload Overview
                </h3>
                <div className="interactive-stats-grid">
                    <div className="gamified-stat-card reported">
                        <div className="g-stat-icon"><AssignmentRoundedIcon fontSize="inherit" /></div>
                        <div className="g-stat-content">
                            <div className="g-stat-value animate-number">{workload.total_assigned || 0}</div>
                            <div className="g-stat-label">Total Assigned</div>
                            <div className={`g-stat-trend trend-neutral`}>All time</div>
                        </div>
                    </div>
                    
                    <div className="gamified-stat-card active">
                        <div className="g-stat-icon"><HourglassEmptyRoundedIcon fontSize="inherit" /></div>
                        <div className="g-stat-content">
                            <div className="g-stat-value animate-number">{activeIssues}</div>
                            <div className="g-stat-label">Active Issues</div>
                            <div className={`g-stat-trend ${activeIssues > 5 ? 'trend-down' : 'trend-neutral'}`}>
                                {activeIssues > 5 ? 'High Workload' : 'Manageable'}
                            </div>
                        </div>
                    </div>

                    <div className="gamified-stat-card resolved">
                        <div className="g-stat-icon"><CheckCircleRoundedIcon fontSize="inherit" /></div>
                        <div className="g-stat-content">
                            <div className="g-stat-value animate-number">{totalResolved}</div>
                            <div className="g-stat-label">Resolved</div>
                            <div className="g-stat-trend trend-up">Great job!</div>
                        </div>
                    </div>
                </div>

                {/* 4. VISUAL PERFORMANCE METRICS */}
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <TrendingUpRoundedIcon style={{ color: 'var(--success-color)' }} /> Performance Metrics
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    
                    {/* SLA Circular Progress */}
                    <div className="gamified-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>SLA Compliance</h4>
                        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                            <svg className="xp-ring-svg" viewBox="0 0 100 100">
                                <circle className="xp-ring-bg" cx="50" cy="50" r="40" />
                                <circle 
                                    className="progress-ring__circle" 
                                    cx="50" cy="50" r="40" 
                                    fill="none" stroke={slaCompliance > 80 ? "var(--success-color)" : "var(--error-color)"} strokeWidth="8"
                                    strokeDasharray={`${slaCompliance * 2.51} 251`}
                                />
                            </svg>
                            <div className="xp-ring-content">
                                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{slaCompliance}%</span>
                            </div>
                        </div>
                        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Target: &gt;90%</p>
                    </div>

                    {/* Average Rating UI */}
                    <div className="gamified-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Citizen Rating</h4>
                        <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            {avgRating.toFixed(1)} <span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>/ 5</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <StarRoundedIcon key={star} fontSize="inherit" style={{ color: star <= Math.round(avgRating) ? 'var(--warning-color)' : 'var(--bg-tertiary)' }} />
                            ))}
                        </div>
                        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Based on citizen feedback</p>
                    </div>

                    {/* Avg Resolution Comparison */}
                    <div className="gamified-card" style={{ padding: '2rem' }}>
                        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Avg Resolution Time</h4>
                        <div className="performance-bars">
                            <div className="bar-row">
                                <div className="bar-labels">
                                    <span>Your Time</span>
                                    <span style={{ color: 'var(--primary-color)' }}>{performance.avg_resolution_hours || 0}h</span>
                                </div>
                                <div className="bar-track">
                                    <div className="bar-fill" style={{ width: `${Math.min(((performance.avg_resolution_hours || 0) / 72) * 100, 100)}%`, background: 'var(--primary-color)' }}></div>
                                </div>
                            </div>
                            <div className="bar-row">
                                <div className="bar-labels">
                                    <span>Dept Avg</span>
                                    <span>48h</span>
                                </div>
                                <div className="bar-track">
                                    <div className="bar-fill" style={{ width: '66%', background: 'var(--text-tertiary)' }}></div>
                                </div>
                            </div>
                        </div>
                        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {performance.avg_resolution_hours < 48 ? <><BoltRoundedIcon fontSize="small"/> Faster than average!</> : "Aim to reduce your time."}
                        </p>
                    </div>
                </div>

                {/* 6. CITIZEN IMPACT SECTION */}
                <div className="motivation-card glow-effect" style={{ background: 'linear-gradient(135deg, var(--gov-green) 0%, var(--success-color) 100%)', marginBottom: '2rem' }}>
                    <div className="motivation-icon"><PeopleRoundedIcon fontSize="inherit" /></div>
                    <div className="motivation-text">
                        <h3>Community Hero</h3>
                        <p>You have physically improved the daily lives of <strong>{impact.total_impacted_citizens || 0}</strong> citizens. Your highest single issue resolution affected <strong>{impact.highest_impact_issue || 0}</strong> people at once!</p>
                    </div>
                </div>

                {/* 7. CHARTS & EMPTY STATES */}
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CalendarTodayRoundedIcon color="info" /> Resolution Trends
                </h3>
                <div className="gamified-card" style={{ padding: '2rem', marginBottom: '3rem' }}>
                    {(!charts?.resolutionTrend || charts.resolutionTrend.length === 0) ? (
                        <div className="gamified-empty-state">
                            <div className="empty-state-emoji"><RocketLaunchRoundedIcon sx={{ fontSize: 60, color: 'var(--primary-color)' }} /></div>
                            <h3>Start Your Journey</h3>
                            <p>No data yet — start resolving issues to see your performance trends here!</p>
                            <button className="btn btn-primary" onClick={handleBack}>Go to Dashboard</button>
                        </div>
                    ) : (
                        <div style={{ height: '250px', width: '100%', position: 'relative' }}>
                             <svg viewBox="0 0 400 200" style={{ width: '100%', height: '100%' }}>
                                <line x1="40" y1="20" x2="40" y2="180" stroke="var(--border-color)" strokeWidth="2"/>
                                <line x1="40" y1="180" x2="380" y2="180" stroke="var(--border-color)" strokeWidth="2"/>
                                
                                <polyline
                                    points={charts.resolutionTrend.map((d, i) => {
                                        const x = 40 + (i * (340 / (charts.resolutionTrend.length - 1)));
                                        const maxHours = Math.max(...charts.resolutionTrend.map(p => p.avg_hours));
                                        const y = 180 - ((d.avg_hours / maxHours) * 160);
                                        return `${x},${y}`;
                                    }).join(' ')}
                                    fill="none" stroke="var(--primary-color)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                                />
                                
                                {charts.resolutionTrend.map((d, i) => {
                                    const x = 40 + (i * (340 / (charts.resolutionTrend.length - 1)));
                                    const maxHours = Math.max(...charts.resolutionTrend.map(p => p.avg_hours));
                                    const y = 180 - ((d.avg_hours / maxHours) * 160);
                                    return <circle key={i} cx={x} cy={y} r="6" fill="var(--gov-navy)" stroke="var(--bg-primary)" strokeWidth="2" />;
                                })}
                            </svg>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
};

export default OfficerProfile;
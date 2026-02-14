import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

const OfficerDashboard = () => {
    const navigate = useNavigate();
    const [issues, setIssues] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchIssues();
    }, []);

    const fetchIssues = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const res = await axios.get('http://localhost:5000/api/officer/my-department-issues', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIssues(res.data);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const [showResolveModal, setShowResolveModal] = React.useState(false);
    const [selectedIssueId, setSelectedIssueId] = React.useState(null);
    const [resolutionImage, setResolutionImage] = React.useState(null);
    const [resolving, setResolving] = React.useState(false);

    const handleStatusChange = (id, newStatus) => {
        if (newStatus === 'Resolved') {
            setSelectedIssueId(id);
            setShowResolveModal(true);
        } else {
            updateStatus(id, newStatus);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setResolutionImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const confirmResolution = () => {
        if (!resolutionImage) {
            alert("Please upload a proof image.");
            return;
        }

        setResolving(true);

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            setResolving(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Call updateStatus with extra data
                updateStatus(selectedIssueId, 'Resolved', {
                    image: resolutionImage,
                    latitude,
                    longitude
                });
                // Reset/Close Modal
                setShowResolveModal(false);
                setResolutionImage(null);
                setSelectedIssueId(null);
                setResolving(false);
            },
            (err) => {
                console.error(err);
                alert("Unable to retrieve your location. Location is mandatory for resolution.");
                setResolving(false);
            }
        );
    };

    const updateStatus = async (id, newStatus, extraData = {}) => {
        try {
            const token = localStorage.getItem('token');
            const payload = { status: newStatus, ...extraData };

            await axios.patch(`http://localhost:5000/api/officer/issue/${id}/status`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchIssues(); // Refresh
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleProfile = () => {
        navigate('/officer/profile');
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Officer Dashboard</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="logout-btn" onClick={handleProfile} style={{ backgroundColor: '#2196f3' }}>
                        My Stats
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>
            <main style={{ padding: '2rem' }}>
                <h2>Assigned & Department Issues</h2>
                {loading ? <p>Loading...</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', color: 'white', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ background: '#334155', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>Category</th>
                                    <th style={{ padding: '12px' }}>Description (Voice)</th>
                                    <th style={{ padding: '12px' }}>Location</th>
                                    <th style={{ padding: '12px' }}>AI Confidence</th>
                                    <th style={{ padding: '12px' }}>Status</th>
                                    <th style={{ padding: '12px' }}>Evidence</th>
                                    <th style={{ padding: '12px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {issues.length === 0 ? (
                                    <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>No issues found for your department.</td></tr>
                                ) : (
                                    issues.map(issue => {
                                        const isAssigned = issue.status === 'Assigned';
                                        return (
                                            <tr key={issue.id} style={{
                                                borderBottom: '1px solid #475569',
                                                backgroundColor: isAssigned ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
                                            }}>
                                                <td style={{ padding: '12px' }}>
                                                    {issue.category}
                                                    {isAssigned && <div style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 'bold' }}>⭐ ASSIGNED TO YOU</div>}
                                                </td>
                                                <td style={{ padding: '12px' }}>{issue.voice_text || 'No description'}</td>
                                                <td style={{ padding: '12px' }}>{issue.latitude || 'N/A'}, {issue.longitude || 'N/A'}</td>
                                                <td style={{ padding: '12px' }}>{(issue.ai_confidence * 100).toFixed(0)}%</td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{
                                                        padding: '4px 8px', borderRadius: '4px',
                                                        background: issue.status === 'Resolved' ? '#166534' : issue.status === 'In Progress' ? '#ca8a04' : issue.status === 'Assigned' ? '#0ea5e9' : '#ef4444',
                                                        color: 'white'
                                                    }}>
                                                        {issue.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    {issue.image && <a href={issue.image} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>View</a>}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <select
                                                        value={issue.status}
                                                        onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                                                        style={{ padding: '4px', background: '#1e293b', color: 'white', border: '1px solid #475569' }}
                                                    >
                                                        <option value="Reported">Reported</option>
                                                        <option value="Assigned">Assigned (Self)</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Resolved">Resolved</option>
                                                        <option value="Rejected">Rejected</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* RESOLUTION PROOF MODAL */}
                {showResolveModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }}>
                        <div style={{
                            background: '#1e293b', padding: '2rem', borderRadius: '10px', width: '400px', color: 'white', border: '1px solid #475569'
                        }}>
                            <h3>✅ Verify Resolution</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>To mark this issue as Resolved, you must provide proof.</p>

                            <div style={{ margin: '1rem 0' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>1. Upload Resolution Image (Required)</label>
                                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%' }} />
                                {resolutionImage && <img src={resolutionImage} alt="Preview" style={{ width: '100%', marginTop: '10px', borderRadius: '5px' }} />}
                            </div>

                            <div style={{ margin: '1rem 0' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>2. GPS Location</label>
                                <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>We will automatically capture your current GPS location as proof of visit.</p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button
                                    onClick={confirmResolution}
                                    disabled={resolving}
                                    style={{ flex: 1, padding: '10px', background: '#22c55e', border: 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    {resolving ? 'Verifying...' : 'Submit Resolution'}
                                </button>
                                <button
                                    onClick={() => setShowResolveModal(false)}
                                    disabled={resolving}
                                    style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '5px', color: '#ef4444', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default OfficerDashboard;

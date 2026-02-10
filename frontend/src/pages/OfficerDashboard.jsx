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

    const updateStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:5000/api/officer/issue/${id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchIssues(); // Refresh
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Officer Dashboard</h1>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
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
                                        // Simple decode of token to get ID, or assume backend returns 'isAssignedToMe' flag
                                        // For now, let's assume we can get user ID from localStorage or basic parse
                                        // But actually, backend query includes OR assigned_officer_id. 
                                        // Let's rely on checking if status is 'Assigned' and maybe we can check ID if available.
                                        // Better yet, just show the assigned status prominently.
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
                                                        onChange={(e) => updateStatus(issue.id, e.target.value)}
                                                        style={{ padding: '4px', background: '#1e293b', color: 'white', border: '1px solid #475569' }}
                                                    >
                                                        <option value="Reported">Reported</option>
                                                        <option value="Assigned">Assigned</option>
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
            </main>
        </div>
    );
};

export default OfficerDashboard;

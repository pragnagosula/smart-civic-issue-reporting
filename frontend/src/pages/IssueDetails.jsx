import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
    VerifiedRounded as VerifiedIcon,
    LocationOnRounded as MapIcon,
    CalendarTodayRounded as DateIcon,
    CategoryRounded as CategoryIcon,
    ArrowBackRounded as BackIcon,
    CheckCircleRounded as CheckIcon
} from '@mui/icons-material';
import '../styles/IssueDetails.css';

// Fix Leaflet Marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const IssueDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [issue, setIssue] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchIssueDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchIssueDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIssue(response.data);
            setComments(response.data.comments || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/${id}/comment`, {
                text: newComment
            }, { headers: { Authorization: `Bearer ${token}` } });
            setNewComment('');
            fetchIssueDetails();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="loading-state">Syncing Dashboard...</div>;
    if (!issue) return <div className="error-state">Issue not found.</div>;

    const confidenceScore = issue.ai_confidence ? (issue.ai_confidence * 100).toFixed(0) : 0;
    const isVerified = issue.ai_status === 'Verified' || issue.ai_status === 'CATEGORIZED';

    return (
        <div className="issue-details-page-v4">
            {/* TOP HEADER */}
            <header className="details-header-v4">
                <div className="header-left">
                    <button className="btn-back-crumb" onClick={() => navigate('/dashboard')}>
                        <BackIcon style={{ fontSize: 18 }} /> Dashboard
                    </button>
                    <span className="crumb-sep">/</span>
                    <h1 className="id-title">Issue #{issue.id}</h1>
                    <div className="summary-pills">
                        <span className="pill pill-category"><div className="dot-blue"></div> {issue.category}</span>
                        <span className="pill pill-coords"><MapIcon style={{ fontSize: 14 }} /> {Number(issue.latitude).toFixed(4)}, {Number(issue.longitude).toFixed(4)}</span>
                    </div>
                </div>
                <div className={`badge-status-top status-${issue.status?.toLowerCase().replace(' ', '-')}`}>
                    <div className="dot"></div> {issue.status}
                </div>
            </header>

            <main className="details-grid-v4">
                {/* LEFT COLUMN: EVIDENCE & DISCUSSION */}
                <div className="details-left">
                    {/* EVIDENCE CARD */}
                    <div className="evidence-card-v4">
                        <div className="tag-float-left">Official evidence</div>
                        <img src={issue.image} alt="Evidence" className="evidence-main-img" />
                        <div className="meta-float-bottom">
                            <div className="time-gps">
                                <div>{new Date(issue.timestamp).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                <div className="gps-acquiring">GPS acquiring...</div>
                            </div>
                            <div className="verified-pill">
                                <div className="dot-green"></div> Verified
                            </div>
                        </div>
                    </div>

                    {/* ISSUE DESCRIPTION & AI VERIFIED */}
                    <div className="card-v4 desc-ai-card">
                        <div className="desc-header">ISSUE DESCRIPTION</div>
                        <p className="desc-text-v4">{issue.description || 'No description provided.'}</p>
                        <div className="divider-line" />
                        <div className={`ai-verification-box ${isVerified ? 'verified-bg' : 'pending-bg'}`}>
                            <div className="ai-box-left">
                                {isVerified ? <CheckIcon className="check-success" /> : <VerifiedIcon className="check-pending" />}
                                <span>
                                    <strong>{isVerified ? 'AI verified' : 'Verification Pending'}</strong> · {confidenceScore}% confidence
                                </span>
                            </div>
                            <div className="ai-box-right">
                                {isVerified ? 'Image matches category' : 'Awaiting manual review'}
                            </div>
                            <div className="ai-progress-v4">
                                <div className={`ai-fill-v4 ${isVerified ? 'bg-success' : 'bg-pending'}`} style={{ width: `${confidenceScore}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* COMMUNITY UPDATES */}
                    <div className="card-v4 community-card">
                        <div className="community-header">
                            <span>COMMUNITY UPDATES</span>
                            <span className="update-count">{comments.length} updates</span>
                        </div>
                        <div className="comment-area-v4">
                            <textarea 
                                placeholder="Share a field observation or update..." 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <div className="btn-row-v4">
                                <button className="btn-post-v4" onClick={handleCommentSubmit}>Post update</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: UNIFIED CONTROL PANEL */}
                <div className="details-right">
                    {/* LOCATION CARD (Separate because it has a map) */}
                    <div className="card-v4 right-item location-box">
                        <div className="right-label">LOCATION</div>
                        <div className="mini-map-v4">
                            <MapContainer center={[Number(issue.latitude), Number(issue.longitude)]} zoom={15} style={{ height: '120px' }} zoomControl={false} dragging={false} scrollWheelZoom={false}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[Number(issue.latitude), Number(issue.longitude)]} />
                            </MapContainer>
                            <div className="map-overlay-coord">{Number(issue.latitude).toFixed(4)}, {Number(issue.longitude).toFixed(4)} ↗</div>
                        </div>
                    </div>

                    {/* UNIFIED METADATA CARD */}
                    <div className="card-v4 unified-meta-box">
                        <div className="meta-section">
                            <div className="right-label">REPORTED ON</div>
                            <div className="date-time-bold">{new Date(issue.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div className="time-sub">{new Date(issue.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} local time</div>
                        </div>
                        
                        <div className="section-divider" />

                        <div className="meta-section">
                            <div className="right-label">CATEGORY</div>
                            <div className="pill-category-card">{issue.category}</div>
                        </div>

                        <div className="section-divider" />

                        <div className="meta-section">
                            <div className="right-label">STATUS</div>
                            <div className={`status-flat status-color-${issue.status?.toLowerCase().replace(' ', '-')}`}>
                                <div className="dot"></div> {issue.status}
                            </div>
                        </div>

                        <div className="section-divider" />

                        <div className="meta-section">
                            <div className="right-label">ASSIGNED TO</div>
                            <div className="officer-row-v4">
                                <div className="officer-avatar-v4">{issue.officer_name?.[0] || 'S'}</div>
                                <div className="officer-meta-v4">
                                    <div className="officer-name-v4">{issue.officer_name || "Unassigned"}</div>
                                    <div className="officer-role-v4">Field officer</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default IssueDetails;
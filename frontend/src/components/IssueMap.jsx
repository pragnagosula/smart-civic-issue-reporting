import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import './IssueMap.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default Leaflet marker icon not loading properly in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to recenter map when `center` prop changes
const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && center[0] !== null) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
};

const IssueMap = ({
  issues = [],
  center = null,
  userLocation = null,
  zoom = 13,
  height = '400px',
  interactive = true
}) => {
  const navigate = useNavigate();

  // If no center provided, compute the center based on userLocation or the first issue
  const defaultCenter = [20.5937, 78.9629]; // India center as fallback
  
  let mapCenter = center;
  if (!mapCenter) {
    if (userLocation) {
      mapCenter = userLocation;
    } else if (issues.length > 0) {
      // Find first issue with valid coords
      const validIssue = issues.find(i => i.latitude && i.longitude);
      if (validIssue) {
        mapCenter = [validIssue.latitude, validIssue.longitude];
      } else {
        mapCenter = defaultCenter;
      }
    } else {
      mapCenter = defaultCenter;
    }
  }

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'resolved': return '#4caf50';
      case 'in progress': return '#ff9800';
      case 'flagged': return '#f44336';
      default: return '#2196f3';
    }
  };

  return (
    <div className="issue-map-container" style={{ height }}>
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        scrollWheelZoom={interactive}
        style={{ height: '100%', width: '100%', borderRadius: '12px', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RecenterMap center={mapCenter} zoom={zoom} />

        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <strong>You are here</strong>
            </Popup>
          </Marker>
        )}

        {issues.map(issue => {
          if (!issue.latitude || !issue.longitude) return null;
          
          return (
            <Marker key={issue.id || issue._id} position={[issue.latitude, issue.longitude]}>
              <Popup>
                <div className="map-popup-card">
                  <h4>{issue.category || 'Uncategorized'} Issue</h4>
                  <p className="popup-desc">
                    {issue.voice_text || issue.description ? 
                      (issue.voice_text || issue.description).substring(0, 100) + '...' 
                      : 'No description available'}
                  </p>
                  <div className="popup-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(issue.status) }}
                    >
                      {issue.status}
                    </span>
                  </div>
                  <button 
                    className="view-details-btn"
                    onClick={() => navigate(`/issue/${issue.id || issue._id}`)}
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default IssueMap;

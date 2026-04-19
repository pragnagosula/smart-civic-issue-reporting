import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import './IssueMap.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default Leaflet marker icon not loading properly in React
try {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
} catch (err) {
    console.error("Leaflet Icon fix error:", err);
}

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to handle map instance operations
const MapController = ({ center, zoom, issues, userLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Force size invalidation
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    const points = Array.isArray(issues) ? issues : [];
    const validPoints = points
      .filter(i => i && i.latitude && i.longitude)
      .map(i => [Number(i.latitude), Number(i.longitude)])
      .filter(p => !isNaN(p[0]) && !isNaN(p[1]));
    
    if (validPoints.length > 0) {
      try {
        const bounds = L.latLngBounds(validPoints);
        if (userLocation && Array.isArray(userLocation) && userLocation.length === 2 && !isNaN(Number(userLocation[0]))) {
          bounds.extend([Number(userLocation[0]), Number(userLocation[1])]);
        }
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } catch (e) {
        console.warn("Leaflet fitBounds error:", e);
      }
    } else if (center && Array.isArray(center) && center.length === 2 && !isNaN(Number(center[0]))) {
      try {
        map.setView([Number(center[0]), Number(center[1])], zoom || 13);
      } catch (e) {
        console.warn("Leaflet setView error:", e);
      }
    }

    return () => clearTimeout(timer);
  }, [map, center, zoom, issues, userLocation]);

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
  const [error, setError] = useState(null);

  // Helper to safely get string description
  const getDescription = useCallback((issue) => {
    if (!issue) return 'No description provided';
    try {
        let desc = issue.description || issue.voice_text || 'No description provided';
        if (typeof desc === 'object') {
          const lang = localStorage.getItem('language') || 'en';
          desc = desc[lang] || desc['en'] || Object.values(desc)[0] || 'No description provided';
        }
        return String(desc);
    } catch (e) {
        return 'No description provided';
    }
  }, []);

  // Compute a stable center if none provided
  const mapCenter = useMemo(() => {
    try {
      if (center && Array.isArray(center) && center.length === 2 && !isNaN(Number(center[0]))) {
        return [Number(center[0]), Number(center[1])];
      }
      if (userLocation && Array.isArray(userLocation) && userLocation.length === 2 && !isNaN(Number(userLocation[0]))) {
        return [Number(userLocation[0]), Number(userLocation[1])];
      }
      if (Array.isArray(issues) && issues.length > 0) {
        const firstValid = issues.find(i => i && i.latitude && i.longitude && !isNaN(Number(i.latitude)));
        if (firstValid) return [Number(firstValid.latitude), Number(firstValid.longitude)];
      }
    } catch (e) {
      console.warn("Error computing map center:", e);
    }
    return [20.5937, 78.9629]; // Default to India center
  }, [center, userLocation, issues]);

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'resolved': return '#10b981';
      case 'in progress': return '#f59e0b';
      case 'flagged': 
      case 'escalated': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const safeIssues = useMemo(() => Array.isArray(issues) ? issues : [], [issues]);

  if (error) {
    return (
        <div style={{ padding: '2rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '12px', border: '1px solid #f87171' }}>
            <h3>Map Component Error</h3>
            <p>{error.message}</p>
            <button onClick={() => setError(null)} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#b91c1c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Retry</button>
        </div>
    );
  }

  try {
    return (
      <div className="issue-map-container" style={{ 
        height, 
        minHeight: '400px', 
        position: 'relative', 
        width: '100%',
        display: 'block',
        backgroundColor: '#f1f5f9'
      }}>
        <MapContainer 
          center={mapCenter} 
          zoom={zoom} 
          scrollWheelZoom={interactive}
          style={{ height: '100%', width: '100%', zIndex: 1, display: 'block' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController 
            center={mapCenter} 
            zoom={zoom} 
            issues={safeIssues} 
            userLocation={userLocation} 
          />
  
          {userLocation && Array.isArray(userLocation) && userLocation.length === 2 && !isNaN(Number(userLocation[0])) && (
            <Marker position={[Number(userLocation[0]), Number(userLocation[1])]} icon={userIcon}>
              <Popup>
                <div style={{ fontWeight: 'bold' }}>Your Location</div>
              </Popup>
            </Marker>
          )}
  
          {safeIssues.map((issue, idx) => {
            if (!issue) return null;
            const lat = Number(issue.latitude);
            const lng = Number(issue.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;
            
            const desc = getDescription(issue);
            
            return (
              <Marker key={issue.id || issue._id || `marker-${idx}`} position={[lat, lng]}>
                <Popup>
                  <div className="map-popup-card">
                    <h4>{issue.category || 'Civic'} Issue</h4>
                    <div className="popup-desc">
                      {desc.length > 80 ? desc.substring(0, 80) + '...' : desc}
                    </div>
                    <div className="popup-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(issue.status) }}
                      >
                        {issue.status || 'Reported'}
                      </span>
                    </div>
                    <button 
                      className="view-details-btn"
                      onClick={() => {
                          const id = issue.id || issue._id || issue.issue_id;
                          if (id) navigate(`/issue/${id}`);
                      }}
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
  } catch (err) {
    setError(err);
    return null;
  }
};

export default IssueMap;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/ReportIssue.css';

const ReportIssue = () => {
    const navigate = useNavigate();

    // State
    const [stream, setStream] = useState(null);
    const [cameraError, setCameraError] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState('');
    const [description, setDescription] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [voiceLanguage, setVoiceLanguage] = useState('en-IN');
    const [hasRecordedVoice, setHasRecordedVoice] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        startCamera();
        getLocation();
        return () => {
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Camera Logic
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera Error:", err);
            setCameraError("Could not access camera. Please allow permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    // GPS Logic
    const getLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by this browser.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (err) => {
                console.error("GPS Error:", err);
                setLocationError("Unable to retrieve your location.");
            }
        );
    };

    // Capture Photo
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current || !location) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Embed Metadata
        const date = new Date();
        const timestamp = date.toLocaleString();
        const locString = `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`;

        context.globalAlpha = 0.7;
        context.fillStyle = "black";
        context.fillRect(10, canvas.height - 80, canvas.width - 20, 70);
        context.globalAlpha = 1.0;

        context.font = "18px Arial";
        context.fillStyle = "white";
        context.fillText(`📅 ${timestamp}`, 20, canvas.height - 50);
        context.fillText(`📍 ${locString}`, 20, canvas.height - 25);

        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        stopCamera();
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        startCamera();
    };

    // Voice Input
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Your browser does not support speech recognition.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = voiceLanguage;
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onstart = () => {
            setIsListening(true);
        };

        recognitionRef.current.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setDescription((prev) => prev ? prev + " " + transcript : transcript);
            setHasRecordedVoice(true);
        };

        recognitionRef.current.onerror = (event) => {
            console.error("Speech Error:", event.error);
            setIsListening(false);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    const toggleListening = () => {
        if (isListening) stopListening();
        else startListening();
    };

    // Submit
    const canSubmit = capturedImage &&
        location &&
        description.trim().length > 0 &&
        !isSubmitting;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setIsSubmitting(true);

        const payload = {
            image: capturedImage,
            voiceText: description,
            language: voiceLanguage,
            latitude: location.lat,
            longitude: location.lng,
            timestamp: new Date().toISOString(),
            citizenId: "FROM_JWT_MIDDLEWARE",
            status: "Reported"
        };

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/report`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log("Submission Success:", response.data);
            alert(response.data.message || "Issue reported successfully!");
            navigate('/dashboard');

        } catch (error) {
            console.error("Submit Error:", error);
            const msg = error.response?.data?.message || "Failed to report issue.";
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="report-issue-page">
            {/* Official Government Header */}
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
                        <p className="gov-subtitle">Report Civic Issue</p>
                    </div>
                    
                    <div className="gov-header-actions">
                        <button className="btn btn-secondary no-print" onClick={() => navigate('/dashboard')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                            Cancel
                        </button>
                    </div>
                </div>
            </header>

            <main className="report-container">
                {/* Progress Steps */}
                <section className="progress-section">
                    <div className="progress-steps">
                        <div className={`progress-step ${capturedImage ? 'completed' : 'active'}`}>
                            <div className="step-circle">
                                {capturedImage ? '✓' : '1'}
                            </div>
                            <div className="step-label">Capture Photo</div>
                        </div>
                        <div className="progress-line"></div>
                        <div className={`progress-step ${location ? 'completed' : capturedImage ? 'active' : ''}`}>
                            <div className="step-circle">
                                {location ? '✓' : '2'}
                            </div>
                            <div className="step-label">Location</div>
                        </div>
                        <div className="progress-line"></div>
                        <div className={`progress-step ${description ? 'completed' : location && capturedImage ? 'active' : ''}`}>
                            <div className="step-circle">
                                {description ? '✓' : '3'}
                            </div>
                            <div className="step-label">Description</div>
                        </div>
                    </div>
                </section>

                {/* Camera Section */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">Capture Evidence</h2>
                        <p className="section-subtitle">Take a clear photo of the civic issue you want to report</p>
                    </div>

                    <div className="camera-card">
                        <div className="media-container">
                            {!capturedImage && !stream && !cameraError && (
                                <div className="loading-overlay">
                                    <div className="spinner"></div>
                                    <p>Initializing camera...</p>
                                </div>
                            )}

                            {cameraError && (
                                <div className="error-overlay">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <line x1="15" y1="9" x2="9" y2="15"/>
                                        <line x1="9" y1="9" x2="15" y2="15"/>
                                    </svg>
                                    <p>{cameraError}</p>
                                </div>
                            )}

                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{ display: capturedImage ? 'none' : 'block' }}
                            />

                            <canvas
                                ref={canvasRef}
                                style={{ display: capturedImage ? 'block' : 'none' }}
                            />

                            {!capturedImage && stream && (
                                <button className="capture-btn" onClick={capturePhoto} title="Capture Photo">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                        <circle cx="12" cy="13" r="4"/>
                                    </svg>
                                </button>
                            )}
                        </div>

                        {capturedImage && (
                            <div className="camera-actions">
                                <button className="btn btn-secondary" onClick={retakePhoto}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 4v6h6M23 20v-6h-6"/>
                                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                                    </svg>
                                    Retake Photo
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Location Section */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">Location Information</h2>
                        <p className="section-subtitle">GPS coordinates will be automatically attached to your report</p>
                    </div>

                    <div className="location-card">
                        {location ? (
                            <div className="location-success">
                                <div className="location-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                </div>
                                <div className="location-details">
                                    <div className="location-status">Location Captured</div>
                                    <div className="location-coords">
                                        <span>Lat: {location.lat.toFixed(6)}</span>
                                        <span className="coord-divider">•</span>
                                        <span>Lng: {location.lng.toFixed(6)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="location-loading">
                                <div className="location-icon">
                                    <div className="spinner-small"></div>
                                </div>
                                <div className="location-details">
                                    <div className="location-status">
                                        {locationError || 'Fetching your location...'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Description Section */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">Issue Description</h2>
                        <p className="section-subtitle">Describe the civic issue in your own words or use voice input</p>
                    </div>

                    <div className="description-card">
                        {/* Voice Controls */}
                        <div className="voice-controls-row">
                            <div className="language-selector">
                                <label>Language</label>
                                <select
                                    className="input-field"
                                    value={voiceLanguage}
                                    onChange={(e) => setVoiceLanguage(e.target.value)}
                                >
                                    <option value="en-IN">🇮🇳 English</option>
                                    <option value="hi-IN">🇮🇳 हिंदी (Hindi)</option>
                                    <option value="te-IN">🇮🇳 తెలుగు (Telugu)</option>
                                    <option value="ta-IN">🇮🇳 தமிழ் (Tamil)</option>
                                    <option value="mr-IN">🇮🇳 मराठी (Marathi)</option>
                                </select>
                            </div>

                            <div className="voice-button-container">
                                <button
                                    className={`voice-btn ${isListening ? 'listening' : ''}`}
                                    onClick={toggleListening}
                                    title={isListening ? "Stop Recording" : "Start Voice Input"}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        {isListening ? (
                                            <>
                                                <rect x="9" y="2" width="6" height="20" rx="3"/>
                                            </>
                                        ) : (
                                            <>
                                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                                <line x1="12" y1="19" x2="12" y2="23"/>
                                                <line x1="8" y1="23" x2="16" y2="23"/>
                                            </>
                                        )}
                                    </svg>
                                    {isListening ? 'Stop' : 'Speak'}
                                </button>
                                {hasRecordedVoice && !isListening && (
                                    <span className="voice-badge">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                            <polyline points="22 4 12 14.01 9 11.01"/>
                                        </svg>
                                        Voice Recorded
                                    </span>
                                )}
                                {isListening && (
                                    <span className="voice-status-listening">
                                        <span className="pulse-dot"></span>
                                        Listening...
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Text Input */}
                        <div className="text-input-container">
                            <textarea
                                className="input-field"
                                placeholder="Type or speak your description here... (e.g., 'Broken street light on Main Road near market')"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={5}
                            />
                            <div className="character-count">
                                {description.length} characters
                            </div>
                        </div>
                    </div>
                </section>

                {/* Submit Section */}
                <section className="dashboard-section">
                    <div className="submit-card">
                        <button
                            className="btn-submit-large"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="spinner-small"></div>
                                    Submitting Report...
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 2L11 13"/>
                                        <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                                    </svg>
                                    Submit Report
                                </>
                            )}
                        </button>

                        {!canSubmit && (
                            <div className="requirements-list">
                                <div className="requirement-item">
                                    <div className={`requirement-status ${capturedImage ? 'completed' : 'pending'}`}>
                                        {capturedImage ? '✓' : '○'}
                                    </div>
                                    <span>Photo captured</span>
                                </div>
                                <div className="requirement-item">
                                    <div className={`requirement-status ${location ? 'completed' : 'pending'}`}>
                                        {location ? '✓' : '○'}
                                    </div>
                                    <span>Location detected</span>
                                </div>
                                <div className="requirement-item">
                                    <div className={`requirement-status ${description.trim() ? 'completed' : 'pending'}`}>
                                        {description.trim() ? '✓' : '○'}
                                    </div>
                                    <span>Description provided</span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ReportIssue;
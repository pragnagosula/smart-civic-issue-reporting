import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/ReportIssue.css';

import { useTranslation } from 'react-i18next';

const ReportIssue = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // State
    const [stream, setStream] = useState(null);
    const [cameraError, setCameraError] = useState('');
    const [capturedImage, setCapturedImage] = useState(null); // base64
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState('');
    const [description, setDescription] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [voiceLanguage, setVoiceLanguage] = useState('en-IN');
    const [hasRecordedVoice, setHasRecordedVoice] = useState(false);
    // const [category, setCategory] = useState(''); // Removed for AI detection
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const recognitionRef = useRef(null);

    // 1. Initialize Camera & GPS on Mount
    useEffect(() => {
        startCamera();
        getLocation();

        // Cleanup
        return () => {
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Camera Logic
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Prefer back camera
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

    // 2. Capture Photo & Embed Metadata
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current || !location) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Embed Metadata
        const date = new Date();
        const timestamp = date.toLocaleString();
        const locString = `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`;

        // Overlay text styles
        context.globalAlpha = 0.6;
        context.fillStyle = "black";
        context.fillRect(10, canvas.height - 80, canvas.width - 20, 70);
        context.globalAlpha = 1.0;

        context.font = "20px Arial";
        context.fillStyle = "white";
        context.fillText(`Date: ${timestamp}`, 20, canvas.height - 55);
        context.fillText(locString, 20, canvas.height - 25);

        // Save as base64
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);

        // Stop stream after capture to save battery/processing
        stopCamera();
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        startCamera();
    };

    // 3. Voice Input Logic
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

    // 4. Submit Logic
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
            // issueCategory: Auto-detected by AI
            latitude: location.lat,
            longitude: location.lng,
            timestamp: new Date().toISOString(),
            citizenId: "FROM_JWT_MIDDLEWARE", // Backend should extract this
            status: "Reported"
        };

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/issues/report', payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log("Submission Success:", response.data);
            alert(response.data.message || "Issue reported successfully!"); // Show tailored message (Duplicate/Flagged/Success)
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
        <div className="report-container">
            <div className="dashboard-header">
                <h1>{t('report_new_issue')}</h1>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>{t('cancel')}</button>
            </div>

            {/* 1. Camera Section */}
            <section className="camera-section">
                <h2 className="section-title">📸 {t('capture_evidence')}</h2>
                <div className="media-container">
                    {!capturedImage && !stream && !cameraError && (
                        <div className="loading-overlay">{t('initializing_camera')}</div>
                    )}

                    {cameraError && (
                        <div className="loading-overlay" style={{ background: '#333' }}>
                            {cameraError}
                        </div>
                    )}

                    {/* Live Video */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ display: capturedImage ? 'none' : 'block' }}
                    />

                    {/* Image Preview (Canvas) */}
                    <canvas
                        ref={canvasRef}
                        style={{ display: capturedImage ? 'block' : 'none' }}
                    />

                    {/* Capture Button */}
                    {!capturedImage && stream && (
                        <button className="capture-btn" onClick={capturePhoto} title="Capture Photo"></button>
                    )}
                </div>

                {capturedImage && (
                    <button className="retake-btn btn" onClick={retakePhoto}>{t('retake_photo')}</button>
                )}
            </section>

            {/* 2. Details Section */}
            <section className="form-section">

                {/* Location Status */}
                <div className="mb-4">
                    {location ? (
                        <span className="location-badge">
                            📍 {t('location_fetched')}: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </span>
                    ) : (
                        <span style={{ color: 'var(--error-color)' }}>
                            {locationError || `📍 ${t('fetching_location')}`}
                        </span>
                    )}
                </div>

                {/* Voice Input */}
                <h2 className="section-title">🎤 {t('describe_issue')}</h2>
                <div className="input-group">
                    <div className="voice-controls">
                        <select
                            className="input-field"
                            style={{ width: '120px' }}
                            value={voiceLanguage}
                            onChange={(e) => setVoiceLanguage(e.target.value)}
                        >
                            <option value="en-IN">English</option>
                            <option value="hi-IN">Hindi</option>
                            <option value="te-IN">Telugu</option>
                        </select>

                        <button
                            className={`mic-btn ${isListening ? 'listening' : ''}`}
                            onClick={toggleListening}
                            title="Tap to Speak"
                        >
                            {isListening ? '⏹️' : '🎙️'}
                        </button>

                        <span className="voice-status">
                            {isListening ? t('listening') : (hasRecordedVoice ? `${t('voice_recorded')} ✅` : t('tap_mic'))}
                        </span>
                    </div>

                    <textarea
                        className="input-field"
                        placeholder={t('type_description')}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ minHeight: '80px' }}
                    />
                </div>



                {/* Submit */}
                <button
                    className="btn btn-primary submit-btn"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                >
                    {isSubmitting ? t('submitting') : t('submit_report')}
                </button>

                {!canSubmit && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                        {t('required_fields')}
                    </p>
                )}
            </section>
        </div>
    );
};

export default ReportIssue;

import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/OfficerRegister.css';

const OfficerRegister = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
    });
    const [document, setDocument] = useState(null);
    const [documentPreview, setDocumentPreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [processingStage, setProcessingStage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // File size validation
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        // File type validation
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setError('Only PDF, JPG, and PNG files are allowed');
            return;
        }

        setDocument(file);
        setError('');

        // Show preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setDocumentPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setDocumentPreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setProcessingStage('Uploading document...');

        if (!document) {
            setError("Please upload a supporting document.");
            setLoading(false);
            return;
        }

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('phone', formData.phone);
            data.append('department', formData.department);
            data.append('designation', formData.designation);
            data.append('document', document);

            setProcessingStage('Processing document with OCR...');

            const response = await axios.post('http://localhost:5000/api/auth/officer-register', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000, // 60 second timeout for OCR processing
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProcessingStage(`Uploading... ${percentCompleted}%`);
                }
            });

            setProcessingStage('Verifying with AI...');

            // Success - navigate to screening page with result
            navigate('/officer/screening', { 
                state: { 
                    officer: response.data.officer,
                    ocrInfo: response.data.ocr_info,
                    nextSteps: response.data.next_steps
                } 
            });

        } catch (err) {
            console.error('Registration error:', err);
            
            // Enhanced error messages
            if (err.code === 'ECONNABORTED') {
                setError('Request timeout. The document processing took too long. Please try with a clearer document.');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.data?.details) {
                const details = err.response.data.details;
                setError(`Document validation failed: ${details.extracted_length || 0} characters extracted (minimum 100 required). Confidence: ${details.confidence || '0%'}. Please upload a clearer document.`);
            } else {
                setError('Registration failed. Please try again.');
            }
            
            setProcessingStage('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="card split-card officer-card">
                <div className="auth-branding">
                    <div className="branding-content">
                        <div className="branding-logo">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <h2>CIVICFIX</h2>
                        </div>
                        <p>Streamlining urban governance with AI-powered reporting and transparent civic management.</p>
                        <Link to="/" className="branding-btn">Back to Home</Link>
                    </div>
                </div>
                
                <div className="auth-form-wrapper">
                    <div className="auth-header">
                        <div className="header-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <h2>Officer Registration</h2>
                        <p>Join the CivicFix team to manage and resolve civic issues</p>
                    </div>

                <div className="auth-body">
                    {error && (
                        <div className="error-message">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            </svg>
                            {error}
                        </div>
                    )}

                    {processingStage && (
                        <div className="processing-message">
                            <div className="processing-spinner"></div>
                            <span>{processingStage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="input-group">
                                <label>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Full Name *
                                </label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    className="input-field" 
                                    value={formData.name} 
                                    onChange={handleChange} 
                                    placeholder="Enter your full name"
                                    required 
                                    disabled={loading}
                                />
                            </div>
                            <div className="input-group">
                                <label>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                    Phone Number *
                                </label>
                                <input 
                                    type="tel" 
                                    name="phone" 
                                    className="input-field" 
                                    value={formData.phone} 
                                    onChange={handleChange} 
                                    placeholder="+91 98765 43210"
                                    required 
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                                Email Address *
                            </label>
                            <input 
                                type="email" 
                                name="email" 
                                className="input-field" 
                                value={formData.email} 
                                onChange={handleChange} 
                                placeholder="officer@example.com"
                                required 
                                disabled={loading}
                            />
                        </div>

                        <div className="form-row">
                            <div className="input-group">
                                <label>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                    Department *
                                </label>
                                <select 
                                    name="department" 
                                    className="input-field" 
                                    value={formData.department} 
                                    onChange={handleChange} 
                                    required
                                    disabled={loading}
                                >
                                    <option value="">Select Department</option>
                                    <option value="Roads">Roads & Infrastructure</option>
                                    <option value="Water Supply">Water Supply</option>
                                    <option value="Sanitation">Sanitation & Hygiene</option>
                                    <option value="Drainage">Drainage System</option>
                                    <option value="Street Lighting">Street Lighting</option>
                                    <option value="Solid Waste Management">Solid Waste Management</option>
                                    <option value="Parks">Parks & Recreation</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    Designation
                                </label>
                                <input 
                                    type="text" 
                                    name="designation" 
                                    className="input-field" 
                                    value={formData.designation} 
                                    onChange={handleChange} 
                                    placeholder="e.g., Junior Engineer, Inspector"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="input-group file-input-group">
                            <label>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <polyline points="10 9 9 9 8 9" />
                                </svg>
                                Supporting Document *
                            </label>
                            <div className="file-hint">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                <p>
                                    Upload <strong>Appointment Letter</strong> or <strong>Government ID</strong> for verification.
                                    <br />
                                    <small>Accepted formats: PDF, JPG, PNG (Max 5MB). Document will be processed with OCR.</small>
                                </p>
                            </div>
                            
                            <div className="file-upload-container">
                                <input 
                                    type="file" 
                                    id="document-upload"
                                    accept=".pdf,.jpg,.jpeg,.png" 
                                    className="file-input" 
                                    onChange={handleFileChange} 
                                    required 
                                    disabled={loading}
                                />
                                <label htmlFor="document-upload" className="file-upload-label">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    {document ? document.name : 'Choose file or drag here'}
                                </label>
                            </div>

                            {documentPreview && (
                                <div className="document-preview">
                                    <img src={documentPreview} alt="Document preview" />
                                </div>
                            )}

                            {document && (
                                <div className="file-info">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                                    </svg>
                                    <span>{document.name} ({(document.size / 1024).toFixed(2)} KB)</span>
                                </div>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary submit-btn" 
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loader"></span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    Register & Verify
                                </>
                            )}
                        </button>

                        <p className="form-footer">
                            Already registered? <a href="/login" className="link">Login here</a>
                        </p>
                    </form>
                </div>
                </div>
            </div>
        </div>
    );
};

export default OfficerRegister;
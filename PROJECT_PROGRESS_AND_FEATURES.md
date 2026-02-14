# Civic Issue Resolution Platform - Project Status & Documentation

## 🚀 Project Overview
A smart civic-tech platform empowering citizens to report issues (potholes, garbage, etc.) and officers to resolve them with accountability. The system features AI-driven categorization, duplicate detection, officer screening, and a robust citizen feedback loop to ensure genuine resolutions.

---

## 🛠️ Technology Stack

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: PostgreSQL (Neon DB)
*   **ORM/Query Builder**: `postgres` (tagged template literals)
*   **AI/ML Service**: Python (FastAPI/Flask) + `scikit-learn` / `sentence-transformers` (for text similarity)
*   **Image Processing**: Cloudinary (Storage), Tesseract.js (OCR), `pdf-parse` (Document Extraction)
*   **Scheduling**: `setInterval` (Custom Cron Service)

### Frontend
*   **Framework**: React.js (Vite)
*   **Styling**: CSS Modules / Vanilla CSS (Glassmorphism Design)
*   **Maps**: Google Maps Links / Geolocation API

### Key Libraries & Tools
*   **Auth**: JWT (JSON Web Tokens), `bcrypt`
*   **Validation**: Custom middleware
*   **Email**: Nodemailer (Notifications)

---

## ✅ Features Completed & Implementation Details

### 1. 🔐 Authentication & Roles (RBAC)
*   **Features**:
    *   Unified Login/Signup for Citizens, Officers, and Admins.
    *   Role-Based protection for routes (`authMiddleware`).
    *   Secure Password Hashing (`bcrypt`).
*   **Implementation**: Steps to verify user existence, hash comparison, and JWT token issuance containing `id` and `role`.

### 2. 📢 Smart Citizen Reporting
*   **Features**:
    *   **Voice-to-Text**: Citizens can describe issues via voice.
    *   **Geo-Tagging**: Auto-capture of GPS coordinates.
    *   **Evidence Upload**: Image upload via Cloudinary.
*   **AI Integration**:
    *   **Categorization**: AI analyzes description/image to assign category (Roads, Sanitation, etc.).
    *   **Urgency/Flagging**: AI detects sensitive/abusive content.
    *   **Duplicate Detection**: System checks 7-day history + 200m radius. If a match is found -> Links to **Master Issue** & increments `affected_citizen_count`.

### 3. 👮 Officer Onboarding & AI Screening
*   **Features**:
    *   Officer Registration with Document Upload (ID/Authorization Letter).
    *   **Automated Vetting**: AI reads the document (PDF/Image OCR).
*   **Logic**:
    *   Extract text -> Send to AI -> Check for keywords (Department, "Authorized").
    *   **Score < 50**: Auto-Reject.
    *   **Score 50-80**: Pending Admin Review.
    *   **Score > 80**: Auto-Approve.

### 4. 📋 Officer Dashboard & Workflow
*   **Features**:
    *   Default view of assigned issues.
    *   **Accept/Reject**: Officers can reject issues (wrong dept/location).
    *   **Rejection Handling**: 3 Rejections -> Auto-Escalate to Admin.
    *   **Resolution Proof**: To mark "Resolved", Officer MUST upload a photo & share GPS location.

### 5. 🤝 The "Trust Layer" (Feedback Loop)
*   **Features**:
    *   **Citizen Verification**: When an issue is "Resolved", citizens get a notification.
    *   **Proof Display**: Citizens see Officer's photo + Map location of resolution.
    *   **Voting System**:
        *   **YES (Resolved)**: If > 60% consensus -> Status: **CLOSED**.
        *   **NO (Not Resolved)**: If majority NO -> Status: **REOPENED**.
    *   **Star Rating**: Citizens rate the quality (1-5 Stars).

### 6. 🧠 governance & Integrity (Advanced)
*   **State Machine**:
    *   Strict transitions: `Reported` -> `Assigned` -> `In Progress` -> `Resolved`.
    *   **Lock**: `Closed` issues cannot be edited.
*   **Automated Deadlines (Cron)**:
    *   Runs every minute. Checks for issues `Resolved` > 72 hours ago.
    *   Auto-closes if no negative feedback.
*   **Escalation Protocol**:
    *   If an issue is **Reopened > 2 times** (3 failed fixes) -> Status: `Escalated` (Admin Locked).
*   **Impact Metrics**:
    *   Tracks `affected_citizen_count` (aggregated from duplicates).

---

## 📡 API Routes Summary

### Auth (`/api/auth`)
*   `POST /signup` - Register Citizen/Officer
*   `POST /login` - Login & Get Token
*   `POST /admin-login` - Specific Admin Entry

### Issues (`/api/issues`)
*   `POST /report` - Submit new issue (Text/Voice/Img)
*   `GET /my-issues` - Citizen's history
*   `GET /:id` - Detailed view (Proof, AI Status)

### Officer (`/api/officer`)
*   `GET /dashboard` - Get assigned/department issues
*   `PUT /update-status/:id` - Change status (Verified -> In Progress -> Resolved)
    *   *Payload for Resolved*: `{ status: 'Resolved', image: url, latitude: 12.3, longitude: 78.9 }`

### Feedback (`/api/feedback`)
*   `POST /:issueId` - Submit Vote & Rating
    *   *Payload*: `{ response: 'Resolved'|'Not Resolved', rating: 4, comment: "..." }`

---

## 📝 Session Summary (Recent Work)

**Objective**: Build a robust "Citizen Feedback Loop" and "Resolution Integrity System".

**Key Achievements**:
1.  **Implemented Resolution Proof**: Modified Officer Dashboard to force Camera/GPS capture before "Resolving".
2.  **Developed Feedback Logic**: Created the 60% Majority Rule algorithms in `feedbackController`.
3.  **Added Ratings**: Integrated 1-5 Star rating system into the DB and UI.
4.  **Built Safety Nets**:
    *   **72h Auto-Close**: Cron job implementation.
    *   **Reopen Escalation**: Prevents infinite loops of bad fixes.
    *   **Duplicate Impact**: Added metrics to track how many users are affected by one issue.
5.  **Refined UI**: Added status badges (Closed/Reopened) and improved the details page.

**Current State**: The system is feature-complete for the core "Report-to-Resolution" flow with high-fidelity governance features installed.

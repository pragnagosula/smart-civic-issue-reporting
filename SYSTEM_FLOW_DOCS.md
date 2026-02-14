# System Flow & API Documentation

This document outlines the complete flow of the application, including user authentication, officer registration with AI screening, admin management, and the underlying API structure.

## 1. User Roles
The system supports three distinct user roles:
- **Citizen**: Can report issues and view their status.
- **Officer**: Can view assigned issues (requires verification).
- **Admin**: Manages officer approvals and system oversight.

## 2. Authentication Flow (Common)
All users authenticate via Email & OTP. There are no passwords.

### Flow:
1.  **Frontend**: User enters email on Login page.
2.  **API**: `POST /api/auth/login`
    *   Generates 6-digit OTP.
    *   Sends OTP via Email (Nodemailer).
    *   Updates DB with OTP and expiry.
3.  **Frontend**: User enters OTP.
4.  **API**: `POST /api/auth/login-verify`
    *   Validates OTP.
    *   **Returns JWT Token** & User details (`role`, `is_verified`, etc.).
5.  **Frontend Redirect**:
    *   `admin` -> `/admin/dashboard`
    *   `officer` -> `/officer/dashboard`
    *   `citizen` -> `/dashboard`

---

## 3. Officer Registration & AI Screening Flow
This is the core feature for vetting government officers using AI.

### Step 1: Registration
*   **Page**: `/officer/register`
*   **Input**: Name, Department, Designation, **Document (PDF/Image)**.
*   **API**: `POST /api/auth/officer-register`

### Step 2: Backend Processing
Inside `officerController.js`:
1.  **Text Extraction**:
    *   Uses `pdf-parse` for PDFs.
    *   Falls back to `tesseract.js` (OCR) if text is insufficient (< 50 chars).
2.  **Cloudinary Upload**:
    *   Uploads the physical file to Cloudinary for permanent storage.
    *   Returns a secure URL (`document_url`).
3.  **AI Screening Request**:
    *   Sends extracted text + department to Python AI Service (`http://localhost:8000/screen-officer`).

### Step 3: AI Service Logic (Python)
Inside `main.py`:
1.  **Normalization**: Cleans text.
2.  **Keyword Matching**: Checks against department specific keywords (e.g., "roads" -> "pothole", "asphalt").
3.  **Semantic Similarity**: Uses `SentenceTransformer` (`all-MiniLM-L6-v2`) to compare document text with department description.
4.  **Scoring**:
    *   `Final Score = (Semantic Score * 0.6) + (Keyword Score * 0.4)`
5.  **Decision Thresholds**:
    *   **Score >= 0.60** -> `APPROVED` (Reason: Strong match)
    *   **Score >= 0.35** -> `PENDING_REVIEW` (Reason: Moderate match)
    *   **Score < 0.35** -> `REJECTED` (Reason: Weak match)

### Step 4: Account Status Assignment
Back in Node.js, the AI result determines the `account_status`:
*   `APPROVED` -> **ACTIVE** (Direct access)
*   `PENDING_REVIEW` -> **ADMIN_REVIEW** (Needs Admin approval)
*   `REJECTED` -> **REJECTED** (No access)

---

## 4. Admin Workflow & Security
The Admin dashboard is strictly protected.

### Admin Login Instructions
**You cannot "Sign Up" as an admin via the UI.** You must use the pre-configured admin credentials.

1.  **Go to Login Page**: `/login`
2.  **Enter Email**: `sneha.amballa0804@gmail.com`
3.  **Enter Password**: The system detects the admin email and shows a password field instead of Sending OTP. Enter the `ADMIN_SECRET` from your `.env` file.
4.  **Redirect**: System validates credentials and sends you to `/admin/dashboard`.

*(Note: Ensure this user exists in your database with `role = 'admin'`. If not, run the SQL command below).*

### Admin Security Middleware
Located in `middleware/adminMiddleware.js`.
Every request to `/api/admin/*` is checked for:
1.  **Valid JWT Token**.
2.  **User Role** must be `admin`.
3.  **User Email** must match `.env` (`sneha.amballa0804@gmail.com`).
4.  **Header `x-admin-secret`** must match `.env` secret.

### Admin Dashboard Features
*   **View Pending**: lists officers with status `ADMIN_REVIEW`.
    *   Shows: Name, Department, AI Score, AI Reason, Link to Document.
*   **Approve**: Calls `POST /api/admin/approve/:id`. Sets status to `ACTIVE`.
*   **Reject**: Calls `POST /api/admin/reject/:id`. Sets status to `REJECTED`.

---

## 5. Database Schema (Key Fields)
Table: `users`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Serial | Primary Key |
| `email` | String | Unique Identifier |
| `role` | String | `citizen`, `officer`, `admin` |
| `account_status` | String | `ACTIVE`, `ADMIN_REVIEW`, `REJECTED`, `PENDING` |
| `ai_score` | Float | Score from 0.0 to 1.0 |
| `ai_result` | String | `APPROVED`, `PENDING_REVIEW`, `REJECTED` |
| `document_url` | String | Cloudinary URL |
| `is_verified` | Boolean | True if OTP verified AND (Officer Approved or Citizen) |

---

## 6. How to Initialize Admin (SQL)
If you cannot login as admin, run this in your Neon SQL Editor:

```sql
INSERT INTO users (name, email, phone, role, account_status, is_verified)
VALUES (
    'Super Admin', 
    'sneha.amballa0804@gmail.com', 
    '0000000000', 
    'admin', 
    'ACTIVE', 
    true
) 
ON CONFLICT (email) 
DO UPDATE SET role = 'admin', account_status = 'ACTIVE';
```

---

## 7. API Routes Summary

### Auth
*   `POST /api/auth/signup` - (Citizens only)
*   `POST /api/auth/login` - Send OTP
*   `POST /api/auth/login-verify` - Verify & Token
*   `POST /api/auth/officer-register` - Upload & AI Screen

### Admin
*   `GET /api/admin/pending-officers`
*   `POST /api/admin/approve/:id`
*   `POST /api/admin/reject/:id`

## 8. Issue Resolution Flow (Officer)
Core feature for maintaining accountability.

### Step 1: Officer Marks "Resolved"
*   **Action**: Selects "Resolved" status in Dashboard.
*   **Requirement**: Officer MUST upload a "Resolution Proof" image.
*   **System Action**: Captures GPS Location automatically.

### Step 2: Backend Processing
*   **Backend API**: `PATCH /api/officer/issue/:id/status`
*   **Uploads**: Image to Cloudinary (`resolution_proofs` folder).
*   **Updates Database**:
    *   `status` = 'Resolved'
    *   `resolved_at` = SERVER TIME
    *   `resolution_image_url` = Cloudinary URL
    *   `resolution_lat`, `resolution_lng` = Officer's GPS Coords
    *   `resolution_proof_metadata` = User Agent + IP

### Step 3: Notification
*   **Citizen**: Receives "Issue Resolved" notification + Request for Feedback.

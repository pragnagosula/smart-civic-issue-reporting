# Comprehensive QA Test Plan for Civic Issue Resolution Platform

This document outlines a complete test plan covering all aspects of the system, including functional, integration, security, and edge case scenarios.

## 1. Functional Tests

### 1.1 Authentication & User Management
- [ ] **Citizen Signup/Login**:
    - Validate email format and uniqueness.
    - Verify OTP generation, email delivery, and verification logic.
    - specific test: Register a new user, verify DB entry has `role='citizen'`.
- [ ] **Officer Registration**:
    - complete form with valid PDF/Image.
    - Verify user created with `account_status='PENDING'` (or 'ACTIVE' if AI score high).
    - specific test: Upload a blank PDF and verify error message asking for clearer text.
- [ ] **Admin Login**:
    - authenticate with hardcoded env credentials.
    - Verify access to Admin Dashboard.

### 1.2 Issue Reporting (Citizen)
- [ ] **Text Report**: Submit issue with text description, location, and info. Verify DB entry.
- [ ] **Voice Report**: Submit using voice-to-text. Verify `voice_text` is saved and translated.
- [ ] **Image Upload**: Upload standard JPEG/PNG. Verify Cloudinary URL is saved in DB.
- [ ] **Location/Map**: Verify latitude/longitude are correctly captured and saved.

### 1.3 Officer Workflow
- [ ] **Dashboard View**: Officer sees only issues for their `department` or assigned to them.
- [ ] **Status Update**:
    - Move from `Assigned` -> `In Progress`.
    - Move from `In Progress` -> `Resolved`.
- [ ] **Resolution Proof**: Attempt to resolve *without* photo/location. Should fail.
- [ ] **Rejection**: Reject an issue. Verify `rejection_count` increments and officer is unassigned.

### 1.4 Citizen Feedback
- [ ] **Voting**:
    - Vote "Resolved" (Yes). Verify stats update.
    - Vote "Not Resolved" (No). Verify stats update.
- [ ] **Impact**: Verify `affected_citizen_count` updates correctly on Master Issue.

---

## 2. Integration Tests

### 2.1 Backend <-> Database
- [ ] Verify foreign key constraints (e.g., `citizen_id` links to valid `users`).
- [ ] Verify transaction atomicity (e.g., when issue is duplicated, both `issues` status update and `issue_citizens` insert happen or fail together).

### 2.2 Backend <-> AI Service (found at localhost:8000)
- [ ] **Connection**: Verify backend can reach Python service.
- [ ] **Categorization**: Send distinct text ("pothole road") and verify category "Roads".
- [ ] **Screening**: Send dummy officer doc text and verify valid `ai_score` returned.

### 2.3 Backend <-> Cloudinary
- [ ] Upload image via `/api/issues/report`. Verify returned URL is accessible.
- [ ] Test large file upload (>10MB). Should fail gracefully.

### 2.4 Backend <-> Gemini Translation
- [ ] Send text in Hindi. Verify `description` JSON contains keys `en`, `hi`, `te`.
- [ ] Disconnect internet/mock failure. Verify fallback to original text.

---

## 3. Security Tests

### 3.1 Role-Based Access Control (RBAC)
- [ ] **Citizen Privilege Escalation**: Try accessing `/api/admin/all-issues` with a Citizen JWT. Expect `403 Forbidden`.
- [ ] **Officer Data Leak**: Try accessing issues from another department. Expect filtered list.
- [ ] **Horizontal Privilege Escalation**: Try getting details of another citizen's issue (if not linked).

### 3.2 Input Validation
- [ ] **SQL Injection**: Attempt to inject SQL in `description` field. (Postgres library should handle this, but verify).
- [ ] **XSS**: Inject `<script>alert(1)</script>` in feedback comments. Verify it is escaped on retrieval.
- [ ] **File Type Validation**: Attempt to upload `.exe` or `.sh` file as proof. Expect `400 Bad Request`.

### 3.3 Authentication Security
- [ ] **Token Expiry**: Use an expired JWT. Expect `401 Unauthorized`.
- [ ] **Brute Force**: Attempt multiple OTP verifications with wrong code. (Check if rate limiting exists).

---

## 4. Edge Case Tests

- [ ] **Zero-Location**: Submit report with lat/long = 0,0 (Null Island).
- [ ] **Max Content**: Submit description with 10,000+ characters.
- [ ] **Concurrent Updates**: Two officers try to update the same issue status simultaneously.
- [ ] **Empty Files**: Upload 0-byte image or PDF.
- [ ] **Orphaned Records**: Delete a user and verify their issues remain (or cascade delete properly).

---

## 5. State Machine Validation Tests

Based on `officerController.js` logic:

- [ ] **Invalid Transition**: updates status directly from `Reported` to `Closed`. Expect Error.
- [ ] **Locked State**: Try to update a `Closed` issue to `In Progress`. Expect Error.
- [ ] **Rejection Limit**:
    - Reject issue 1st time -> Reassigns.
    - Reject issue 2nd time -> Reassigns.
    - Reject issue 3rd time -> Status changes to `Escalated`.

---

## 6. Multilingual Cross-Language Tests

- [ ] **Input**: Citizen speaks in Telugu.
- [ ] **Processing**: Verify Gemini translates to English.
- [ ] **Output**: Officer (English pref) sees English text.
- [ ] **Re-Output**: Citizen sees their original Telugu text in `my-issues`.
- [ ] **Mixed Language**: Report with mixed Hindi/English words. Verify AI still categorizes correctly (requires English translation to work).

---

## 7. AI Validation Tests

- [ ] **Unclear Input**: Submit report "Something is wrong". Verify `ai_confidence` is low.
- [ ] **Flagged Content**: Submit report with abusive text. Verify `ai_status` becomes `FLAGGED`.
- [ ] **Officer Doc Screening**:
    - Text < 50 chars -> Auto Reject (Client side or server check).
    - Text matches "Roads" keyword -> High Match Score.
    - Text matches "Water" keyword but applying for "Roads" -> Low Score.

---

## 8. Duplicate Handling Tests

- [ ] **Exact Duplicate**: Submit same text/image/location 1 minute later. Verify `status='Duplicate'` and `master_issue_id` is set.
- [ ] **Near Duplicate**: Submit slightly different text but same location/category within 7 days.
- [ ] **Impact Count**: Report duplicate. Verify Master Issue's `affected_citizen_count` increases by 1.
- [ ] **Distance Check**: Submit same issue > 500m away. Should NOT be a duplicate.

---

## 9. Background Job Tests (Pending Implementation)

*Current status: `cronJob.js` logic is empty. These tests are for after implementation.*

- [ ] **Auto-Close**: Mock issue resolved 73 hours ago with no feedback. Run cron. Status should change to `Closed`.
- [ ] **Stale Issues**: Identify issues `In Progress` > 7 days. Verify notification sent to officer/admin.

---

## 10. Failure Simulation Tests

- [ ] **AI Service Down**: Stop the Python server. Submit report.
    - Expected: Report saved as `Uncategorized` or default, error logged, user not blocked.
- [ ] **Cloudinary Down**: Simulate network failure to CDN.
    - Expected: Report fails gracefully (Client Error) OR queues retry.
- [ ] **Database Timeout**: Simulate slow query.
    - Expected: API returns `504 Gateway Timeout` or `500 Error` safely.

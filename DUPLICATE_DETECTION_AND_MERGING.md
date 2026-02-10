# 🔄 Duplicate Detection & Crowdsourcing Mechanism

## 1. 🎯 Overview

The goal of this system is to prevent duplicate work for officers while allowing unlimited citizens to report the same issue (crowdsourcing). Instead of blocking duplicates, we **merge** them into a single "Master Issue" and notify all contributors.

### **Core Philosophy**
> "One Problem, One Ticket, Many Reporters."

---

## 2. 🏗️ High-Level Architecture

The process runs automatically during the `reportIssue` flow.

1.  **Frontend**: Citizen submits report (Text + Location + Image).
2.  **Backend (Node.js)**:
    *   Checks for related issues in the database (SQL Filter).
    *   If candidates exist, asks AI to compare meanings.
3.  **AI Service (Python)**:
    *   Computes **Semantic Similarity** (Text) + **Spatial Proximity** (Distance) + **Temporal Proximity** (Time).
    *   Returns a Similarity Score.
4.  **Backend Decision**:
    *   **Score ≥ 0.75**: It's a Duplicate. Link to Master Issue.
    *   **Score < 0.75**: It's a New Issue.
5.  **Database**: Updates `issues` table and new `issue_citizens` tracking table.

---

## 3. 🚦 Step-by-Step Internal Flow

### **Phase 1: Candidate Filtering (SQL Layer)**
Before invoking AI (which is expensive), we use a cheap SQL query to find potential matches.
*   **Criteria**:
    *   Same `category` (e.g., both "Roads").
    *   Status is `Reported`, `In Progress`, or `Verified`.
    *   Created within the last **7 Days**.
    *   Located within **200 meters** (using Haversine Formula).

```sql
SELECT id, voice_text, latitude, longitude FROM issues
WHERE category = 'Roads'
AND created_at >= NOW() - INTERVAL '7 days'
AND (6371 * acos(...)) <= 0.2  -- Approx 200m
```

### **Phase 2: AI Similarity Check**
If SQL finds candidates, Backend sends them to AI.

*   **API Call**: `POST http://localhost:8000/check-duplicate`
*   **Payload**:
    ```json
    {
      "new_text": "Deep pothole near the big tree",
      "new_lat": 12.9716, "new_lng": 77.5946,
      "candidates": [
        { "id": 101, "text": "Bad road condition", "latitude": 12.9718, ... }
      ]
    }
    ```

### **Phase 3: AI Scoring Algorithm**
The Python service calculates a composite score:

1.  **Semantic Score (50%)**: `CosineSimilarity(Vector(New), Vector(Existing))`
    *   "Big Pothole" ≈ "Bad Road" -> 0.85
2.  **Distance Score (30%)**: Closer = Higher Score.
    *   0m = 1.0, 200m = 0.0
3.  **Time Score (20%)**: Newer = Higher Score.
    *   Same hour = 1.0, 7 days ago = 0.0

> **Formula**: `Score = (0.5 * Semantic) + (0.3 * Distance) + (0.2 * Time)`

If `Score >= 0.75` -> **DUPLICATE DETECTED**.

### **Phase 4: Merging & Storing**

#### **Case A: It IS a Duplicate**
1.  **Insert Issue**:
    *   `status`: `'Duplicate'`
    *   `master_issue_id`: `101` (ID of the existing match)
2.  **Link Citizen**:
    *   Insert into `issue_citizens (issue_id, citizen_id) VALUES (101, CurrentUser)`.

#### **Case B: It is NEW**
1.  **Insert Issue**:
    *   `status`: `'Reported'`
    *   `master_issue_id`: `NULL`
2.  **Link Citizen**:
    *   Insert into `issue_citizens (issue_id, citizen_id) VALUES (NewID, CurrentUser)`.

---

## 4. 🗄️ Database Schema for Deduplication

### **Table: `issues`**
| Column | Type | New Purpose |
| :--- | :--- | :--- |
| `id` | Serial | Unique ID for every report. |
| `status` | Varchar | Now includes `'Duplicate'`. |
| `master_issue_id` | Integer | (Self-Ref IF) Points to the "Real" issue if this is a dupe. |

### **Table: `issue_citizens` (New)**
Tracks *all* people interested in a specific issue.

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `issue_id` | Integer | The Master Issue ID. |
| `citizen_id` | UUID | User interested in this issue. |
| `created_at` | Timestamp | When they reported/subscribed. |

---

## 5. 🔗 API Routes

### **1. Report Issue (Modified)**
*   **Endpoint**: `POST /api/issues/report`
*   **Logic**:
    *   Runs Deduplication Check.
    *   Returns `"status": "Duplicate"` if merged.
    *   Frontend should show: *"Thanks! We linked your report to an existing issue nearby."*

### **2. AI Check Duplicate (Internal)**
*   **Endpoint**: `POST /check-duplicate`
*   **Host**: `localhost:8000`
*   **Response**:
    ```json
    {
      "is_duplicate": true,
      "master_issue_id": 101,
      "score": 0.89
    }
    ```

---

## 6. ✅ Future Extensibility
This system is designed to scale:
*   **Notifications**: When the Master Issue updates (e.g., "Resolved"), we can query `issue_citizens` and notify **all 50 people** who reported it, not just the first one.
*   **Vote Counting**: We can easily count `SELECT count(*) FROM issue_citizens WHERE issue_id = X` to see how popular/severe an issue is.

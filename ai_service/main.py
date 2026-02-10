from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
import uvicorn

app = FastAPI()

print("Loading text model...")
text_model = SentenceTransformer("all-MiniLM-L6-v2")
print("Text model loaded.")

# ===============================
# DEPARTMENT KNOWLEDGE BASE
# ===============================
DEPARTMENT_PROFILES = {
    "roads": [
        "road maintenance",
        "potholes",
        "street repair",
        "asphalt",
        "pavement",
        "footpath",
        "road infrastructure",
        "public works",
        "road safety",
        "street inspection",
        "drainage along roads",
        "civic road complaints"
    ],
    "water": [
        "water supply",
        "pipeline",
        "water leakage",
        "drinking water",
        "valve repair",
        "water distribution"
    ],
    "sanitation": [
        "garbage",
        "waste collection",
        "cleanliness",
        "sanitation workers",
        "solid waste"
    ],
    "streetlight": [
        "streetlight",
        "lamp post",
        "lighting",
        "electrical maintenance"
    ]
}

class OfficerScreeningRequest(BaseModel):
    text: str
    department: str
    designation: str | None = None
    document_url: str | None = None

def normalize(text: str) -> str:
    return text.lower().strip()

@app.post("/screen-officer")
def screen_officer(request: OfficerScreeningRequest):
    try:
        if not request.text or len(request.text.strip()) < 100:
            return {
                "ai_score": 0.0,
                "ai_result": "NOT_CHECKED",
                "ai_reason": "Insufficient readable document text"
            }

        department = normalize(request.department)
        if department not in DEPARTMENT_PROFILES:
            return {
                "ai_score": 0.0,
                "ai_result": "FLAGGED",
                "ai_reason": f"Unknown department: {request.department}"
            }

        doc_text = normalize(request.text)
        keywords = DEPARTMENT_PROFILES[department]

        keyword_hits = sum(1 for kw in keywords if kw in doc_text)
        keyword_score = keyword_hits / len(keywords)

        reference_text = f"{department} department responsibilities include " + ", ".join(keywords)

        doc_embedding = text_model.encode(doc_text)
        ref_embedding = text_model.encode(reference_text)

        semantic_score = float(util.cos_sim(doc_embedding, ref_embedding)[0][0])
        final_score = (semantic_score * 0.6) + (keyword_score * 0.4)

        if final_score >= 0.60:
            result = "APPROVED"
            reason = "Strong match with department responsibilities"
        elif final_score >= 0.35:
            result = "PENDING_REVIEW"
            reason = "Moderate match, requires manual verification"
        else:
            result = "REJECTED"
            reason = "Weak or no match with department responsibilities"

        return {
            "ai_score": round(final_score, 2),
            "ai_result": result,
            "ai_reason": reason
        }

    except Exception as e:
        print("AI ERROR:", str(e))
        raise HTTPException(status_code=500, detail="AI screening failed")

@app.get("/")
def health():
    return {"status": "Officer AI Service Running"}


class IssueAnalysisRequest(BaseModel):
    image: str | None = None
    text: str | None = None

@app.post("/analyze")
def analyze_issue(request: IssueAnalysisRequest):
    try:
        text = request.text or ""
        # If no text, we can't do much with just local embedding model for images
        # In a real app, we would use a VLM (Vision Language Model) here.
        if not text or len(text.strip()) < 5:
             return {
                "category": "Uncategorized",
                "ai_status": "PENDING_REVIEW",
                "ai_confidence": 0.0,
                "ai_reason": "No description provided for analysis"
            }

        # Classify based on text
        norm_text = normalize(text)
        embedding = text_model.encode(norm_text)
        
        best_category = "Uncategorized"
        best_score = 0.0
        
        for dept, keywords in DEPARTMENT_PROFILES.items():
             # Create a prototype sentence for the department
             ref_text = f"This is an issue regarding {dept}. " + ", ".join(keywords)
             ref_embedding = text_model.encode(ref_text)
             
             score = float(util.cos_sim(embedding, ref_embedding)[0][0])
             
             if score > best_score:
                 best_score = score
                 best_category = dept.capitalize()

        if best_score > 0.4:
            return {
                "category": best_category,
                "ai_status": "CATEGORIZED",
                "ai_confidence": round(best_score, 2),
                "ai_reason": f"Matched with {best_category} related terms"
            }
        elif best_score < 0.25:
             return {
                "category": "Flagged",
                "ai_status": "FLAGGED",
                "ai_confidence": round(best_score, 2),
                "ai_reason": "Content seems irrelevant or unintelligible"
            }
        else:
             return {
                "category": "Uncategorized",
                "ai_status": "PENDING_REVIEW",
                "ai_confidence": round(best_score, 2),
                "ai_reason": "Low confidence in automatic categorization"
            }

    except Exception as e:
        print("ANALYSIS ERROR:", str(e))
        return {
            "category": "Uncategorized",
            "ai_status": "ERROR",
            "ai_confidence": 0.0,
            "ai_reason": "AI Service Error"
        }

# ===============================
# DUPLICATE DETECTION API
# ===============================
from typing import List

class CandidateIssue(BaseModel):
    id: int
    text: str
    latitude: float
    longitude: float
    hours_diff: float # Time difference in hours

class DuplicateCheckRequest(BaseModel):
    new_text: str
    new_lat: float
    new_lng: float
    candidates: List[CandidateIssue]

@app.post("/check-duplicate")
def check_duplicate(request: DuplicateCheckRequest):
    try:
        if not request.candidates:
            return {"is_duplicate": False, "master_issue_id": None, "score": 0.0}

        new_embedding = text_model.encode(request.new_text or "")
        
        best_match_id = None
        highest_score = 0.0
        
        for candidate in request.candidates:
            # 1. Semantic Text Similarity (0.5 weight)
            cand_embedding = text_model.encode(candidate.text or "")
            semantic_sim = float(util.cos_sim(new_embedding, cand_embedding)[0][0])
            
            # 2. Distance Score (0.3 weight) - Pre-filtered by DB but closer is better
            # Assume strict filter is 200m. 
            # We don't have exact distance here unless passed, but we can approximate or assume DB filter is enough.
            # User Algorithm: (0.3 * distance_score). Let's assume passed candidates are close.
            # We'll calculate simple euclidean for score component as a proxy for Haversine on small scale
            # Or simplified: if it's in the list, it's "close enough" for base score, but we can refine.
            # Let's use 1.0 for distance score for now since DB did the heavy lifting of 200m radius.
            distance_score = 1.0 
            
            # 3. Time Proximity (0.2 weight)
            # 7 days = 168 hours. Score = 1 - (diff / 168)
            time_score = max(0, 1 - (candidate.hours_diff / 168.0))
            
            # Composite Score
            # duplicate_score = (0.5 × text_similarity) + (0.3 × distance_score) + (0.2 × time_proximity)
            # *Refinement*: The user spec says distance score is a component.
            # If we assume DB filter = 100% score? No, closer is better.
            # Let's say 200m = 0 score, 0m = 1 score.
            # We unfortunately don't have the exact distance passed in request, only lat/lng.
            # Let's calculate rough distance (Euclidean on lat/lng is okay for small diffs 0.002 approx 200m)
            deg_diff = ((request.new_lat - candidate.latitude)**2 + (request.new_lng - candidate.longitude)**2)**0.5
            # 0.002 degrees is approx 220m.
            distance_score = max(0, 1 - (deg_diff / 0.002))

            duplicate_score = (0.5 * semantic_sim) + (0.3 * distance_score) + (0.2 * time_score)
            
            if duplicate_score > highest_score:
                highest_score = duplicate_score
                best_match_id = candidate.id

        # Threshold decision
        is_duplicate = highest_score >= 0.75
        
        return {
            "is_duplicate": is_duplicate,
            "master_issue_id": best_match_id if is_duplicate else None,
            "score": round(highest_score, 2)
        }

    except Exception as e:
        print("DUPLICATE CHECK ERROR:", str(e))
        return {"is_duplicate": False, "master_issue_id": None, "score": 0.0}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

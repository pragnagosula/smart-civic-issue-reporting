from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
from transformers import CLIPProcessor, CLIPModel, MarianMTModel, MarianTokenizer
from PIL import Image
from typing import List
import uvicorn
import base64
import io
import torch
from langdetect import detect as detect_lang

app = FastAPI()

# ===============================
# LOAD MODELS (DEFERRED)
# ===============================
text_model = None
clip_model = None
clip_processor = None
translate_tokenizer = None
translate_model = None

@app.on_event("startup")
def load_models():
    global text_model, clip_model, clip_processor, translate_tokenizer, translate_model
    try:
        print("Loading SentenceTransformer...")
        text_model = SentenceTransformer("all-MiniLM-L6-v2")
        print("SentenceTransformer Loaded.")

        print("Loading CLIP...")
        clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        print("CLIP Loaded.")

        print("Loading translation model...")
        TRANSLATION_MODEL = "Helsinki-NLP/opus-mt-mul-en"
        translate_tokenizer = MarianTokenizer.from_pretrained(TRANSLATION_MODEL)
        translate_model = MarianMTModel.from_pretrained(TRANSLATION_MODEL)
        print("Translation model loaded.")
    except Exception as e:
        print(f"Failed to load models during startup: {e}")

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
        "road damage"
    ],
    "water": [
        "water supply",
        "pipeline",
        "water leakage",
        "drinking water"
    ],
    "sanitation": [
        "garbage",
        "waste collection",
        "cleanliness"
    ],
    "streetlight": [
        "streetlight",
        "lamp post",
        "lighting"
    ]
}

CIVIC_PROMPTS = [
    "A real-world outdoor public road with potholes, cracks, or damaged asphalt",
    "A real-world outdoor public area with garbage, litter, or overflowing waste",
    "A real-world outdoor streetlight pole or public lighting infrastructure",
    "A real-world outdoor public water leakage from pipelines or water flowing on roads",
    "A real-world outdoor drainage issue such as clogged drains, sewage overflow, or open manholes"
]

TRAP_PROMPTS = [
    "A private indoor room with ceiling fan, indoor lighting, furniture, or curtains",
    "A close-up photo of a person or human face",
    "A photo of paper, printed text, mobile screen, or digital display",
    "A very blurry or dark image with no clear subject"
]

ISSUE_CATEGORIES = CIVIC_PROMPTS + TRAP_PROMPTS

# Mapping descriptive prompts back to backend department names
PROMPT_TO_DEPT = {
    "A real-world outdoor public road with potholes, cracks, or damaged asphalt": "Roads",
    "A real-world outdoor public area with garbage, litter, or overflowing waste": "Sanitation",
    "A real-world outdoor streetlight pole or public lighting infrastructure": "Streetlight",
    "A real-world outdoor public water leakage from pipelines or water flowing on roads": "Water",
    "A real-world outdoor drainage issue such as clogged drains, sewage overflow, or open manholes": "Drainage",
    "A private indoor room with ceiling fan, indoor lighting, furniture, or curtains": "Flagged",
    "A close-up photo of a person or human face": "Flagged",
    "A photo of paper, printed text, mobile screen, or digital display": "Flagged",
    "A very blurry or dark image with no clear subject": "Flagged"
}



# ===============================
# HELPERS
# ===============================
def normalize(text: str):
    return text.lower().strip()


def classify_image_from_base64(base64_str):
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]

        image_data = base64.b64decode(base64_str)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")

        inputs = clip_processor(
            text=ISSUE_CATEGORIES,
            images=image,
            return_tensors="pt",
            padding=True
        )

        with torch.no_grad():
            outputs = clip_model(**inputs)

        # Use sigmoid to get independent probabilities so 0.4 and 0.85 can co-exist
        probs = torch.sigmoid(outputs.logits_per_image)[0].detach().numpy()

        civic_probs = probs[:len(CIVIC_PROMPTS)]
        trap_probs = probs[len(CIVIC_PROMPTS):]

        best_civic_idx = int(np.argmax(civic_probs))
        best_trap_idx = int(np.argmax(trap_probs))

        return {
            "civic_score": float(civic_probs[best_civic_idx]),
            "civic_prompt": CIVIC_PROMPTS[best_civic_idx],
            "trap_score": float(trap_probs[best_trap_idx]),
            "trap_prompt": TRAP_PROMPTS[best_trap_idx],
            "best_overall_prompt": ISSUE_CATEGORIES[int(np.argmax(probs))]
        }

    except Exception as e:
        print("Image Error:", e)
        return None


def classify_text(text):
    norm_text = normalize(text)

    embedding = text_model.encode(norm_text)

    best_category = "Uncategorized"
    best_score = 0.0

    for dept, keywords in DEPARTMENT_PROFILES.items():

        ref_text = f"This is issue related to {dept}. " + ", ".join(keywords)

        ref_embedding = text_model.encode(ref_text)

        score = float(util.cos_sim(embedding, ref_embedding)[0][0])

        if score > best_score:
            best_score = score
            best_category = dept.capitalize()

    return {
        "category": best_category,
        "confidence": round(best_score, 2)
    }


# ===============================
# REQUEST MODELS
# ===============================
class IssueAnalysisRequest(BaseModel):
    image: str | None = None
    text: str | None = None


class OfficerScreeningRequest(BaseModel):
    text: str
    department: str
    designation: str | None = None
    document_url: str | None = None


class CandidateIssue(BaseModel):
    id: int
    text: str
    latitude: float
    longitude: float
    hours_diff: float


class DuplicateCheckRequest(BaseModel):
    new_text: str
    new_lat: float
    new_lng: float
    candidates: List[CandidateIssue]


class TranslationRequest(BaseModel):
    text: str


# ===============================
# ISSUE ANALYSIS API
# ===============================
@app.post("/analyze")
def analyze_issue(request: IssueAnalysisRequest):
    try:

        image_result = None
        text_result = None

        # IMAGE CLASSIFICATION
        if request.image:
            image_result = classify_image_from_base64(request.image)

        # TEXT CLASSIFICATION
        if request.text and len(request.text.strip()) >= 5:
            text_result = classify_text(request.text)

        # FUSION LOGIC AND FINAL DECISION
        if image_result:
            trap_score = image_result["trap_score"]
            civic_score = image_result["civic_score"]
            predicted_category = PROMPT_TO_DEPT.get(image_result["civic_prompt"], "Other")

            # Final Decision Logic (Dictated by Rules)
            # Step 1: Trap override (highest priority)
            if trap_score > 0.5:
                category = "FLAGGED"
            # Step 2: Conflict safety (prevents wrong 90% matches)
            elif trap_score > 0.4 and civic_score > 0.85:
                category = "FLAGGED"
            # Step 3: Civic classification
            elif civic_score > 0.85:
                category = predicted_category
            # Step 4: Uncertain cases
            else:
                category = "REVIEW_REQUIRED"

            final_confidence = max(trap_score, civic_score)
            scene = "Indoor/Unclear" if "indoor" in image_result["trap_prompt"].lower() or trap_score > civic_score else "Outdoor"
            ai_status = "CATEGORIZED" if category not in ["FLAGGED", "REVIEW_REQUIRED"] else "FLAGGED"
            
            if category == "REVIEW_REQUIRED":
                 final_category = predicted_category # Preserve the guess but status is pending
            else:
                 final_category = category

            # Multi-line Reason Format
            reason = (
                f"Scene: {scene}\n"
                f"Category: {final_category}\n"
                f"Confidence: {round(final_confidence, 2)}\n\n"
                f"Reason:\n"
                f"- Scene detected: Civic ({round(civic_score, 2)}), Trap ({round(trap_score, 2)})\n"
                f"- Key objects: {image_result['best_overall_prompt']}\n"
                f"- Final decision: {category}"
            )
        else:
            return {
                "category": "Uncategorized",
                "ai_status": "FLAGGED",
                "ai_confidence": 0.0,
                "ai_reason": "No valid image/text"
            }

        return {
            "category": final_category if final_category != "FLAGGED" else "Flagged",
            "ai_status": ai_status,
            "ai_confidence": round(final_confidence, 2),
            "ai_reason": reason
        }

    except Exception as e:
        print("ANALYSIS ERROR:", e)

        return {
            "category": "Uncategorized",
            "ai_status": "ERROR",
            "ai_confidence": 0.0,
            "ai_reason": "AI Service Error"
        }


# ===============================
# OFFICER SCREENING
# ===============================
@app.post("/screen-officer")
def screen_officer(request: OfficerScreeningRequest):

    try:
        department = normalize(request.department)

        if department not in DEPARTMENT_PROFILES:
            return {
                "ai_score": 0.0,
                "ai_result": "FLAGGED",
                "ai_reason": "Unknown Department"
            }

        doc_embedding = text_model.encode(request.text)

        ref_text = department + " " + " ".join(DEPARTMENT_PROFILES[department])

        ref_embedding = text_model.encode(ref_text)

        score = float(util.cos_sim(doc_embedding, ref_embedding)[0][0])

        return {
            "ai_score": round(score, 2),
            "ai_result": "APPROVED" if score > 0.5 else "PENDING_REVIEW",
            "ai_reason": "Officer Screening Completed"
        }

    except:
        raise HTTPException(status_code=500, detail="Officer Screening Failed")


# ===============================
# DUPLICATE CHECK
# ===============================
@app.post("/check-duplicate")
def check_duplicate(request: DuplicateCheckRequest):

    try:
        if not request.candidates:
            return {
                "is_duplicate": False,
                "master_issue_id": None,
                "score": 0.0
            }

        new_embedding = text_model.encode(request.new_text)

        highest_score = 0
        best_match = None

        for candidate in request.candidates:

            cand_embedding = text_model.encode(candidate.text)

            sim = float(util.cos_sim(new_embedding, cand_embedding)[0][0])

            if sim > highest_score:
                highest_score = sim
                best_match = candidate.id

        return {
            "is_duplicate": highest_score >= 0.75,
            "master_issue_id": best_match if highest_score >= 0.75 else None,
            "score": round(highest_score, 2)
        }

    except:
        return {
            "is_duplicate": False,
            "master_issue_id": None,
            "score": 0.0
        }


@app.post("/translate")
def translate(request: TranslationRequest):
    try:
        detected = detect_lang(request.text)
        if detected == "en":
            return {
                "translated_text": request.text,
                "detected_language": "en",
                "was_translated": False
            }

        tokens = translate_tokenizer(
            [request.text],
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512
        )
        with torch.no_grad():
            translated = translate_model.generate(**tokens)
        result = translate_tokenizer.decode(translated[0], skip_special_tokens=True)

        return {
            "translated_text": result,
            "detected_language": detected,
            "was_translated": True
        }
    except Exception as e:
        return {
            "translated_text": request.text,
            "detected_language": "unknown",
            "was_translated": False,
            "error": str(e)
        }


@app.get("/")
def health():
    return {"status": "AI Service Running"}


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
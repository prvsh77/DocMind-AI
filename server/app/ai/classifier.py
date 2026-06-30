import json
import logging
import os
from app.ai.prompts import CLASSIFIER_SYSTEM_PROMPT, CLASSIFIER_USER_PROMPT

logger = logging.getLogger(__name__)

def classify_by_heuristic(ocr_text: str) -> str:
    """Fallback keyword check if LLM API is unavailable."""
    text_lower = ocr_text.lower()
    if "invoice" in text_lower:
        return "Invoice"
    elif "receipt" in text_lower or "tax invoice" in text_lower or "staples" in text_lower:
        return "Receipt"
    elif "resume" in text_lower or "cv" in text_lower or "education" in text_lower or "experience" in text_lower:
        return "Resume"
    elif "contract" in text_lower or "agreement" in text_lower or "hereby" in text_lower:
        return "Contract"
    elif "statement" in text_lower or "account number" in text_lower or "balance" in text_lower:
        return "Bank Statement"
    return "Other"

async def classify_document(ocr_text: str) -> str:
    """Classifies the OCR text using Gemini or OpenAI, or falls back to heuristic matching."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if not ocr_text or not ocr_text.strip():
        return "Other"
        
    prompt = CLASSIFIER_USER_PROMPT.format(ocr_text=ocr_text)
    
    # 1. Try Gemini
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                generation_config={"response_mime_type": "application/json"}
            )
            # Run generative call synchronously inside the async endpoint
            response = model.generate_content(
                contents=[
                    {"role": "user", "parts": [CLASSIFIER_SYSTEM_PROMPT, prompt]}
                ]
            )
            data = json.loads(response.text.strip())
            classification = data.get("classification", "Other")
            # Normalize casing
            valid_types = {"Invoice", "Receipt", "Resume", "Bank Statement", "Contract", "Other"}
            for vt in valid_types:
                if classification.lower() == vt.lower():
                    return vt
        except Exception as e:
            logger.error(f"Gemini classification failed: {e}. Trying next option.")
            
    # 2. Try OpenAI
    if openai_key:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=openai_key)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": CLASSIFIER_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content.strip())
            classification = data.get("classification", "Other")
            valid_types = {"Invoice", "Receipt", "Resume", "Bank Statement", "Contract", "Other"}
            for vt in valid_types:
                if classification.lower() == vt.lower():
                    return vt
        except Exception as e:
            logger.error(f"OpenAI classification failed: {e}. Trying heuristics.")
            
    # 3. Fallback Heuristic
    logger.info("Using heuristic classification fallback.")
    return classify_by_heuristic(ocr_text)

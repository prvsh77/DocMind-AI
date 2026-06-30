import os
import logging
from app.ai.prompts import SUMMARY_SYSTEM_PROMPT, SUMMARY_USER_PROMPT

logger = logging.getLogger(__name__)

def generate_heuristic_summary(ocr_text: str) -> str:
    """Generates a text summary using simple heuristic extraction if LLM keys are absent."""
    if not ocr_text or not ocr_text.strip():
        return "No text available to summarize."
        
    lines = [l.strip() for l in ocr_text.split("\n") if l.strip()]
    if not lines:
        return "Empty document."
        
    # Grab first few lines to detect key context
    summary_words = []
    # Identify if resume, invoice, bank statement
    lower_text = ocr_text.lower()
    
    doc_type = "Document"
    if "invoice" in lower_text:
        doc_type = "Invoice"
    elif "receipt" in lower_text:
        doc_type = "Receipt"
    elif "resume" in lower_text or "cv" in lower_text:
        doc_type = "Resume"
    elif "statement" in lower_text or "bank" in lower_text:
        doc_type = "Bank Statement"
    elif "contract" in lower_text or "agreement" in lower_text:
        doc_type = "Contract"

    # Compile dynamic snippet
    heading_snippets = " ".join(lines[:3])
    if len(heading_snippets) > 150:
        heading_snippets = heading_snippets[:150] + "..."
        
    summary = f"This is an analyzed {doc_type}. Key headers and top lines mention: '{heading_snippets}'."
    
    # Try finding an email or vendor in the text
    import re
    emails = re.findall(r'[\w\.-]+@[\w\.-]+', ocr_text)
    if emails:
        summary += f" Contact information detected: {emails[0]}."
        
    # Try finding an amount
    amounts = re.findall(r'(?:₹|\$|INR)\s*([\d,]+(?:\.\d+)?)', ocr_text)
    if amounts:
        summary += f" Monetary values including {amounts[0]} were identified."
        
    return summary

async def generate_summary(ocr_text: str) -> str:
    """Generates a 2-3 sentence AI summary of the document using LLM or local heuristics."""
    if not ocr_text or not ocr_text.strip():
        return "No document text available to analyze."

    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    # 1. Try Gemini
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(
                contents=[
                    {"role": "user", "parts": [SUMMARY_SYSTEM_PROMPT, SUMMARY_USER_PROMPT.format(ocr_text=ocr_text)]}
                ]
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini summarization failed: {e}")

    # 2. Try OpenAI
    if openai_key:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=openai_key)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
                    {"role": "user", "content": SUMMARY_USER_PROMPT.format(ocr_text=ocr_text)}
                ]
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI summarization failed: {e}")

    # 3. Fallback to Local Heuristics
    return generate_heuristic_summary(ocr_text)

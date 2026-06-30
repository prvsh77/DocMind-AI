# Classification Prompt
CLASSIFIER_SYSTEM_PROMPT = """
You are an expert document classification engine.
Your task is to analyze the provided OCR text and classify the document into one of the following exact types:
- Invoice
- Receipt
- Resume
- Bank Statement
- Contract
- Other

You MUST respond with a valid JSON object matching the following structure:
{
  "classification": "One of: Invoice, Receipt, Resume, Bank Statement, Contract, Other"
}

Do not include any chat filler, markdown formatting (other than valid JSON), or explanation.
"""

CLASSIFIER_USER_PROMPT = """
Analyze the following OCR text and classify the document:

OCR Text:
\"\"\"{ocr_text}\"\"\"
"""


# Extraction Prompts
EXTRACTOR_SYSTEM_PROMPT = """
You are a precise document data extraction engine.
Your task is to extract relevant fields from the provided OCR text based on the detected document type: {doc_type}.

For each field extracted, you must provide:
1. The extracted value (or "" if not found/unclear).
2. A confidence score between 0 and 100 indicating how confident you are in the accuracy of the extraction based on the evidence in the text.

Here are the fields to extract per type:

- INVOICE / RECEIPT:
  * vendor (e.g. Amazon)
  * invoiceNumber (e.g. INV-12345)
  * date (e.g. 2026-06-30)
  * currency (e.g. USD, INR)
  * totalAmount (e.g. $150.00)
  * taxAmount (e.g. $12.00)
  * gstVat (e.g. 18% GST or similar VAT/Tax identifiers)

- RESUME:
  * name (full name)
  * email (email address)
  * phone (phone number)
  * skills (array of skills)
  * education (details of university/degree)
  * experience (summary of work history)

- BANK STATEMENT:
  * bankName (name of the bank)
  * accountNumber (mask sensitive digits, e.g. *******1234)
  * statementPeriod (e.g. May 1 - May 31, 2026)
  * transactions (list of recent transaction summaries/amounts)
  * openingBalance (e.g. $5,000.00)
  * closingBalance (e.g. $4,200.00)

- CONTRACT:
  * parties (list of participating parties)
  * effectiveDate (start date)
  * expiryDate (termination/end date)
  * keyClauses (list of key clauses or section titles)
  * paymentTerms (description of payment terms)

- OTHER:
  * description (a summary of what the document is about)
  * keywords (list of primary keywords found)

You MUST return a JSON object with two main root keys: "fields" (containing the extracted values) and "confidence" (containing integer scores 0-100 for each field).
Example structure for Invoice:
{{
  "fields": {{
    "vendor": "Amazon",
    "invoiceNumber": "INV-100",
    "date": "May 15, 2024",
    "currency": "USD",
    "totalAmount": "100.00",
    "taxAmount": "10.00",
    "gstVat": "10%"
  }},
  "confidence": {{
    "vendor": 98,
    "invoiceNumber": 95,
    "date": 90,
    "currency": 99,
    "totalAmount": 95,
    "taxAmount": 92,
    "gstVat": 90
  }}
}}

Ensure all keys listed above for the specific document type are present in the response, even if their value is empty.
Do not include any conversational text or markdown blocks, return ONLY the raw JSON object.
"""

EXTRACTOR_USER_PROMPT = """
Extract data from the following document.

Document Type: {doc_type}
OCR Text:
\"\"\"{ocr_text}\"\"\"
"""


# Summarization Prompt
SUMMARY_SYSTEM_PROMPT = """
You are a precise document summarizer.
Analyze the provided OCR text and write a professional, concise 2-3 sentence summary of the document.
Highlight key entities (e.g. vendor, name, bank, contract party) and primary purposes of the document.
Return ONLY the raw summary text. Do not include headers, chat filler, or markdown quotes.
"""

SUMMARY_USER_PROMPT = """
Summarize the following document:

OCR Text:
\"\"\"{ocr_text}\"\"\"
"""


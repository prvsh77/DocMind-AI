import asyncio
import datetime
import uuid
import sys
import os
import random

# Add server directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.database.session import SessionLocal, engine
from app.models import User, Document, ExtractedData, DocumentStatus, SearchLog, ChatLog
from app.auth.security import hash_password
from app.ai.embeddings import get_embedding
from app.ai.vector_store import add_to_vector_store, delete_from_vector_store

# Mock Documents Data
MOCK_DOCUMENTS = [
    # --- INVOICES (5) ---
    {
        "type": "Invoice",
        "name": "AWS Services Invoice May.pdf",
        "date_offset": 15, # Days ago
        "ocr": "Amazon Web Services, Inc. Bill to: Demo Corp. Invoice Number: AWS-987251. Date: May 15, 2026. AWS EC2 Cloud Compute: $1,200.00. AWS S3 Storage Services: $250.00. AWS Relational Database Service: $450.00. Total Tax: $342.00. Total Amount Due: $2,242.00. Payments terms: Due upon receipt. GSTIN: 9918USA29012.",
        "summary": "AWS monthly cloud billing statement for May 2026. Includes charges for EC2 instances, S3 storage, and RDS hosting services totaling $2,242.00.",
        "fields": {
            "vendor": "Amazon Web Services",
            "invoiceNumber": "AWS-987251",
            "date": "2026-05-15",
            "currency": "USD",
            "totalAmount": "2242.00",
            "taxAmount": "342.00",
            "gstVat": "18%"
        },
        "confidence": {
            "vendor": 98,
            "invoiceNumber": 99,
            "date": 95,
            "currency": 99,
            "totalAmount": 97,
            "taxAmount": 93,
            "gstVat": 90
        }
    },
    {
        "type": "Invoice",
        "name": "Microsoft Office 365 Licensing.pdf",
        "date_offset": 45,
        "ocr": "Microsoft Corp India Pvt. Ltd. Bill to: Demo Corp. Invoice Ref: MS-391823. Invoice Date: April 15, 2026. Description: Microsoft 365 Business Premium Subscription - 50 Seats. Rate: ₹1,500 per seat. Subtotal: ₹75,000. Integrated GST (18%): ₹13,500. Total Invoice Amount: ₹88,500. Expiry: May 14, 2026. Bank Transfer details included.",
        "summary": "Annual licensing invoice from Microsoft India for 50 Microsoft 365 Business Premium seats. Total billing amount is ₹88,500 inclusive of 18% IGST.",
        "fields": {
            "vendor": "Microsoft Corporation",
            "invoiceNumber": "MS-391823",
            "date": "2026-04-15",
            "currency": "INR",
            "totalAmount": "88500.00",
            "taxAmount": "13500.00",
            "gstVat": "18% IGST"
        },
        "confidence": {
            "vendor": 99,
            "invoiceNumber": 98,
            "date": 96,
            "currency": 99,
            "totalAmount": 99,
            "taxAmount": 95,
            "gstVat": 95
        }
    },
    {
        "type": "Invoice",
        "name": "Google Workspace Cloud Billing.pdf",
        "date_offset": 75,
        "ocr": "Google Cloud Asia Pacific. Customer: Demo Corp. Invoice ID: GOOG-WORKSPACE-4912. Billing Month: March 2026. Invoice Date: March 28, 2026. Workspace Enterprise Licenses: $640.00. Support Fee: $100.00. Tax Amount: $0.00. Total billing: $740.00. Thank you for your business.",
        "summary": "Google Workspace cloud license statement for March 2026 covering Enterprise seats and support services for $740.00.",
        "fields": {
            "vendor": "Google Cloud",
            "invoiceNumber": "GOOG-WORKSPACE-4912",
            "date": "2026-03-28",
            "currency": "USD",
            "totalAmount": "740.00",
            "taxAmount": "0.00",
            "gstVat": "0%"
        },
        "confidence": {
            "vendor": 95,
            "invoiceNumber": 94,
            "date": 92,
            "currency": 99,
            "totalAmount": 96,
            "taxAmount": 90,
            "gstVat": 85
        }
    },
    {
        "type": "Invoice",
        "name": "Hubspot Marketing Suite Annual.pdf",
        "date_offset": 105,
        "ocr": "HubSpot, Inc. 25 First Street, Cambridge, MA. Invoice: HB-841920. Date: Feb 12, 2026. Client: Demo Corp. Marketing Hub Professional Annual Subscription. Price: $9,600.00. VAT/Tax: $0.00. Net Total: $9,600.00. Billing Period: Feb 12, 2026 to Feb 11, 2027. Paid via Credit Card Ending *4201.",
        "summary": "HubSpot marketing automation licensing invoice for marketing hub professional suite from Feb 2026 to Feb 2027. Amount charged: $9,600.00.",
        "fields": {
            "vendor": "HubSpot",
            "invoiceNumber": "HB-841920",
            "date": "2026-02-12",
            "currency": "USD",
            "totalAmount": "9600.00",
            "taxAmount": "0.00",
            "gstVat": ""
        },
        "confidence": {
            "vendor": 97,
            "invoiceNumber": 99,
            "date": 96,
            "currency": 99,
            "totalAmount": 98,
            "taxAmount": 90,
            "gstVat": 80
        }
    },
    {
        "type": "Invoice",
        "name": "GitHub Enterprise Copilot.pdf",
        "date_offset": 135,
        "ocr": "GitHub, Inc. 88 Colin P Kelly Jr St, San Francisco, CA. Invoice Ref: GH-102948. Invoice Date: January 15, 2026. Account: Demo Corp. Product: GitHub Enterprise Cloud + GitHub Copilot licenses. Quantity: 20 users. Rate: $39.00/mo per user. Subtotal: $780.00. Tax: $0.00. Total Invoice Balance: $780.00. Payment method: Autopay.",
        "summary": "GitHub Enterprise license billing statement for January 2026. Includes 20 user licenses of GitHub Cloud and AI Copilot for $780.00.",
        "fields": {
            "vendor": "GitHub Inc",
            "invoiceNumber": "GH-102948",
            "date": "2026-01-15",
            "currency": "USD",
            "totalAmount": "780.00",
            "taxAmount": "0.00",
            "gstVat": "0%"
        },
        "confidence": {
            "vendor": 98,
            "invoiceNumber": 98,
            "date": 97,
            "currency": 99,
            "totalAmount": 99,
            "taxAmount": 92,
            "gstVat": 88
        }
    },

    # --- RECEIPTS (5) ---
    {
        "type": "Receipt",
        "name": "Amazon Office Chairs Receipt.pdf",
        "date_offset": 8,
        "ocr": "Amazon Retail India. Order Receipt. Order ID: OD-402-91823. Order Date: June 22, 2026. Items: Ergonomic High-Back Executive Office Chair x 3. Price: ₹12,500. Subtotal: ₹37,500. Shipping charges: ₹500. SGST: ₹3,375, CGST: ₹3,375. Grand Total: ₹44,750. Delivery Address: Demo Office Sector 62. Paid via NetBanking.",
        "summary": "Amazon office purchase receipt for three ergonomic high-back executive chairs. Order value: ₹44,750 inclusive of CGST/SGST taxes.",
        "fields": {
            "vendor": "Amazon",
            "invoiceNumber": "OD-402-91823",
            "date": "2026-06-22",
            "currency": "INR",
            "totalAmount": "44750.00",
            "taxAmount": "6750.00",
            "gstVat": "18% GST"
        },
        "confidence": {
            "vendor": 95,
            "invoiceNumber": 92,
            "date": 94,
            "currency": 99,
            "totalAmount": 97,
            "taxAmount": 91,
            "gstVat": 89
        }
    },
    {
        "type": "Receipt",
        "name": "Uber Ride Receipt June.pdf",
        "date_offset": 20,
        "ocr": "Uber Technologies Inc. Ride Receipt. Date: June 10, 2026. Trip ID: TR-U-819231. Passenger: Demo Executive. Ride details: Bengaluru Airport to Indiranagar. Distance: 38.2 km. Fare: ₹920.00. Airport Parking Fee: ₹150.00. GST: ₹53.50. Total Charged: ₹1,123.50. Paid via Corporate Profile (Visa ending 1102).",
        "summary": "Uber corporate transit receipt from Bengaluru Airport to Indiranagar. Fare total: ₹1,123.50.",
        "fields": {
            "vendor": "Uber",
            "invoiceNumber": "TR-U-819231",
            "date": "2026-06-10",
            "currency": "INR",
            "totalAmount": "1123.50",
            "taxAmount": "53.50",
            "gstVat": "5% GST"
        },
        "confidence": {
            "vendor": 99,
            "invoiceNumber": 96,
            "date": 97,
            "currency": 99,
            "totalAmount": 99,
            "taxAmount": 94,
            "gstVat": 90
        }
    },
    {
        "type": "Receipt",
        "name": "Starbucks Client Lunch Meeting.pdf",
        "date_offset": 35,
        "ocr": "Starbucks Coffee Company. Store #289, Indiranagar. Ticket: #STB-9281. Date: May 26, 2026 12:45 PM. Items: Caffe Latte x 2 (₹600), Java Chip Frappuccino x 1 (₹350), Cinnamon Roll x 3 (₹450). Subtotal: ₹1,400. CGST: ₹70. SGST: ₹70. Total: ₹1,540. Paid: Cash.",
        "summary": "Starbucks food and coffee receipt for a client meetup in Indiranagar. Receipt total: ₹1,540.",
        "fields": {
            "vendor": "Starbucks",
            "invoiceNumber": "STB-9281",
            "date": "2026-05-26",
            "currency": "INR",
            "totalAmount": "1540.00",
            "taxAmount": "140.00",
            "gstVat": "10%"
        },
        "confidence": {
            "vendor": 98,
            "invoiceNumber": 95,
            "date": 95,
            "currency": 99,
            "totalAmount": 99,
            "taxAmount": 90,
            "gstVat": 88
        }
    },
    {
        "type": "Receipt",
        "name": "Staples Stationeries Purchase.pdf",
        "date_offset": 60,
        "ocr": "Staples Office Supplies. Store 4012. Date: May 1, 2026. Cashier: Sarah. Item: Whiteboard Markers Pack x 5 ($25.00), A4 Printing Paper Reams x 10 ($60.00), Sticky Notes Pack of 12 ($15.00). Subtotal: $100.00. Tax (8%): $8.00. Total Paid: $108.00. Thank you for shopping at Staples.",
        "summary": "Staples receipt for board markers, sticky notes, and printing papers. Amount paid: $108.00.",
        "fields": {
            "vendor": "Staples",
            "invoiceNumber": "4012-STP",
            "date": "2026-05-01",
            "currency": "USD",
            "totalAmount": "108.00",
            "taxAmount": "8.00",
            "gstVat": "8%"
        },
        "confidence": {
            "vendor": 96,
            "invoiceNumber": 80,
            "date": 98,
            "currency": 99,
            "totalAmount": 98,
            "taxAmount": 95,
            "gstVat": 92
        }
    },
    {
        "type": "Receipt",
        "name": "Zomato Team Dinner.pdf",
        "date_offset": 90,
        "ocr": "Zomato Delivery. Order ID: ZM-81923091. Merchant: Barbeque Nation. Date: April 1, 2026. Team Dinner Buffet Pack x 8. Price: ₹6,400. Restaurant Packaging: ₹100. CGST: ₹320, SGST: ₹320. Delivery Partner Tip: ₹100. Promo Code Discount: -₹500. Final Paid: ₹6,740. Payment mode: Paytm Wallet.",
        "summary": "Zomato catering order receipt from Barbeque Nation for a team buffet dinner. Total charged: ₹6,740.",
        "fields": {
            "vendor": "Zomato",
            "invoiceNumber": "ZM-81923091",
            "date": "2026-04-01",
            "currency": "INR",
            "totalAmount": "6740.00",
            "taxAmount": "640.00",
            "gstVat": "10% GST"
        },
        "confidence": {
            "vendor": 97,
            "invoiceNumber": 95,
            "date": 96,
            "currency": 99,
            "totalAmount": 99,
            "taxAmount": 92,
            "gstVat": 90
        }
    },

    # --- RESUMES (5) ---
    {
        "type": "Resume",
        "name": "Rajesh Kumar Python Engineer.pdf",
        "date_offset": 12,
        "ocr": "Rajesh Kumar. Email: rajesh.kumar@gmail.com. Phone: +91-9876543210. Location: Bangalore, India. Profile: Python backend software engineer with 5 years experience specializing in FastAPI, SQLAlchemy, PostgreSQL, and AWS deployment. Skills: Python, FastAPI, Django, PostgreSQL, Docker, AWS, Git, Redis, Alembic. Education: B.Tech Computer Science, NIT Trichy, 2021. Experience: backend engineer at FinCorp Bangalore (2021-Present), worked on core transaction APIs, optimized Postgres queries, led database migration to SQLAlchemy Async.",
        "summary": "Professional resume of Rajesh Kumar, a Python Backend Engineer with 5 years of experience in FastAPI, Postgres, and Docker. Graduated from NIT Trichy in 2021.",
        "fields": {
            "name": "Rajesh Kumar",
            "email": "rajesh.kumar@gmail.com",
            "phone": "+91-9876543210",
            "skills": ["Python", "FastAPI", "Django", "PostgreSQL", "Docker", "AWS", "Git", "Redis", "Alembic"],
            "education": "B.Tech Computer Science, NIT Trichy, 2021",
            "experience": "Backend Engineer at FinCorp Bangalore (2021-Present). Optimized SQL queries and migrated relational schemas to async paradigms."
        },
        "confidence": {
            "name": 98,
            "email": 99,
            "phone": 99,
            "skills": 95,
            "education": 92,
            "experience": 90
        }
    },
    {
        "type": "Resume",
        "name": "Sarah Miller React Developer.pdf",
        "date_offset": 25,
        "ocr": "Sarah Miller. Email: sarah.miller@outlook.com. Phone: +1-415-555-0192. Location: San Francisco, CA. Front-End Engineer specializing in React, TypeScript, Next.js, and tailwind. 4 years developing responsive web applications. Skills: React, TypeScript, Next.js, Redux, TailwindCSS, Jest, Cypress, HTML5, CSS3, JavaScript. Education: B.S. Software Engineering, San Jose State University, 2022. Experience: Frontend Engineer at SaaSify Inc (2022-Present). Redesigned dashboard workspace components, increasing performance by 40%.",
        "summary": "Software engineer resume for Sarah Miller, a frontend React developer with Next.js and TypeScript skills based in San Francisco.",
        "fields": {
            "name": "Sarah Miller",
            "email": "sarah.miller@outlook.com",
            "phone": "+1-415-555-0192",
            "skills": ["React", "TypeScript", "Next.js", "Redux", "TailwindCSS", "Jest", "Cypress", "HTML5", "CSS3", "JavaScript"],
            "education": "B.S. Software Engineering, San Jose State University, 2022",
            "experience": "Frontend Engineer at SaaSify Inc (2022-Present). Optimized React components and integrated TailwindCSS frameworks."
        },
        "confidence": {
            "name": 99,
            "email": 99,
            "phone": 98,
            "skills": 97,
            "education": 95,
            "experience": 93
        }
    },
    {
        "type": "Resume",
        "name": "Arjun Sharma Product Manager.pdf",
        "date_offset": 50,
        "ocr": "Arjun Sharma. Email: arjun.sharma@yahoo.com. Phone: +91-9988776655. Profile: Technical Product Manager with 6+ years of experience leading cross-functional teams in SaaS, fintech, and AI workflows. Skills: Product Strategy, Agile methodology, JIRA, Roadmap definition, A/B Testing, SQL, User Research, Scrum Master. Education: MBA, IIM Calcutta (2020), B.E. Electrical Engineering, BITS Pilani (2018). Experience: Product Manager at PayQuick (2020-Present). Launched peer-to-peer payments, boosting engagement by 35%.",
        "summary": "Resume of Arjun Sharma, a Technical Product Manager holding an MBA from IIM Calcutta. Skilled in agile roadmap strategy, product life cycles, and JIRA.",
        "fields": {
            "name": "Arjun Sharma",
            "email": "arjun.sharma@yahoo.com",
            "phone": "+91-9988776655",
            "skills": ["Product Strategy", "Agile methodology", "JIRA", "Roadmap definition", "A/B Testing", "SQL", "User Research", "Scrum Master"],
            "education": "MBA, IIM Calcutta (2020), B.E. Electrical Engineering, BITS Pilani (2018)",
            "experience": "Product PM at PayQuick (2020-Present). Managed the payment core APIs and ran structured A/B tests."
        },
        "confidence": {
            "name": 98,
            "email": 99,
            "phone": 99,
            "skills": 90,
            "education": 96,
            "experience": 91
        }
    },
    {
        "type": "Resume",
        "name": "Priyanka Patel HR Specialist.pdf",
        "date_offset": 80,
        "ocr": "Priyanka Patel. Email: priyanka.patel@hrdomain.com. Phone: +91-9012345678. HR Operations Specialist. 7 years experience in corporate recruitment, talent retention, onboarding, and payroll administration. Skills: Recruiting, Employee onboarding, Compensation, Talent Management, Conflict resolution, Excel, Workday. Education: M.A. Human Resources, Mumbai University, 2019. Experience: HR Lead at Titan Corp (2019-Present). Automated hiring workflow pipelines, saving 15 hours of manual screening weekly.",
        "summary": "Human Resources Specialist resume for Priyanka Patel. Experienced in recruitment and Workday, holding a Master's in HR from Mumbai University.",
        "fields": {
            "name": "Priyanka Patel",
            "email": "priyanka.patel@hrdomain.com",
            "phone": "+91-9012345678",
            "skills": ["Recruiting", "Employee onboarding", "Compensation", "Talent Management", "Conflict resolution", "Excel", "Workday"],
            "education": "M.A. Human Resources, Mumbai University, 2019",
            "experience": "HR Lead at Titan Corp (2019-Present). Led corporate recruitment campaigns and configured Workday structures."
        },
        "confidence": {
            "name": 99,
            "email": 99,
            "phone": 99,
            "skills": 94,
            "education": 95,
            "experience": 92
        }
    },
    {
        "type": "Resume",
        "name": "David Clark System Admin.pdf",
        "date_offset": 110,
        "ocr": "David Clark. Email: david.clark@linuxmail.org. Phone: +1-206-555-0145. Seattle, WA. System Administrator with 8 years managing Linux server infrastructures, cloud platforms, networking security, and backup recovery pipelines. Skills: Linux administration, Bash scripting, Kubernetes, Docker, Network security, DNS, SSL, Terraform, Ansible. Education: Associate Degree in Networking, Seattle College, 2017. Experience: Linux Systems Engineer at CloudTech Systems (2018-Present). Configured microservices cluster orchestrators, reducing downtime to 99.99%.",
        "summary": "Linux System Administrator resume for David Clark with experience in Kubernetes orchestration, Bash automation, and cloud setups.",
        "fields": {
            "name": "David Clark",
            "email": "david.clark@linuxmail.org",
            "phone": "+1-206-555-0145",
            "skills": ["Linux administration", "Bash scripting", "Kubernetes", "Docker", "Network security", "DNS", "SSL", "Terraform", "Ansible"],
            "education": "Associate Degree in Networking, Seattle College, 2017",
            "experience": "Linux Systems Engineer at CloudTech Systems (2018-Present). Implemented disaster recovery backups and container cluster platforms."
        },
        "confidence": {
            "name": 98,
            "email": 99,
            "phone": 98,
            "skills": 96,
            "education": 90,
            "experience": 92
        }
    },

    # --- CONTRACTS (3) ---
    {
        "type": "Contract",
        "name": "Non-Disclosure Agreement NDA.pdf",
        "date_offset": 10,
        "ocr": "MUTUAL NON-DISCLOSURE AGREEMENT. This Agreement is entered into on June 20, 2026 (Effective Date). Parties: Demo Corp, and CloudSaaS Technologies Inc. Description: The parties wish to explore a business relationship and share proprietary intellectual properties. Expiry Date: June 20, 2029 (three years from effective date). Key Clauses: Definition of Confidential Information, Non-disclosure Obligations, Remedies for breach. Payment Terms: N/A. Signed by Representatives: Jane Doe (Demo Corp) and Mark Spencer (CloudSaaS).",
        "summary": "Mutual non-disclosure agreement between Demo Corp and CloudSaaS Technologies Inc to protect trade secrets during partnership talks.",
        "fields": {
            "parties": ["Demo Corp", "CloudSaaS Technologies Inc"],
            "effectiveDate": "2026-06-20",
            "expiryDate": "2026-06-20",
            "keyClauses": ["Definition of Confidential Information", "Non-disclosure Obligations", "Remedies for breach"],
            "paymentTerms": "N/A"
        },
        "confidence": {
            "parties": 98,
            "effectiveDate": 95,
            "expiryDate": 90,
            "keyClauses": 92,
            "paymentTerms": 85
        }
    },
    {
        "type": "Contract",
        "name": "Office Lease Agreement Sec 62.pdf",
        "date_offset": 40,
        "ocr": "COMMERCIAL REAL ESTATE LEASE AGREEMENT. This lease is made on May 21, 2026. Parties: Horizon Realty Ltd (Lessor) and Demo Corp (Lessee). Premises: Suite 501, Horizon IT Tower, Sector 62. Effective Date: June 1, 2026. Term: 24 Months. Expiry Date: May 31, 2028. Payment Terms: Monthly Rent of ₹1,50,000 payable by the 5th of each calendar month. Security Deposit: ₹4,50,000. Key Clauses: Permitted Use, Sublease Restrictions, Maintenance, Late Payment Penalties.",
        "summary": "Commercial real estate lease contract for Suite 501, Horizon IT Tower, Sector 62, between Horizon Realty Ltd and Demo Corp.",
        "fields": {
            "parties": ["Horizon Realty Ltd", "Demo Corp"],
            "effectiveDate": "2026-06-01",
            "expiryDate": "2028-05-31",
            "keyClauses": ["Permitted Use", "Sublease Restrictions", "Maintenance", "Late Payment Penalties"],
            "paymentTerms": "Monthly Rent of ₹1,50,000 payable by the 5th of each calendar month"
        },
        "confidence": {
            "parties": 99,
            "effectiveDate": 95,
            "expiryDate": 98,
            "keyClauses": 92,
            "paymentTerms": 96
        }
    },
    {
        "type": "Contract",
        "name": "Consulting Services Agreement.pdf",
        "date_offset": 70,
        "ocr": "CONSULTING SERVICES AGREEMENT. This Agreement is dated April 20, 2026. Parties: Demo Corp, and TechConsult Consulting LLC. Description: Consultant will provide software architecture and security audit services. Effective Date: May 1, 2026. Termination Date: October 31, 2026. Payment Terms: Retainer fee of $5,000 per month payable within 10 days of invoice date. Key Clauses: Scope of Services, Independent Contractor Status, Intellectual Property Ownership, Confidentiality obligations.",
        "summary": "Consulting services contract between Demo Corp and TechConsult Consulting LLC for software security architecture auditing.",
        "fields": {
            "parties": ["Demo Corp", "TechConsult Consulting LLC"],
            "effectiveDate": "2026-05-01",
            "expiryDate": "2026-10-31",
            "keyClauses": ["Scope of Services", "Independent Contractor Status", "Intellectual Property Ownership", "Confidentiality obligations"],
            "paymentTerms": "Retainer fee of $5,000 per month payable within 10 days of invoice date"
        },
        "confidence": {
            "parties": 98,
            "effectiveDate": 96,
            "expiryDate": 94,
            "keyClauses": 91,
            "paymentTerms": 95
        }
    },

    # --- BANK STATEMENTS (3) ---
    {
        "type": "Bank Statement",
        "name": "HDFC Corporate Statement June.pdf",
        "date_offset": 5,
        "ocr": "HDFC Bank Ltd. Corporate Branch, Bangalore. Account Statement for Demo Corp. Account Number: ********9876. Period: June 1, 2026 to June 25, 2026. Opening Balance: ₹5,00,000.00. Closing Balance: ₹4,22,500.00. Transactions: June 5 - Transfer to Horizon Realty - ₹1,50,000.00 Debit. June 10 - Client Payment Inward - ₹75,000.00 Credit. June 15 - Salary Disbursement - ₹3,000.00 Debit. June 22 - Amazon Purchase - ₹2,500.00 Debit. Total Credits: ₹75,000.00. Total Debits: ₹1,52,500.00.",
        "summary": "HDFC corporate current account bank statement for June 2026. Features transactions including rent transfer of ₹1.5L and client inward credits.",
        "fields": {
            "bankName": "HDFC Bank Ltd",
            "accountNumber": "********9876",
            "statementPeriod": "June 1, 2026 to June 25, 2026",
            "transactions": [
                {"description": "Transfer to Horizon Realty", "amount": "-₹1,50,000.00"},
                {"description": "Client Payment Inward", "amount": "+₹75,000.00"},
                {"description": "Salary Disbursement", "amount": "-₹3,000.00"},
                {"description": "Amazon Purchase", "amount": "-₹2,500.00"}
            ],
            "openingBalance": "₹5,00,000.00",
            "closingBalance": "₹4,22,500.00"
        },
        "confidence": {
            "bankName": 99,
            "accountNumber": 98,
            "statementPeriod": 95,
            "openingBalance": 97,
            "closingBalance": 99
        }
    },
    {
        "type": "Bank Statement",
        "name": "SBI Savings Account Statement.pdf",
        "date_offset": 30,
        "ocr": "State Bank of India. Indiranagar Branch. Statement of Account for Rajesh Kumar. Account No: *******4921. Period: May 1 to May 31, 2026. Opening Balance: ₹75,000.00. Closing Balance: ₹1,45,000.00. Transactions: May 1 - Salary Inward FinCorp - ₹95,000.00 Credit. May 10 - UPI Transfer Starbucks - ₹1,500.00 Debit. May 15 - Rent payment landlord - ₹20,000.00 Debit. Total Credit: ₹95,000.00. Total Debit: ₹21,500.00.",
        "summary": "SBI salary account bank statement for May 2026. Records Rajesh Kumar's salary credit of ₹95,000 and UPI payment history.",
        "fields": {
            "bankName": "State Bank of India",
            "accountNumber": "*******4921",
            "statementPeriod": "May 1 to May 31, 2026",
            "transactions": [
                {"description": "Salary Inward FinCorp", "amount": "+₹95,000.00"},
                {"description": "UPI Transfer Starbucks", "amount": "-₹1,500.00"},
                {"description": "Rent payment landlord", "amount": "-₹20,000.00"}
            ],
            "openingBalance": "₹75,000.00",
            "closingBalance": "₹1,45,000.00"
        },
        "confidence": {
            "bankName": 99,
            "accountNumber": 99,
            "statementPeriod": 96,
            "openingBalance": 98,
            "closingBalance": 98
        }
    },
    {
        "type": "Bank Statement",
        "name": "Chase Business Checking.pdf",
        "date_offset": 65,
        "ocr": "JPMorgan Chase Bank, N.A. Seattle Branch. Business checking account for Demo Corp. Account number ending in *0218. Statement period: April 1, 2026 through April 30, 2026. Starting balance: $12,500.00. Ending balance: $11,960.00. Transactions: April 5 - Card Purchase Hubspot - $500.00 Debit. April 15 - GitHub Autopay - $40.00 Debit. April 20 - Client deposit ACH - $2,500.00 Credit. April 25 - AWS Direct Debit - $2,500.00 Debit.",
        "summary": "Chase corporate checking bank statement for April 2026. Features debits for GitHub and Hubspot cloud software suites and AWS cloud computing.",
        "fields": {
            "bankName": "JPMorgan Chase Bank",
            "accountNumber": "*0218",
            "statementPeriod": "April 1, 2026 through April 30, 2026",
            "transactions": [
                {"description": "Card Purchase Hubspot", "amount": "-$500.00"},
                {"description": "GitHub Autopay", "amount": "-$40.00"},
                {"description": "Client deposit ACH", "amount": "+$2,500.00"},
                {"description": "AWS Direct Debit", "amount": "-$2,500.00"}
            ],
            "openingBalance": "$12,500.00",
            "closingBalance": "$11,960.00"
        },
        "confidence": {
            "bankName": 99,
            "accountNumber": 95,
            "statementPeriod": 96,
            "openingBalance": 98,
            "closingBalance": 99
        }
    }
]

async def seed_data():
    print("Starting database seed configuration...")
    async with SessionLocal() as db:
        # 1. Create or get demo user
        demo_email = "demo@example.com"
        stmt = select(User).where(User.email == demo_email)
        res = await db.execute(stmt)
        user = res.scalars().first()
        
        if not user:
            print("Creating new demo user 'demo@example.com'...")
            user = User(
                name="Demo User",
                email=demo_email,
                password_hash=hash_password("password123"),
                company="Demo Corp Ltd",
                role="user"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            print("Demo user already exists. Cleaning up existing seeded documents for this user...")
            # Cleanup old documents and logs to ensure clean re-seeding
            del_docs_stmt = select(Document).where(Document.user_id == user.id)
            del_res = await db.execute(del_docs_stmt)
            old_docs = del_res.scalars().all()
            for old in old_docs:
                try:
                    delete_from_vector_store(str(old.id))
                except Exception:
                    pass
                await db.delete(old)
                
            del_searches = select(SearchLog).where(SearchLog.user_id == user.id)
            old_searches = (await db.execute(del_searches)).scalars().all()
            for s in old_searches:
                await db.delete(s)
                
            del_chats = select(ChatLog).where(ChatLog.user_id == user.id)
            old_chats = (await db.execute(del_chats)).scalars().all()
            for c in old_chats:
                await db.delete(c)
                
            await db.commit()

        # 2. Seed 21 Documents
        print(f"Seeding {len(MOCK_DOCUMENTS)} documents...")
        for doc_mock in MOCK_DOCUMENTS:
            doc_id = uuid.uuid4()
            upload_date = datetime.datetime.utcnow() - datetime.timedelta(days=doc_mock["date_offset"])
            
            # File system mock name
            ext = ".pdf"
            fs_name = f"{doc_id.hex}{ext}"
            
            # Create Document object
            doc = Document(
                id=doc_id,
                user_id=user.id,
                filename=fs_name,
                original_filename=doc_mock["name"],
                file_type=doc_mock["type"],
                status=DocumentStatus.COMPLETED,
                ocr_text=doc_mock["ocr"],
                summary=doc_mock["summary"],
                uploaded_at=upload_date
            )
            db.add(doc)
            
            # Create ExtractedData payload
            extracted_payload = {
                "fields": doc_mock["fields"],
                "confidence": doc_mock["confidence"]
            }
            ext_data = ExtractedData(
                document_id=doc_id,
                json_data=extracted_payload,
                created_at=upload_date
            )
            db.add(ext_data)
            
            # Generate embedding and add to vector store
            fields = doc_mock["fields"]
            extracted_str = "\n".join([f"{k}: {v}" for k, v in fields.items() if v])
            text_to_embed = f"Document Type: {doc_mock['type']}\nExtracted Fields:\n{extracted_str}\n\nOCR Text:\n{doc_mock['ocr']}"
            
            try:
                embedding_vector = await get_embedding(text_to_embed)
                add_to_vector_store(
                    doc_id=str(doc_id),
                    embedding=embedding_vector,
                    text=text_to_embed,
                    metadata={
                        "original_filename": doc_mock["name"],
                        "doc_type": doc_mock["type"],
                        "user_id": str(user.id)
                    }
                )
            except Exception as e:
                print(f"Warning: Failed to index vector for {doc_mock['name']}: {e}")

        # 3. Seed some dummy search and chat logs to activate dashboard metrics
        print("Seeding dummy search and chat logs...")
        
        search_queries = [
            "AWS cloud bills May", "FastAPI developer resume", "Starbucks client lunch Indiranagar",
            "NDA expiry date", "Horizon realty rent receipt", "invoices over ₹50,000",
            "resumes with Docker and Kubernetes", "receipts from Amazon", "office supplies Staples",
            "HDFC bank closing balance", "Consulting LLC agreement payment terms", "Uber transit Bangalore",
            "PM resume with MBA", "GitHub enterprise licensing cost", "Zomato dining expenses"
        ]
        
        for q in search_queries:
            log = SearchLog(
                user_id=user.id,
                query=q,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 90))
            )
            db.add(log)
            
        chat_qa_pairs = [
            ("Summarize AWS spent", "Based on AWS Services Invoice May.pdf, your total spend is $2,242.00."),
            ("Find developer with Python", "Rajesh Kumar is a Python developer with FastAPI and Postgres skills."),
            ("Office lease monthly rent", "The rent is ₹1,50,000 payable by the 5th of each month per Horizon Realty agreement."),
            (" स्टारबक्स खर्च details", "Your Coffee meeting cost ₹1,540 at Starbucks Indiranagar."),
            ("NDA expiration", "The mutual NDA with CloudSaaS expires on June 20, 2029."),
            ("GitHub seat count", "You purchased GitHub Enterprise licenses for 20 users (total $780.00)."),
            ("Zomato dinner promo code", "Barbeque Nation order received -₹500 coupon code discount, paying ₹6,740."),
            ("PM university details", "Arjun Sharma holds an MBA from IIM Calcutta and B.E. from BITS Pilani."),
            ("Lease security deposit", "Horizon Lease lists security deposit amount of ₹4,50,000."),
            ("SBI bank statement salary credit", "Rajesh Kumar received a salary credit of ₹95,000 from FinCorp.")
        ]
        
        for q, a in chat_qa_pairs:
            log = ChatLog(
                user_id=user.id,
                question=q,
                answer=a,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 60))
            )
            db.add(log)

        await db.commit()
        print("Database seed populated successfully! Demo User 'demo@example.com' with password 'password123' is ready.")

if __name__ == "__main__":
    asyncio.run(seed_data())

<p align="center">
  <img src="assets/dashboard.png" alt="DocMind AI Dashboard" width="100%">
</p>

<h1 align="center">🧠 DocMind AI</h1>

<p align="center">
  <strong>AI-Powered Document Intelligence Platform</strong>
</p>

<p align="center">
  Upload • Extract • Search • Chat
</p>

<p align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)
![ChromaDB](https://img.shields.io/badge/ChromaDB-VectorDB-orange?style=for-the-badge)
![Gemini](https://img.shields.io/badge/Gemini-AI-8E75FF?style=for-the-badge)

</p>

---

# 📖 Overview

DocMind AI is a full-stack AI-powered Document Intelligence platform that enables users to upload documents, extract structured information using AI, perform semantic search, and chat with their documents using Retrieval-Augmented Generation (RAG).

Built with **FastAPI**, **React**, **PostgreSQL**, **ChromaDB**, and modern AI models, DocMind AI demonstrates an end-to-end document processing pipeline—from OCR to conversational AI.

---

# ✨ Features

### 📄 Intelligent Document Processing

- Upload PDF, PNG, and JPG documents
- OCR-based text extraction
- AI-powered document classification
- Structured information extraction
- Automatic document summarization

### 🔍 Semantic Search

- Vector embeddings with BAAI BGE
- ChromaDB vector database
- Similarity search
- Highlighted search results
- AI-generated summaries

### 💬 AI Chat (RAG)

- Retrieval-Augmented Generation
- Context-aware document conversations
- Source citations
- Multi-document retrieval
- Local embedding support

### 📊 Analytics Dashboard

- Document statistics
- Upload trends
- Processing success metrics
- Confidence score analysis
- Search & chat analytics

### 🔐 Authentication

- JWT Authentication
- User Registration & Login
- Protected Routes
- Secure API Access

---

# 🛠 Tech Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Query
- Recharts
- React Hook Form
- Zod

## Backend

- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- JWT Authentication
- AsyncPG

## AI & Machine Learning

- PaddleOCR
- Google Gemini
- OpenAI
- ChromaDB
- BAAI BGE Embeddings
- Semantic Search
- Retrieval-Augmented Generation (RAG)

---

# 📸 Application Preview

<p align="center">
<img src="assets/dashboard.png" width="100%">
</p>

---

# 🚀 Getting Started

## Clone the Repository

```bash
git clone https://github.com/prvsh77/DocMind-AI.git

cd DocMind-AI
```

## Frontend

```bash
npm install

npm run dev
```

## Backend

```bash
cd server

python -m venv .venv

.venv\Scripts\activate

pip install -r requirements.txt

python -m alembic upgrade head

python seed.py

python -m uvicorn app.main:app --reload --port 8080
```

---

# 📂 Project Structure

```
DocMind-AI
│
├── server
│   ├── app
│   │   ├── ai
│   │   ├── api
│   │   ├── auth
│   │   ├── database
│   │   ├── models
│   │   └── schemas
│   │
│   └── migrations
│
├── src
│   ├── app
│   ├── components
│   ├── pages
│   └── api
│
├── assets
│
├── README.md
└── package.json
```

---

# 🎯 Roadmap

- ✅ OCR Processing
- ✅ AI Classification
- ✅ Structured Data Extraction
- ✅ Semantic Search
- ✅ RAG Chat
- ✅ Analytics Dashboard
- ✅ JWT Authentication
- ⏳ Multi-document Chat
- ⏳ Cloud Deployment
- ⏳ Real-time Collaboration

---

# 🤝 Contributing

Contributions are welcome!

If you have ideas, improvements, or bug fixes, feel free to fork the repository and submit a pull request.

---

# 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">
Made with ❤️ using React, FastAPI, PostgreSQL, ChromaDB, and Generative AI.
</p>

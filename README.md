# 🧠 DocuMind — Open-Source RAG Document Intelligence

> **100% FREE** RAG application with Hugging Face inference. Single Next.js app, deploys to Vercel in one click.

![Stack](https://img.shields.io/badge/Next.js-14-000000) ![HF](https://img.shields.io/badge/HuggingFace-Mistral--7B-FFD21E) ![Free](https://img.shields.io/badge/Cost-%240-success) ![Deploy](https://img.shields.io/badge/Deploy-Vercel-black)

---

## ✨ Features

- **📤 Multi-format Upload** — PDF, DOCX, TXT
- **🔍 Real RAG Pipeline** — Parse → chunk → embed → retrieve → generate
- **🎯 4 AI Modes** — Extract / Classify / Summarize / Q&A
- **📊 Source Citations** — RAG answers with chunks & similarity scores
- **🆓 100% Free** — Uses Hugging Face Inference API free tier

## 🏗️ Architecture

```
Next.js 14 (Vercel)
   ├── Frontend (React + Tailwind)
   └── API Routes (serverless)
        ├── pdf-parse / mammoth (parsing)
        ├── In-memory vector store (cosine similarity)
        └── Hugging Face Inference API
             ├── sentence-transformers/all-MiniLM-L6-v2 (embeddings)
             └── mistralai/Mistral-7B-Instruct-v0.3 (LLM)
```

---

## 🚀 Deploy in 5 Minutes

### Step 1 — Get FREE Hugging Face Token (2 min)

1. Go to **[huggingface.co/join](https://huggingface.co/join)** and sign up free
2. Once logged in, visit **[huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)**
3. Click **+ Create new token**
4. Settings:
   - **Token name:** `documind`
   - **Token type:** select **"Read"**
5. Click **Create token**
6. **Copy the token** (starts with `hf_...`)

### Step 2 — Push to GitHub (1 min)

```bash
cd documind
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/documind.git
git push -u origin main
```

### Step 3 — Deploy to Vercel (2 min)

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → import repo
2. Add environment variable:
   - **Key:** `HF_TOKEN`
   - **Value:** your `hf_...` token from Step 1
3. Click **Deploy** → live in ~90 seconds 🎉

---

## ⚠️ Free Tier Notes

This uses Hugging Face's **free Inference API**, which has these characteristics:

- **Cold starts:** First request after a while takes 15-20s (model warming up). Subsequent requests are fast (1-3s).
- **Rate limits:** 1000 requests/day on free tier — plenty for portfolio demo.
- **Vector store is in-memory:** When a Vercel serverless function goes "cold" (~5-15 min idle), the document chunks are lost. Users would need to re-upload.

For production use, upgrade to Hugging Face Pro ($9/mo) or swap to OpenAI/Anthropic in `src/lib/hf.ts`.

---

## 📁 Project Structure

```
documind/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload/route.ts
│   │   │   ├── extract/route.ts
│   │   │   ├── classify/route.ts
│   │   │   ├── summarize/route.ts
│   │   │   ├── qa/route.ts
│   │   │   └── delete/route.ts
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── UploadZone.tsx
│   │   ├── ModeSelector.tsx
│   │   ├── Results.tsx
│   │   └── QAChat.tsx
│   └── lib/
│       ├── hf.ts            # Hugging Face client
│       ├── parser.ts        # PDF/DOCX parser + chunking
│       ├── vectorstore.ts   # In-memory vector DB
│       ├── llm.ts           # AI operations
│       └── api.ts           # Frontend client
├── package.json
├── next.config.js
└── README.md
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| LLM | Mistral-7B-Instruct (Hugging Face) |
| Embeddings | all-MiniLM-L6-v2 (Hugging Face) |
| Vector Store | In-memory + cosine similarity |
| PDF Parsing | pdf-parse |
| DOCX Parsing | mammoth |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## 🙋 Built By

**Kanhaiya Chaudhary** — GenAI Developer @ PwC  
[LinkedIn](https://linkedin.com/in/kanhaiya772) · [GitHub](https://github.com/kanhaiya772)

## 📄 License
MIT

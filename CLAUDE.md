# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RAG (Retrieval Augmented Generation) platform for PDF documents. Users upload PDFs, the system indexes them into a vector database, and an interactive chat answers questions using only the extracted document content as context.

## Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js with Express or Fastify
- **Document DB:** MongoDB (file metadata, users, logs)
- **Vector DB:** ChromaDB or LanceDB (via Docker)
- **AI Orchestration:** LangChain.js
- **PDF Parsing:** `pdf-parse` or `@langchain/community/document_loaders/fs/pdf`
- **Embeddings:** OpenAI `text-embedding-3-small` (or local via Transformers.js)
- **LLM:** GPT-4 or Claude

## Architecture

### Ingestion Pipeline (Upload)
1. Frontend sends `.pdf` via `multipart/form-data` to `POST /upload`
2. Backend extracts raw text from PDF
3. Text is split using `RecursiveCharacterTextSplitter` (chunk: 1000 chars, overlap: 200)
4. Each chunk is embedded and stored in the vector DB
5. File metadata (name, path, user ID) is saved to MongoDB

### Query Pipeline (Chat)
1. User question is embedded using the same model
2. Top 4–5 most similar chunks are retrieved via cosine similarity
3. A prompt is assembled with the retrieved context and sent to the LLM
4. LLM response is streamed back to the frontend

### System Prompt Template
```
Você é um assistente técnico. Use os seguintes trechos de documentos para responder à pergunta do usuário. Se a resposta não estiver no texto, diga que não sabe.
CONTEXTO: {trechos_recuperados}
PERGUNTA: {pergunta_do_usuario}
```

## Deployment

Uses `docker-compose` to orchestrate the app, MongoDB, and vector DB containers. The vector DB volume must be mounted to the host for persistence. Nginx acts as reverse proxy serving the Vite build and forwarding API requests.

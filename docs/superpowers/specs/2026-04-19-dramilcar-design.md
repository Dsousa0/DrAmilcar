# DrAmilcar — Design Spec

**Data:** 2026-04-19
**Status:** Aprovado

---

## Visão Geral

Plataforma RAG (Retrieval Augmented Generation) para upload e consulta de documentos PDF. Usuários autenticados fazem upload de PDFs, o sistema os indexa em um banco vetorial, e um chat interativo responde perguntas usando exclusivamente o conteúdo dos documentos do usuário. Respostas streamadas token a token.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Auth | JWT (access token 24h, bcrypt salt 12) |
| Document DB | MongoDB + Mongoose |
| Vector DB | ChromaDB (Docker container) |
| AI Orchestration | LangChain.js |
| PDF Parsing | pdf-parse |
| Embeddings | OpenRouter → text-embedding-3-small |
| LLM | OpenRouter (model configurável via .env) |
| Streaming | SSE (Server-Sent Events) |
| Proxy | Nginx |
| Deploy | Docker Compose |

---

## Estrutura de Diretórios

```
DrAmilcar/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── documents.routes.js
│   │   │   └── chat.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── documents.controller.js
│   │   │   └── chat.controller.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── pdf.service.js
│   │   │   ├── embedding.service.js
│   │   │   ├── vector.service.js
│   │   │   └── rag.service.js
│   │   ├── models/
│   │   │   ├── User.model.js
│   │   │   └── Document.model.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── upload.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── config/
│   │   │   ├── env.js
│   │   │   ├── mongo.js
│   │   │   └── chroma.js
│   │   └── utils/
│   │       └── logger.js
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   │   ├── ChatWindow.jsx
│   │   │   │   ├── MessageBubble.jsx
│   │   │   │   └── ChatInput.jsx
│   │   │   ├── Upload/
│   │   │   │   ├── UploadZone.jsx
│   │   │   │   └── ProgressBar.jsx
│   │   │   └── Documents/
│   │   │       └── DocumentList.jsx
│   │   ├── hooks/
│   │   │   ├── useChat.js
│   │   │   └── useDocuments.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   └── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── Dockerfile
│
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
└── CLAUDE.md
```

---

## API Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | /api/auth/register | ❌ | Cria usuário (email + senha) |
| POST | /api/auth/login | ❌ | Retorna JWT |
| GET | /api/documents | ✅ | Lista PDFs do usuário |
| POST | /api/documents/upload | ✅ | Upload + ingestão (multipart/form-data, max 250MB) |
| DELETE | /api/documents/:id | ✅ | Remove PDF e chunks do ChromaDB |
| POST | /api/chat/stream | ✅ | SSE stream da resposta RAG |

---

## Auth

- Senha armazenada com **bcrypt** (salt rounds: 12)
- Login retorna **JWT** com payload `{ userId, email }`, expiração 24h
- Middleware `auth.middleware.js` verifica o token em todas as rotas protegidas
- Todas as queries filtram por `userId` — usuário nunca acessa dados de outro

---

## Pipeline de Ingestão

```
POST /api/documents/upload
  │
  ├─ Multer → recebe PDF (limite 250MB)
  ├─ pdf.service → extrai texto bruto (pdf-parse)
  ├─ pdf.service → RecursiveCharacterTextSplitter (chunk 1000 chars, overlap 200)
  ├─ embedding.service → vetoriza cada chunk (OpenRouter text-embedding-3-small)
  ├─ vector.service → salva chunks + vetores no ChromaDB (collection: user_{userId})
  └─ Document.model → salva metadados no MongoDB → retorna 201
```

---

## Pipeline de Query — SSE Streaming

```
POST /api/chat/stream  { question }
  │
  ├─ Headers SSE: Content-Type: text/event-stream
  ├─ embedding.service → vetoriza a pergunta
  ├─ vector.service → top-5 chunks mais similares (cosine, collection: user_{userId})
  ├─ rag.service → monta prompt (sistema + contexto + pergunta)
  ├─ OpenRouter API (stream: true) via LangChain ChatOpenAI
  ├─ Cada token → escreve data: { token } no SSE
  └─ Ao finalizar → data: [DONE], fecha conexão
```

### System prompt RAG

```
Você é um assistente técnico. Use os seguintes trechos de documentos para
responder à pergunta do usuário. Se a resposta não estiver no texto, diga
que não sabe.

CONTEXTO:
---
{trechos_recuperados}
---

PERGUNTA: {pergunta_do_usuario}
```

---

## Isolamento Multi-usuário (ChromaDB)

Cada usuário tem uma collection nomeada `user_{userId}`. A busca vetorial é sempre scoped para a collection do usuário autenticado — sem filtros adicionais, sem risco de vazamento entre usuários.

---

## Frontend

### Layout

```
┌─────────────────────────────────────────────┐
│  Sidebar                  │  Chat Window     │
│  [+ Upload PDF]           │  [Mensagens com  │
│                           │   markdown +     │
│  Arquivos indexados:      │   auto-scroll]   │
│  • relatorio.pdf ✕        │                  │
│  • manual.pdf    ✕        │  [Input + Enviar]│
└─────────────────────────────────────────────┘
```

### Componentes

- **UploadZone** — drag-and-drop + clique, barra de progresso via `onUploadProgress` do Axios, bloqueia durante upload em andamento
- **DocumentList** — lista PDFs com botão de exclusão, atualiza após upload
- **ChatWindow** — auto-scroll, renderiza markdown com `react-markdown` + `remark-gfm`
- **MessageBubble** — estilo distinto para mensagens do usuário vs IA
- **useChat** — gerencia SSE: `{ messages, sendMessage, isStreaming }`
- **AuthContext** — JWT no localStorage, interceptor Axios, redirect em 401

### Dependências frontend

```
react-markdown    # Renderização markdown
remark-gfm        # Suporte a tabelas, código, listas
axios             # HTTP client com interceptors JWT
```

---

## Docker

### Produção (docker-compose.yml)

```yaml
services:
  nginx:     # Porta 80 pública — serve build Vite + proxy /api → backend
  backend:   # Porta 3000 interna
  mongodb:   # Porta 27017 interna — volume persistente
  chromadb:  # Porta 8000 interna — volume persistente
```

Todos os serviços com `healthcheck`. Backend usa `depends_on: condition: service_healthy`.

### Desenvolvimento (docker-compose.dev.yml)

```yaml
services:
  backend:   # Porta 3000 exposta, bind-mount src/, nodemon
  frontend:  # Porta 5173 exposta, Vite HMR
  mongodb:   # Porta 27017 exposta
  chromadb:  # Porta 8000 exposta
```

Subir: `docker-compose -f docker-compose.dev.yml up`

### Nginx — SSE

Headers obrigatórios para streaming funcionar:
```nginx
proxy_buffering off;
proxy_set_header X-Accel-Buffering no;
```

---

## Variáveis de Ambiente (.env)

```bash
# LLM
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=openai/gpt-4o
EMBEDDING_MODEL=openai/text-embedding-3-small

# Auth
JWT_SECRET=                        # mínimo 32 chars
JWT_EXPIRES_IN=24h

# MongoDB
MONGODB_URI=mongodb://mongodb:27017/dramilcar

# ChromaDB
CHROMA_URL=http://chromadb:8000

# App
PORT=3000
NODE_ENV=production
UPLOAD_LIMIT_MB=250
```

---

## MongoDB Schemas

### User
```js
{ email: String (unique), passwordHash: String, createdAt: Date }
```

### Document
```js
{
  userId: ObjectId (ref: User),
  filename: String,
  originalName: String,
  sizeBytes: Number,
  chunkCount: Number,
  chromaCollection: String,  // "user_{userId}"
  createdAt: Date
}
```

---

## Padrões de Implementação

- `app.js` separado de `server.js` (testabilidade via Supertest)
- Env vars validadas no startup com **Zod** (falha rápida e explícita)
- Graceful shutdown: fecha MongoDB + HTTP server em SIGTERM/SIGINT
- Logging estruturado com **pino** (redact: authorization headers, passwords)
- Retry com exponential backoff em chamadas à API OpenRouter (max 3 tentativas)
- `max_tokens` definido em toda chamada LLM
- Input do usuário nunca concatenado diretamente em instruções do prompt

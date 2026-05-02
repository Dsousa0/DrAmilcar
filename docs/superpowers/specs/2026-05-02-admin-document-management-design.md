# Design: Gerenciamento de Documentos Restrito ao Admin

**Data:** 2026-05-02  
**Status:** Aprovado  
**Escopo:** Restringir upload/delete de documentos ao admin; tornar documentos uma coleção global compartilhada; introduzir sidebar de navegação.

---

## Contexto

Atualmente, qualquer usuário autenticado pode fazer upload e deletar documentos. Cada usuário tem sua própria coleção isolada no ChromaDB (`user_{userId}`). O objetivo é centralizar o gerenciamento de documentos no admin, com uma coleção global que todos os usuários utilizam no chat.

---

## Decisões de Design

| Decisão | Escolha | Motivo |
|---|---|---|
| Armazenamento de documentos | Coleção global `global_documents` | Simplicidade; sem duplicação de dados |
| Proteção das rotas | `requireAdmin` middleware existente | Já implementado, sem código novo |
| Navegação frontend | Sidebar lateral persistente | Melhor UX; separa claramente Chat e Documentos |
| Acesso de usuários comuns à lista | Visível, somente leitura via sidebar | Transparência sobre o corpus disponível |

---

## Arquitetura

### Backend

#### Rotas (`documents.routes.js`)

```
POST   /api/documents/upload   → authenticate → requireAdmin → upload.single → uploadDocument
DELETE /api/documents/:id      → authenticate → requireAdmin → deleteDocument
GET    /api/documents          → authenticate → listDocuments  (todos os usuários)
```

#### Controller (`documents.controller.js`)

- `uploadDocument()`: usa `global_documents` como `chromaCollection` (substitui `user_${userId}`)
- `listDocuments()`: remove filtro `{ userId }` — retorna todos os documentos
- `deleteDocument()`: remove checagem de ownership — admin pode deletar qualquer documento

#### Serviço de Vector/Chat

- Todas as buscas de similaridade apontam para `global_documents` em vez de `user_${req.user.userId}`
- Afeta: `vectorService` e o controller/service de chat onde a coleção é resolvida

#### Modelo (`Document.model.js`)

- O campo `chromaCollection` passa a armazenar sempre `global_documents`
- Campo `userId` mantido para rastreabilidade (quem fez o upload)

---

### Frontend

#### Layout com Sidebar

```
┌─────────┬──────────────────────────────┐
│         │                              │
│  [Chat] │    Área de conteúdo          │
│         │    (Chat ou Documentos)      │
│  [Docs] │                              │
│         │                              │
│─────────│                              │
│ [Avatar]│                              │
│[Usuários│  ← admin only               │
│[Logout] │                              │
└─────────┴──────────────────────────────┘
```

#### Componentes

| Componente | Ação | Descrição |
|---|---|---|
| `Sidebar.jsx` | Novo | Navegação lateral com ícones; aba ativa destacada; botão "Usuários" apenas para admin no rodapé |
| `DocumentsPage.jsx` | Novo | Agrega `UploadZone` + `DocumentList`; recebe `isAdmin` para controle de renderização |
| `DocumentList.jsx` | Modificado | Aceita prop `canDelete`; botão de deletar condicional |
| `App.jsx` | Modificado | Substitui layout flat pela estrutura sidebar + área de conteúdo; gerencia aba ativa |

#### Comportamento por Role

| Elemento | Admin | Usuário comum |
|---|---|---|
| Aba Chat (sidebar) | Visível | Visível |
| Aba Documentos (sidebar) | Visível | Visível |
| UploadZone na aba Documentos | Visível | Oculto |
| Lista de documentos | Com botão deletar | Somente leitura |
| Título da aba Documentos | "Gerenciar Documentos" | "Documentos" |
| Botão "Usuários" (sidebar rodapé) | Visível | Oculto |

---

## Fluxo de Dados

### Upload (admin)
1. Admin seleciona/arrasta PDF na `UploadZone`
2. `useDocuments.upload()` envia `POST /api/documents/upload` com Bearer token
3. Backend valida `requireAdmin`, processa PDF, gera embeddings
4. Armazena metadados no MongoDB com `chromaCollection: 'global_documents'`
5. Lista de documentos é atualizada automaticamente

### Chat (qualquer usuário)
1. Usuário digita pergunta no chat
2. Backend embute a pergunta e busca no ChromaDB em `global_documents`
3. Retorna os chunks mais relevantes como contexto para o LLM
4. Resposta streamada de volta ao frontend

### Listagem de Documentos (qualquer usuário autenticado)
1. Usuário clica na aba "Documentos" na sidebar
2. `GET /api/documents` retorna todos os documentos (sem filtro de userId)
3. `DocumentList` renderiza a lista; botão deletar aparece somente para admin

---

## Tratamento de Erros

| Cenário | Resposta |
|---|---|
| Usuário comum tenta POST /upload | 403 FORBIDDEN — "Admin access required" |
| Usuário comum tenta DELETE /:id | 403 FORBIDDEN — "Admin access required" |
| Upload de arquivo não-PDF | 400 — "Only PDF files are allowed" |
| Documento não encontrado no delete | 404 — "Document not found" |

---

## O que NÃO muda

- Sistema de autenticação (JWT, bcrypt, middleware)
- Gerenciamento de usuários (AdminUsers page)
- Funcionalidade de chat e conversas
- ChromaDB e LangChain (só muda o nome da coleção)
- MongoDB schema (campo `chromaCollection` já existe)

---

## Sequência de Implementação

1. Backend: adicionar `requireAdmin` nas rotas de upload e delete
2. Backend: alterar `uploadDocument` para usar `global_documents`
3. Backend: remover filtro userId em `listDocuments` e checagem de ownership em `deleteDocument`
4. Backend: alterar serviço de vector/chat para buscar em `global_documents`
5. Frontend: criar `Sidebar.jsx`
6. Frontend: criar `DocumentsPage.jsx`
7. Frontend: modificar `DocumentList.jsx` para aceitar `canDelete`
8. Frontend: refatorar `App.jsx` para layout com sidebar

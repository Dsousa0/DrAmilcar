# Chat Persistence Design

## Goal

Persist chat conversations to MongoDB so users can reload history across sessions, switch between past conversations, and reset to a new conversation at any time.

## Architecture

Conversations are stored as MongoDB documents containing an embedded array of messages. The backend chat streaming endpoint is extended to accept a `conversationId` and saves both the user question and the full assistant response after the stream completes. The frontend manages conversation state through a new `useConversations` hook that drives both the sidebar list and the chat message display.

## Tech Stack

- MongoDB + Mongoose (existing)
- Express (existing)
- React hooks (existing pattern: `useDocuments`, `useChat`)

---

## Backend

### New Model: `Conversation`

**File:** `backend/src/models/Conversation.model.js`

```js
{
  userId:   ObjectId,          // ref: 'User', indexed
  title:    String,            // first 60 chars of first user message
  messages: [
    { role: 'user'|'assistant', content: String, createdAt: Date }
  ],
  timestamps: true             // createdAt, updatedAt
}
```

### New Service: `conversation.service.js`

**File:** `backend/src/services/conversation.service.js`

- `listConversations(userId)` — returns `[{ _id, title, updatedAt }]`, sorted by `updatedAt` desc, no messages
- `createConversation(userId)` — creates empty conversation, returns full document
- `getConversation(userId, conversationId)` — returns full document with messages; throws 404 if not found or wrong user
- `appendMessages(conversationId, userContent, assistantContent)` — single `$push` of both messages; sets title from first user message if title is empty

### New Routes: `/api/conversations`

**File:** `backend/src/routes/conversations.routes.js`

| Method | Path   | Action                                          |
|--------|--------|-------------------------------------------------|
| GET    | `/`    | list conversations (id, title, updatedAt only)  |
| POST   | `/`    | create new empty conversation                   |
| GET    | `/:id` | get full conversation with messages             |

All routes protected by existing `authenticate` middleware.

### Modified: `chat.controller.js`

`POST /api/chat/stream` body now accepts optional `conversationId`.

After the stream completes (`onDone`), the controller calls `appendMessages(conversationId, question, fullResponse)`. If `conversationId` is absent or invalid, streaming still works — persistence is best-effort and does not block the response.

The full assistant response is accumulated in a local string during streaming:
```js
let fullResponse = ''
onToken: (token) => {
  fullResponse += token
  res.write(...)
}
onDone: async () => {
  res.write('data: [DONE]\n\n')
  res.end()
  if (conversationId) await appendMessages(conversationId, question, fullResponse)
}
```

---

## Frontend

### New Hook: `useConversations`

**File:** `frontend/src/hooks/useConversations.js`

State:
- `conversations` — `[{ _id, title, updatedAt }]`
- `activeId` — id of selected conversation
- `messages` — `[{ role, content }]` of active conversation

Actions:
- `loadConversations()` — `GET /api/conversations`, auto-selects most recent
- `selectConversation(id)` — `GET /api/conversations/:id`, sets messages
- `createConversation()` — `POST /api/conversations`, sets as active with empty messages
- `appendOptimistic(role, content)` — local append during streaming (no API call)

### Modified: `useChat`

Accepts `{ conversationId, onMessageAppend }` props.

- Sends `{ question, conversationId }` in POST body
- Calls `onMessageAppend('user', question)` and `onMessageAppend('assistant', '')` before streaming
- Updates last message token-by-token via `onMessageAppend` during stream

### Modified: `App.jsx`

`MainLayout` instantiates `useConversations`, passes `activeId` and `appendOptimistic` to `ChatWindow`.

### Modified: `ChatWindow.jsx`

Receives `messages`, `activeId`, `appendOptimistic` as props instead of owning them internally. Passes `conversationId` down to `useChat`.

### New Component: `ConversationList.jsx`

**File:** `frontend/src/components/Conversations/ConversationList.jsx`

- Renders list of past conversations (title + relative date)
- Highlights active conversation
- "**+ Nova Conversa**" button at top calls `createConversation()`
- Shown in sidebar above "Documentos indexados" section

### Modified: `api.js`

Three new functions:
- `getConversations()` — `GET /api/conversations`
- `createConversation()` — `POST /api/conversations`
- `getConversation(id)` — `GET /api/conversations/:id`

---

## Data Flow

```
Login
  └─ loadConversations()
       ├─ conversations exist → selectConversation(most recent id)
       └─ none → empty state, messages = []

User sends message
  ├─ if no activeId → createConversation() first
  ├─ appendOptimistic('user', question)
  ├─ appendOptimistic('assistant', '')
  ├─ POST /chat/stream { question, conversationId }
  │    └─ tokens stream in, last message updated
  └─ backend saves both messages after [DONE]

"Nova Conversa" click
  └─ createConversation() → activeId = new id, messages = []

Conversation click in sidebar
  └─ selectConversation(id) → messages = full history
```

---

## Error Handling

- `getConversation` returns 404 if `userId` doesn't match → frontend shows empty state
- `appendMessages` failure is logged server-side but does not surface to user (stream already completed)
- If `loadConversations` fails on startup → silently start with empty state

## Out of Scope

- Pagination of conversations list
- Deleting individual conversations
- Renaming conversation titles
- Search across conversations

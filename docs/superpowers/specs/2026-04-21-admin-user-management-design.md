# Admin User Management — Design Spec

**Date:** 2026-04-21
**Status:** Approved

## Overview

Restrict user creation to administrators only. Remove public self-registration. Admins get a dedicated CRUD screen to manage all users; regular users see only the chat interface.

---

## Backend

### 1. User Model (`backend/src/models/User.model.js`)

Add a `role` field:

```js
role: {
  type: String,
  enum: ['admin', 'user'],
  default: 'user',
}
```

### 2. Auth Service (`backend/src/services/auth.service.js`)

Include `role` in the JWT payload:

```js
generateToken({ userId, email, role })
```

The `verifyToken` result will now expose `req.user.role` downstream.

### 3. Auth Middleware (`backend/src/middleware/auth.middleware.js`)

Add `requireAdmin` alongside the existing `authenticate`:

```js
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Admin access required' },
    })
  }
  next()
}
```

### 4. Admin Routes (`backend/src/routes/admin.routes.js`) — new file

All routes protected by `authenticate + requireAdmin`.

| Method   | Route              | Action                        |
|----------|--------------------|-------------------------------|
| `GET`    | `/admin/users`     | List all users (email, role, createdAt) |
| `POST`   | `/admin/users`     | Create user (email, password, role) |
| `PATCH`  | `/admin/users/:id` | Update email and/or password  |
| `DELETE` | `/admin/users/:id` | Remove user                   |

Admin cannot delete their own account (guard: `req.params.id !== req.user.userId`).

### 5. Admin Controller (`backend/src/controllers/admin.controller.js`) — new file

- `listUsers`: returns all users excluding `passwordHash`
- `createUser`: validates email uniqueness, hashes password, sets role (default `'user'`)
- `updateUser`: accepts optional `email` and `password`; re-hashes if password provided
- `deleteUser`: rejects self-deletion with 400

### 6. Remove Public Register Endpoint

Delete `router.post('/register', register)` from `auth.routes.js` and the `register` function from `auth.controller.js`.

### 7. Seed Script (`backend/scripts/seed-admin.js`) — new file

Reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`. Creates the admin user if not already present. Idempotent (safe to run multiple times).

```
npm run seed:admin
```

Add to `package.json`:
```json
"seed:admin": "node scripts/seed-admin.js"
```

---

## Frontend

### 1. Login Page (`frontend/src/pages/Login.jsx`)

- Remove the `mode` state and all register-related JSX
- Remove the toggle link "Não tem conta? Cadastre-se"
- Page renders only the login form

### 2. Auth Context (`frontend/src/context/AuthContext.jsx`)

- Remove the `register` function and its export
- Persist `user.role` — already included since `user` object from API will carry `role`
- Expose `isAdmin` helper: `const isAdmin = user?.role === 'admin'`

### 3. App Router (`frontend/src/App.jsx`)

After login:
- `role === 'admin'` → renders `MainLayout` with an extra "Usuários" button in the sidebar footer area
- `role === 'user'` → renders `MainLayout` as-is (no admin access)
- `AdminUsers` page replaces the full layout when active (not a modal, a full page swap)

### 4. Admin Users Page (`frontend/src/pages/AdminUsers.jsx`) — new file

**Layout:** Full-page, same stone/amber design system.

**Header:** "← Voltar" button (returns to chat) + title "Gestão de Usuários" in Lora.

**User list:** Table-style list with columns: Email, Role, Criado em, Ações.
- Each row: edit icon (opens inline edit form) + delete icon (with confirmation)
- Role displayed as a small badge: "admin" in amber, "user" in stone

**Create form:** "Novo usuário" button at the top opens an inline panel with fields:
- Email (text input)
- Senha (password input)
- Role (select: "user" | "admin")
- Confirmar / Cancelar buttons

**Edit form:** Clicking edit on a row opens an inline panel for that row:
- Email (pre-filled)
- Nova senha (optional — leave blank to keep current)
- Role (select)

**API integration:** New functions in `frontend/src/services/api.js`:
```js
export async function getUsers() { ... }
export async function createUser(data) { ... }
export async function updateUser(id, data) { ... }
export async function deleteUser(id) { ... }
```

**Error handling:** Inline error messages below each form. Confirmation dialog before delete ("Remover este usuário?").

---

## Security Notes

- `requireAdmin` runs server-side on every admin API call — client-side role check is UI only, not a security boundary
- Self-deletion blocked server-side
- Passwords never returned in any API response (`toJSON` transform on User model already strips `passwordHash`)
- Admin seed script must not run in production CI automatically — should be a manual one-time step

---

## Files to Create

| File | Type |
|------|------|
| `backend/scripts/seed-admin.js` | new |
| `backend/src/routes/admin.routes.js` | new |
| `backend/src/controllers/admin.controller.js` | new |
| `frontend/src/pages/AdminUsers.jsx` | new |

## Files to Modify

| File | Change |
|------|--------|
| `backend/src/models/User.model.js` | add `role` field |
| `backend/src/services/auth.service.js` | include `role` in JWT |
| `backend/src/middleware/auth.middleware.js` | add `requireAdmin` |
| `backend/src/routes/auth.routes.js` | remove `/register` route |
| `backend/src/controllers/auth.controller.js` | remove `register` function |
| `backend/src/app.js` | mount `/admin` routes |
| `frontend/src/pages/Login.jsx` | remove register mode |
| `frontend/src/context/AuthContext.jsx` | remove `register`, expose `isAdmin` |
| `frontend/src/App.jsx` | add admin routing + "Usuários" button |
| `frontend/src/services/api.js` | add admin API functions |

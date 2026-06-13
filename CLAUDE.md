# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

The entire project lives under `website/`. There are two independent npm workspaces:

- `website/backend/` — Express 5 + MongoDB API (CommonJS)
- `website/client/` — React 18 + Vite frontend (ES modules)

## Commands

All commands must be run from the appropriate subdirectory.

```bash
# Backend
cd website/backend
npm run dev        # nodemon watch mode (port 5001)
npm start          # plain node
npm test           # run all tests: node --test tests/*.test.js

# Run a single test file
node --test tests/authController.test.js

# Frontend
cd website/client
npm run dev        # Vite dev server (port 5173)
npm run build      # production build to dist/
npm run preview    # preview the production build
```

## Environment setup

**`website/backend/.env`** (minimum):
```
PORT=5001
MONGO_URI=mongodb://localhost:27017/college-lab-dashboard
JWT_SECRET=<long-random-string>
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**`website/client/.env`** (minimum):
```
VITE_API_URL=http://localhost:5001
```

Optional backend vars for AI features: `GEMINI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `LLM_MODEL` (default `gemini-2.5-flash-lite`).

## Architecture

### Backend request pipeline

`server.js` connects to MongoDB, initializes services (chat, vector store, announcement expiry), then hands off to the Express app created in `app.js`.

Every request goes through: `attachRequestContext` → `requestLogger` → CORS → JSON body parsing → route-specific rate limiters → route handler → `notFound` / `errorHandler`.

Rate limits: 240 req/min for `/api/*`, 30 req/15min for `/api/auth`, 40 req/min for `/api/chat`.

### Adding a new API route

1. Create `backend/routes/<name>Routes.js` and `backend/controllers/<name>Controller.js`
2. Mount it in `backend/app.js` with `app.use('/api/<name>', require('./routes/<name>Routes'))`
3. Apply `protect`, `instructorOrAdmin`, or `admin` from `middleware/authMiddleware.js` as needed

### Auth and role model

`protect` validates the JWT from `Authorization: Bearer <token>` and attaches `req.user`. Roles are `STUDENT`, `INSTRUCTOR` (alias `TEACHER`), and `ADMIN`. The `instructorOrAdmin` guard accepts all three non-student roles.

### Request validation

Input validation is centralized in `middleware/requestValidation.js`. It exports multer upload configs and per-route validator middleware. Add new validators there rather than inline in controllers.

### File access

Only `/uploads/testimonials` is served as static. All other uploads are gated behind JWT via `fileController.js` / `/api/files`.

### AI chat service

`services/chatService.js` wraps Google Gemini. It is lazily initialized via `initChatService()` called from `server.js`. If no API key is set the chat endpoint stays up but returns a degraded response. RAG context comes from Pinecone via `services/vectorStore.js`; personal student context is fetched from MongoDB by `services/personalDataRetriever.js`.

### Frontend

`client/src/config.js` exports the API base URL (`VITE_API_URL`). All API calls should import from there.

Provider nesting order in `App.jsx`: `ThemeProvider` → `I18nProvider` → `AuthProvider` → `Router`.

`ProtectedRoute` in `App.jsx` enforces role-based access; unauthenticated users are redirected to `/`.

Translations live in `context/translations.js` and are accessed via the `useI18n()` hook.

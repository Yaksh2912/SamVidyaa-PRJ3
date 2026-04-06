# SamVidyaa - Academic Management and RAG-Enabled Learning Platform

## Overview
SamVidyaa is a comprehensive full-stack academic platform designed to streamline course delivery, laboratory workflows, and student engagement in higher-education environments. The platform serves three primary user roles: **Students**, **Instructors**, and **Administrators**.

Beyond baseline academic management, the system supports:
- Course, module, and task lifecycle management
- Enrollment processing and student progress tracking
- Collaboration requests between peers
- Gamification through points, rewards, and leaderboards
- Announcement and testimonial management
- Desktop application distribution
- An AI-powered academic assistant implemented using a **Retrieval-Augmented Generation (RAG)** architecture

## Architecture & Tech Stack

The project is organized as a **monorepo** with two major runtime segments: a React frontend and an Express backend. Architecturally, the application follows a **layered modular monolith** approach.

### Frontend (`/client`)
- **Framework:** React 18 (built with Vite)
- **Routing:** React Router DOM
- **State / Cross-cutting Context:** React Context for authentication, theming, and internationalization
- **Styling:** Custom CSS stylesheets (`index.css`, page-level CSS, and component CSS)
- **Animations / Visual Enhancements:** Framer Motion, shader-based visual components, and React graphics tooling
- **Icons:** Lucide React, Radix UI Icons, React Icons.
- **API Communication:** `fetch` calls using a configurable `VITE_API_URL`

### Backend (`/backend`)
- **Runtime & Framework:** Node.js with Express.js
- **Database:** MongoDB via Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) and `bcryptjs` for password hashing.
- **File Uploads:** Multer for handouts, testimonial assets, and desktop app files
- **AI & RAG Integration:** 
  - OpenAI-compatible SDK configured for a Groq-hosted LLM by default
  - Google Generative AI embeddings (`text-embedding-004`)
  - Pinecone for vector storage and semantic retrieval
  - `pdf-parse` for PDF extraction during ingestion
- **Other Utilities:** `cors`, `dotenv`, `archiver`, `xlsx`, native file-system access

## Core Features

### 1. Role-Based Access Control
- **Admin Dashboard:** System overview, user management, and lab monitoring.
- **Instructor Dashboard:** Course management, module creation, task authoring, reward management, and student progress analytics.
- **Student Dashboard:** Viewing courses, submitting tasks, redeeming points for rewards, and accessing the AI Chatbot.

### 2. Gamification & Engagement
- **Points & Rewards:** Students earn points for academic actions. Instructors can create course-level rewards and students can redeem them.
- **Leaderboards:** Global, weekly, class-based, and peer-based ranking views.

### 3. Collaboration System
- Students can create collaboration requests tied to specific tasks and receive accept/reject responses from peers.

### 4. AI-Powered Assistant (RAG)
- The student-facing chatbot combines:
  - **Personal context retrieval** from MongoDB
  - **Semantic document retrieval** from Pinecone
  - **Conversation history persistence** through `ChatMessage`
  - **Rate limiting and in-memory caching** for operational stability
- **Retrieval-Augmented Generation (RAG):** Uploaded course handouts can be parsed, chunked, embedded, and indexed into Pinecone so the assistant can answer questions grounded in course material.

### 5. Document and Content Ingestion
- **Course Handouts:** Instructors can upload PDF handouts which are automatically processed and optionally indexed for semantic retrieval.
- **Task Import Pipeline:** Tasks can be imported from structured or semi-structured documents such as PDF, Word, text, and spreadsheet files.

### 6. Content Publishing Features
- **Announcements:** Used to broadcast platform or course information.
- **Testimonials:** Public landing-page feedback cards managed from the admin side.
- **Desktop App Assets:** The system can publish and distribute downloadable desktop application builds.

## Project Structure

```text
SamVidyaa-PRJ3/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components and modal workflows
│   │   ├── context/        # Auth, theme, and i18n providers
│   │   ├── pages/          # Landing, auth, and dashboard pages
│   │   ├── App.jsx         # Main application routing
│   │   └── main.jsx        # Application entry point
│   ├── index.html
│   └── vite.config.js      # Vite configuration
│
├── backend/                # Backend Node/Express application
│   ├── config/             # Configuration and database connection
│   ├── controllers/        # Business logic for endpoints
│   ├── middleware/         # Express middleware (JWT protection, etc.)
│   ├── models/             # Mongoose schemas and domain entities
│   ├── routes/             # API route definitions
│   ├── services/           # AI, retrieval, caching, and ingestion services
│   ├── uploads/            # Local file storage for uploaded assets
│   └── server.js           # Server entry point
│
└── SamVidyaa.md            # This documentation file
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance (local or MongoDB Atlas)
- Pinecone Account (for Vector Database)
- LLM Provider API Key (Groq / OpenAI / Google Generative AI)

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Configure Environment Variables: Create a `.env` file in the `backend/` root with the following keys:
   ```env
   PORT=5001
   MONGO_URI=<your_mongodb_connection_string>
   JWT_SECRET=<your_jwt_secret>
   
   # LLM provider configuration
   GROQ_API_KEY=<your_groq_api_key>
   LLM_MODEL=llama-3.3-70b-versatile
   LLM_BASE_URL=https://api.groq.com/openai/v1
   
   # Pinecone Vector Store
   PINECONE_API_KEY=<your_pinecone_api_key>
   PINECONE_INDEX_NAME=samvidyaa-docs

   # Google embeddings for vector generation
   GOOGLE_API_KEY=<your_google_api_key>
   ```
4. Start the development server: `npm run dev`

### Frontend Setup
1. Navigate to the client directory: `cd client`
2. Install dependencies: `npm install`
3. Configure Environment Variables (if required, create `.env` in `client/` and set `VITE_API_URL=http://localhost:5001`).
   *(Note: The client uses Vite, so env variables should be prefixed with `VITE_`)*
4. Start the Vite development server: `npm run dev`
5. Open your browser and navigate to `http://localhost:5173`.

## Database Entities (MongoDB Models)
- **User:** Stores identity, role, credentials, and point balance.
- **Course:** Represents a course with instructor ownership and optional handout indexing metadata.
- **Module:** Ordered instructional subdivisions within a course.
- **Task:** Rich assignment model including difficulty, time limit, deadline, collaboration flags, and test cases.
- **Enrollment:** Many-to-many relationship between students and courses with approval/status tracking.
- **StudentProgress:** Stores per-student course/module progress and score state.
- **TaskCompletion:** Immutable task completion events with awarded points and collaborator references.
- **Reward:** Redeemable reward catalog scoped to courses.
- **PointTransaction:** Audit-style ledger for point accrual and redemption.
- **ChatMessage:** Persisted conversation history for the chatbot.
- **CollaborationRequest:** Peer collaboration workflow entity.
- **Announcement / Testimonial / DesktopAppAsset:** Supporting entities for publishing and platform operations.

## Runtime Request Flow
At a high level, the request lifecycle follows this sequence:

1. The React SPA triggers an API request using `fetch`
2. Protected endpoints receive a `Bearer` JWT token
3. `authMiddleware` verifies the token and hydrates `req.user`
4. Route handlers forward control to the corresponding controller
5. Controllers execute validation, authorization, and use-case logic
6. Mongoose persists or retrieves operational data from MongoDB
7. Optional services interact with uploads, vector storage, or the LLM stack
8. JSON responses are returned to the frontend and rendered into the UI

## RAG Chatbot Architecture
The chatbot subsystem is implemented as a hybrid retrieval pipeline:

- **Personal Retrieval Layer:** Queries student-specific academic data from MongoDB using the authenticated student's ID from the JWT
- **General Retrieval Layer:** Performs semantic search over vectorized course handouts stored in Pinecone
- **Prompt Orchestration Layer:** Injects personal context, retrieved course context, and recent chat history into a system-guided LLM prompt
- **Generation Layer:** Produces the final response through a Groq-hosted model via an OpenAI-compatible SDK

Operational safeguards include:
- Per-student and global rate limiting
- In-memory LRU cache for repeated chat queries
- Graceful degradation when vector search or embeddings are unavailable
- Persistent `ChatMessage` storage for conversation continuity

## Deployment Notes
- **Frontend** can be deployed to platforms like Vercel, Netlify, or Render (ensure build commands are set to `npm run build`).
- **Backend** can be deployed to Render, Heroku-style PaaS, or cloud VM/container environments with Node.js support.
- **Database** requires MongoDB, either local or managed.
- **AI/RAG Features** require external provider configuration for Groq-compatible LLM access, Google embeddings, and Pinecone vector storage.
- The backend currently serves the `uploads/` directory as static content. In production, object storage such as S3 or an equivalent managed blob service would be a better long-term strategy.

---
*Created for future maintainers and developers of SamVidyaa.*

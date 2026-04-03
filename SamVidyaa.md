# SamVidyaa - College Lab Dashboard

## Overview
SamVidyaa is a comprehensive, full-stack educational platform designed to streamline college lab management and enhance the learning experience. It serves three primary user roles: **Students**, **Teachers**, and **Administrators**. 
The platform not only handles standard features like courses, modules, assignments, and grading but also incorporates gamification (points, leaderboards, rewards) and advanced AI capabilities (Retrieval-Augmented Generation Chatbot) to assist students.

## Architecture & Tech Stack

The project is structured as a monorepo containing a distinct Frontend (Client) and Backend.

### Frontend (`/client`)
- **Framework:** React 18 (built with Vite)
- **Routing:** React Router DOM
- **Styling:** CSS3, TailwindCSS (via `tailwind-merge`, `clsx`), Radix UI primitives.
- **Animations:** Framer Motion, and Three.js / React Three Fiber for 3D/dynamic elements (`@paper-design/shaders-react`, `@react-three/fiber`).
- **Icons:** Lucide React, Radix UI Icons, React Icons.

### Backend (`/backend`)
- **Runtime & Framework:** Node.js with Express.js
- **Database:** MongoDB (via Mongoose ORM)
- **Authentication:** JSON Web Tokens (JWT) and `bcryptjs` for password hashing.
- **File Uploads:** Multer (handling handouts, assignments, and profile images).
- **AI & RAG Integration:** 
  - `@google/generative-ai` / `openai` / GROQ API for LLM capabilities.
  - `@pinecone-database/pinecone` for vector database storage.
  - `pdf-parse` for parsing documents to feed the vector store.
- **Other Utilities:** `cors`, `dotenv`, `archiver`, `xlsx`.

## Core Features

### 1. Role-Based Access Control
- **Admin Dashboard:** System overview, user management, and lab monitoring.
- **Teacher Dashboard:** Course management, module creation, task assignment, reward management, and student progress tracking.
- **Student Dashboard:** Viewing courses, submitting tasks, redeeming points for rewards, and accessing the AI Chatbot.

### 2. Gamification & Engagement
- **Points & Rewards:** Students earn points for completing tasks. Teachers can create custom rewards, and students can redeem them in the "Point Shop".
- **Leaderboards:** Competitive tracking of student progress based on acquired points.

### 3. Collaboration System
- Students can interact with peers, ask for collaboration on specific tasks, and form study or project groups.

### 4. AI-Powered Assistant (RAG)
- An integrated Chatbot powered by Large Language Models (LLMs) like Llama 3 / OpenAI models.
- **Retrieval-Augmented Generation (RAG):** The chatbot utilizes Pinecone as a vector store to answer student queries contextually based on course materials and uploaded documents.

## Project Structure

```text
SamVidyaa-PRJ3/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components and Modals (e.g., ChatBot, ModalForms)
│   │   ├── context/        # React Context providers (AuthContext)
│   │   ├── pages/          # View components for routes (Dashboards, LandingPage, Auth)
│   │   ├── App.jsx         # Main application routing
│   │   └── main.jsx        # Application entry point
│   ├── index.html
│   └── vite.config.js      # Vite configuration
│
├── backend/                # Backend Node/Express application
│   ├── config/             # Configuration files (Database connection)
│   ├── controllers/        # Business logic for endpoints
│   ├── middleware/         # Custom Express middlewares (Auth, Multer setups)
│   ├── models/             # Mongoose schemas (User, Course, Module, Task, Reward, etc.)
│   ├── routes/             # API route definitions
│   ├── services/           # External services logic (ChatService, VectorStore setup)
│   ├── uploads/            # Directory for storing user-uploaded files
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
   
   # AI Provider configs (Example: Groq)
   GROQ_API_KEY=<your_groq_api_key>
   LLM_MODEL=llama-3.3-70b-versatile
   
   # Pinecone Vector Store
   PINECONE_API_KEY=<your_pinecone_api_key>
   PINECONE_INDEX_NAME=samvidyaa-docs
   ```
4. Start the development server: `npm run dev`

### Frontend Setup
1. Navigate to the client directory: `cd client`
2. Install dependencies: `npm install`
3. Configure Environment Variables (if required, create `.env` in `client/` and point API requests to `http://localhost:5001/api`).
   *(Note: The client uses Vite, so env variables should be prefixed with `VITE_`)*
4. Start the Vite development server: `npm run dev`
5. Open your browser and navigate to `http://localhost:5173`.

## Database Entities (MongoDB Models)
- **User:** Stores credentials, roles (Student, Teacher, Admin), and profile info.
- **Course:** Represents a subject or lab.
- **Module:** Sub-sections within a course.
- **Task / CodingQuestion:** Assignments or coding challenges tied to modules.
- **StudentProgress & Enrollment:** Tracks student enrollment in courses and their progress.
- **PointTransaction & Reward:** Manages gamification, storing earned points, and available redeemable items.
- **ChatMessage:** Stores conversation history interacting with the AI.
- **CollaborationRequest:** Manages peer-to-peer collaboration on tasks.

## Deployment Notes
- **Frontend** can be deployed to platforms like Vercel, Netlify, or Render (ensure build commands are set to `npm run build`).
- **Backend** can be deployed to Render, Heroku, or AWS (requires Node environment and `.env` variable configuration in the cloud platform).
- The `uploads/` dir in the backend handles local static file serving, in a production setting you might consider replacing Multer's local disk storage with an S3 bucket configuration.

---
*Created for future maintainers and developers of SamVidyaa.*

# College Lab Dashboard

A modern web dashboard for managing college lab work, designed for students, teachers, and administrators.

## Features

- **Landing Page**: Beautiful homepage with feature overview
- **Authentication**: Login and Signup pages with role selection
- **Role-based Dashboards**:
  - **Admin Dashboard**: System overview, user management, lab management
  - **Student Dashboard**: View assignments, submit work, track progress
  - **Teacher Dashboard**: Manage classes, grade assignments, monitor students

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
PRJ3/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── StudentDashboard.jsx
│   │   └── TeacherDashboard.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── vite.config.js
```

## Usage

1. Start at the landing page
2. Click "Sign Up" to create an account (select your role: Student, Teacher, or Admin)
3. Or click "Login" to sign in with existing credentials
4. After authentication, you'll be redirected to the appropriate dashboard based on your role

## Technologies Used

- React 18
- React Router DOM
- Vite
- CSS3

## Notes

- Authentication is currently simulated (localStorage-based) for demo purposes
- In a production environment, you would connect to a backend API for real authentication
- All dashboards are fully functional with placeholder data

import React from 'react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="logo">SamVidyaa</h1>
          <div className="nav-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link btn-primary">Sign Up</Link>
          </div>
        </div>
      </nav>

      <main className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to SamVidyaa</h1>
          <p className="hero-subtitle">
            Manage your lab work, assignments, and resources all in one place.
            Designed for students, teachers, and administrators.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-large btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-large btn-secondary">
              Sign In
            </Link>
          </div>
        </div>

        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">👨‍🎓</div>
            <h3>For Students</h3>
            <p>Access lab assignments, submit work, and track your progress</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍🏫</div>
            <h3>For Teachers</h3>
            <p>Manage classes, grade assignments, and monitor student progress</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍💼</div>
            <h3>For Admins</h3>
            <p>Oversee the entire system, manage users, and generate reports</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2024 SamVidyaa. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default LandingPage

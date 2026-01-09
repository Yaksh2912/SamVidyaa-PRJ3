import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import { useNavigate } from 'react-router-dom'
import { HiDocumentText, HiCheckCircle, HiClock, HiStar } from 'react-icons/hi2'
import './Dashboard.css'

function StudentDashboard() {
  const { theme } = useTheme()
  const { translations, language, changeLanguage } = useI18n()
  const { toggleTheme, isDark } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const t = translations.dashboard.student

  return (
    <div className="dashboard" data-theme={theme}>
      <nav className="dashboard-nav">
        <div className="nav-content">
          <h1 className="dashboard-title">{t.title}</h1>
          <div className="nav-actions">
            <div className="nav-controls">
              <select 
                className="language-selector"
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
              >
                <option value="en">EN</option>
                <option value="hi">हिं</option>
              </select>
              <button 
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
            <span className="user-info">{t.welcome}, {user?.name || 'Student'}</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              {t.logout}
            </button>
          </div>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h2>{t.header}</h2>
          <p>{t.subtitle}</p>
        </div>

        <div className="stats-grid">
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="stat-icon">
              <HiDocumentText />
            </div>
            <div className="stat-info">
              <h3>{t.stats.assignments}</h3>
              <p className="stat-number">12</p>
            </div>
          </motion.div>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="stat-icon">
              <HiCheckCircle />
            </div>
            <div className="stat-info">
              <h3>{t.stats.completed}</h3>
              <p className="stat-number">8</p>
            </div>
          </motion.div>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="stat-icon">
              <HiClock />
            </div>
            <div className="stat-info">
              <h3>{t.stats.pending}</h3>
              <p className="stat-number">4</p>
            </div>
          </motion.div>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="stat-icon">
              <HiStar />
            </div>
            <div className="stat-info">
              <h3>{t.stats.averageGrade}</h3>
              <p className="stat-number">85%</p>
            </div>
          </motion.div>
        </div>

        <div className="dashboard-sections">
          <motion.div 
            className="section-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <h3>{t.sections.currentAssignments}</h3>
            <p>{t.sections.currentAssignmentsDesc}</p>
            <button className="btn btn-primary">{t.sections.viewAssignments}</button>
          </motion.div>

          <motion.div 
            className="section-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <h3>{t.sections.submitWork}</h3>
            <p>{t.sections.submitWorkDesc}</p>
            <button className="btn btn-primary">{t.sections.submitWorkBtn}</button>
          </motion.div>

          <motion.div 
            className="section-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <h3>{t.sections.grades}</h3>
            <p>{t.sections.gradesDesc}</p>
            <button className="btn btn-primary">{t.sections.viewGrades}</button>
          </motion.div>

          <motion.div 
            className="section-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <h3>{t.sections.resources}</h3>
            <p>{t.sections.resourcesDesc}</p>
            <button className="btn btn-primary">{t.sections.resourcesBtn}</button>
          </motion.div>
        </div>

        <motion.div 
          className="recent-activity"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <h3>{t.activity.title}</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-time">{t.activity.dueTomorrow}</span>
              <span className="activity-text">Lab 5: Data Structures</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">Due: 3 days</span>
              <span className="activity-text">Lab 6: Algorithms</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">{t.activity.graded}</span>
              <span className="activity-text">Lab 4: OOP Concepts - Grade: 90%</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default StudentDashboard

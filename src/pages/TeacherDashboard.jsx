import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import { useNavigate } from 'react-router-dom'
import { HiUsers, HiBookOpen, HiDocumentText, HiChartBar } from 'react-icons/hi2'
import './Dashboard.css'

function TeacherDashboard() {
  const { theme } = useTheme()
  const { translations, language, changeLanguage } = useI18n()
  const { toggleTheme, isDark } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const t = translations.dashboard.teacher

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
            <span className="user-info">{t.welcome}, {user?.name || 'Teacher'}</span>
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
              <HiUsers />
            </div>
            <div className="stat-info">
              <h3>{t.stats.totalStudents}</h3>
              <p className="stat-number">120</p>
            </div>
          </motion.div>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="stat-icon">
              <HiBookOpen />
            </div>
            <div className="stat-info">
              <h3>{t.stats.activeClasses}</h3>
              <p className="stat-number">5</p>
            </div>
          </motion.div>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="stat-icon">
              <HiDocumentText />
            </div>
            <div className="stat-info">
              <h3>{t.stats.pendingGrading}</h3>
              <p className="stat-number">23</p>
            </div>
          </motion.div>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="stat-icon">
              <HiChartBar />
            </div>
            <div className="stat-info">
              <h3>{t.stats.avgPerformance}</h3>
              <p className="stat-number">82%</p>
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
            <h3>{t.sections.createAssignment}</h3>
            <p>{t.sections.createAssignmentDesc}</p>
            <button className="btn btn-primary">{t.sections.createAssignmentBtn}</button>
          </motion.div>

          <motion.div 
            className="section-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <h3>{t.sections.gradeSubmissions}</h3>
            <p>{t.sections.gradeSubmissionsDesc}</p>
            <button className="btn btn-primary">{t.sections.gradeWork}</button>
          </motion.div>

          <motion.div 
            className="section-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <h3>{t.sections.studentProgress}</h3>
            <p>{t.sections.studentProgressDesc}</p>
            <button className="btn btn-primary">{t.sections.viewProgress}</button>
          </motion.div>

          <motion.div 
            className="section-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <h3>{t.sections.classResources}</h3>
            <p>{t.sections.classResourcesDesc}</p>
            <button className="btn btn-primary">{t.sections.manageResources}</button>
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
              <span className="activity-time">2 hours ago</span>
              <span className="activity-text">John Doe {t.activity.submitted} Lab 5</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">5 hours ago</span>
              <span className="activity-text">Jane Smith {t.activity.submitted} Lab 5</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">{t.activity.dayAgo}</span>
              <span className="activity-text">Bob Johnson {t.activity.submitted} Lab 4</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default TeacherDashboard

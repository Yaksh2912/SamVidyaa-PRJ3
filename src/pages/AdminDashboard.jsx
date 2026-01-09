import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import { useNavigate } from 'react-router-dom'
import { HiUsers, HiAcademicCap, HiUserGroup, HiBookOpen } from 'react-icons/hi2'
import './Dashboard.css'

function AdminDashboard() {
  const { theme } = useTheme()
  const { translations, language, changeLanguage } = useI18n()
  const { toggleTheme, isDark } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const t = translations.dashboard.admin

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
            <span className="user-info">{t.welcome}, {user?.name || 'Admin'}</span>
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
              <h3>{t.stats.totalUsers}</h3>
              <p className="stat-number">1,234</p>
            </div>
          </motion.div>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="stat-icon">
              <HiAcademicCap />
            </div>
            <div className="stat-info">
              <h3>{t.stats.students}</h3>
              <p className="stat-number">1,000</p>
            </div>
          </motion.div>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="stat-icon">
              <HiUserGroup />
            </div>
            <div className="stat-info">
              <h3>{t.stats.teachers}</h3>
              <p className="stat-number">50</p>
            </div>
          </motion.div>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="stat-icon">
              <HiBookOpen />
            </div>
            <div className="stat-info">
              <h3>{t.stats.activeLabs}</h3>
              <p className="stat-number">25</p>
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
            <h3>{t.sections.userManagement}</h3>
            <p>{t.sections.userManagementDesc}</p>
            <button className="btn btn-primary">{t.sections.manageUsers}</button>
          </motion.div>

          <motion.div 
            className="section-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <h3>{t.sections.labManagement}</h3>
            <p>{t.sections.labManagementDesc}</p>
            <button className="btn btn-primary">{t.sections.manageLabs}</button>
          </motion.div>

          <motion.div 
            className="section-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <h3>{t.sections.reports}</h3>
            <p>{t.sections.reportsDesc}</p>
            <button className="btn btn-primary">{t.sections.viewReports}</button>
          </motion.div>

          <motion.div 
            className="section-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <h3>{t.sections.settings}</h3>
            <p>{t.sections.settingsDesc}</p>
            <button className="btn btn-primary">{t.sections.settingsBtn}</button>
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
              <span className="activity-text">{t.activity.newStudent}</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">5 hours ago</span>
              <span className="activity-text">{t.activity.assignmentSubmitted}</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">1 day ago</span>
              <span className="activity-text">{t.activity.newTeacher}</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default AdminDashboard

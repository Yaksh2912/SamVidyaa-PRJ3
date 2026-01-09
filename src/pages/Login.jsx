import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import './Auth.css'

function Login() {
  const { theme } = useTheme()
  const { translations } = useI18n()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
  })
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError(translations.auth.login.fillFields)
      return
    }

    login({
      email: formData.email,
      role: formData.role,
      name: formData.email.split('@')[0],
    })

    if (formData.role === 'admin') {
      navigate('/admin')
    } else if (formData.role === 'teacher') {
      navigate('/teacher')
    } else {
      navigate('/student')
    }
  }

  return (
    <div className="auth-container" data-theme={theme}>
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <h1>{translations.auth.login.title}</h1>
          <p>{translations.auth.login.subtitle}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">{translations.auth.login.email}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={translations.auth.login.emailPlaceholder}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{translations.auth.login.password}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={translations.auth.login.passwordPlaceholder}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">{translations.auth.login.role}</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="role-select"
            >
              <option value="student">{translations.auth.roles.student}</option>
              <option value="teacher">{translations.auth.roles.teacher}</option>
              <option value="admin">{translations.auth.roles.admin}</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-full">
            {translations.auth.login.signIn}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {translations.auth.login.noAccount} <Link to="/signup">{translations.auth.login.signUp}</Link>
          </p>
          <Link to="/" className="back-link">
            {translations.auth.login.backHome}
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default Login

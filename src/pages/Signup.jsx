import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import './Auth.css'

function Signup() {
  const { theme } = useTheme()
  const { translations } = useI18n()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    if (!formData.name || !formData.email || !formData.password) {
      setError(translations.auth.signup.fillFields)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError(translations.auth.signup.passwordMismatch)
      return
    }

    if (formData.password.length < 6) {
      setError(translations.auth.signup.passwordLength)
      return
    }

    login({
      email: formData.email,
      role: formData.role,
      name: formData.name,
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
          <h1>{translations.auth.signup.title}</h1>
          <p>{translations.auth.signup.subtitle}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">{translations.auth.signup.name}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={translations.auth.signup.namePlaceholder}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">{translations.auth.signup.email}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={translations.auth.signup.emailPlaceholder}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{translations.auth.signup.password}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={translations.auth.signup.passwordPlaceholder}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{translations.auth.signup.confirmPassword}</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={translations.auth.signup.confirmPasswordPlaceholder}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">{translations.auth.signup.role}</label>
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
            {translations.auth.signup.signUp}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {translations.auth.signup.haveAccount} <Link to="/login">{translations.auth.signup.signIn}</Link>
          </p>
          <Link to="/" className="back-link">
            {translations.auth.signup.backHome}
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default Signup

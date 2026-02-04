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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError(translations.auth.login.fillFields)
      return
    }

    try {
      const data = await login(formData.email, formData.password)

      const userRole = data.role

      if (userRole === 'ADMIN') {
        navigate('/admin')
      } else if (userRole === 'INSTRUCTOR' || userRole === 'teacher') {
        navigate('/teacher')
      } else {
        navigate('/student')
      }
    } catch (err) {
      setError(err.message)
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

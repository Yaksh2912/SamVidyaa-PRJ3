import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import '../pages/Auth.css'

function AuthSplitPage({ mode = 'login' }) {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { translations } = useI18n()
  const { login, register } = useAuth()
  const [displayMode, setDisplayMode] = useState(mode)
  const isSignupMode = displayMode === 'signup'

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loginError, setLoginError] = useState('')
  const [signupError, setSignupError] = useState('')

  const loginText = translations.auth.login
  const signupText = translations.auth.signup

  const handleModeSwitch = (nextMode) => {
    setDisplayMode(nextMode)
  }

  const handleLoginChange = (event) => {
    const { name, value } = event.target
    setLoginForm((current) => ({ ...current, [name]: value }))
    setLoginError('')
  }

  const handleSignupChange = (event) => {
    const { name, value } = event.target
    setSignupForm((current) => ({ ...current, [name]: value }))
    setSignupError('')
  }

  const redirectByRole = (role) => {
    if (role === 'ADMIN') {
      navigate('/admin')
      return
    }

    if (role === 'INSTRUCTOR' || role === 'teacher') {
      navigate('/teacher')
      return
    }

    navigate('/student')
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    setLoginError('')

    if (!loginForm.email || !loginForm.password) {
      setLoginError(loginText.fillFields)
      return
    }

    try {
      const data = await login(loginForm.email, loginForm.password)
      redirectByRole(data.role)
    } catch (error) {
      setLoginError(error.message)
    }
  }

  const handleSignupSubmit = async (event) => {
    event.preventDefault()
    setSignupError('')

    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      setSignupError(signupText.fillFields)
      return
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupError(signupText.passwordMismatch)
      return
    }

    if (signupForm.password.length < 6) {
      setSignupError(signupText.passwordLength)
      return
    }

    try {
      const data = await register(signupForm.name, signupForm.email, signupForm.password)
      redirectByRole(data.role)
    } catch (error) {
      setSignupError(error.message)
    }
  }

  return (
    <div className="auth-stage" data-theme={theme}>
      <motion.div
        className={`auth-wrapper ${isSignupMode ? 'panel-active' : ''}`}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="auth-form-box register-form-box">
          <form className="auth-reference-form" onSubmit={handleSignupSubmit}>
            <div className="auth-top-row">
              <Link to="/" className="auth-inline-home-link">{signupText.backHome}</Link>
            </div>
            <div className="auth-brand-mark">SamVidyaa</div>
            <h1>{signupText.title}</h1>
            <span>{signupText.subtitle}</span>
            {signupError ? <div className="auth-inline-error">{signupError}</div> : null}

            <input
              type="text"
              name="name"
              placeholder={signupText.namePlaceholder}
              value={signupForm.name}
              onChange={handleSignupChange}
              aria-label={signupText.name}
              required
            />
            <input
              type="email"
              name="email"
              placeholder={signupText.emailPlaceholder}
              value={signupForm.email}
              onChange={handleSignupChange}
              aria-label={signupText.email}
              required
            />
            <input
              type="password"
              name="password"
              placeholder={signupText.passwordPlaceholder}
              value={signupForm.password}
              onChange={handleSignupChange}
              aria-label={signupText.password}
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder={signupText.confirmPasswordPlaceholder}
              value={signupForm.confirmPassword}
              onChange={handleSignupChange}
              aria-label={signupText.confirmPassword}
              required
            />

            <button type="submit">{signupText.signUp}</button>

            <div className="mobile-switch">
              <p>{signupText.haveAccount}</p>
              <button type="button" className="auth-mobile-switch-link" onClick={() => handleModeSwitch('login')}>
                {signupText.signIn}
              </button>
            </div>
          </form>
        </div>

        <div className="auth-form-box login-form-box">
          <form className="auth-reference-form" onSubmit={handleLoginSubmit}>
            <div className="auth-top-row">
              <Link to="/" className="auth-inline-home-link">{loginText.backHome}</Link>
            </div>
            <div className="auth-brand-mark">SamVidyaa</div>
            <h1>{loginText.title}</h1>
            <span>{loginText.subtitle}</span>
            {loginError ? <div className="auth-inline-error">{loginError}</div> : null}

            <input
              type="email"
              name="email"
              placeholder={loginText.emailPlaceholder}
              value={loginForm.email}
              onChange={handleLoginChange}
              aria-label={loginText.email}
              required
            />
            <input
              type="password"
              name="password"
              placeholder={loginText.passwordPlaceholder}
              value={loginForm.password}
              onChange={handleLoginChange}
              aria-label={loginText.password}
              required
            />
            <button type="submit">{loginText.signIn}</button>

            <div className="mobile-switch">
              <p>{loginText.noAccount}</p>
              <button type="button" className="auth-mobile-switch-link" onClick={() => handleModeSwitch('signup')}>
                {loginText.signUp}
              </button>
            </div>
          </form>
        </div>

        <div className="slide-panel-wrapper">
          <div className="slide-panel">
            <div className="panel-content panel-content-left">
              <h1>{loginText.panelTitle}</h1>
              <p>{loginText.panelText}</p>
              <button type="button" className="transparent-btn" onClick={() => handleModeSwitch('login')}>
                {loginText.signIn}
              </button>
            </div>

            <div className="panel-content panel-content-right">
              <h1>{signupText.panelTitle}</h1>
              <p>{signupText.panelText}</p>
              <button type="button" className="transparent-btn" onClick={() => handleModeSwitch('signup')}>
                {signupText.signUp}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AuthSplitPage

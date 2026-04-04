import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import { useNavigate } from 'react-router-dom'
import { HiUsers, HiAcademicCap, HiUserGroup, HiBookOpen } from 'react-icons/hi2'
import { FiUpload, FiDownload, FiTrash2 } from 'react-icons/fi'
import API_BASE_URL from '../config'
import './Dashboard.css'

function AdminDashboard() {
  const { theme } = useTheme()
  const { translations, language, changeLanguage, t: translate } = useI18n()
  const { toggleTheme, isDark } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const installerInputRef = React.useRef(null)
  const [desktopApp, setDesktopApp] = React.useState(null)
  const [desktopAppLoading, setDesktopAppLoading] = React.useState(true)
  const [desktopVersion, setDesktopVersion] = React.useState('')
  const [selectedInstaller, setSelectedInstaller] = React.useState(null)
  const [desktopAppMessage, setDesktopAppMessage] = React.useState('')
  const [uploadingDesktopApp, setUploadingDesktopApp] = React.useState(false)
  const [removingDesktopApp, setRemovingDesktopApp] = React.useState(false)
  const testimonialImageInputRef = React.useRef(null)
  const [testimonials, setTestimonials] = React.useState([])
  const [testimonialForm, setTestimonialForm] = React.useState({
    id: null,
    name: '',
    role: '',
    quote: '',
    imageFile: null,
    imagePath: null,
  })
  const [testimonialMessage, setTestimonialMessage] = React.useState('')
  const [savingTestimonial, setSavingTestimonial] = React.useState(false)
  const [deletingTestimonialId, setDeletingTestimonialId] = React.useState(null)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const t = translations.dashboard.admin
  const dateFormatter = new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  React.useEffect(() => {
    let isMounted = true

    const fetchDesktopApp = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/desktop-app/latest`)

        if (!response.ok) {
          throw new Error('desktop_app_fetch_failed')
        }

        const data = await response.json()

        if (isMounted) {
          setDesktopApp(data.available === false ? null : data)
          setDesktopVersion(data.available === false ? '' : (data.version || ''))
          setDesktopAppLoading(false)
        }
      } catch (error) {
        console.error('Failed to fetch desktop app', error)
        if (isMounted) {
          setDesktopApp(null)
          setDesktopAppLoading(false)
        }
      }
    }

    fetchDesktopApp()

    return () => {
      isMounted = false
    }
  }, [])

  React.useEffect(() => {
    let isMounted = true

    const fetchTestimonials = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/testimonials`)
        if (!response.ok) {
          throw new Error('testimonials_fetch_failed')
        }

        const data = await response.json()
        if (isMounted) {
          setTestimonials(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Failed to fetch testimonials', error)
        if (isMounted) {
          setTestimonials([])
        }
      }
    }

    fetchTestimonials()

    return () => {
      isMounted = false
    }
  }, [])

  const formatFileSize = (size) => {
    if (!size) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    let value = size
    let unitIndex = 0

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex += 1
    }

    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
  }

  const getUploadUrl = (filePath = '') => `${API_BASE_URL}/${filePath.replace(/\\/g, '/')}`

  const resetTestimonialForm = () => {
    setTestimonialForm({
      id: null,
      name: '',
      role: '',
      quote: '',
      imageFile: null,
      imagePath: null,
    })
    setTestimonialMessage('')
    if (testimonialImageInputRef.current) testimonialImageInputRef.current.value = ''
  }

  const handleInstallerSelection = (event) => {
    const file = event.target.files?.[0] || null
    setSelectedInstaller(file)
    setDesktopAppMessage('')
  }

  const handleDesktopAppUpload = async () => {
    if (!selectedInstaller || !user?.token) {
      return
    }

    setUploadingDesktopApp(true)
    setDesktopAppMessage('')

    try {
      const formData = new FormData()
      formData.append('installer', selectedInstaller)
      formData.append('version', desktopVersion)

      const response = await fetch(`${API_BASE_URL}/api/desktop-app/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'desktop_app_upload_failed')
      }

      setDesktopApp(data)
      setDesktopVersion(data.version || '')
      setSelectedInstaller(null)
      setDesktopAppMessage(t.desktopApp.uploadSuccess)
      if (installerInputRef.current) installerInputRef.current.value = ''
    } catch (error) {
      console.error('Desktop app upload failed', error)
      setDesktopAppMessage(error.message || t.desktopApp.uploadFailed)
    } finally {
      setUploadingDesktopApp(false)
    }
  }

  const handleDesktopAppRemove = async () => {
    if (!user?.token || !desktopApp) {
      return
    }

    setRemovingDesktopApp(true)
    setDesktopAppMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/desktop-app`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'desktop_app_remove_failed')
      }

      setDesktopApp(null)
      setSelectedInstaller(null)
      setDesktopAppMessage(t.desktopApp.removeSuccess)
      if (installerInputRef.current) installerInputRef.current.value = ''
    } catch (error) {
      console.error('Desktop app remove failed', error)
      setDesktopAppMessage(error.message || t.desktopApp.removeFailed)
    } finally {
      setRemovingDesktopApp(false)
    }
  }

  const handleTestimonialFieldChange = (field, value) => {
    setTestimonialForm((prev) => ({ ...prev, [field]: value }))
    setTestimonialMessage('')
  }

  const handleTestimonialImageSelection = (event) => {
    const file = event.target.files?.[0] || null
    setTestimonialForm((prev) => ({ ...prev, imageFile: file }))
    setTestimonialMessage('')
  }

  const handleEditTestimonial = (testimonial) => {
    setTestimonialForm({
      id: testimonial._id,
      name: testimonial.name || '',
      role: testimonial.role || '',
      quote: testimonial.quote || '',
      imageFile: null,
      imagePath: testimonial.image_path || null,
    })
    setTestimonialMessage('')
    if (testimonialImageInputRef.current) testimonialImageInputRef.current.value = ''
  }

  const handleSaveTestimonial = async () => {
    if (!user?.token || !testimonialForm.name.trim() || !testimonialForm.role.trim() || !testimonialForm.quote.trim()) {
      return
    }

    setSavingTestimonial(true)
    setTestimonialMessage('')

    try {
      const formData = new FormData()
      formData.append('name', testimonialForm.name)
      formData.append('role', testimonialForm.role)
      formData.append('quote', testimonialForm.quote)
      if (testimonialForm.imageFile) {
        formData.append('image', testimonialForm.imageFile)
      }

      const isEditing = Boolean(testimonialForm.id)
      const response = await fetch(
        `${API_BASE_URL}/api/testimonials${isEditing ? `/${testimonialForm.id}` : ''}`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'testimonial_save_failed')
      }

      setTestimonials((prev) => {
        if (isEditing) {
          return prev.map((item) => item._id === data._id ? data : item)
        }
        return [data, ...prev]
      })

      resetTestimonialForm()
      setTestimonialMessage(isEditing ? t.testimonials.updated : t.testimonials.created)
    } catch (error) {
      console.error('Save testimonial failed', error)
      setTestimonialMessage(t.testimonials.createFailed)
    } finally {
      setSavingTestimonial(false)
    }
  }

  const handleDeleteTestimonial = async (testimonialId) => {
    if (!user?.token || !testimonialId) {
      return
    }

    setDeletingTestimonialId(testimonialId)
    setTestimonialMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/testimonials/${testimonialId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'testimonial_delete_failed')
      }

      setTestimonials((prev) => prev.filter((item) => item._id !== testimonialId))
      if (testimonialForm.id === testimonialId) {
        resetTestimonialForm()
      }
      setTestimonialMessage(t.testimonials.deleted)
    } catch (error) {
      console.error('Delete testimonial failed', error)
      setTestimonialMessage(t.testimonials.deleteFailed)
    } finally {
      setDeletingTestimonialId(null)
    }
  }

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
                <option value="en">{translations.common.languageNames.en}</option>
                <option value="hi">{translations.common.languageNames.hi}</option>
              </select>
              <button 
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={translations.common.toggleTheme}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
            <span className="user-info">{t.welcome}, {user?.name || translations.auth.roles.admin}</span>
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
          className="section-card admin-installer-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
        >
          <h3>{t.desktopApp.title}</h3>
          <p>{t.desktopApp.description}</p>

          <div className="admin-installer-panel">
            <div className="admin-installer-panel__fields">
              <label className="admin-installer-panel__label">
                {t.desktopApp.versionLabel}
                <input
                  type="text"
                  className="admin-installer-panel__input"
                  placeholder={t.desktopApp.versionPlaceholder}
                  value={desktopVersion}
                  onChange={(e) => setDesktopVersion(e.target.value)}
                />
              </label>

              <input
                ref={installerInputRef}
                type="file"
                accept=".exe,.msi"
                className="admin-installer-panel__file-input"
                onChange={handleInstallerSelection}
              />

              <div className="admin-installer-panel__actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => installerInputRef.current?.click()}
                >
                  <FiUpload /> {desktopApp ? t.desktopApp.replace : t.desktopApp.chooseFile}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleDesktopAppUpload}
                  disabled={!selectedInstaller || uploadingDesktopApp}
                >
                  <FiUpload /> {uploadingDesktopApp ? t.desktopApp.uploading : t.desktopApp.upload}
                </button>
                {desktopApp ? (
                  <>
                    <a href={`${API_BASE_URL}/api/desktop-app/download`} className="btn btn-secondary">
                      <FiDownload /> {t.desktopApp.download}
                    </a>
                    <button
                      type="button"
                      className="btn btn-secondary admin-installer-panel__remove"
                      onClick={handleDesktopAppRemove}
                      disabled={removingDesktopApp}
                    >
                      <FiTrash2 /> {removingDesktopApp ? t.desktopApp.removing : t.desktopApp.remove}
                    </button>
                  </>
                ) : null}
              </div>

              <p className="admin-installer-panel__hint">{t.desktopApp.onlyFormats}</p>
              {selectedInstaller ? (
                <p className="admin-installer-panel__status">
                  {translate('dashboard.admin.desktopApp.selectedFile', { name: selectedInstaller.name })}
                </p>
              ) : null}
              {desktopAppLoading ? (
                <p className="admin-installer-panel__status">{translations.common.loading}</p>
              ) : desktopApp ? (
                <div className="admin-installer-panel__status admin-installer-panel__status--stacked">
                  <span>{translate('dashboard.admin.desktopApp.currentFile', { name: desktopApp.filename })}</span>
                  <span>{translate('dashboard.admin.desktopApp.uploadedOn', { date: dateFormatter.format(new Date(desktopApp.updated_at)) })}</span>
                  <span>{formatFileSize(desktopApp.file_size)}</span>
                </div>
              ) : (
                <p className="admin-installer-panel__status">{t.desktopApp.noFile}</p>
              )}
              {desktopAppMessage ? (
                <p className="admin-installer-panel__status admin-installer-panel__status--message">{desktopAppMessage}</p>
              ) : null}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="section-card admin-testimonials-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.88 }}
        >
          <h3>{t.testimonials.title}</h3>
          <p>{t.testimonials.description}</p>

          <div className="admin-testimonials-layout">
            <div className="admin-testimonial-form">
              <label className="admin-installer-panel__label">
                {t.testimonials.nameLabel}
                <input
                  type="text"
                  className="admin-installer-panel__input"
                  placeholder={t.testimonials.namePlaceholder}
                  value={testimonialForm.name}
                  onChange={(e) => handleTestimonialFieldChange('name', e.target.value)}
                />
              </label>

              <label className="admin-installer-panel__label">
                {t.testimonials.roleLabel}
                <input
                  type="text"
                  className="admin-installer-panel__input"
                  placeholder={t.testimonials.rolePlaceholder}
                  value={testimonialForm.role}
                  onChange={(e) => handleTestimonialFieldChange('role', e.target.value)}
                />
              </label>

              <label className="admin-installer-panel__label">
                {t.testimonials.quoteLabel}
                <textarea
                  className="admin-testimonial-form__textarea"
                  placeholder={t.testimonials.quotePlaceholder}
                  value={testimonialForm.quote}
                  onChange={(e) => handleTestimonialFieldChange('quote', e.target.value)}
                />
              </label>

              <input
                ref={testimonialImageInputRef}
                type="file"
                accept="image/*"
                className="admin-installer-panel__file-input"
                onChange={handleTestimonialImageSelection}
              />

              <div className="admin-installer-panel__actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => testimonialImageInputRef.current?.click()}
                >
                  <FiUpload /> {testimonialForm.imagePath ? t.testimonials.replaceImage : t.testimonials.chooseImage}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={savingTestimonial || !testimonialForm.name.trim() || !testimonialForm.role.trim() || !testimonialForm.quote.trim()}
                  onClick={handleSaveTestimonial}
                >
                  {testimonialForm.id ? t.testimonials.update : t.testimonials.add}
                </button>
                {testimonialForm.id ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetTestimonialForm}
                  >
                    {t.testimonials.cancelEdit}
                  </button>
                ) : null}
              </div>

              <p className="admin-installer-panel__hint">{t.testimonials.imageHint}</p>
              {testimonialForm.imageFile ? (
                <p className="admin-installer-panel__status">
                  {translate('dashboard.admin.testimonials.selectedImage', { name: testimonialForm.imageFile.name })}
                </p>
              ) : null}
              {testimonialMessage ? (
                <p className="admin-installer-panel__status admin-installer-panel__status--message">{testimonialMessage}</p>
              ) : null}
            </div>

            <div className="admin-testimonials-list">
              {testimonials.length ? testimonials.map((testimonial) => (
                <article key={testimonial._id} className="admin-testimonial-item">
                  <div className="admin-testimonial-item__header">
                    {testimonial.image_path ? (
                      <img
                        className="admin-testimonial-item__avatar"
                        src={getUploadUrl(testimonial.image_path)}
                        alt={testimonial.name}
                      />
                    ) : (
                      <div className="admin-testimonial-item__avatar admin-testimonial-item__avatar--placeholder">
                        {testimonial.name?.charAt(0)?.toUpperCase() || 'I'}
                      </div>
                    )}
                    <div className="admin-testimonial-item__meta">
                      <strong>{testimonial.name}</strong>
                      <span>{testimonial.role}</span>
                    </div>
                  </div>
                  <p className="admin-testimonial-item__quote">{testimonial.quote}</p>
                  <div className="admin-testimonial-item__actions">
                    <button type="button" className="btn btn-secondary" onClick={() => handleEditTestimonial(testimonial)}>
                      {t.testimonials.edit}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary admin-installer-panel__remove"
                      disabled={deletingTestimonialId === testimonial._id}
                      onClick={() => handleDeleteTestimonial(testimonial._id)}
                    >
                      {t.testimonials.delete}
                    </button>
                  </div>
                </article>
              )) : (
                <p className="admin-installer-panel__status">{t.testimonials.noTestimonials}</p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="recent-activity"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <h3>{t.activity.title}</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-time">{translate('dashboard.admin.activity.hoursAgo', { hours: 2 })}</span>
              <span className="activity-text">{t.activity.newStudent}</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">{translate('dashboard.admin.activity.hoursAgo', { hours: 5 })}</span>
              <span className="activity-text">{t.activity.assignmentSubmitted}</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">{t.activity.dayAgo}</span>
              <span className="activity-text">{t.activity.newTeacher}</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default AdminDashboard

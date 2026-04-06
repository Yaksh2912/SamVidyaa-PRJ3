import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  HiArrowDownTray,
  HiBellAlert,
  HiBookOpen,
  HiChartBar,
  HiSparkles,
  HiStar,
  HiUsers
} from 'react-icons/hi2'
import { FiDownload, FiMoon, FiSun, FiTrash2, FiUpload } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import API_BASE_URL from '../config'
import {
  AnnouncementFeedSkeleton,
  PanelStatusSkeleton,
  useDelayedLoading
} from '../components/ui/Skeleton'
import './Dashboard.css'

const getInitials = (name = '') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase() || '')
  .join('') || 'AD'

function AdminDashboard() {
  const { theme, toggleTheme, isDark } = useTheme()
  const { translations, language, changeLanguage, t: translate } = useI18n()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const common = translations.common
  const t = translations.dashboard.admin
  const installerInputRef = React.useRef(null)
  const testimonialImageInputRef = React.useRef(null)

  const [activeTab, setActiveTab] = React.useState('overview')
  const [platformStats, setPlatformStats] = React.useState({ totalUsers: 0, totalCourses: 0 })
  const [platformStatsLoading, setPlatformStatsLoading] = React.useState(true)
  const [desktopApp, setDesktopApp] = React.useState(null)
  const [desktopAppLoading, setDesktopAppLoading] = React.useState(true)
  const [desktopVersion, setDesktopVersion] = React.useState('')
  const [selectedInstaller, setSelectedInstaller] = React.useState(null)
  const [desktopAppMessage, setDesktopAppMessage] = React.useState('')
  const [uploadingDesktopApp, setUploadingDesktopApp] = React.useState(false)
  const [removingDesktopApp, setRemovingDesktopApp] = React.useState(false)
  const [testimonials, setTestimonials] = React.useState([])
  const [testimonialsLoading, setTestimonialsLoading] = React.useState(true)
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
  const [courses, setCourses] = React.useState([])
  const [privilegedUserForm, setPrivilegedUserForm] = React.useState({
    name: '',
    email: '',
    password: '',
    role: 'INSTRUCTOR',
    institution: '',
  })
  const [privilegedUserMessage, setPrivilegedUserMessage] = React.useState('')
  const [savingPrivilegedUser, setSavingPrivilegedUser] = React.useState(false)
  const [announcements, setAnnouncements] = React.useState([])
  const [announcementsLoading, setAnnouncementsLoading] = React.useState(true)
  const [announcementMessage, setAnnouncementMessage] = React.useState('')
  const [savingAnnouncement, setSavingAnnouncement] = React.useState(false)
  const [deletingAnnouncementId, setDeletingAnnouncementId] = React.useState(null)
  const [announcementForm, setAnnouncementForm] = React.useState({
    audienceType: 'GLOBAL',
    courseId: '',
    title: '',
    message: '',
  })
  const showDesktopAppSkeleton = useDelayedLoading(desktopAppLoading)
  const showAnnouncementSkeletons = useDelayedLoading(announcementsLoading)
  const showTestimonialStatus = useDelayedLoading(testimonialsLoading)

  const dateFormatter = new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const announcementDateFormatter = new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const formatDate = React.useCallback((value, formatter = dateFormatter) => {
    if (!value) return common.notAvailable
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? common.notAvailable : formatter.format(parsed)
  }, [common.notAvailable, dateFormatter])

  React.useEffect(() => {
    let isMounted = true

    const fetchPlatformStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/public-stats`)
        if (!response.ok) {
          throw new Error('platform_stats_fetch_failed')
        }

        const data = await response.json()
        if (isMounted) {
          setPlatformStats({
            totalUsers: Number(data.totalUsers) || 0,
            totalCourses: Number(data.totalCourses) || 0,
          })
        }
      } catch (error) {
        console.error('Failed to fetch platform stats', error)
        if (isMounted) {
          setPlatformStats({ totalUsers: 0, totalCourses: 0 })
        }
      } finally {
        if (isMounted) {
          setPlatformStatsLoading(false)
        }
      }
    }

    fetchPlatformStats()

    return () => {
      isMounted = false
    }
  }, [])

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
        }
      } catch (error) {
        console.error('Failed to fetch desktop app', error)
        if (isMounted) {
          setDesktopApp(null)
        }
      } finally {
        if (isMounted) {
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
      } finally {
        if (isMounted) {
          setTestimonialsLoading(false)
        }
      }
    }

    fetchTestimonials()

    return () => {
      isMounted = false
    }
  }, [])

  React.useEffect(() => {
    let isMounted = true

    const fetchCoursesAndAnnouncements = async () => {
      try {
        const token = user?.token
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const [coursesResponse, announcementsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/courses`, { headers }),
          fetch(`${API_BASE_URL}/api/announcements/manage`, { headers }),
        ])

        if (coursesResponse.ok) {
          const courseData = await coursesResponse.json()
          if (isMounted) {
            setCourses(Array.isArray(courseData) ? courseData : [])
          }
        }

        if (announcementsResponse.ok) {
          const announcementData = await announcementsResponse.json()
          if (isMounted) {
            setAnnouncements(Array.isArray(announcementData) ? announcementData : [])
          }
        } else if (isMounted) {
          setAnnouncements([])
        }
      } catch (error) {
        console.error('Failed to fetch admin announcements', error)
        if (isMounted) {
          setAnnouncements([])
        }
      } finally {
        if (isMounted) {
          setAnnouncementsLoading(false)
        }
      }
    }

    fetchCoursesAndAnnouncements()

    return () => {
      isMounted = false
    }
  }, [user?.token])

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

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      audienceType: 'GLOBAL',
      courseId: '',
      title: '',
      message: '',
    })
    setAnnouncementMessage('')
  }

  const resetPrivilegedUserForm = () => {
    setPrivilegedUserForm({
      name: '',
      email: '',
      password: '',
      role: 'INSTRUCTOR',
      institution: '',
    })
    setPrivilegedUserMessage('')
  }

  const handleInstallerSelection = (event) => {
    const file = event.target.files?.[0] || null
    setSelectedInstaller(file)
    setDesktopAppMessage('')
  }

  const handlePrivilegedUserFieldChange = (field, value) => {
    setPrivilegedUserForm((prev) => ({ ...prev, [field]: value }))
    setPrivilegedUserMessage('')
  }

  const handleCreatePrivilegedUser = async () => {
    if (!user?.token) {
      return
    }

    if (!privilegedUserForm.name.trim() || !privilegedUserForm.email.trim() || !privilegedUserForm.password.trim()) {
      return
    }

    setSavingPrivilegedUser(true)
    setPrivilegedUserMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          name: privilegedUserForm.name.trim(),
          email: privilegedUserForm.email.trim(),
          password: privilegedUserForm.password,
          role: privilegedUserForm.role,
          institution: privilegedUserForm.institution.trim(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'privileged_user_create_failed')
      }

      setPlatformStats((prev) => ({
        ...prev,
        totalUsers: Number(prev.totalUsers || 0) + 1,
      }))
      resetPrivilegedUserForm()
      setPrivilegedUserMessage(translate('dashboard.admin.userManagement.created', {
        role: data.role === 'ADMIN' ? translations.auth.roles.admin : translations.auth.roles.teacher,
      }))
    } catch (error) {
      console.error('Privileged user creation failed', error)
      setPrivilegedUserMessage(error.message || t.userManagement.createFailed)
    } finally {
      setSavingPrivilegedUser(false)
    }
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
      setDesktopVersion('')
      setDesktopAppMessage(t.desktopApp.removeSuccess)
      if (installerInputRef.current) installerInputRef.current.value = ''
    } catch (error) {
      console.error('Desktop app remove failed', error)
      setDesktopAppMessage(error.message || t.desktopApp.removeFailed)
    } finally {
      setRemovingDesktopApp(false)
    }
  }

  const handleAnnouncementFieldChange = (field, value) => {
    setAnnouncementForm((prev) => {
      if (field === 'audienceType') {
        return {
          ...prev,
          audienceType: value,
          courseId: value === 'GLOBAL' ? '' : prev.courseId
        }
      }

      return { ...prev, [field]: value }
    })
    setAnnouncementMessage('')
  }

  const handleCreateAnnouncement = async () => {
    if (!user?.token || !announcementForm.title.trim() || !announcementForm.message.trim()) {
      return
    }

    if (announcementForm.audienceType === 'COURSE' && !announcementForm.courseId) {
      return
    }

    setSavingAnnouncement(true)
    setAnnouncementMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          audience_type: announcementForm.audienceType,
          course_id: announcementForm.audienceType === 'COURSE' ? announcementForm.courseId : null,
          title: announcementForm.title.trim(),
          message: announcementForm.message.trim(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'announcement_create_failed')
      }

      setAnnouncements((prev) => [data, ...prev])
      resetAnnouncementForm()
      setAnnouncementMessage(t.announcements.created)
    } catch (error) {
      console.error('Create announcement failed', error)
      setAnnouncementMessage(t.announcements.createFailed)
    } finally {
      setSavingAnnouncement(false)
    }
  }

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!user?.token || !announcementId) {
      return
    }

    setDeletingAnnouncementId(announcementId)
    setAnnouncementMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'announcement_delete_failed')
      }

      setAnnouncements((prev) => prev.filter((item) => item._id !== announcementId))
      setAnnouncementMessage(t.announcements.deleted)
    } catch (error) {
      console.error('Delete announcement failed', error)
      setAnnouncementMessage(t.announcements.deleteFailed)
    } finally {
      setDeletingAnnouncementId(null)
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
    setActiveTab('testimonials')
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

  const globalAnnouncementCount = announcements.filter((announcement) => announcement.audience_type === 'GLOBAL').length
  const courseAnnouncementCount = announcements.length - globalAnnouncementCount
  const pendingActions = Number(!desktopApp) + Number(!announcements.length) + Number(!testimonials.length)
  const recentAnnouncements = announcements.slice(0, 3)
  const recentTestimonials = testimonials.slice(0, 3)
  const latestAnnouncement = announcements[0] || null
  const latestTestimonial = testimonials[0] || null
  const topbarTitle = activeTab === 'overview'
    ? translate('dashboard.admin.topbar.welcomeBack', { name: user?.name || translations.auth.roles.admin })
    : t.tabs[activeTab]
  const statsCards = [
    {
      id: 'users',
      icon: <HiUsers />,
      label: t.stats.totalUsers,
      value: platformStatsLoading ? '...' : platformStats.totalUsers,
    },
    {
      id: 'courses',
      icon: <HiBookOpen />,
      label: t.stats.liveCourses,
      value: platformStatsLoading ? '...' : platformStats.totalCourses,
    },
    {
      id: 'announcements',
      icon: <HiBellAlert />,
      label: t.stats.announcements,
      value: announcementsLoading ? '...' : announcements.length,
    },
    {
      id: 'testimonials',
      icon: <HiSparkles />,
      label: t.stats.testimonials,
      value: testimonialsLoading ? '...' : testimonials.length,
    },
  ]
  const activityItems = [
    {
      time: desktopApp ? formatDate(desktopApp.updated_at) : common.notAvailable,
      text: desktopApp
        ? `${t.desktopApp.title}: ${desktopApp.filename}`
        : `${t.desktopApp.title}: ${t.desktopApp.noFile}`
    },
    {
      time: latestAnnouncement ? formatDate(latestAnnouncement.createdAt, announcementDateFormatter) : common.notAvailable,
      text: latestAnnouncement
        ? `${t.announcements.title}: ${latestAnnouncement.title}`
        : `${t.announcements.title}: ${t.announcements.empty}`
    },
    {
      time: latestTestimonial ? formatDate(latestTestimonial.updatedAt || latestTestimonial.createdAt) : common.notAvailable,
      text: latestTestimonial
        ? `${t.testimonials.title}: ${latestTestimonial.name}`
        : `${t.testimonials.title}: ${t.testimonials.noTestimonials}`
    }
  ]

  const renderTopbarAction = () => {
    if (activeTab === 'overview') {
      return (
        <button className="btn btn-primary topbar-create-button" onClick={() => setActiveTab('announcements')}>
          <span className="topbar-create-button__icon">
            <HiBellAlert />
          </span>
          <span className="topbar-create-button__label">{t.overview.primaryAction}</span>
        </button>
      )
    }

    if (activeTab === 'announcements') {
      const isDisabled = savingAnnouncement
        || !announcementForm.title.trim()
        || !announcementForm.message.trim()
        || (announcementForm.audienceType === 'COURSE' && !announcementForm.courseId)

      return (
        <button className="btn btn-primary topbar-create-button" onClick={handleCreateAnnouncement} disabled={isDisabled}>
          <span className="topbar-create-button__icon">
            <HiBellAlert />
          </span>
          <span className="topbar-create-button__label">
            {savingAnnouncement ? t.announcements.creating : t.announcements.create}
          </span>
        </button>
      )
    }

    if (activeTab === 'users') {
      const isDisabled = savingPrivilegedUser
        || !privilegedUserForm.name.trim()
        || !privilegedUserForm.email.trim()
        || !privilegedUserForm.password.trim()

      return (
        <button className="btn btn-primary topbar-create-button" onClick={handleCreatePrivilegedUser} disabled={isDisabled}>
          <span className="topbar-create-button__icon">
            <HiUsers />
          </span>
          <span className="topbar-create-button__label">{t.userManagement.createAction}</span>
        </button>
      )
    }

    if (activeTab === 'testimonials') {
      const isDisabled = savingTestimonial
        || !testimonialForm.name.trim()
        || !testimonialForm.role.trim()
        || !testimonialForm.quote.trim()

      return (
        <button className="btn btn-primary topbar-create-button" onClick={handleSaveTestimonial} disabled={isDisabled}>
          <span className="topbar-create-button__icon">
            <HiSparkles />
          </span>
          <span className="topbar-create-button__label">
            {testimonialForm.id ? t.testimonials.update : t.testimonials.add}
          </span>
        </button>
      )
    }

    return (
      <button className="btn btn-primary topbar-create-button" onClick={handleDesktopAppUpload} disabled={!selectedInstaller || uploadingDesktopApp}>
        <span className="topbar-create-button__icon">
          <FiUpload />
        </span>
        <span className="topbar-create-button__label">
          {uploadingDesktopApp ? t.desktopApp.uploading : t.desktopApp.upload}
        </span>
      </button>
    )
  }

  return (
    <div className="dashboard-layout" data-theme={theme}>
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <h1 className="dashboard-title">{t.title}</h1>
        </div>

        <nav className="sidebar-nav">
          <button className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <HiChartBar className="sidebar-icon" /> {t.tabs.overview}
          </button>
          <button className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <HiUsers className="sidebar-icon" /> {t.tabs.users}
          </button>
          <button className={`sidebar-link ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>
            <HiBellAlert className="sidebar-icon" /> {t.tabs.announcements}
          </button>
          <button className={`sidebar-link ${activeTab === 'testimonials' ? 'active' : ''}`} onClick={() => setActiveTab('testimonials')}>
            <HiSparkles className="sidebar-icon" /> {t.tabs.testimonials}
          </button>
          <button className={`sidebar-link ${activeTab === 'desktop' ? 'active' : ''}`} onClick={() => setActiveTab('desktop')}>
            <HiArrowDownTray className="sidebar-icon" /> {t.tabs.desktop}
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="profile-info">
              <div className="profile-avatar">{getInitials(user?.name || translations.auth.roles.admin)}</div>
              <div className="profile-text">
                <span className="profile-name">{user?.name || translations.auth.roles.admin}</span>
                <span className="profile-role">{t.roleLabel}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout" title={t.logout}>
              <HiArrowDownTray style={{ transform: 'rotate(-90deg)', fontSize: '1.2rem' }} />
            </button>
          </div>
        </div>
      </aside>

      <main className="dashboard-content">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <h2 className="topbar-title">{topbarTitle}</h2>
            {renderTopbarAction()}
          </div>

          <div className="topbar-right">
            <div className="admin-topbar-pill">
              <HiStar />
              <span>{translate('dashboard.admin.topbar.pendingActions', { count: pendingActions })}</span>
            </div>
            <select
              className="language-selector"
              value={language}
              onChange={(event) => changeLanguage(event.target.value)}
            >
              <option value="en">{common.languageNames.en}</option>
              <option value="hi">{common.languageNames.hi}</option>
            </select>
            <button className="theme-toggle topbar-theme-toggle" onClick={toggleTheme} aria-label={common.toggleTheme}>
              {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <button onClick={handleLogout} className="btn-logout topbar-action-mobile" title={t.logout}>
              <HiArrowDownTray style={{ transform: 'rotate(-90deg)', fontSize: '1.4rem' }} />
            </button>
          </div>
        </header>

        <div className="dashboard-workspace">
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
              <section className="admin-overview-hero">
                <div className="admin-overview-hero__content">
                  <span className="admin-overview-hero__eyebrow">{t.overview.eyebrow}</span>
                  <h3>{t.header}</h3>
                  <p>{t.subtitle}</p>

                  <div className="admin-overview-hero__actions">
                    <button type="button" className="btn btn-primary" onClick={() => setActiveTab('announcements')}>
                      <HiBellAlert /> {t.overview.primaryAction}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('desktop')}>
                      <FiUpload /> {t.overview.secondaryAction}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('users')}>
                      <HiUsers /> {t.userManagement.primaryAction}
                    </button>
                  </div>
                </div>

                <div className="admin-overview-hero__panel">
                  <div className="admin-section-heading admin-section-heading--tight">
                    <div>
                      <span className="admin-copy-badge">{t.overview.operationsTitle}</span>
                    </div>
                  </div>

                  <div className="admin-overview-status-list">
                    <article className="admin-overview-status-item">
                      <span>{t.desktopApp.title}</span>
                      <strong>{desktopApp ? t.overview.releaseReady : t.overview.releaseMissing}</strong>
                      <p>
                        {desktopApp
                          ? translate('dashboard.admin.desktopApp.currentFile', { name: desktopApp.filename })
                          : t.desktopApp.noFile}
                      </p>
                    </article>

                    <article className="admin-overview-status-item">
                      <span>{t.announcements.title}</span>
                      <strong>
                        {announcements.length
                          ? translate('dashboard.admin.overview.updatesReady', { count: announcements.length })
                          : t.overview.updatesMissing}
                      </strong>
                      <p>{`${t.announcements.generalAudience}: ${globalAnnouncementCount} • ${t.announcements.courseAudience}: ${courseAnnouncementCount}`}</p>
                    </article>

                    <article className="admin-overview-status-item">
                      <span>{t.testimonials.title}</span>
                      <strong>
                        {testimonials.length
                          ? translate('dashboard.admin.overview.proofReady', { count: testimonials.length })
                          : t.overview.proofMissing}
                      </strong>
                      <p>{latestTestimonial?.role || t.testimonials.noTestimonials}</p>
                    </article>
                  </div>
                </div>
              </section>

              <div className="stats-grid">
                {statsCards.map((card) => (
                  <motion.div key={card.id} className="stat-card" whileHover={{ y: -4 }}>
                    <div className="stat-icon">{card.icon}</div>
                    <div className="stat-info">
                      <h3>{card.label}</h3>
                      <p className="stat-number">{card.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="admin-overview-grid">
                <section className="admin-overview-card">
                  <div className="admin-section-heading">
                    <div>
                      <span className="admin-copy-badge">{t.desktopApp.title}</span>
                      <h3>{t.overview.releaseTitle}</h3>
                      <p>{t.overview.releaseDescription}</p>
                    </div>
                    <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('desktop')}>
                      {t.tabs.desktop}
                    </button>
                  </div>

                  {desktopAppLoading ? (
                    <PanelStatusSkeleton visible={showDesktopAppSkeleton} />
                  ) : desktopApp ? (
                    <div className="admin-kpi-grid">
                      <article className="admin-kpi-card">
                        <span>{t.desktopApp.versionLabel}</span>
                        <strong>{desktopApp.version || common.notAvailable}</strong>
                      </article>
                      <article className="admin-kpi-card">
                        <span>{translate('landingDownload.downloadsLabel')}</span>
                        <strong>{desktopApp.download_count || 0}</strong>
                      </article>
                      <article className="admin-kpi-card">
                        <span>{common.files}</span>
                        <strong>{formatFileSize(desktopApp.file_size)}</strong>
                      </article>
                      <article className="admin-kpi-card">
                        <span>{translate('dashboard.admin.desktopApp.uploadedOn', { date: formatDate(desktopApp.updated_at) })}</span>
                        <strong>{desktopApp.filename}</strong>
                      </article>
                    </div>
                  ) : (
                    <p className="empty-state">{t.desktopApp.noFile}</p>
                  )}
                </section>

                <section className="admin-overview-card">
                  <div className="admin-section-heading">
                    <div>
                      <span className="admin-copy-badge">{t.announcements.title}</span>
                      <h3>{t.overview.commsTitle}</h3>
                      <p>{t.overview.commsDescription}</p>
                    </div>
                    <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('announcements')}>
                      {t.tabs.announcements}
                    </button>
                  </div>

                  <div className="admin-kpi-grid">
                    <article className="admin-kpi-card">
                      <span>{t.announcements.generalAudience}</span>
                      <strong>{globalAnnouncementCount}</strong>
                    </article>
                    <article className="admin-kpi-card">
                      <span>{t.announcements.courseAudience}</span>
                      <strong>{courseAnnouncementCount}</strong>
                    </article>
                    <article className="admin-kpi-card">
                      <span>{t.stats.liveCourses}</span>
                      <strong>{courses.length}</strong>
                    </article>
                    <article className="admin-kpi-card">
                      <span>{t.announcements.titleLabel}</span>
                      <strong>{latestAnnouncement?.title || common.notAvailable}</strong>
                    </article>
                  </div>
                </section>

                <section className="admin-overview-card">
                  <div className="admin-section-heading">
                    <div>
                      <span className="admin-copy-badge">{t.overview.quickLinksTitle}</span>
                      <h3>{t.overview.quickLinksTitle}</h3>
                      <p>{t.overview.quickLinksDescription}</p>
                    </div>
                  </div>

                  <div className="admin-quick-links">
                    <button type="button" className="admin-quick-link" onClick={() => setActiveTab('announcements')}>
                      <HiBellAlert />
                      <div>
                        <strong>{t.tabs.announcements}</strong>
                        <span>{t.announcements.description}</span>
                      </div>
                    </button>
                    <button type="button" className="admin-quick-link" onClick={() => setActiveTab('users')}>
                      <HiUsers />
                      <div>
                        <strong>{t.tabs.users}</strong>
                        <span>{t.userManagement.description}</span>
                      </div>
                    </button>
                    <button type="button" className="admin-quick-link" onClick={() => setActiveTab('testimonials')}>
                      <HiSparkles />
                      <div>
                        <strong>{t.tabs.testimonials}</strong>
                        <span>{t.testimonials.description}</span>
                      </div>
                    </button>
                    <button type="button" className="admin-quick-link" onClick={() => setActiveTab('desktop')}>
                      <FiUpload />
                      <div>
                        <strong>{t.tabs.desktop}</strong>
                        <span>{t.desktopApp.description}</span>
                      </div>
                    </button>
                  </div>
                </section>
              </div>

              <div className="admin-overview-grid admin-overview-grid--secondary">
                <section className="admin-overview-card">
                  <div className="admin-section-heading">
                    <div>
                      <span className="admin-copy-badge">{t.announcements.title}</span>
                      <h3>{t.overview.latestAnnouncements}</h3>
                    </div>
                  </div>

                  {announcementsLoading ? (
                    <AnnouncementFeedSkeleton count={2} visible={showAnnouncementSkeletons} />
                  ) : recentAnnouncements.length ? (
                    <div className="dashboard-announcements-feed admin-overview-feed">
                      {recentAnnouncements.map((announcement) => (
                        <article key={announcement._id} className="dashboard-announcement-item">
                          <div className="dashboard-announcement-item__meta">
                            <div>
                              <h4>{announcement.title}</h4>
                              <p>
                                {announcement.audience_type === 'GLOBAL'
                                  ? t.announcements.generalAudience
                                  : announcement.course_id?.course_name || t.announcements.courseAudience}
                                {' • '}
                                {formatDate(announcement.createdAt, announcementDateFormatter)}
                              </p>
                            </div>
                          </div>
                          <p className="dashboard-announcement-item__body">{announcement.message}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">{t.overview.noAnnouncements}</p>
                  )}
                </section>

                <section className="admin-overview-card">
                  <div className="admin-section-heading">
                    <div>
                      <span className="admin-copy-badge">{t.testimonials.title}</span>
                      <h3>{t.overview.latestTestimonials}</h3>
                    </div>
                  </div>

                  {testimonialsLoading ? (
                    <PanelStatusSkeleton visible={showTestimonialStatus} />
                  ) : recentTestimonials.length ? (
                    <div className="admin-testimonials-list admin-testimonials-list--compact">
                      {recentTestimonials.map((testimonial) => (
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
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">{t.overview.noTestimonials}</p>
                  )}
                </section>
              </div>

              <section className="recent-activity">
                <h3>{t.activity.title}</h3>
                <div className="activity-list">
                  {activityItems.map((item) => (
                    <div key={`${item.time}-${item.text}`} className="activity-item">
                      <span className="activity-time">{item.time}</span>
                      <span className="activity-text">{item.text}</span>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
              <section className="admin-tab-intro">
                <div>
                  <span className="admin-copy-badge">{t.tabs.users}</span>
                  <h3>{t.userManagement.title}</h3>
                  <p>{t.userManagement.description}</p>
                </div>

                <div className="admin-inline-stats">
                  <article className="admin-inline-stat">
                    <span>{t.userManagement.publicSignupLabel}</span>
                    <strong>{translations.auth.roles.student}</strong>
                  </article>
                  <article className="admin-inline-stat">
                    <span>{t.userManagement.allowedRolesLabel}</span>
                    <strong>{t.userManagement.allowedRolesValue}</strong>
                  </article>
                </div>
              </section>

              <div className="admin-testimonials-layout">
                <div className="admin-testimonial-form">
                  <label className="admin-installer-panel__label">
                    {t.userManagement.nameLabel}
                    <input
                      type="text"
                      className="admin-installer-panel__input"
                      placeholder={t.userManagement.namePlaceholder}
                      value={privilegedUserForm.name}
                      onChange={(event) => handlePrivilegedUserFieldChange('name', event.target.value)}
                    />
                  </label>

                  <label className="admin-installer-panel__label">
                    {t.userManagement.emailLabel}
                    <input
                      type="email"
                      className="admin-installer-panel__input"
                      placeholder={t.userManagement.emailPlaceholder}
                      value={privilegedUserForm.email}
                      onChange={(event) => handlePrivilegedUserFieldChange('email', event.target.value)}
                    />
                  </label>

                  <label className="admin-installer-panel__label">
                    {t.userManagement.passwordLabel}
                    <input
                      type="password"
                      className="admin-installer-panel__input"
                      placeholder={t.userManagement.passwordPlaceholder}
                      value={privilegedUserForm.password}
                      onChange={(event) => handlePrivilegedUserFieldChange('password', event.target.value)}
                    />
                  </label>

                  <label className="admin-installer-panel__label">
                    {t.userManagement.roleLabel}
                    <select
                      className="admin-installer-panel__input"
                      value={privilegedUserForm.role}
                      onChange={(event) => handlePrivilegedUserFieldChange('role', event.target.value)}
                    >
                      <option value="INSTRUCTOR">{translations.auth.roles.teacher}</option>
                      <option value="ADMIN">{translations.auth.roles.admin}</option>
                    </select>
                  </label>

                  <label className="admin-installer-panel__label">
                    {t.userManagement.institutionLabel}
                    <input
                      type="text"
                      className="admin-installer-panel__input"
                      placeholder={t.userManagement.institutionPlaceholder}
                      value={privilegedUserForm.institution}
                      onChange={(event) => handlePrivilegedUserFieldChange('institution', event.target.value)}
                    />
                  </label>

                  <div className="admin-installer-panel__actions">
                    <button type="button" className="btn btn-primary" onClick={handleCreatePrivilegedUser}>
                      {savingPrivilegedUser ? t.userManagement.creating : t.userManagement.createAction}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={resetPrivilegedUserForm}>
                      {t.userManagement.clear}
                    </button>
                  </div>

                  {privilegedUserMessage ? (
                    <p className="admin-installer-panel__status admin-installer-panel__status--message">{privilegedUserMessage}</p>
                  ) : null}
                </div>

                <section className="admin-overview-card">
                  <div className="admin-section-heading">
                    <div>
                      <span className="admin-copy-badge">{t.userManagement.securityBadge}</span>
                      <h3>{t.userManagement.securityTitle}</h3>
                      <p>{t.userManagement.securityDescription}</p>
                    </div>
                  </div>

                  <div className="admin-quick-links">
                    <div className="admin-quick-link admin-quick-link--static">
                      <HiUsers />
                      <div>
                        <strong>{t.userManagement.publicSignupLabel}</strong>
                        <span>{t.userManagement.publicSignupDescription}</span>
                      </div>
                    </div>
                    <div className="admin-quick-link admin-quick-link--static">
                      <HiUsers />
                      <div>
                        <strong>{t.userManagement.allowedRolesLabel}</strong>
                        <span>{t.userManagement.allowedRolesDescription}</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === 'announcements' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
              <section className="admin-tab-intro">
                <div>
                  <span className="admin-copy-badge">{t.tabs.announcements}</span>
                  <h3>{t.announcements.title}</h3>
                  <p>{t.announcements.description}</p>
                </div>

                <div className="admin-inline-stats">
                  <article className="admin-inline-stat">
                    <span>{common.active}</span>
                    <strong>{announcements.length}</strong>
                  </article>
                  <article className="admin-inline-stat">
                    <span>{t.announcements.generalAudience}</span>
                    <strong>{globalAnnouncementCount}</strong>
                  </article>
                  <article className="admin-inline-stat">
                    <span>{t.announcements.courseAudience}</span>
                    <strong>{courseAnnouncementCount}</strong>
                  </article>
                </div>
              </section>

              <div className="admin-testimonials-layout">
                <div className="admin-testimonial-form">
                  <label className="admin-installer-panel__label">
                    {t.announcements.audienceLabel}
                    <select
                      className="admin-installer-panel__input"
                      value={announcementForm.audienceType}
                      onChange={(event) => handleAnnouncementFieldChange('audienceType', event.target.value)}
                    >
                      <option value="GLOBAL">{t.announcements.audienceGlobal}</option>
                      <option value="COURSE">{t.announcements.audienceCourse}</option>
                    </select>
                  </label>

                  {announcementForm.audienceType === 'COURSE' ? (
                    <label className="admin-installer-panel__label">
                      {t.announcements.courseLabel}
                      <select
                        className="admin-installer-panel__input"
                        value={announcementForm.courseId}
                        onChange={(event) => handleAnnouncementFieldChange('courseId', event.target.value)}
                      >
                        <option value="">{t.announcements.selectCourse}</option>
                        {courses.map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.course_name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  <label className="admin-installer-panel__label">
                    {t.announcements.titleLabel}
                    <input
                      type="text"
                      className="admin-installer-panel__input"
                      placeholder={t.announcements.titlePlaceholder}
                      value={announcementForm.title}
                      onChange={(event) => handleAnnouncementFieldChange('title', event.target.value)}
                    />
                  </label>

                  <label className="admin-installer-panel__label">
                    {t.announcements.messageLabel}
                    <textarea
                      className="admin-testimonial-form__textarea"
                      placeholder={t.announcements.messagePlaceholder}
                      value={announcementForm.message}
                      onChange={(event) => handleAnnouncementFieldChange('message', event.target.value)}
                    />
                  </label>

                  <div className="admin-installer-panel__actions">
                    <button type="button" className="btn btn-primary" onClick={handleCreateAnnouncement}>
                      {savingAnnouncement ? t.announcements.creating : t.announcements.create}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={resetAnnouncementForm}>
                      {t.announcements.clear}
                    </button>
                  </div>

                  {announcementMessage ? (
                    <p className="admin-installer-panel__status admin-installer-panel__status--message">{announcementMessage}</p>
                  ) : null}
                </div>

                <div className="admin-testimonials-list">
                  {announcementsLoading ? (
                    <AnnouncementFeedSkeleton count={3} visible={showAnnouncementSkeletons} />
                  ) : announcements.length ? announcements.map((announcement) => (
                    <article key={announcement._id} className="dashboard-announcement-item">
                      <div className="dashboard-announcement-item__meta">
                        <div>
                          <h4>{announcement.title}</h4>
                          <p>
                            {announcement.audience_type === 'GLOBAL'
                              ? t.announcements.generalAudience
                              : announcement.course_id?.course_name || t.announcements.courseAudience}
                            {' • '}
                            {announcement.created_by?.name || translations.auth.roles.admin}
                            {' • '}
                            {formatDate(announcement.createdAt, announcementDateFormatter)}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary admin-installer-panel__remove"
                          disabled={deletingAnnouncementId === announcement._id}
                          onClick={() => handleDeleteAnnouncement(announcement._id)}
                        >
                          {deletingAnnouncementId === announcement._id ? t.announcements.deleting : t.announcements.delete}
                        </button>
                      </div>
                      <p className="dashboard-announcement-item__body">{announcement.message}</p>
                    </article>
                  )) : (
                    <p className="empty-state">{t.announcements.empty}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'testimonials' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
              <section className="admin-tab-intro">
                <div>
                  <span className="admin-copy-badge">{t.tabs.testimonials}</span>
                  <h3>{t.testimonials.title}</h3>
                  <p>{t.testimonials.description}</p>
                </div>

                <div className="admin-inline-stats">
                  <article className="admin-inline-stat">
                    <span>{common.active}</span>
                    <strong>{testimonials.length}</strong>
                  </article>
                  <article className="admin-inline-stat">
                    <span>{testimonialForm.id ? common.update : common.create}</span>
                    <strong>{testimonialForm.id ? t.testimonials.edit : t.testimonials.add}</strong>
                  </article>
                </div>
              </section>

              <div className="admin-testimonials-layout">
                <div className="admin-testimonial-form">
                  <label className="admin-installer-panel__label">
                    {t.testimonials.nameLabel}
                    <input
                      type="text"
                      className="admin-installer-panel__input"
                      placeholder={t.testimonials.namePlaceholder}
                      value={testimonialForm.name}
                      onChange={(event) => handleTestimonialFieldChange('name', event.target.value)}
                    />
                  </label>

                  <label className="admin-installer-panel__label">
                    {t.testimonials.roleLabel}
                    <input
                      type="text"
                      className="admin-installer-panel__input"
                      placeholder={t.testimonials.rolePlaceholder}
                      value={testimonialForm.role}
                      onChange={(event) => handleTestimonialFieldChange('role', event.target.value)}
                    />
                  </label>

                  <label className="admin-installer-panel__label">
                    {t.testimonials.quoteLabel}
                    <textarea
                      className="admin-testimonial-form__textarea"
                      placeholder={t.testimonials.quotePlaceholder}
                      value={testimonialForm.quote}
                      onChange={(event) => handleTestimonialFieldChange('quote', event.target.value)}
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
                    <button type="button" className="btn btn-primary" onClick={handleSaveTestimonial}>
                      {testimonialForm.id ? t.testimonials.update : t.testimonials.add}
                    </button>
                    {testimonialForm.id ? (
                      <button type="button" className="btn btn-secondary" onClick={resetTestimonialForm}>
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
                  {testimonialsLoading ? (
                    <PanelStatusSkeleton visible={showTestimonialStatus} />
                  ) : testimonials.length ? testimonials.map((testimonial) => (
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
                          {deletingTestimonialId === testimonial._id ? common.deleting : t.testimonials.delete}
                        </button>
                      </div>
                    </article>
                  )) : (
                    <p className="empty-state">{t.testimonials.noTestimonials}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'desktop' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
              <section className="admin-tab-intro">
                <div>
                  <span className="admin-copy-badge">{t.tabs.desktop}</span>
                  <h3>{t.desktopApp.title}</h3>
                  <p>{t.desktopApp.description}</p>
                </div>

                <div className="admin-inline-stats">
                  <article className="admin-inline-stat">
                    <span>{t.desktopApp.versionLabel}</span>
                    <strong>{desktopApp?.version || common.notAvailable}</strong>
                  </article>
                  <article className="admin-inline-stat">
                    <span>{translate('landingDownload.downloadsLabel')}</span>
                    <strong>{desktopApp?.download_count || 0}</strong>
                  </article>
                </div>
              </section>

              <div className="admin-desktop-layout">
                <section className="admin-overview-card">
                  <div className="admin-section-heading">
                    <div>
                      <span className="admin-copy-badge">{t.overview.releaseTitle}</span>
                      <h3>{t.desktopApp.title}</h3>
                      <p>{t.overview.releaseDescription}</p>
                    </div>
                  </div>

                  {desktopAppLoading ? (
                    <PanelStatusSkeleton visible={showDesktopAppSkeleton} />
                  ) : desktopApp ? (
                    <div className="admin-desktop-metrics">
                      <article className="admin-desktop-metric">
                        <span>{t.desktopApp.versionLabel}</span>
                        <strong>{desktopApp.version || common.notAvailable}</strong>
                      </article>
                      <article className="admin-desktop-metric">
                        <span>{common.files}</span>
                        <strong>{desktopApp.filename}</strong>
                      </article>
                      <article className="admin-desktop-metric">
                        <span>{translate('landingDownload.downloadsLabel')}</span>
                        <strong>{desktopApp.download_count || 0}</strong>
                      </article>
                      <article className="admin-desktop-metric">
                        <span>{translate('dashboard.admin.desktopApp.uploadedOn', { date: formatDate(desktopApp.updated_at) })}</span>
                        <strong>{formatFileSize(desktopApp.file_size)}</strong>
                      </article>
                    </div>
                  ) : (
                    <p className="empty-state">{t.desktopApp.noFile}</p>
                  )}

                  {desktopApp ? (
                    <div className="admin-installer-panel__actions">
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
                    </div>
                  ) : null}
                </section>

                <section className="admin-installer-panel admin-installer-panel--wide">
                  <div className="admin-installer-panel__fields">
                    <label className="admin-installer-panel__label">
                      {t.desktopApp.versionLabel}
                      <input
                        type="text"
                        className="admin-installer-panel__input"
                        placeholder={t.desktopApp.versionPlaceholder}
                        value={desktopVersion}
                        onChange={(event) => setDesktopVersion(event.target.value)}
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
                    </div>

                    <p className="admin-installer-panel__hint">{t.desktopApp.onlyFormats}</p>
                    {selectedInstaller ? (
                      <p className="admin-installer-panel__status">
                        {translate('dashboard.admin.desktopApp.selectedFile', { name: selectedInstaller.name })}
                      </p>
                    ) : null}
                    {desktopAppMessage ? (
                      <p className="admin-installer-panel__status admin-installer-panel__status--message">{desktopAppMessage}</p>
                    ) : null}
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard

import React from 'react'
import API_BASE_URL from '../config'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import { useNavigate } from 'react-router-dom'
import { HiUsers, HiBookOpen, HiDocumentText, HiChartBar, HiFolderPlus, HiArrowDownTray, HiTrash, HiPlus, HiListBullet, HiUserGroup, HiPaperClip, HiGift, HiStar, HiPencilSquare, HiBellAlert } from 'react-icons/hi2'
import { FiSun, FiMoon } from 'react-icons/fi'
import CreateModuleForm from '../components/CreateModuleForm'
import CreateCourseForm from '../components/CreateCourseForm'
import CreateTaskForm from '../components/CreateTaskForm'
import AddStudentsModal from '../components/AddStudentsModal'
import ManageRewardsModal from '../components/ManageRewardsModal'
import CourseAnalyticsModal from '../components/CourseAnalyticsModal'
import TeacherDashboardWorkspace from '../components/dashboard/teacher/TeacherDashboardWorkspace'
import TeacherStudentsModal from '../components/dashboard/teacher/TeacherStudentsModal'
import { AnalyticsColumnChart, AnalyticsDonutChart, AnalyticsHeatGrid } from '../components/AnalyticsGraphs'
import {
  StudentListSkeleton,
  TeacherModuleGridSkeleton,
  TeacherTaskGridSkeleton,
  useDelayedLoading
} from '../components/ui/Skeleton'
import { applyAnnouncementEvent, normalizeAnnouncementList, subscribeToAnnouncementStream } from '../utils/announcementRealtime'
import {
  ANNOUNCEMENT_TIMER_PRESETS,
  ANNOUNCEMENT_TIMER_UNITS,
  getAnnouncementExpiryMinutes,
  getDefaultAnnouncementTimerForm,
  isAnnouncementTimerValid,
} from '../utils/announcementTimerOptions'
import './Dashboard.css'

const COURSE_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #FF8008 0%, #FFA080 100%)',
  'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
]

const getCourseGradient = (id) => {
  if (!id) return COURSE_GRADIENTS[0]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return COURSE_GRADIENTS[Math.abs(hash) % COURSE_GRADIENTS.length]
}

const formatPercent = (value) => `${Math.round(value || 0)}%`

const getInitials = (name = '') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase() || '')
  .join('') || 'ST'

const TEACHER_DASHBOARD_STATE_KEY = 'teacher_dashboard_state'

const DEFAULT_PERFORMANCE_ANALYTICS = {
  activeLearners: 0,
  avgCompletionRate: 0,
  avgScore: 0,
  studentsNeedingSupport: 0,
  progressBandBreakdown: {
    completed: 0,
    on_track: 0,
    steady: 0,
    needs_support: 0,
    not_started: 0
  },
  topPerformers: [],
  attentionNeeded: [],
  leaderboardSnapshot: {
    topPerformers: [],
    atRiskStudents: [],
    topAverageEngagement: 0,
    atRiskAverageEngagement: 0,
    engagementGap: 0
  },
  scoreDistribution: [],
  taskDifficultyHotspots: [],
  courseBreakdown: [],
  courseHighlights: {
    strongestCourse: null,
    needsAttentionCourse: null,
    toughestCourse: null
  },
  studentCount: 0,
  dataMode: 'enrollment_only'
}

const PERFORMANCE_BAND_ORDER = ['completed', 'on_track', 'steady', 'needs_support', 'not_started']
const PROGRESS_BAND_COLORS = {
  completed: '#10b981',
  on_track: '#0d9488',
  steady: '#3b82f6',
  needs_support: '#ef4444',
  not_started: '#8b5cf6'
}

const formatFileSize = (size) => {
  if (!size || Number(size) <= 0) return ''

  const units = ['B', 'KB', 'MB', 'GB']
  const sizeValue = Number(size)
  const unitIndex = Math.min(Math.floor(Math.log(sizeValue) / Math.log(1024)), units.length - 1)
  const formattedValue = sizeValue / (1024 ** unitIndex)

  return `${formattedValue >= 10 || unitIndex === 0 ? Math.round(formattedValue) : formattedValue.toFixed(1)} ${units[unitIndex]}`
}

const formatRuntimeCompact = (runtimeMs) => {
  const value = Number(runtimeMs)

  if (!value || value <= 0) return 'N/A'
  if (value < 1000) return `${Math.round(value)} ms`
  if (value < 60000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} s`

  return `${(value / 60000).toFixed(1)} min`
}

const getModuleTaskCount = (module = {}) => Number(
  module.task_count
    ?? module.total_tasks
    ?? module.tasks_per_module
    ?? 0
) || 0

const sortModulesByOrder = (moduleList = []) => [...moduleList].sort((left, right) => {
  const orderDelta = (Number(left?.module_order) || 0) - (Number(right?.module_order) || 0)
  if (orderDelta !== 0) return orderDelta

  const createdAtDelta = new Date(left?.createdAt || 0).getTime() - new Date(right?.createdAt || 0).getTime()
  if (createdAtDelta !== 0) return createdAtDelta

  return (left?.module_name || '').localeCompare(right?.module_name || '')
})

function TeacherDashboard() {
  const { theme } = useTheme()
  const { translations, language, changeLanguage, t: translate } = useI18n()
  const { toggleTheme, isDark } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const t = translations.dashboard.teacher
  const common = translations.common
  const deadlineFormatter = new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
  const announcementDateFormatter = new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  const formatTaskDeadline = (deadlineAt) => {
    if (!deadlineAt) return ''

    const parsedDeadline = new Date(deadlineAt)
    return Number.isNaN(parsedDeadline.getTime()) ? '' : deadlineFormatter.format(parsedDeadline)
  }

  const isTaskDeadlinePassed = (task) => Boolean(
    (task?.has_deadline ?? Boolean(task?.deadline_at)) &&
    task?.deadline_at &&
    new Date(task.deadline_at).getTime() < Date.now()
  )

  const [showModuleForm, setShowModuleForm] = React.useState(false)
  const [showCourseForm, setShowCourseForm] = React.useState(false)
  const [editingCourse, setEditingCourse] = React.useState(null)
  const [editingModule, setEditingModule] = React.useState(null)
  const [showTaskForm, setShowTaskForm] = React.useState(false) // For creating/editing task
  const [editingTask, setEditingTask] = React.useState(null) // Holds task object when editing

  const [courses, setCourses] = React.useState([])
  const [selectedCourse, setSelectedCourse] = React.useState(null)

  const [modules, setModules] = React.useState([])
  const [loadingModules, setLoadingModules] = React.useState(false)

  const [selectedModule, setSelectedModule] = React.useState(null) // For viewing tasks
  const [tasks, setTasks] = React.useState([])
  const [loadingTasks, setLoadingTasks] = React.useState(false)

  const [viewingStudents, setViewingStudents] = React.useState(false)
  const [students, setStudents] = React.useState([])
  const [loadingStudents, setLoadingStudents] = React.useState(false)

  const [selectedModuleForTask, setSelectedModuleForTask] = React.useState(null) // For modal context
  const [showAddStudentsModal, setShowAddStudentsModal] = React.useState(false)
  const [showRewardsModal, setShowRewardsModal] = React.useState(false)
  const [analyticsCourse, setAnalyticsCourse] = React.useState(null)
  const [courseAnalytics, setCourseAnalytics] = React.useState(null)
  const [loadingCourseAnalytics, setLoadingCourseAnalytics] = React.useState(false)

  // Handout state
  const [handoutUploading, setHandoutUploading] = React.useState(false)
  const handoutInputRef = React.useRef(null)
  const [activeTab, setActiveTab] = React.useState(() => {
    try {
      const saved = sessionStorage.getItem(TEACHER_DASHBOARD_STATE_KEY)
      if (!saved) return 'dashboard'
      const parsed = JSON.parse(saved)
      return parsed.activeTab || 'dashboard'
    } catch (_error) {
      return 'dashboard'
    }
  })
  const [announcements, setAnnouncements] = React.useState([])
  const [loadingAnnouncements, setLoadingAnnouncements] = React.useState(false)
  const [savingAnnouncement, setSavingAnnouncement] = React.useState(false)
  const [deletingAnnouncementId, setDeletingAnnouncementId] = React.useState(null)
  const [announcementMessage, setAnnouncementMessage] = React.useState('')
  const [announcementForm, setAnnouncementForm] = React.useState({
    audienceType: 'COURSE',
    courseId: '',
    title: '',
    message: '',
    ...getDefaultAnnouncementTimerForm()
  })
  const showModuleSkeletons = useDelayedLoading(loadingModules)
  const showTaskSkeletons = useDelayedLoading(loadingTasks)
  const showStudentSkeletons = useDelayedLoading(loadingStudents)
  const isCustomAnnouncementTimer = announcementForm.timerPreset === 'custom'
  const isAnnouncementTimerReady = isAnnouncementTimerValid(announcementForm)

  const [stats, setStats] = React.useState({
    activeClasses: 0,
    totalStudents: 0,
    pendingGrading: 0,
    avgPerformance: '0%',
    performanceAnalytics: DEFAULT_PERFORMANCE_ANALYTICS
  })
  const restoredTeacherStateRef = React.useRef(false)

  const getAuthHeaders = () => {
    const userStr = localStorage.getItem('user')
    const token = userStr ? JSON.parse(userStr).token : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const downloadProtectedFile = async (filePath, filename = 'download') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/files?path=${encodeURIComponent(filePath)}&download=1`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('file_download_failed')
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Failed to download file', error)
    }
  }

  const openProtectedFile = async (filePath) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/files?path=${encodeURIComponent(filePath)}`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('file_open_failed')
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      window.open(blobUrl, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60 * 1000)
    } catch (error) {
      console.error('Failed to open file', error)
    }
  }

  const fetchStats = async () => {
    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/courses/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats', error)
    }
  }

  const fetchCourses = async () => {
    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      }
    } catch (error) {
      console.error('Failed to fetch courses', error)
    }
  }

  React.useEffect(() => {
    sessionStorage.setItem(TEACHER_DASHBOARD_STATE_KEY, JSON.stringify({
      activeTab,
      selectedCourseId: selectedCourse?._id || null,
      selectedModuleId: selectedModule?._id || null,
    }))
  }, [activeTab, selectedCourse?._id, selectedModule?._id])

  React.useEffect(() => {
    if (restoredTeacherStateRef.current || courses.length === 0) return

    try {
      const saved = sessionStorage.getItem(TEACHER_DASHBOARD_STATE_KEY)
      if (!saved) {
        restoredTeacherStateRef.current = true
        return
      }

      const parsed = JSON.parse(saved)
      const savedCourseId = parsed.selectedCourseId
      if (parsed.activeTab) {
        setActiveTab(parsed.activeTab)
      }

      if (savedCourseId && parsed.activeTab === 'myCourses') {
        const savedCourse = courses.find((course) => course._id === savedCourseId)
        if (savedCourse) {
          setSelectedCourse(savedCourse)
          fetchModules(savedCourse._id)
        }
      }
    } catch (_error) {
      // Ignore invalid persisted state.
    } finally {
      restoredTeacherStateRef.current = true
    }
  }, [courses])

  React.useEffect(() => {
    if (!selectedCourse || modules.length === 0 || selectedModule) return

    try {
      const saved = sessionStorage.getItem(TEACHER_DASHBOARD_STATE_KEY)
      if (!saved) return

      const parsed = JSON.parse(saved)
      const savedModuleId = parsed.selectedModuleId
      if (!savedModuleId) return

      const savedModule = modules.find((module) => module._id === savedModuleId)
      if (savedModule) {
        setSelectedModule(savedModule)
        fetchTasks(savedModule._id)
      }
    } catch (_error) {
      // Ignore invalid persisted state.
    }
  }, [selectedCourse?._id, modules, selectedModule])

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true)
    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/announcements/manage`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(normalizeAnnouncementList(data))
      }
    } catch (error) {
      console.error('Failed to fetch announcements', error)
    } finally {
      setLoadingAnnouncements(false)
    }
  }

  const fetchModules = async (courseId) => {
    setLoadingModules(true)
    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/modules?course_id=${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const sortedModules = sortModulesByOrder(data)
        setModules(sortedModules)
        setSelectedCourse((prev) => prev && prev._id === courseId ? { ...prev, modules_count: sortedModules.length } : prev)
        setCourses((prev) => prev.map((course) => course._id === courseId ? { ...course, modules_count: sortedModules.length } : course))
      }
    } catch (error) {
      console.error('Failed to fetch modules', error)
    } finally {
      setLoadingModules(false)
    }
  }

  const fetchTasks = async (moduleId) => {
    setLoadingTasks(true)
    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/tasks?module_id=${moduleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Failed to fetch tasks', error)
    } finally {
      setLoadingTasks(false)
    }
  }

  const fetchEnrolledStudents = async (courseId) => {
    setLoadingStudents(true)
    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/enrollments/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        // Response now contains student details plus status, or we might need to adjust backend to ensure it returns the enrollment document with status.
        // Wait, the backend currently returns a mapped object with status. Let's verify.
        // Yes, backend returns: { _id, name, email, enrollment_number, status, enrolledAt }
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Failed to fetch students', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const closeCourseAnalytics = () => {
    setAnalyticsCourse(null)
    setCourseAnalytics(null)
    setLoadingCourseAnalytics(false)
  }

  const openCourseAnalytics = async (course) => {
    setAnalyticsCourse(course)
    setCourseAnalytics(null)
    setLoadingCourseAnalytics(true)

    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/courses/${course._id}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('analytics_failed')
      }

      const data = await response.json()
      setCourseAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch course analytics', error)
      alert(t.alerts.courseAnalyticsFailed)
    } finally {
      setLoadingCourseAnalytics(false)
    }
  }

  const handleEnrollmentStatus = async (enrollmentId, newStatus) => {
    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;

      const response = await fetch(`${API_BASE_URL}/api/enrollments/${enrollmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setStudents(students.map(s =>
          s.enrollment_id === enrollmentId ? { ...s, status: newStatus } : s
        ));
      } else {
        alert(t.alerts.updateStatusFailed);
      }
    } catch (error) {
      console.error("Status update error", error);
      alert(t.alerts.updateStatusError);
    }
  }

  React.useEffect(() => {
    fetchCourses()
    fetchStats()
    fetchAnnouncements()
  }, [])

  React.useEffect(() => {
    const expiryPruneInterval = window.setInterval(() => {
      setAnnouncements((prev) => normalizeAnnouncementList(prev))
    }, 30000)

    return () => {
      window.clearInterval(expiryPruneInterval)
    }
  }, [])

  React.useEffect(() => {
    const userStr = localStorage.getItem('user')
    const token = userStr ? JSON.parse(userStr).token : null

    if (!token) {
      return undefined
    }

    return subscribeToAnnouncementStream({
      token,
      onEvent: async ({ event, data }) => {
        if (event !== 'announcement' || !data?.type) {
          return
        }

        setAnnouncements((prev) => applyAnnouncementEvent(prev, data))
      },
      onError: (error) => {
        console.error('Announcement stream error:', error)
      },
    })
  }, [])

  React.useEffect(() => {
    if (announcementForm.audienceType === 'COURSE' && !announcementForm.courseId && courses.length) {
      setAnnouncementForm((prev) => ({ ...prev, courseId: courses[0]._id }))
    }
  }, [announcementForm.audienceType, announcementForm.courseId, courses])

  const handleAnnouncementFieldChange = (field, value) => {
    setAnnouncementForm((prev) => {
      if (field === 'audienceType') {
        return {
          ...prev,
          audienceType: value,
          courseId: value === 'GLOBAL' ? '' : (prev.courseId || courses[0]?._id || '')
        }
      }

      return { ...prev, [field]: value }
    })
    setAnnouncementMessage('')
  }

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      audienceType: 'COURSE',
      courseId: courses[0]?._id || '',
      title: '',
      message: '',
      ...getDefaultAnnouncementTimerForm()
    })
    setAnnouncementMessage('')
  }

  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) return
    if (announcementForm.audienceType === 'COURSE' && !announcementForm.courseId) return

    const expiresInMinutes = getAnnouncementExpiryMinutes(announcementForm)
    if (announcementForm.timerPreset === 'custom' && !isAnnouncementTimerReady) return

    setSavingAnnouncement(true)
    setAnnouncementMessage('')

    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          audience_type: announcementForm.audienceType,
          course_id: announcementForm.audienceType === 'COURSE' ? announcementForm.courseId : null,
          title: announcementForm.title.trim(),
          message: announcementForm.message.trim(),
          expires_in_minutes: expiresInMinutes
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'announcement_create_failed')
      }

      setAnnouncements((prev) => normalizeAnnouncementList([data, ...prev]))
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
    if (!announcementId) return

    setDeletingAnnouncementId(announcementId)
    setAnnouncementMessage('')

    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'announcement_delete_failed')
      }

      setAnnouncements((prev) => prev.filter((announcement) => announcement._id !== announcementId))
      setAnnouncementMessage(t.announcements.deleted)
    } catch (error) {
      console.error('Delete announcement failed', error)
      setAnnouncementMessage(t.announcements.deleteFailed)
    } finally {
      setDeletingAnnouncementId(null)
    }
  }

  const openCourseForm = (course = null) => {
    setEditingCourse(course)
    setShowCourseForm(true)
  }

  const openModuleForm = (module = null) => {
    setEditingModule(module)
    setShowModuleForm(true)
  }

  const handleCourseSaved = (courseData, isEditing = false) => {
    if (isEditing) {
      setCourses((prev) => prev.map((course) => course._id === courseData._id ? courseData : course))
      setSelectedCourse((prev) => prev && prev._id === courseData._id ? { ...prev, ...courseData } : prev)
      setEditingCourse(null)
      return
    }

    setCourses((prev) => [...prev, courseData])
  }

  const handleCourseSelect = (course) => {
    setSelectedCourse(course)
    fetchModules(course._id)
  }

  const handleViewStudents = () => {
    setViewingStudents(true);
    if (selectedCourse) {
      fetchEnrolledStudents(selectedCourse._id);
    }
  }

  const handleModuleSelect = (module) => {
    setSelectedModule(module);
    fetchTasks(module._id);
  }

  const handleDeleteModuleFile = async (filePath) => {
    if (!selectedModule?._id || !filePath) return
    if (!window.confirm(t.modules.resources.removeConfirm)) return

    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/modules/${selectedModule._id}/files`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ filePath })
      })

      if (!response.ok) {
        throw new Error('delete_module_file_failed')
      }

      const updatedModule = await response.json()
      const mergedModule = {
        ...selectedModule,
        ...updatedModule,
        task_count: updatedModule.task_count ?? selectedModule?.task_count ?? 0
      }
      setSelectedModule(mergedModule)
      setModules((prev) => sortModulesByOrder(prev.map((module) => module._id === mergedModule._id ? { ...module, ...mergedModule } : module)))
    } catch (error) {
      console.error('Delete module file error', error)
      alert(t.modules.resources.removeFailed)
    }
  }

  const handleBack = () => {
    if (selectedModule) {
      setSelectedModule(null);
      setTasks([]);
    } else if (selectedCourse) {
      setSelectedCourse(null);
      setModules([]);
    }
  }

  const handleModuleSaved = (moduleData, isEditing = false) => {
    if (isEditing) {
      setModules((prev) => sortModulesByOrder(prev.map((module) => (
        module._id === moduleData._id
          ? { ...module, ...moduleData, task_count: moduleData.task_count ?? module.task_count ?? 0 }
          : module
      ))))
      setSelectedModule((prev) => prev && prev._id === moduleData._id ? { ...prev, ...moduleData, task_count: moduleData.task_count ?? prev.task_count ?? 0 } : prev)
      setEditingModule(null)
      return
    }

    const newModule = { ...moduleData, task_count: moduleData.task_count ?? 0 }
    setModules((prev) => sortModulesByOrder([...prev, newModule]))
    setSelectedCourse((prev) => prev ? { ...prev, modules_count: (prev.modules_count || 0) + 1 } : prev)
    setCourses((prev) => prev.map((course) => (
      course._id === selectedCourse?._id
        ? { ...course, modules_count: (course.modules_count || 0) + 1 }
        : course
    )))
  }

  const handleTaskCreated = (taskData, isEditing = false) => {
    if (isEditing) {
      setTasks((prev) => prev.map((task) => task._id === taskData._id ? taskData : task))
      setEditingTask(null)
    } else {
      if (selectedModule && selectedModule._id === taskData.module_id) {
        setTasks((prev) => [...prev, taskData]);
      }

      setModules((prev) => prev.map((module) =>
        module._id === taskData.module_id
          ? {
              ...module,
              task_count: getModuleTaskCount(module) + 1,
              total_tasks: (module.total_tasks || getModuleTaskCount(module)) + 1
            }
          : module
      ));
    }
  }

  const openTaskForm = (moduleId, taskToEdit = null) => {
    setSelectedModuleForTask(moduleId)
    setEditingTask(taskToEdit)
    setShowTaskForm(true)
  }

  const handleDeleteCourse = async (e, courseId) => {
    e.stopPropagation()
    if (!window.confirm(t.alerts.confirmDeleteCourse)) return;

    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setCourses(courses.filter(c => c._id !== courseId))
      } else {
        alert(t.alerts.deleteCourseFailed)
      }
    } catch (error) {
      console.error("Delete error", error)
      alert(t.alerts.deleteCourseError)
    }
  }

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm(t.alerts.confirmDeleteModule)) return;

    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/modules/${moduleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setModules(modules.filter(m => m._id !== moduleId))
        setSelectedCourse((prev) => prev ? { ...prev, modules_count: Math.max(0, (prev.modules_count || 0) - 1) } : prev)
        setCourses((prev) => prev.map((course) => (
          course._id === selectedCourse?._id
            ? { ...course, modules_count: Math.max(0, (course.modules_count || 0) - 1) }
            : course
        )))
        // If deleting the currently viewed module, go back
        if (selectedModule && selectedModule._id === moduleId) {
          setSelectedModule(null);
        }
      } else {
        alert(t.alerts.deleteModuleFailed)
      }
    } catch (error) {
      console.error("Delete error", error)
      alert(t.alerts.deleteModuleError)
    }
  }

  const handleDeleteTask = async (taskId, moduleId) => {
    if (!window.confirm(t.alerts.confirmDeleteTask)) return;

    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setTasks(tasks.filter(t => t._id !== taskId))

        // Update module task count locally
        setModules(modules.map(m =>
          m._id === moduleId
            ? {
                ...m,
                task_count: Math.max(0, getModuleTaskCount(m) - 1),
                total_tasks: Math.max(0, (m.total_tasks || getModuleTaskCount(m)) - 1)
              }
            : m
        ));
      } else {
        alert(t.alerts.deleteTaskFailed)
      }
    } catch (error) {
      console.error("Delete error", error)
      alert(t.alerts.deleteTaskError)
    }
  }

  const handleCourseExport = async (courseId, courseCode) => {
    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `course_export_${courseCode}_${timestamp}.zip`;

        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        alert(t.alerts.courseExportFailed)
      }
    } catch (error) {
      console.error('Export error', error)
      alert(t.alerts.courseExportFailed)
    }
  }

  const handleModuleExport = async (moduleId, moduleName) => {
    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/modules/${moduleId}/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `module_export_${moduleName.replace(/ /g, '_')}_${timestamp}.zip`;

        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        alert(t.alerts.moduleExportFailed)
      }
    } catch (error) {
      console.error('Export error', error)
      alert(t.alerts.moduleExportFailed)
    }
  }

  const handleHandoutUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setHandoutUploading(true);
    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;

      const formData = new FormData();
      formData.append('handout', file);

      const response = await fetch(`${API_BASE_URL}/api/courses/${selectedCourse._id}/handout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedCourse(prev => ({
          ...prev,
          handout_filename: data.handout_filename,
          handout_path: data.handout_path,
        }));
        // Also update in courses list
        setCourses(prev => prev.map(c => c._id === selectedCourse._id
          ? { ...c, handout_filename: data.handout_filename, handout_path: data.handout_path }
          : c
        ));
      } else {
        const err = await response.json();
        alert(err.message || t.handout.uploadFailed);
      }
    } catch (error) {
      console.error('Handout upload error', error);
      alert(t.handout.uploadFailed);
    } finally {
      setHandoutUploading(false);
      // Reset file input so the same file can be re-selected after removal
      if (handoutInputRef.current) handoutInputRef.current.value = '';
    }
  };

  const handleHandoutDelete = async () => {
    if (!window.confirm(t.handout.removeConfirm)) return;

    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;

      const response = await fetch(`${API_BASE_URL}/api/courses/${selectedCourse._id}/handout`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSelectedCourse(prev => ({ ...prev, handout_filename: null, handout_path: null }));
        setCourses(prev => prev.map(c => c._id === selectedCourse._id
          ? { ...c, handout_filename: null, handout_path: null }
          : c
        ));
      } else {
        alert(t.handout.removeFailed);
      }
    } catch (error) {
      console.error('Handout delete error', error);
      alert(t.handout.removeError);
    }
  };

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const selectedCourseTaskCount = modules.reduce((sum, module) => sum + getModuleTaskCount(module), 0)
  const selectedCourseFileCount = modules.reduce((sum, module) => sum + ((module.files && module.files.length) || 0), 0)
  const orderedModules = React.useMemo(() => sortModulesByOrder(modules), [modules])
  const selectedModuleDisplayOrder = React.useMemo(() => {
    if (!selectedModule?._id) return selectedModule?.module_order || 1

    const moduleIndex = orderedModules.findIndex((module) => module._id === selectedModule._id)
    return moduleIndex >= 0 ? moduleIndex + 1 : (selectedModule.module_order || 1)
  }, [orderedModules, selectedModule])
  const selectedModuleTotalPoints = tasks.reduce((sum, task) => sum + (task.points || 0), 0)
  const selectedModuleAverageTime = tasks.length > 0
    ? Math.round(tasks.reduce((sum, task) => sum + (task.time_limit || 0), 0) / tasks.length)
    : 0
  const selectedModuleLanguageCount = new Set(tasks.map(task => task.language).filter(Boolean)).size
  const tabTitles = {
    dashboard: t.tabs.dashboard,
    myCourses: t.tabs.myCourses,
    announcements: t.tabs.announcements
  }
  const performanceSection = t.dashboardAnalytics
  const analyticsLabels = t.analyticsModal
  const getDifficultyLabel = (difficulty) => translations.forms.task.difficulties[difficulty] || difficulty
  const getStatusLabel = (status) => common.statuses[status] || status
  const performanceAnalytics = stats.performanceAnalytics || DEFAULT_PERFORMANCE_ANALYTICS
  const overallTopPerformer = performanceAnalytics.topPerformers?.[0] || null
  const dashboardDonutItems = PERFORMANCE_BAND_ORDER.map((band) => ({
    key: band,
    label: analyticsLabels.progressBands[band] || band,
    value: performanceAnalytics.progressBandBreakdown?.[band] || 0,
    color: PROGRESS_BAND_COLORS[band]
  }))
  const dashboardColumnItems = (performanceAnalytics.topPerformers || []).slice(0, 5).map((student) => ({
    key: student.studentId,
    label: student.name,
    shortLabel: student.name?.split(' ')[0] || student.name,
    value: student.engagementScore || 0,
    meta: formatPercent(student.averageScore),
    color: 'var(--accent-gradient)'
  }))
  const scoreCurveItems = (performanceAnalytics.scoreDistribution || []).map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    shortLabel: bucket.label,
    value: bucket.value || 0,
    meta: `${bucket.share || 0}%`,
    color: 'linear-gradient(180deg, #0f766e 0%, #22c55e 100%)'
  }))
  const leaderboardSnapshot = performanceAnalytics.leaderboardSnapshot || DEFAULT_PERFORMANCE_ANALYTICS.leaderboardSnapshot
  const overallHardestTask = performanceAnalytics.taskDifficultyHotspots?.[0] || null
  const courseHighlights = performanceAnalytics.courseHighlights || DEFAULT_PERFORMANCE_ANALYTICS.courseHighlights
  const courseComparisonItems = (performanceAnalytics.courseBreakdown || []).map((course) => ({
    key: course.courseId,
    label: course.courseName,
    shortLabel: course.courseCode || course.courseName?.split(' ').slice(0, 2).join(' '),
    value: course.avgCompletionRate || 0,
    meta: `${formatPercent(course.averageEngagement)} • ${course.activeLearners || 0}`,
    color: 'linear-gradient(180deg, #2563eb 0%, #14b8a6 100%)'
  }))
  const taskHotspotItems = (performanceAnalytics.taskDifficultyHotspots || []).slice(0, 6).map((task) => ({
    key: task.taskId,
    title: task.taskName,
    subtitle: [task.courseName, task.moduleName].filter(Boolean).join(' • '),
    intensity: task.challengeScore || 0,
    level: task.heatLevel || 'stable',
    valueLabel: `${analyticsLabels.fields.challenge}: ${formatPercent(task.challengeScore)}`,
    metrics: [
      { label: analyticsLabels.fields.passRate, value: formatPercent(task.passRate) },
      { label: analyticsLabels.fields.completion, value: formatPercent(task.completionRate) },
      { label: analyticsLabels.fields.attempts, value: task.attempts || 0 },
      { label: analyticsLabels.fields.runtime, value: formatRuntimeCompact(task.averageRuntimeMs) }
    ],
    footer: [getDifficultyLabel(task.difficulty), task.language].filter(Boolean).join(' • ')
  }))
  const showTopbarCourseBack = activeTab === 'myCourses' && !!selectedCourse
  const topbarBackLabel = selectedModule
    ? t.topbar.backToModules
    : t.topbar.backToCourses
  const topbarTitle = activeTab === 'dashboard'
    ? translate('dashboard.teacher.topbar.welcomeBack', { name: user?.name || translations.auth.roles.teacher })
    : activeTab === 'myCourses'
      ? (selectedCourse ? '' : '')
      : tabTitles[activeTab]
  const teacherWorkspaceProps = {
    activeTab,
    t,
    common,
    translate,
    stats,
    performanceSection,
    performanceAnalytics,
    analyticsLabels,
    overallTopPerformer,
    overallHardestTask,
    leaderboardSnapshot,
    courseHighlights,
    dashboardDonutItems,
    scoreCurveItems,
    dashboardColumnItems,
    taskHotspotItems,
    courseComparisonItems,
    announcementDateFormatter,
    formatPercent,
    getInitials,
    performanceBandOrder: PERFORMANCE_BAND_ORDER,
    courses,
    getCourseGradient,
    courseGradients: COURSE_GRADIENTS,
    openCourseAnalytics,
    openCourseForm,
    handleCourseExport,
    handleDeleteCourse,
    handleCourseSelect,
    selectedCourse,
    selectedModule,
    modules,
    orderedModules,
    selectedCourseTaskCount,
    selectedCourseFileCount,
    handoutInputRef,
    handleHandoutUpload,
    handoutUploading,
    handleViewStudents,
    setShowRewardsModal,
    openModuleForm,
    handleHandoutDelete,
    openProtectedFile,
    loadingModules,
    showModuleSkeletons,
    getModuleTaskCount,
    handleModuleSelect,
    handleModuleExport,
    handleDeleteModule,
    openTaskForm,
    selectedModuleDisplayOrder,
    tasks,
    selectedModuleTotalPoints,
    selectedModuleAverageTime,
    selectedModuleLanguageCount,
    formatFileSize,
    downloadProtectedFile,
    handleDeleteModuleFile,
    loadingTasks,
    showTaskSkeletons,
    getDifficultyLabel,
    formatTaskDeadline,
    isTaskDeadlinePassed,
    handleDeleteTask,
    announcements,
    loadingAnnouncements,
    announcementForm,
    handleAnnouncementFieldChange,
    isCustomAnnouncementTimer,
    isAnnouncementTimerReady,
    savingAnnouncement,
    handleCreateAnnouncement,
    resetAnnouncementForm,
    announcementMessage,
    deletingAnnouncementId,
    handleDeleteAnnouncement,
  }
  const teacherStudentsModalProps = {
    viewingStudents,
    selectedCourse,
    setViewingStudents,
    setStudents,
    translate,
    students,
    setShowAddStudentsModal,
    t,
    loadingStudents,
    showStudentSkeletons,
    common,
    getStatusLabel,
    handleEnrollmentStatus,
  }

  return (
    <div className="dashboard-layout" data-theme={theme}>
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <h1 className="dashboard-title">{t.title}</h1>
        </div>
        
        <nav className="sidebar-nav">
          <button className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); handleBack(); }}>
            <HiChartBar className="sidebar-icon" /> {t.tabs.dashboard}
          </button>
          <button className={`sidebar-link ${activeTab === 'myCourses' ? 'active' : ''}`} onClick={() => setActiveTab('myCourses')}>
            <HiBookOpen className="sidebar-icon" /> {t.tabs.myCourses}
          </button>
          <button className={`sidebar-link ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => { setActiveTab('announcements'); handleBack(); }}>
            <HiBellAlert className="sidebar-icon" /> {t.tabs.announcements}
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="profile-info">
              <div className="profile-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'T'}</div>
              <div className="profile-text">
                <span className="profile-name">{user?.name || translations.auth.roles.teacher}</span>
                <span className="profile-role">{t.roleLabel}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout" title={t.logout}>
              <HiArrowDownTray style={{ transform: 'rotate(-90deg)', fontSize: '1.2rem' }} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-content">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            {showTopbarCourseBack && (
              <button className="btn btn-secondary topbar-back-button" onClick={handleBack}>
                {topbarBackLabel}
              </button>
            )}
            {topbarTitle && <h2 className="topbar-title">{topbarTitle}</h2>}
            {activeTab === 'myCourses' && !selectedCourse && (
              <button className="btn btn-primary topbar-create-button" onClick={() => openCourseForm()}>
                <span className="topbar-create-button__icon">
                  <HiFolderPlus />
                </span>
                <span className="topbar-create-button__label">{t.courses.createCourse}</span>
              </button>
            )}
          </div>
          <div className="topbar-right">
            <select
              className="language-selector"
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
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

        <TeacherDashboardWorkspace {...teacherWorkspaceProps} />
      </main>

      {showCourseForm && (
        <CreateCourseForm
          onClose={() => { setShowCourseForm(false); setEditingCourse(null) }}
          onCourseSaved={handleCourseSaved}
          initialData={editingCourse}
        />
      )}

      {showModuleForm && selectedCourse && (
        <CreateModuleForm
          onClose={() => { setShowModuleForm(false); setEditingModule(null) }}
          onModuleSaved={handleModuleSaved}
          courseId={selectedCourse._id}
          initialData={editingModule}
        />
      )}

      {showTaskForm && selectedModuleForTask && (
        <CreateTaskForm
          onClose={() => { setShowTaskForm(false); setEditingTask(null); }}
          onTaskCreated={handleTaskCreated}
          moduleId={selectedModuleForTask}
          initialData={editingTask}
        />
      )}

      {showRewardsModal && selectedCourse && (
        <ManageRewardsModal
          course={selectedCourse}
          onClose={() => setShowRewardsModal(false)}
        />
      )}

      {analyticsCourse && (
        <CourseAnalyticsModal
          course={analyticsCourse}
          analytics={courseAnalytics}
          loading={loadingCourseAnalytics}
          onClose={closeCourseAnalytics}
          labels={t}
          common={common}
        />
      )}

      <TeacherStudentsModal {...teacherStudentsModalProps} />

      {showAddStudentsModal && selectedCourse && (
        <AddStudentsModal
          courseId={selectedCourse._id}
          onClose={() => setShowAddStudentsModal(false)}
          onStudentsAdded={() => fetchEnrolledStudents(selectedCourse._id)}
        />
      )}
    </div>
  )
}

export default TeacherDashboard

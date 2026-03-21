import React from 'react'
import API_BASE_URL from '../config'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import { useNavigate } from 'react-router-dom'
import { HiUsers, HiBookOpen, HiDocumentText, HiChartBar, HiFolderPlus, HiArrowDownTray, HiTrash, HiPlus, HiListBullet, HiUserGroup, HiPaperClip, HiGift, HiStar } from 'react-icons/hi2'
import { FiSun, FiMoon } from 'react-icons/fi'
import CreateModuleForm from '../components/CreateModuleForm'
import CreateCourseForm from '../components/CreateCourseForm'
import CreateTaskForm from '../components/CreateTaskForm'
import AddStudentsModal from '../components/AddStudentsModal'
import ManageRewardsModal from '../components/ManageRewardsModal'
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

function TeacherDashboard() {
  const { theme } = useTheme()
  const { translations, language, changeLanguage } = useI18n()
  const { toggleTheme, isDark } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [showModuleForm, setShowModuleForm] = React.useState(false)
  const [showCourseForm, setShowCourseForm] = React.useState(false)
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

  // Handout state
  const [handoutUploading, setHandoutUploading] = React.useState(false)
  const handoutInputRef = React.useRef(null)
  const [activeTab, setActiveTab] = React.useState('Dashboard')

  const [stats, setStats] = React.useState({
    activeClasses: 0,
    totalStudents: 0,
    pendingGrading: 0,
    avgPerformance: '0%'
  });

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
        setModules(data)
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
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Status update error", error);
      alert("Error updating status");
    }
  }

  React.useEffect(() => {
    fetchCourses()
    fetchStats()
  }, [])

  const handleCourseCreated = (newCourse) => {
    setCourses([...courses, newCourse])
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

  const handleBack = () => {
    if (selectedModule) {
      setSelectedModule(null);
      setTasks([]);
    } else if (selectedCourse) {
      setSelectedCourse(null);
      setModules([]);
    }
  }

  const handleModuleCreated = (newModule) => {
    setModules([newModule, ...modules])
  }

  const handleTaskCreated = (taskData, isEditing = false) => {
    if (isEditing) {
      setTasks(tasks.map(t => t._id === taskData._id ? taskData : t))
      setEditingTask(null)
    } else {
      // If viewing the specific module, update task list
      if (selectedModule && selectedModule._id === taskData.module_id) {
        setTasks([...tasks, taskData]);
      }

      // Update the module's task count in the module list
      setModules(modules.map(m =>
        m._id === taskData.module_id
          ? { ...m, tasks_per_module: (m.tasks_per_module || 0) + 1 }
          : m
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
    if (!window.confirm("Are you sure you want to delete this course?")) return;

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
        alert("Failed to delete course")
      }
    } catch (error) {
      console.error("Delete error", error)
      alert("Error deleting course")
    }
  }

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm("Are you sure you want to delete this module?")) return;

    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`${API_BASE_URL}/api/modules/${moduleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setModules(modules.filter(m => m._id !== moduleId))
        // If deleting the currently viewed module, go back
        if (selectedModule && selectedModule._id === moduleId) {
          setSelectedModule(null);
        }
      } else {
        alert("Failed to delete module")
      }
    } catch (error) {
      console.error("Delete error", error)
      alert("Error deleting module")
    }
  }

  const handleDeleteTask = async (taskId, moduleId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

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
            ? { ...m, tasks_per_module: Math.max(0, (m.tasks_per_module || 0) - 1) }
            : m
        ));
      } else {
        alert("Failed to delete task")
      }
    } catch (error) {
      console.error("Delete error", error)
      alert("Error deleting task")
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
        alert('Course export failed')
      }
    } catch (error) {
      console.error('Export error', error)
      alert('Course export failed')
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
        alert('Module export failed')
      }
    } catch (error) {
      console.error('Export error', error)
      alert('Module export failed')
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
        alert(err.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Handout upload error', error);
      alert('Upload failed');
    } finally {
      setHandoutUploading(false);
      // Reset file input so the same file can be re-selected after removal
      if (handoutInputRef.current) handoutInputRef.current.value = '';
    }
  };

  const handleHandoutDelete = async () => {
    if (!window.confirm('Remove the uploaded handout?')) return;

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
        alert('Failed to remove handout');
      }
    } catch (error) {
      console.error('Handout delete error', error);
      alert('Error removing handout');
    }
  };

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const t = translations.dashboard.teacher
  const selectedCourseTaskCount = modules.reduce((sum, module) => sum + (module.tasks_per_module || 0), 0)
  const selectedCourseFileCount = modules.reduce((sum, module) => sum + ((module.files && module.files.length) || 0), 0)
  const selectedModuleTotalPoints = tasks.reduce((sum, task) => sum + (task.points || 0), 0)
  const selectedModuleAverageTime = tasks.length > 0
    ? Math.round(tasks.reduce((sum, task) => sum + (task.time_limit || 0), 0) / tasks.length)
    : 0
  const selectedModuleLanguageCount = new Set(tasks.map(task => task.language).filter(Boolean)).size

  return (
    <div className="dashboard-layout" data-theme={theme}>
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <h1 className="dashboard-title">{t.title}</h1>
        </div>
        
        <nav className="sidebar-nav">
          <button className={`sidebar-link ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('Dashboard'); handleBack(); }}>
            <HiChartBar className="sidebar-icon" /> Dashboard
          </button>
          <button className={`sidebar-link ${activeTab === 'My Courses' ? 'active' : ''}`} onClick={() => setActiveTab('My Courses')}>
            <HiBookOpen className="sidebar-icon" /> My Courses
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="theme-toggle-row">
            <span className="text-secondary" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Theme</span>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>
          </div>
          <div className="sidebar-profile">
            <div className="profile-info">
              <div className="profile-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'T'}</div>
              <div className="profile-text">
                <span className="profile-name">{user?.name || 'Teacher'}</span>
                <span className="profile-role">Teacher</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout" title="Logout">
              <HiArrowDownTray style={{ transform: 'rotate(-90deg)', fontSize: '1.2rem' }} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-content">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <h2 className="topbar-title">
              {activeTab === 'Dashboard' ? `Welcome Back, ${user?.name || 'Teacher'}` :
               activeTab === 'My Courses' ? (selectedCourse ? selectedCourse.course_name : 'My Courses') : activeTab}
            </h2>
          </div>
          <div className="topbar-right">
            <select
              className="language-selector"
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
            >
              <option value="en">EN</option>
              <option value="hi">हिं</option>
            </select>
          </div>
        </header>

        <div className="dashboard-workspace">
          {activeTab === 'Dashboard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
              <div className="workspace-panel-header">
                <h3>Quick Stats</h3>
              </div>
              <div className="stats-grid">
                <motion.div className="stat-card" whileHover={{ y: -4 }}>
                  <div className="stat-icon"><HiUsers /></div>
                  <div className="stat-info">
                    <h3>{t.stats.totalStudents}</h3>
                    <p className="stat-number">{stats.totalStudents}</p>
                  </div>
                </motion.div>
                <motion.div className="stat-card" whileHover={{ y: -4 }}>
                  <div className="stat-icon"><HiBookOpen /></div>
                  <div className="stat-info">
                    <h3>{t.stats.activeClasses}</h3>
                    <p className="stat-number">{stats.activeClasses}</p>
                  </div>
                </motion.div>
                <motion.div className="stat-card" whileHover={{ y: -4 }}>
                  <div className="stat-icon"><HiDocumentText /></div>
                  <div className="stat-info">
                    <h3>{t.stats.pendingGrading}</h3>
                    <p className="stat-number">{stats.pendingGrading}</p>
                  </div>
                </motion.div>
                <motion.div className="stat-card" whileHover={{ y: -4 }}>
                  <div className="stat-icon"><HiChartBar /></div>
                  <div className="stat-info">
                    <h3>{t.stats.avgPerformance}</h3>
                    <p className="stat-number">{stats.avgPerformance}</p>
                  </div>
                </motion.div>
              </div>

              <div className="recent-activity mt-4">
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
              </div>
            </motion.div>
          )}

          {activeTab === 'My Courses' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
              {!selectedCourse ? (
                /* COURSE LIST VIEW */
                <div className="courses-section">
                  <div className="section-header">
                    <h3>My Courses</h3>
                    <button className="btn btn-primary" onClick={() => setShowCourseForm(true)}>
                      <HiFolderPlus /> Create Course
                    </button>
                  </div>
                  <div className="gc-course-grid teacher-course-grid">
                    {courses.length === 0 ? <p className="no-data">No courses created yet.</p> : courses.map(course => (
                      <motion.div
                        key={course._id}
                        className="gc-course-card teacher-course-card"
                        whileHover={{ y: -5 }}
                        onClick={() => handleCourseSelect(course)}
                      >
                        <div className="gc-card-header" style={{ background: getCourseGradient(course._id) }}>
                          <h3 title={course.course_name}>{course.course_name}</h3>
                          <p className="gc-course-teacher">Instructor Workspace • {course.course_code}</p>
                        </div>

                        <div className="gc-card-avatar teacher-course-avatar">
                          {(course.course_name || 'C').charAt(0).toUpperCase()}
                        </div>

                        <div className="gc-card-body teacher-course-body">
                          <p className="gc-course-desc">{course.description || 'No description provided.'}</p>
                          <div className="teacher-course-meta">
                            <span className="teacher-course-chip">{course.subject || 'General'}</span>
                            <span className="teacher-course-chip">Q: {course.course_test_questions || 0}</span>
                            <span className="teacher-course-chip">{course.points || 0} pts</span>
                          </div>
                        </div>

                        <div className="gc-card-footer teacher-course-footer">
                          <button
                            className="btn-icon"
                            title="Export Course"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCourseExport(course._id, course.course_code)
                            }}
                          >
                            <HiArrowDownTray size={20} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Delete Course"
                            onClick={(e) => handleDeleteCourse(e, course._id)}
                          >
                            <HiTrash size={20} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Open Course"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCourseSelect(course)
                            }}
                          >
                            <HiBookOpen size={22} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : !selectedModule ? (
                /* MODULE LIST VIEW */
                <div className="teacher-course-shell">
                  <div className="view-header teacher-course-workspace-header">
                    <button className="btn btn-secondary" onClick={handleBack}>
                      ← Back to Courses
                    </button>
                    <div className="teacher-course-hero">
                      <div className="view-title-info teacher-course-title-block">
                        <h2>{selectedCourse.course_name} <span className="course-code-large">({selectedCourse.course_code})</span></h2>
                        <p className="view-description">{selectedCourse.description}</p>
                        <div className="teacher-course-inline-meta">
                          <span className="teacher-workspace-chip">{selectedCourse.subject || 'General'}</span>
                          <span className="teacher-workspace-chip">{modules.length} Modules</span>
                          <span className="teacher-workspace-chip">{selectedCourseTaskCount} Tasks</span>
                        </div>
                      </div>
                      <div className="course-actions teacher-course-action-bar">
                        <button className="btn btn-outline" onClick={() => handleCourseExport(selectedCourse._id, selectedCourse.course_code)} title="Export Course">
                          <HiArrowDownTray /> Export Course
                        </button>
                        <button className="btn btn-secondary" onClick={handleViewStudents}>
                          <HiUserGroup /> Students
                        </button>
                        <button className="btn btn-secondary" onClick={() => setShowRewardsModal(true)}>
                          <HiGift /> Rewards
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowModuleForm(true)}>
                          <HiFolderPlus /> Add Module
                        </button>
                      </div>

                      {/* Hidden file input for handout */}
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                        ref={handoutInputRef}
                        onChange={handleHandoutUpload}
                      />
                    </div>

                    <div className="teacher-course-summary-grid">
                      <div className="teacher-summary-card">
                        <span className="teacher-summary-label">Modules</span>
                        <strong>{modules.length}</strong>
                        <p>Structured learning blocks in this course</p>
                      </div>
                      <div className="teacher-summary-card">
                        <span className="teacher-summary-label">Tasks</span>
                        <strong>{selectedCourseTaskCount}</strong>
                        <p>Total assignments published across modules</p>
                      </div>
                      <div className="teacher-summary-card">
                        <span className="teacher-summary-label">Resources</span>
                        <strong>{selectedCourseFileCount}</strong>
                        <p>Files attached across your teaching flow</p>
                      </div>
                      <div className="teacher-summary-card">
                        <span className="teacher-summary-label">Course Points</span>
                        <strong>{selectedCourse.points || 0}</strong>
                        <p>Reward value configured for the course journey</p>
                      </div>
                    </div>
                  </div>

                  {/* Handout section */}
                  <div className={`course-handout-panel ${selectedCourse.handout_path ? 'is-attached' : ''}`}>
                    <HiPaperClip className="course-handout-icon" />
                    {selectedCourse.handout_path ? (
                      <>
                        <span className="course-handout-content">
                          <a
                            className="course-handout-link"
                            href={`${API_BASE_URL.replace('/api', '')}/${selectedCourse.handout_path.replace(/\\/g, '/')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {selectedCourse.handout_filename}
                          </a>
                        </span>
                        <div className="course-handout-actions">
                          <button
                            className="btn btn-outline"
                            onClick={() => handoutInputRef.current?.click()}
                            disabled={handoutUploading}
                          >
                            {handoutUploading ? 'Uploading…' : '↑ Replace'}
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={handleHandoutDelete}
                          >
                            <HiTrash /> Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="course-handout-empty">No handout uploaded</span>
                        <button
                          className="btn btn-outline"
                          onClick={() => handoutInputRef.current?.click()}
                          disabled={handoutUploading}
                        >
                          <HiPaperClip /> {handoutUploading ? 'Uploading…' : 'Upload Handout (PDF)'}
                        </button>
                      </>
                    )}
                  </div>

                  <div className="modules-section">
                    <div className="teacher-section-heading">
                      <div>
                        <h3>Modules</h3>
                        <p>Organize the course into clear learning blocks with tasks and resources.</p>
                      </div>
                    </div>
                    {loadingModules ? <p>Loading modules...</p> : (
                      <div className="teacher-module-grid">
                        {modules.length === 0 ? <p className="no-modules">No modules in this course.</p> : modules.map(module => (
                          <div key={module._id} className="teacher-module-card">
                            <div className="teacher-module-top">
                              <div className="teacher-module-heading">
                                <span className="teacher-module-order">Module {module.module_order}</span>
                                <h4>{module.module_name}</h4>
                              </div>
                              <span className="teacher-module-points">{module.points || 0} pts</span>
                            </div>

                            <p className="teacher-module-description">{module.description || 'No module description added yet.'}</p>

                            <div className="teacher-module-meta">
                              <span className="teacher-workspace-chip">{module.files.length} Files</span>
                              <span className="teacher-workspace-chip">{module.tasks_per_module || 0} Tasks</span>
                              <span className="teacher-workspace-chip">Order #{module.module_order}</span>
                            </div>

                            <div className="teacher-module-actions">
                              <div className="teacher-module-primary-actions">
                                <button className="btn btn-outline" onClick={() => handleModuleSelect(module)} title="View Tasks">
                                  <HiListBullet /> View Tasks
                                </button>
                                <button className="btn btn-outline" onClick={() => openTaskForm(module._id)} title="Add Task">
                                  <HiPlus /> Add Task
                                </button>
                              </div>

                              <div className="teacher-module-secondary-actions">
                                <button className="btn btn-outline" onClick={() => handleModuleExport(module._id, module.module_name)} title="Export Module">
                                  <HiArrowDownTray /> Export
                                </button>
                                <button className="btn btn-danger" onClick={() => handleDeleteModule(module._id)} title="Delete Module">
                                  <HiTrash /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* TASK LIST VIEW */
                <div className="teacher-course-shell">
                  <div className="view-header teacher-course-workspace-header">
                    <button className="btn btn-secondary" onClick={handleBack}>
                      ← Back to Modules
                    </button>
                    <div className="teacher-course-hero">
                      <div className="view-title-info teacher-course-title-block">
                        <h2>{selectedModule.module_name} <span className="module-order">Module #{selectedModule.module_order}</span></h2>
                        <p className="view-description">{selectedModule.description}</p>
                        <div className="teacher-course-inline-meta">
                          <span className="teacher-workspace-chip">{tasks.length} Tasks</span>
                          <span className="teacher-workspace-chip">{selectedModuleTotalPoints} Total Points</span>
                          <span className="teacher-workspace-chip">{selectedModuleAverageTime} min avg time</span>
                        </div>
                      </div>
                      <button className="btn btn-primary" onClick={() => openTaskForm(selectedModule._id, null)}>
                        <HiPlus /> Create Task
                      </button>
                    </div>

                    <div className="teacher-course-summary-grid">
                      <div className="teacher-summary-card">
                        <span className="teacher-summary-label">Tasks</span>
                        <strong>{tasks.length}</strong>
                        <p>Published coding tasks inside this module</p>
                      </div>
                      <div className="teacher-summary-card">
                        <span className="teacher-summary-label">Points</span>
                        <strong>{selectedModuleTotalPoints}</strong>
                        <p>Total points available across all tasks</p>
                      </div>
                      <div className="teacher-summary-card">
                        <span className="teacher-summary-label">Languages</span>
                        <strong>{selectedModuleLanguageCount}</strong>
                        <p>Distinct programming languages currently used</p>
                      </div>
                      <div className="teacher-summary-card">
                        <span className="teacher-summary-label">Time Profile</span>
                        <strong>{selectedModuleAverageTime}m</strong>
                        <p>Average suggested time limit for completion</p>
                      </div>
                    </div>
                  </div>

                  <div className="modules-section">
                    <div className="teacher-section-heading">
                      <div>
                        <h3>Tasks</h3>
                        <p>Review, edit, and maintain the coding challenges for this module.</p>
                      </div>
                    </div>
                    {loadingTasks ? <p>Loading tasks...</p> : (
                      <div className="teacher-task-grid">
                        {tasks.length === 0 ? <p className="no-modules">No tasks in this module.</p> : tasks.map(task => (
                          <div key={task._id} className="teacher-task-card">
                            <div className="teacher-task-top">
                              <div>
                                <h4>{task.task_name}</h4>
                                <p className="teacher-task-problem">{task.problem_statement}</p>
                              </div>
                              <span className={`teacher-task-difficulty ${task.difficulty?.toLowerCase()}`}>
                                {task.difficulty}
                              </span>
                            </div>

                            <div className="teacher-task-meta">
                              <span className="teacher-workspace-chip">Lang: {task.language}</span>
                              <span className="teacher-workspace-chip">Time: {task.time_limit}m</span>
                              <span className="teacher-workspace-chip">Tests: {task.test_cases_count}</span>
                              <span className="teacher-workspace-chip">{task.points || 0} pts</span>
                            </div>

                            {task.constraints && (
                              <p className="teacher-task-constraints">
                                <strong>Constraints:</strong> {task.constraints}
                              </p>
                            )}

                            <div className="teacher-task-actions">
                              <button
                                className="btn btn-outline"
                                onClick={() => openTaskForm(task.module_id, task)}
                                title="Edit Task"
                                style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
                              >
                                Edit Task
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteTask(task._id, task.module_id)}
                                title="Delete Task"
                              >
                                <HiTrash /> Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </main>

      {showCourseForm && (
        <CreateCourseForm
          onClose={() => setShowCourseForm(false)}
          onCourseCreated={handleCourseCreated}
        />
      )}

      {showModuleForm && selectedCourse && (
        <CreateModuleForm
          onClose={() => setShowModuleForm(false)}
          onModuleCreated={handleModuleCreated}
          courseId={selectedCourse._id}
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

      {/* STUDENTS POPUP MODAL */}
      {viewingStudents && selectedCourse && (
        <div className="modal-overlay" onClick={() => { setViewingStudents(false); setStudents([]); }}>
          <div className="modal-content course-students-modal" onClick={(e) => e.stopPropagation()}>
            <div className="students-modal-header">
              <div className="students-modal-title">
                <h2>{selectedCourse.course_name}</h2>
                <p>Enrolled Students ({students.length})</p>
              </div>
              <div className="students-modal-actions">
                <button className="btn btn-primary" onClick={() => setShowAddStudentsModal(true)}>
                  <HiPlus /> Add Students
                </button>
                <button className="btn btn-secondary" onClick={() => { setViewingStudents(false); setStudents([]); }}>
                  Close
                </button>
              </div>
            </div>

            <div className="students-modal-body">
              {loadingStudents ? <p className="students-modal-loading">Loading students...</p> : (
                students.length === 0 ? (
                  <p className="no-modules">No students enrolled yet.</p>
                ) : (
                  <div className="students-list">
                    {students.map(student => (
                      <div key={student._id} className="student-row" data-status={student.status?.toLowerCase()}>
                        <div className="student-main">
                          <span className="student-name">{student.name}</span>
                          <span className="student-email">{student.email}</span>
                          <span className="student-enrollment">{student.enrollment_number || 'N/A'}</span>
                        </div>
                        <div className="student-actions">
                          <span className={`student-status-chip ${student.status?.toLowerCase()}`}>
                            {student.status}
                          </span>
                          {student.status === 'PENDING' && (
                            <>
                              <button
                                className="btn btn-primary"
                                onClick={() => handleEnrollmentStatus(student.enrollment_id, 'ACTIVE')}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleEnrollmentStatus(student.enrollment_id, 'REJECTED')}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

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

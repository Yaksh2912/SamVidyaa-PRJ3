import React from 'react'
import API_BASE_URL from '../config'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import { useNavigate } from 'react-router-dom'
import { HiUsers, HiBookOpen, HiDocumentText, HiChartBar, HiFolderPlus, HiArrowDownTray, HiTrash, HiPlus, HiListBullet, HiUserGroup, HiPaperClip, HiGift } from 'react-icons/hi2'
import { FiSun, FiMoon } from 'react-icons/fi'
import CreateModuleForm from '../components/CreateModuleForm'
import CreateCourseForm from '../components/CreateCourseForm'
import CreateTaskForm from '../components/CreateTaskForm'
import AddStudentsModal from '../components/AddStudentsModal'
import ManageRewardsModal from '../components/ManageRewardsModal'
import './Dashboard.css'

function TeacherDashboard() {
  const { theme } = useTheme()
  const { translations, language, changeLanguage } = useI18n()
  const { toggleTheme, isDark } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [showModuleForm, setShowModuleForm] = React.useState(false)
  const [showCourseForm, setShowCourseForm] = React.useState(false)
  const [showTaskForm, setShowTaskForm] = React.useState(false) // For creating task

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

  const handleTaskCreated = (newTask) => {
    // If viewing the specific module, update task list
    if (selectedModule && selectedModule._id === newTask.module_id) {
      setTasks([...tasks, newTask]);
    }

    // Update the module's task count in the module list
    setModules(modules.map(m =>
      m._id === newTask.module_id
        ? { ...m, tasks_per_module: (m.tasks_per_module || 0) + 1 }
        : m
    ));
  }

  const openTaskForm = (moduleId) => {
    setSelectedModuleForTask(moduleId);
    setShowTaskForm(true);
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
                  <div className="courses-grid">
                    {courses.length === 0 ? <p className="no-data">No courses created yet.</p> : courses.map(course => (
                      <motion.div
                        key={course._id}
                        className="course-card"
                        whileHover={{ y: -5 }}
                        onClick={() => handleCourseSelect(course)}
                      >
                        <div className="course-header">
                          <span className="course-code">{course.course_code}</span>
                          <button className="btn-icon delete-btn" onClick={(e) => handleDeleteCourse(e, course._id)} title="Delete Course">
                            <HiTrash />
                          </button>
                        </div>
                        <h4>{course.course_name}</h4>
                        <p>{course.description}</p>
                        <div className="course-meta">
                          <span>{course.subject}</span>
                          <span>Q: {course.course_test_questions} | {course.points || 0} pts</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : !selectedModule ? (
                /* MODULE LIST VIEW */
                <div className="modules-view">
                  <div className="view-header">
                    <button className="btn btn-secondary" onClick={handleBack}>
                      ← Back to Courses
                    </button>
                    <div className="view-title-row">
                      <div className="view-title-info">
                        <h2>{selectedCourse.course_name} <span className="course-code-large">({selectedCourse.course_code})</span></h2>
                        <p style={{ color: 'var(--text-secondary)' }}>{selectedCourse.description}</p>
                      </div>
                      <div className="course-actions">
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
                  </div>

                  {/* Handout section */}
                  <div style={{
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--border-radius-sm)',
                    padding: '0.9rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    marginBottom: '1.25rem',
                    border: selectedCourse.handout_path ? '1px solid var(--accent-green, #10b981)' : '1px dashed var(--border-color)',
                  }}>
                    <HiPaperClip style={{ flexShrink: 0, color: selectedCourse.handout_path ? 'var(--accent-green, #10b981)' : 'var(--text-tertiary)' }} />
                    {selectedCourse.handout_path ? (
                      <>
                        <span style={{ flex: 1, fontWeight: 500, fontSize: '0.9rem' }}>
                          <a
                            href={`${API_BASE_URL.replace('/api', '')}/${selectedCourse.handout_path.replace(/\\/g, '/')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent-blue, #3b82f6)', textDecoration: 'underline' }}
                          >
                            {selectedCourse.handout_filename}
                          </a>
                        </span>
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem' }}
                          onClick={() => handoutInputRef.current?.click()}
                          disabled={handoutUploading}
                        >
                          {handoutUploading ? 'Uploading…' : '↑ Replace'}
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem' }}
                          onClick={handleHandoutDelete}
                        >
                          <HiTrash /> Remove
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No handout uploaded</span>
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: '0.82rem', padding: '0.3rem 0.9rem' }}
                          onClick={() => handoutInputRef.current?.click()}
                          disabled={handoutUploading}
                        >
                          <HiPaperClip /> {handoutUploading ? 'Uploading…' : 'Upload Handout (PDF)'}
                        </button>
                      </>
                    )}
                  </div>

                  <div className="modules-section">
                    <h3>Modules</h3>
                    {loadingModules ? <p>Loading modules...</p> : (
                      <div className="modules-grid">
                        {modules.length === 0 ? <p className="no-modules">No modules in this course.</p> : modules.map(module => (
                          <div key={module._id} className="module-card">
                            <div className="module-info">
                              <h4>{module.module_name} <span className="module-order">#{module.module_order}</span></h4>
                              <p>{module.description}</p>
                              <div className="module-meta">
                                <span className="file-count">{module.files.length} Files</span>
                                <span>{module.tasks_per_module} Tasks</span>
                                <span>{module.points || 0} pts</span>
                              </div>
                            </div>
                            <div className="module-actions">
                              <button className="btn btn-outline" onClick={() => handleModuleExport(module._id, module.module_name)} title="Export Module">
                                <HiArrowDownTray /> Export
                              </button>
                              <button className="btn btn-outline" onClick={() => handleModuleSelect(module)} title="View Tasks">
                                <HiListBullet /> Tasks
                              </button>
                              <button className="btn btn-outline" onClick={() => openTaskForm(module._id)} title="Add Task">
                                <HiPlus /> Add
                              </button>

                              <button className="btn btn-danger" onClick={() => handleDeleteModule(module._id)} title="Delete Module">
                                <HiTrash />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* TASK LIST VIEW */
                <div className="tasks-view">
                  <div className="view-header">
                    <button className="btn btn-secondary" onClick={handleBack}>
                      ← Back to Modules
                    </button>
                    <div className="view-title-row">
                      <div className="view-title-info">
                        <h2>{selectedModule.module_name} <span className="module-order">Module #{selectedModule.module_order}</span></h2>
                        <p style={{ color: 'var(--text-secondary)' }}>{selectedModule.description}</p>
                      </div>
                      <button className="btn btn-primary" onClick={() => openTaskForm(selectedModule._id)}>
                        <HiPlus /> Create Task
                      </button>
                    </div>
                  </div>

                  <div className="modules-section">
                    <h3>Tasks</h3>
                    {loadingTasks ? <p>Loading tasks...</p> : (
                      <div className="modules-grid">
                        {tasks.length === 0 ? <p className="no-modules">No tasks in this module.</p> : tasks.map(task => (
                          <div key={task._id} className="module-card">
                            <div className="module-info">
                              <h4>
                                {task.task_name}
                                <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                  {task.difficulty} | {task.points}pts
                                </span>
                              </h4>
                              <p>{task.problem_statement}</p>
                              <div className="module-meta">
                                <span>Lang: {task.language}</span>
                                <span>Time: {task.time_limit}m</span>
                                <span>Tests: {task.test_cases_count}</span>
                              </div>
                              {task.constraints && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                                  <strong>Constraints:</strong> {task.constraints}
                                </p>
                              )}
                            </div>
                            <div className="module-actions">
                              <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteTask(task._id, task.module_id)}
                                title="Delete Task"
                              >
                                <HiTrash />
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
          onClose={() => setShowTaskForm(false)}
          onTaskCreated={handleTaskCreated}
          moduleId={selectedModuleForTask}
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
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ marginBottom: '0.25rem' }}>{selectedCourse.course_name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Enrolled Students ({students.length})</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={() => setShowAddStudentsModal(true)} style={{ fontSize: '0.9rem', padding: '0.55rem 1.1rem' }}>
                  <HiPlus /> Add Students
                </button>
                <button className="btn btn-secondary" onClick={() => { setViewingStudents(false); setStudents([]); }} style={{ fontSize: '0.9rem', padding: '0.55rem 1.1rem' }}>
                  Close
                </button>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loadingStudents ? <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading students...</p> : (
                students.length === 0 ? (
                  <p className="no-modules">No students enrolled yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {students.map(student => (
                      <div key={student._id} style={{
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--border-radius-sm)',
                        padding: '1rem 1.25rem',
                        borderLeft: `3px solid ${student.status === 'ACTIVE' ? 'var(--accent-green)' : student.status === 'PENDING' ? '#f59e0b' : 'var(--accent-red)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{student.name}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.email}</span>
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{student.enrollment_number || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                          <span style={{
                            color: student.status === 'PENDING' ? '#f59e0b' : student.status === 'ACTIVE' ? '#10b981' : '#ef4444',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background: student.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : student.status === 'PENDING' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '980px'
                          }}>
                            {student.status}
                          </span>
                          {student.status === 'PENDING' && (
                            <>
                              <button
                                className="btn btn-primary"
                                style={{ padding: '0.25rem 0.7rem', fontSize: '0.75rem' }}
                                onClick={() => handleEnrollmentStatus(student.enrollment_id, 'ACTIVE')}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-danger"
                                style={{ padding: '0.25rem 0.7rem', fontSize: '0.75rem' }}
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

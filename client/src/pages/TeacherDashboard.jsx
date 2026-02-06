import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import { useNavigate } from 'react-router-dom'
import { HiUsers, HiBookOpen, HiDocumentText, HiChartBar, HiFolderPlus, HiArrowDownTray, HiTrash, HiPlus, HiListBullet, HiUserGroup } from 'react-icons/hi2'
import CreateModuleForm from '../components/CreateModuleForm'
import CreateCourseForm from '../components/CreateCourseForm'
import CreateTaskForm from '../components/CreateTaskForm'
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
      const response = await fetch('http://localhost:5001/api/courses/stats', {
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
      const response = await fetch('http://localhost:5001/api/courses', {
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
      const response = await fetch(`http://localhost:5001/api/modules?course_id=${courseId}`, {
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
      const response = await fetch(`http://localhost:5001/api/tasks?module_id=${moduleId}`, {
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
      const response = await fetch(`http://localhost:5001/api/enrollments/course/${courseId}`, {
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

      const response = await fetch(`http://localhost:5001/api/enrollments/${enrollmentId}`, {
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
    if (viewingStudents) {
      setViewingStudents(false);
      setStudents([]);
    } else if (selectedModule) {
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
      const response = await fetch(`http://localhost:5001/api/courses/${courseId}`, {
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
      const response = await fetch(`http://localhost:5001/api/modules/${moduleId}`, {
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

  const handleExport = async (moduleId, moduleName) => {
    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`http://localhost:5001/api/modules/${moduleId}/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${moduleName.replace(/ /g, '_')}.zip`
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        alert('Export failed')
      }
    } catch (error) {
      console.error('Export error', error)
      alert('Export failed')
    }
  }

  const handleCourseExport = async (courseId, courseName) => {
    try {
      const userStr = localStorage.getItem('user')
      const token = userStr ? JSON.parse(userStr).token : null
      const response = await fetch(`http://localhost:5001/api/courses/${courseId}/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${courseName.replace(/ /g, '_')}_COMPLETE.zip`
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

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const t = translations.dashboard.teacher

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
            <span className="user-info">{t.welcome}, {user?.name || 'Teacher'}</span>
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
            <div className="stat-icon"><HiUsers /></div>
            <div className="stat-info">
              <h3>{t.stats.totalStudents}</h3>
              <p className="stat-number">{stats.totalStudents}</p>
            </div>
          </motion.div>
          <motion.div
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="stat-icon"><HiBookOpen /></div>
            <div className="stat-info">
              <h3>{t.stats.activeClasses}</h3>
              <p className="stat-number">{stats.activeClasses}</p>
            </div>
          </motion.div>
          <motion.div
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="stat-icon"><HiDocumentText /></div>
            <div className="stat-info">
              <h3>{t.stats.pendingGrading}</h3>
              <p className="stat-number">{stats.pendingGrading}</p>
            </div>
          </motion.div>
          <motion.div
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="stat-icon"><HiChartBar /></div>
            <div className="stat-info">
              <h3>{t.stats.avgPerformance}</h3>
              <p className="stat-number">{stats.avgPerformance}</p>
            </div>
          </motion.div>
        </div>

        <div className="dashboard-sections">
          <motion.div className="section-card" whileHover={{ scale: 1.02, y: -4 }}>
            <h3>{t.sections.gradeSubmissions}</h3>
            <p>{t.sections.gradeSubmissionsDesc}</p>
            <button className="btn btn-primary">{t.sections.gradeWork}</button>
          </motion.div>
          <motion.div className="section-card" whileHover={{ scale: 1.02, y: -4 }}>
            <h3>{t.sections.studentProgress}</h3>
            <p>{t.sections.studentProgressDesc}</p>
            <button className="btn btn-primary">{t.sections.viewProgress}</button>
          </motion.div>
          <motion.div className="section-card" whileHover={{ scale: 1.02, y: -4 }}>
            <h3>{t.sections.classResources}</h3>
            <p>{t.sections.classResourcesDesc}</p>
            <button className="btn btn-primary">{t.sections.manageResources}</button>
          </motion.div>
        </div>

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
                    <span>Q: {course.course_test_questions}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : viewingStudents ? (
          /* ENROLLED STUDENTS VIEW */
          <div className="students-view">
            <div className="view-header">
              <button className="btn btn-secondary" onClick={handleBack}>
                ← Back to Modules
              </button>
              <div className="view-title-row">
                <div className="view-title-info">
                  <h2>{selectedCourse.course_name} <span className="course-code-large">Students</span></h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Enrolled Students</p>
                </div>
              </div>
            </div>
            <div className="modules-section">
              <h3>Enrolled Students ({students.length})</h3>
              {loadingStudents ? <p>Loading students...</p> : (
                <div className="modules-grid">
                  {students.length === 0 ? <p className="no-modules">No students enrolled yet.</p> : students.map(student => (
                    <div key={student._id} className="module-card">
                      <div className="module-info">
                        <h4>{student.name}</h4>
                        <p>{student.email}</p>
                        <div className="module-meta">
                          <span>ID: {student.enrollment_number || 'N/A'}</span>
                          <span style={{
                            marginLeft: '1rem',
                            color: student.status === 'PENDING' ? '#ffd700' : student.status === 'ACTIVE' ? '#51cf66' : '#ff6b6b',
                            fontWeight: 'bold'
                          }}>
                            {student.status}
                          </span>
                        </div>
                        {student.status === 'PENDING' && (
                          <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => handleEnrollmentStatus(student.enrollment_id, 'ACTIVE')}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => handleEnrollmentStatus(student.enrollment_id, 'REJECTED')}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  <button className="btn btn-outline" onClick={() => handleCourseExport(selectedCourse._id, selectedCourse.course_name)} title="Export Course">
                    <HiArrowDownTray /> Export Course
                  </button>
                  <button className="btn btn-secondary" onClick={handleViewStudents}>
                    <HiUserGroup /> Students
                  </button>
                  <button className="btn btn-primary" onClick={() => setShowModuleForm(true)}>
                    <HiFolderPlus /> Add Module
                  </button>
                </div>
              </div>
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
                        </div>
                      </div>
                      <div className="module-actions">
                        <button className="btn btn-outline" onClick={() => handleModuleSelect(module)} title="View Tasks">
                          <HiListBullet /> Tasks
                        </button>
                        <button className="btn btn-outline" onClick={() => openTaskForm(module._id)} title="Add Task">
                          <HiPlus /> Add
                        </button>
                        <button className="btn btn-outline" onClick={() => handleExport(module._id, module.module_name)}>
                          <HiArrowDownTray /> Export
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
        </motion.div>
      </main>
    </div>
  )
}

export default TeacherDashboard

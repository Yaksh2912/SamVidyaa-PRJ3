
import React, { useState, useEffect } from 'react'
import API_BASE_URL from '../config'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import { useNavigate } from 'react-router-dom'
import { HiDocumentText, HiCheckCircle, HiClock, HiStar, HiTrophy, HiBookOpen, HiPlusCircle, HiArrowDownTray, HiPaperClip, HiShoppingCart, HiGift, HiBolt, HiSparkles, HiCheckBadge, HiLightBulb, HiSwatch, HiIdentification } from 'react-icons/hi2'
import { FiSun, FiMoon } from 'react-icons/fi'
import './Dashboard.css'

function StudentDashboard() {
  const { theme } = useTheme()
  const { translations, language, changeLanguage } = useI18n()
  const { toggleTheme, isDark } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollLoading, setEnrollLoading] = useState(null); // Course ID being enrolled
  const [userPoints, setUserPoints] = useState(0);
  const [claimingReward, setClaimingReward] = useState(null);
  const [showPointShop, setShowPointShop] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseModules, setCourseModules] = useState([]);
  const [courseTasks, setCourseTasks] = useState({});
  const [expandedModule, setExpandedModule] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [rewards, setRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(true);

  // Mapping of icon names to actual components
  const MAP_ICONS = {
    'HiCheckBadge': <HiCheckBadge />,
    'HiClock': <HiClock />,
    'HiLightBulb': <HiLightBulb />,
    'HiSwatch': <HiSwatch />,
    'HiBolt': <HiBolt />,
    'HiIdentification': <HiIdentification />,
    'HiGift': <HiGift />
  };

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const fetchData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;

      if (!token) return;

      // Fetch Enrolled Courses
      const enrolledRes = await fetch(`${API_BASE_URL}/api/enrollments/student`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const enrolledData = await enrolledRes.json();
      setEnrolledCourses(enrolledData);

      // Fetch All Courses
      const coursesRes = await fetch(`${API_BASE_URL}/api/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allCourses = await coursesRes.json();

      // Calculate Available Courses (Active Courses - Enrolled Courses)
      // We only consider "Active" or "Pending" enrollments as "taking a slot". 
      // Rejected/Dropped should appear in "Available" so they can try again.
      const activeEnrollmentIds = enrolledData
        .filter(e => ['ACTIVE', 'APPROVED', 'PENDING'].includes(e.status))
        .map(e => e.course_id._id);

      const available = allCourses.filter(c => !activeEnrollmentIds.includes(c._id) && c.is_active !== false); // Assuming default active if field missing
      setAvailableCourses(available);

      // Filter Enrolled Courses to only show Active/Pending/Approved - Hide Rejected/Dropped to "archive" them essentially
      // unless we want a "History" tab later. For now, user wants them "back in available", which implies removed from here.
      setEnrolledCourses(enrolledData.filter(e => ['ACTIVE', 'APPROVED', 'PENDING'].includes(e.status)));

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/users/me/points`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUserPoints(data.points || 0);
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  const fetchRewards = async () => {
    try {
      setLoadingRewards(true);
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/rewards/student`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRewards(data);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoadingRewards(false);
    }
  };

  const handleClaimReward = async (reward) => {
    setClaimingReward(reward._id);
    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;
      const res = await fetch(`${API_BASE_URL}/api/users/claim-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rewardId: reward._id })
      });
      const data = await res.json();
      if (res.ok) {
        setUserPoints(data.points);
        alert(`🎉 ${data.message}`);
      } else {
        alert(data.message || 'Could not claim reward');
      }
    } catch (error) {
      console.error('Claim error:', error);
      alert('Something went wrong');
    } finally {
      setClaimingReward(null);
    }
  };

  const handleAddPoints = async (amount = 50) => {
    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;
      const res = await fetch(`${API_BASE_URL}/api/users/add-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok) {
        setUserPoints(data.points);
      }
    } catch (error) {
      console.error('Add points error:', error);
    }
  };

  const handleViewCourse = async (course) => {
    setSelectedCourse(course);
    setModalLoading(true);
    setCourseModules([]);
    setExpandedModule(null);
    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;
      const res = await fetch(`${API_BASE_URL}/api/modules/course/${course._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourseModules(data);
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const toggleModule = async (moduleId) => {
    if (expandedModule === moduleId) {
      setExpandedModule(null);
      return;
    }
    setExpandedModule(moduleId);
    if (!courseTasks[moduleId]) {
      try {
        const userStr = localStorage.getItem('user');
        const token = userStr ? JSON.parse(userStr).token : null;
        const res = await fetch(`${API_BASE_URL}/api/tasks?module_id=${moduleId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCourseTasks(prev => ({ ...prev, [moduleId]: data }));
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }
    }
  };

  useEffect(() => {
    fetchData();
    fetchUserPoints();
    fetchRewards();
  }, []);

  const handleHandoutDownload = async (handoutPath, filename) => {
    try {
      const url = `${API_BASE_URL}/${handoutPath.replace(/\\/g, '/')}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'handout.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error', error);
      alert('Download failed');
    }
  };

  const handleEnroll = async (courseId) => {

    setEnrollLoading(courseId);
    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;

      const response = await fetch(`${API_BASE_URL}/api/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: courseId,
          student_email: user.email
        })
      });

      if (response.ok) {
        await fetchData(); // Refresh lists
        alert("Enrolled successfully!");
      } else {
        const data = await response.json();
        alert(data.message || "Enrollment failed");
      }
    } catch (error) {
      console.error("Enrollment error:", error);
      alert("Something went wrong");
    } finally {
      setEnrollLoading(null);
    }
  };

  const t = translations.dashboard.student

  return (
    <div className="dashboard-layout" data-theme={theme}>
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <h1 className="dashboard-title">{t.title}</h1>
        </div>
        
        <nav className="sidebar-nav">
          <button className={`sidebar-link ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}>
            <HiStar className="sidebar-icon" /> Dashboard
          </button>
          <button className={`sidebar-link ${activeTab === 'My Courses' ? 'active' : ''}`} onClick={() => setActiveTab('My Courses')}>
            <HiBookOpen className="sidebar-icon" /> My Courses
          </button>
          <button className={`sidebar-link ${activeTab === 'Available Courses' ? 'active' : ''}`} onClick={() => setActiveTab('Available Courses')}>
            <HiPlusCircle className="sidebar-icon" /> Available Courses
          </button>
          <button className={`sidebar-link ${activeTab === 'Point Shop' ? 'active' : ''}`} onClick={() => setActiveTab('Point Shop')}>
            <HiShoppingCart className="sidebar-icon" /> Point Shop
          </button>
          <button className={`sidebar-link ${activeTab === 'Rankings' ? 'active' : ''}`} onClick={() => setActiveTab('Rankings')}>
            <HiTrophy className="sidebar-icon" /> Rankings
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
              <div className="profile-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'S'}</div>
              <div className="profile-text">
                <span className="profile-name">{user?.name || 'Student'}</span>
                <span className="profile-role">Student</span>
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
        {/* MAIN HEADER */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <h2 className="topbar-title">
              {activeTab === 'Dashboard' ? `Welcome Back, ${user?.name || 'Student'}` : activeTab}
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
            <div 
              className="points-badge-premium" 
              onClick={() => setActiveTab('Point Shop')} 
              title="Open Point Shop"
            >
              <HiStar className="premium-star" />
              <div className="premium-points-info">
                <span className="premium-points-value">{userPoints}</span>
                <span className="premium-points-label">Total Points</span>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE */}
        <div className="dashboard-workspace">
          {activeTab === 'Dashboard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
              <div className="workspace-panel-header">
                <h3>Quick Stats</h3>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon"><HiBookOpen /></div>
                  <div className="stat-info">
                    <h3>Enrolled Courses</h3>
                    <p className="stat-number">{enrolledCourses.filter(e => e.status === 'ACTIVE' || e.status === 'APPROVED').length}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><HiClock /></div>
                  <div className="stat-info">
                    <h3>Pending Requests</h3>
                    <p className="stat-number">{enrolledCourses.filter(e => e.status === 'PENDING').length}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><HiPlusCircle /></div>
                  <div className="stat-info">
                    <h3>Available</h3>
                    <p className="stat-number">{availableCourses.length}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><HiStar /></div>
                  <div className="stat-info">
                    <h3>Points Earned</h3>
                    <p className="stat-number">{userPoints}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'My Courses' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
              <div className="workspace-panel-header">
                <h3>My Backpack</h3>
              </div>
              {loading ? <p>Loading...</p> : enrolledCourses.length === 0 ? (
                <p className="empty-state">You are not enrolled in any courses yet.</p>
              ) : (
                <div className="modules-grid">
                  {enrolledCourses.map((enrollment) => (
                    <div key={enrollment._id} className="module-card">
                      <div className="module-info">
                        <h4>
                          {enrollment.course_id.course_name}
                          <span className={`status-badge ${enrollment.status.toLowerCase()}`}>
                            {enrollment.status}
                          </span>
                        </h4>
                        <p className="text-secondary">{enrollment.course_id.course_code}</p>
                        <p>{enrollment.course_id.description}</p>
                        <div className="module-meta">
                          <span>Instructor: {enrollment.course_id.instructor ? enrollment.course_id.instructor.name : 'Unknown'}</span>
                        </div>
                        <div className="course-card-actions">
                          <button
                            className="btn btn-primary"
                            disabled={enrollment.status !== 'ACTIVE' && enrollment.status !== 'APPROVED'}
                            onClick={() => handleViewCourse(enrollment.course_id)}
                          >
                            {enrollment.status === 'PENDING' ? 'Request Pending' : enrollment.status === 'REJECTED' ? 'Not Enrolled' : 'View Course'}
                          </button>
                          {(enrollment.status === 'ACTIVE' || enrollment.status === 'APPROVED') && enrollment.course_id.handout_path && (
                            <>
                              <a
                                className="btn btn-outline"
                                href={`${API_BASE_URL.replace('/api', '')}/${enrollment.course_id.handout_path.replace(/\\/g, '/')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <HiPaperClip /> View Handout
                              </a>
                              <button
                                className="btn btn-outline"
                                onClick={() => handleHandoutDownload(enrollment.course_id.handout_path, enrollment.course_id.handout_filename)}
                              >
                                <HiArrowDownTray /> Download
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'Available Courses' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
              <div className="workspace-panel-header">
                <h3>Course Catalog</h3>
              </div>
              {loading ? <p>Loading...</p> : availableCourses.length === 0 ? (
                <p className="empty-state">No new courses available at the moment.</p>
              ) : (
                <div className="modules-grid">
                  {availableCourses.map((course) => (
                    <div key={course._id} className="module-card available">
                      <div className="module-info">
                        <h4>{course.course_name}</h4>
                        <p className="text-secondary">{course.course_code}</p>
                        <p>{course.description}</p>
                        <div className="module-meta">
                          <span>Subject: {course.subject}</span>
                          <span>Instructor: {course.instructor ? course.instructor.name : 'Unknown'}</span>
                        </div>
                        <div className="course-card-actions">
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleEnroll(course._id)}
                            disabled={enrollLoading === course._id}
                          >
                            {enrollLoading === course._id ? 'Requesting...' : 'Request Enrollment'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'Point Shop' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel point-shop-panel">
              <div className="workspace-panel-header">
                <h3>Fun Zone Rewards</h3>
                <button className="btn btn-earn-points" onClick={() => handleAddPoints(50)}>
                  <HiBolt /> Earn 50 Points (Test)
                </button>
              </div>
              <div className="rewards-grid">
                {loadingRewards ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Loading fresh rewards...</p>
                ) : rewards.length === 0 ? (
                  <p className="empty-state">No custom rewards available. Keep an eye out for updates from your teachers!</p>
                ) : rewards.map((reward) => (
                  <motion.div
                    key={reward._id}
                    className={`reward-card ${userPoints < reward.cost ? 'locked' : 'unlocked'}`}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="reward-card-icon">{MAP_ICONS[reward.icon_name] || <HiGift />}</div>
                    <div className="reward-card-body">
                      <h4 className="reward-card-name" style={{ marginBottom: '0.15rem' }}>{reward.name}</h4>
                      {reward.course_id && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                          Course: {reward.course_id.course_name}
                        </span>
                      )}
                      <p className="reward-card-desc">{reward.description}</p>
                    </div>
                    <div className="reward-card-footer">
                      <span className="reward-cost"><HiStar /> {reward.cost} pts</span>
                      <button
                        className="btn btn-claim"
                        disabled={userPoints < reward.cost || claimingReward === reward._id}
                        onClick={() => handleClaimReward(reward)}
                      >
                        {claimingReward === reward._id ? 'Claiming...' : userPoints < reward.cost ? 'Locked' : 'Claim'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'Rankings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
              <div className="workspace-panel-header">
                <h3>{t.leaderboard?.title || "Class Rankings"}</h3>
              </div>
              <div className="ranking-list">
                {[
                  { rank: 1, name: "Alice Johnson", score: 2850, avatar: "AJ" },
                  { rank: 2, name: "Bob Smith", score: 2720, avatar: "BS" },
                  { rank: 3, name: user?.name || "Student", score: 2650, avatar: "ME", isCurrentUser: true },
                  { rank: 4, name: "David Wilson", score: 2580, avatar: "DW" },
                  { rank: 5, name: "Eva Brown", score: 2450, avatar: "EB" },
                ].map((student) => (
                  <div
                    key={student.rank}
                    className={`ranking-item ${student.isCurrentUser ? 'current-user' : ''} ${student.rank <= 3 ? 'top-3' : ''}`}
                  >
                    <div className="rank-badge">{student.rank}</div>
                    <div className="rank-avatar">{student.avatar}</div>
                    <div className="rank-info">
                      <span className="rank-name">
                        {student.isCurrentUser ? `${student.name} (${t.leaderboard?.yourRank || "You"})` : student.name}
                      </span>
                    </div>
                    <div className="rank-score">
                      {student.score} <span style={{ fontSize: '0.8em', opacity: 0.8 }}>{t.leaderboard?.points || "pts"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* NEUMORPHIC COURSE DETAILS MODAL */}
      {selectedCourse && (
        <div className="neumorphic-modal-overlay" onClick={() => setSelectedCourse(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="neumorphic-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="neumorphic-modal-header">
              <div>
                <h2>{selectedCourse.course_name}</h2>
                <p className="course-code-subtitle">
                  {selectedCourse.course_code} | <span>{selectedCourse.points || 0} Course Points</span>
                </p>
              </div>
              <button className="btn-neumorphic-close" onClick={() => setSelectedCourse(null)}>Close</button>
            </div>

            <div className="neumorphic-modal-body">
              {modalLoading ? (
                <p className="loading-text">Loading syllabus...</p>
              ) : courseModules.length === 0 ? (
                <p className="empty-state">No modules available for this course yet.</p>
              ) : (
                <div className="neumorphic-modules">
                  {courseModules.map((module) => (
                    <div key={module._id} className={`neumorphic-module-card ${expandedModule === module._id ? 'expanded' : ''}`}>
                      <div
                        className="neumorphic-module-header"
                        onClick={() => toggleModule(module._id)}
                      >
                        <div>
                          <h4>{module.module_order}. {module.module_name}</h4>
                          <p>{module.description}</p>
                        </div>
                        <div className="module-points-badge">
                          {module.points || 0} pts
                        </div>
                      </div>

                      {expandedModule === module._id && (
                        <div className="neumorphic-module-tasks">
                          <h5>Tasks ({courseTasks[module._id]?.length || 0})</h5>
                          
                          {!courseTasks[module._id] ? (
                            <p className="loading-tasks">Loading tasks...</p>
                          ) : courseTasks[module._id].length === 0 ? (
                            <p className="loading-tasks">No tasks assigned yet.</p>
                          ) : (
                            <div className="neumorphic-task-list">
                              {courseTasks[module._id].map(task => (
                                <div key={task._id} className="neumorphic-task-item">
                                  <div className="task-info">
                                    <span className="task-name">{task.task_name}</span>
                                    <span className="task-meta">
                                      <span className={`diff-${task.difficulty.toLowerCase()}`}>{task.difficulty}</span> | {task.language} | <HiClock/> {task.time_limit}m
                                    </span>
                                  </div>
                                  <div className="task-points">
                                    <HiStar /> {task.points} pts
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default StudentDashboard

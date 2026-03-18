
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
                {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
              </button>
            </div>
            <div className="points-badge" onClick={() => setShowPointShop(!showPointShop)} title="Open Point Shop">
              <HiStar className="points-badge-icon" />
              <span className="points-badge-value">{userPoints}</span>
              <span className="points-badge-label">pts</span>
            </div>
            <span className="user-info">{t.welcome}, {user?.name || 'Student'}</span>
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
              <HiBookOpen />
            </div>
            <div className="stat-info">
              <h3>Enrolled Courses</h3>
              <p className="stat-number">{enrolledCourses.filter(e => e.status === 'ACTIVE' || e.status === 'APPROVED').length}</p>
            </div>
          </motion.div>
          <motion.div
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="stat-icon">
              <HiClock />
            </div>
            <div className="stat-info">
              <h3>Pending Requests</h3>
              <p className="stat-number">{enrolledCourses.filter(e => e.status === 'PENDING').length}</p>
            </div>
          </motion.div>
          <motion.div
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="stat-icon">
              <HiPlusCircle />
            </div>
            <div className="stat-info">
              <h3>Available</h3>
              <p className="stat-number">{availableCourses.length}</p>
            </div>
          </motion.div>
        </div>

        {/* ENROLLED COURSES SECTION */}
        <div className="dashboard-section mt-4">
          <h3>My Courses</h3>
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
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
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
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem' }}
                          >
                            <HiPaperClip /> View Handout
                          </a>
                          <button
                            className="btn btn-outline"
                            onClick={() => handleHandoutDownload(enrollment.course_id.handout_path, enrollment.course_id.handout_filename)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem' }}
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
        </div>

        {/* AVAILABLE COURSES SECTION */}
        <div className="dashboard-section mt-5">
          <h3>Available Courses</h3>
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
                    <button
                      className="btn btn-secondary mt-2"
                      onClick={() => handleEnroll(course._id)}
                      disabled={enrollLoading === course._id}
                    >
                      {enrollLoading === course._id ? 'Requesting...' : 'Request Enrollment'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* POINT SHOP SECTION */}
        <motion.div
          className="dashboard-section point-shop-section mt-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="point-shop-header">
            <div className="point-shop-title-row">
              <HiShoppingCart className="point-shop-icon" />
              <h3>Point Shop</h3>
            </div>
            <div className="point-shop-balance">
              <HiStar className="balance-star" />
              <span className="balance-amount">{userPoints}</span>
              <span className="balance-label">points available</span>
            </div>
          </div>

          <div className="point-shop-earn-row">
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
                className={`reward-card ${userPoints < reward.cost ? 'locked' : ''}`}
                whileHover={{ scale: 1.03 }}
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
                    {claimingReward === reward._id ? 'Claiming...' : userPoints < reward.cost ? 'Not enough' : 'Claim'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Rankings Mock Data */}
        <motion.div
          className="rankings-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <div className="rankings-header">
            <h3>{t.leaderboard?.title || "Class Rankings"}</h3>
            <div className="stat-icon stat-icon-sm">
              <HiTrophy />
            </div>
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
      </main>

      {/* COURSE DETAILS MODAL */}
      {selectedCourse && (
        <div className="modal-overlay" onClick={() => setSelectedCourse(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '800px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                  {selectedCourse.course_name}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  {selectedCourse.course_code} | <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{selectedCourse.points || 0} Course Points</span>
                </p>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedCourse(null)}>Close</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              {modalLoading ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading syllabus...</p>
              ) : courseModules.length === 0 ? (
                <p className="empty-state">No modules available for this course yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {courseModules.map((module) => (
                    <div key={module._id} style={{
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--border-radius-md)',
                      border: '1px solid var(--border-light)',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          padding: '1.25rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: expandedModule === module._id ? 'var(--bg-secondary)' : 'transparent',
                          transition: 'background 0.2s ease'
                        }}
                        onClick={() => toggleModule(module._id)}
                      >
                        <div>
                          <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                            {module.module_order}. {module.module_name}
                          </h4>
                          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {module.description}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{
                            background: 'var(--accent-gradient-subtle)',
                            color: 'var(--accent-primary)',
                            padding: '0.3rem 0.8rem',
                            borderRadius: '980px',
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }}>
                            {module.points || 0} pts
                          </span>
                        </div>
                      </div>

                      {expandedModule === module._id && (
                        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--glass-bg)' }}>
                          <h5 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            Tasks ({courseTasks[module._id]?.length || 0})
                          </h5>
                          
                          {!courseTasks[module._id] ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading tasks...</p>
                          ) : courseTasks[module._id].length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No tasks assigned yet.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {courseTasks[module._id].map(task => (
                                <div key={task._id} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.8rem 1rem',
                                  background: 'var(--bg-primary)',
                                  borderRadius: 'var(--border-radius-sm)',
                                  border: '1px solid var(--border-light)'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div>
                                      <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)' }}>{task.task_name}</span>
                                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                        {task.difficulty} | {task.language} | {task.time_limit}m
                                      </span>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{
                                      color: '#fbbf24',
                                      fontWeight: 700,
                                      fontSize: '0.9rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}>
                                      <HiStar /> {task.points} pts
                                    </span>
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
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentDashboard

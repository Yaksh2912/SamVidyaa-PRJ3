
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import { useNavigate } from 'react-router-dom'
import { HiDocumentText, HiCheckCircle, HiClock, HiStar, HiTrophy, HiBookOpen, HiPlusCircle } from 'react-icons/hi2'
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
      const enrolledRes = await fetch('http://localhost:5001/api/enrollments/student', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const enrolledData = await enrolledRes.json();
      setEnrolledCourses(enrolledData);

      // Fetch All Courses
      const coursesRes = await fetch('http://localhost:5001/api/courses', {
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

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnroll = async (courseId) => {
    setEnrollLoading(courseId);
    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;

      const response = await fetch('http://localhost:5001/api/enrollments', {
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
                {isDark ? '☀️' : '🌙'}
              </button>
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
                    <button
                      className="btn btn-primary mt-2"
                      disabled={enrollment.status !== 'ACTIVE' && enrollment.status !== 'APPROVED'}
                    >
                      {enrollment.status === 'PENDING' ? 'Request Pending' : enrollment.status === 'REJECTED' ? 'Not Enrolled' : 'View Course'}
                    </button>
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

        {/* Restore Recent Activity & Rankings Mock Data */}
        <motion.div
          className="recent-activity mt-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <h3>{t.activity.title}</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-time">{t.activity.dueTomorrow}</span>
              <span className="activity-text">Lab 5: Data Structures</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">Due: 3 days</span>
              <span className="activity-text">Lab 6: Algorithms</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">{t.activity.graded}</span>
              <span className="activity-text">Lab 4: OOP Concepts - Grade: 90%</span>
            </div>
          </div>
        </motion.div>

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
    </div>
  )
}

export default StudentDashboard

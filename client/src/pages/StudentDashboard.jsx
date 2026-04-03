
import React, { useState, useEffect } from 'react'
import API_BASE_URL from '../config'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import { useNavigate } from 'react-router-dom'
import CompleteTaskModal from '../components/CompleteTaskModal'
import AskCollaborationModal from '../components/AskCollaborationModal'
import ChatBot from '../components/ChatBot'
import { HiDocumentText, HiCheckCircle, HiClock, HiStar, HiTrophy, HiBookOpen, HiPlusCircle, HiArrowDownTray, HiPaperClip, HiShoppingCart, HiGift, HiBolt, HiSparkles, HiCheckBadge, HiLightBulb, HiSwatch, HiIdentification, HiUserGroup, HiCheck, HiXMark } from 'react-icons/hi2'
import { FiSun, FiMoon } from 'react-icons/fi'
import './Dashboard.css'

const COURSE_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Deep Purple
  'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)', // Deep Blue
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', // Emerald
  'linear-gradient(135deg, #FF8008 0%, #FFA080 100%)', // Orange/Peach
  'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)', // Ruby Red
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'  // Night Sky
];

const getCourseGradient = (id) => {
  if (!id) return COURSE_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return COURSE_GRADIENTS[Math.abs(hash) % COURSE_GRADIENTS.length];
};

const sortModulesByOrder = (moduleList = []) => [...moduleList].sort((left, right) => {
  const orderDelta = (Number(left?.module_order) || 0) - (Number(right?.module_order) || 0);
  if (orderDelta !== 0) return orderDelta;

  const createdAtDelta = new Date(left?.createdAt || 0).getTime() - new Date(right?.createdAt || 0).getTime();
  if (createdAtDelta !== 0) return createdAtDelta;

  return (left?.module_name || '').localeCompare(right?.module_name || '');
});

const formatFileSize = (size) => {
  if (!size || Number(size) <= 0) return ''

  const units = ['B', 'KB', 'MB', 'GB'];
  const sizeValue = Number(size);
  const unitIndex = Math.min(Math.floor(Math.log(sizeValue) / Math.log(1024)), units.length - 1);
  const formattedValue = sizeValue / (1024 ** unitIndex);

  return `${formattedValue >= 10 || unitIndex === 0 ? Math.round(formattedValue) : formattedValue.toFixed(1)} ${units[unitIndex]}`;
};

const getUploadFileUrl = (filePath = '') => `${API_BASE_URL}/${filePath.replace(/\\/g, '/')}`;

function StudentDashboard() {
  const { theme } = useTheme()
  const { translations, language, changeLanguage, t: translate } = useI18n()
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
  const [activeTab, setActiveTab] = useState('dashboard');

  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState('global'); // global, weekly, class, peers
  const [selectedCourseForRanking, setSelectedCourseForRanking] = useState('');

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseModules, setCourseModules] = useState([]);
  const [courseTasks, setCourseTasks] = useState({});
  const [expandedModule, setExpandedModule] = useState(null);

  const [completingTask, setCompletingTask] = useState(null); // stores the task object to complete
  const [modalLoading, setModalLoading] = useState(false);

  const [rewards, setRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(true);

  // Collaboration State
  const [collaborations, setCollaborations] = useState({ incoming: [], outgoing: [] });
  const [collabModalTask, setCollabModalTask] = useState(null);

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
        .filter(e => e.course_id && ['ACTIVE', 'APPROVED', 'PENDING'].includes(e.status))
        .map(e => e.course_id._id);

      const available = allCourses.filter(c => !activeEnrollmentIds.includes(c._id) && c.is_active !== false); // Assuming default active if field missing
      setAvailableCourses(available);

      // Filter Enrolled Courses to only show Active/Pending/Approved - Hide Rejected/Dropped to "archive" them essentially
      // unless we want a "History" tab later. For now, user wants them "back in available", which implies removed from here.
      setEnrolledCourses(enrolledData.filter(e => e.course_id && ['ACTIVE', 'APPROVED', 'PENDING'].includes(e.status)));

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborations = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/collaborations/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCollaborations(data);
      }
    } catch (error) {
      console.error('Error fetching collaborations:', error);
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
        await fetchRewards(); // Update locked/unlocked states
        alert(t.pointShop.claimSuccess);
      } else {
        alert(data.message || translations.dashboard.student.pointShop.claimFailed);
      }
    } catch (error) {
      console.error('Claim reward error:', error);
      alert(translations.dashboard.student.pointShop.claimError);
    } finally {
      setClaimingReward(null);
    }
  };

  const handleTaskCompleteSuccess = (taskId, newPointsTotal) => {
    setUserPoints(newPointsTotal);
    // You can also mark the task as "done" locally in courseTasks if desired
    // For now, simple visual alert is enough since there is no persistent 'completed' flag on tasks locally yet
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;
      if (!token) return;

      let endpoint = `/api/leaderboard/${leaderboardType}`;
      if (leaderboardType === 'class') {
        if (!selectedCourseForRanking) {
          setLeaderboardData([]);
          setLoadingLeaderboard(false);
          return;
        }
        endpoint += `/${selectedCourseForRanking}`;
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaderboardData(data);
      } else {
        setLeaderboardData([]);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboardData([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'rankings') {
      fetchLeaderboard();
    }
  }, [activeTab, leaderboardType, selectedCourseForRanking]);

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

  const handleRespondCollab = async (collabId, status) => {
    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;
      const res = await fetch(`${API_BASE_URL}/api/collaborations/${collabId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchCollaborations(); // Refresh list
      } else {
        const data = await res.json();
        alert(data.message || translations.dashboard.student.collaboration.updateFailed);
      }
    } catch (error) {
      console.error('Respond collab error:', error);
    }
  };

  const handleViewCourse = async (course) => {
    setSelectedCourse(course);
    setModalLoading(true);
    setCourseModules([]);
    setCourseTasks({});
    setExpandedModule(null);
    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;
      const res = await fetch(`${API_BASE_URL}/api/modules/course/${course._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourseModules(sortModulesByOrder(data));
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
    fetchCollaborations();
  }, []);

  const handleHandoutDownload = async (handoutPath, filename) => {
    try {
      const url = `${API_BASE_URL}/${handoutPath.replace(/\\/g, '/')}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(translations.dashboard.student.courseModal.downloadFailed);
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
      alert(translations.dashboard.student.courseModal.downloadFailed);
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
        alert(translations.dashboard.student.availableCourses.enrollSuccess);
      } else {
        const data = await response.json();
        alert(data.message || translations.dashboard.student.availableCourses.enrollFailed);
      }
    } catch (error) {
      console.error("Enrollment error:", error);
      alert(translations.common.errors.somethingWentWrong);
    } finally {
      setEnrollLoading(null);
    }
  };

  const t = translations.dashboard.student
  const common = translations.common
  const tabTitles = {
    dashboard: t.tabs.dashboard,
    myCourses: t.tabs.myCourses,
    availableCourses: t.tabs.availableCourses,
    pointShop: t.tabs.pointShop,
    rankings: t.tabs.rankings
  }
  const getEnrollmentStatusLabel = (status) => {
    if (status === 'PENDING') return t.courses.requestPending
    if (status === 'REJECTED') return t.courses.notEnrolled
    return t.courses.active
  }
  const getDifficultyLabel = (difficulty) => translations.forms.task.difficulties[difficulty] || difficulty

  return (
    <div className="dashboard-layout" data-theme={theme}>
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <h1 className="dashboard-title">{t.title}</h1>
        </div>
        
        <nav className="sidebar-nav">
          <button className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <HiStar className="sidebar-icon" /> {t.tabs.dashboard}
          </button>
          <button className={`sidebar-link ${activeTab === 'myCourses' ? 'active' : ''}`} onClick={() => setActiveTab('myCourses')}>
            <HiBookOpen className="sidebar-icon" /> {t.tabs.myCourses}
          </button>
          <button className={`sidebar-link ${activeTab === 'availableCourses' ? 'active' : ''}`} onClick={() => setActiveTab('availableCourses')}>
            <HiPlusCircle className="sidebar-icon" /> {t.tabs.availableCourses}
          </button>
          <button className={`sidebar-link ${activeTab === 'pointShop' ? 'active' : ''}`} onClick={() => setActiveTab('pointShop')}>
            <HiShoppingCart className="sidebar-icon" /> {t.tabs.pointShop}
          </button>
          <button className={`sidebar-link ${activeTab === 'rankings' ? 'active' : ''}`} onClick={() => setActiveTab('rankings')}>
            <HiTrophy className="sidebar-icon" /> {t.tabs.rankings}
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="profile-info">
              <div className="profile-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'S'}</div>
              <div className="profile-text">
                <span className="profile-name">{user?.name || translations.auth.roles.student}</span>
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
        {/* MAIN HEADER */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <h2 className="topbar-title">
              {activeTab === 'dashboard'
                ? translate('dashboard.student.topbar.welcomeBack', { name: user?.name || translations.auth.roles.student })
                : tabTitles[activeTab]}
            </h2>
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
            <div 
              className="points-badge-premium" 
              onClick={() => setActiveTab('pointShop')} 
              title={t.topbar.openPointShop}
            >
              <HiStar className="premium-star" />
              <div className="premium-points-info">
                <span className="premium-points-value">{userPoints}</span>
                <span className="premium-points-label">{t.topbar.totalPoints}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout topbar-action-mobile" title={t.logout}>
              <HiArrowDownTray style={{ transform: 'rotate(-90deg)', fontSize: '1.4rem' }} />
            </button>
          </div>
        </header>

        {/* WORKSPACE */}
        <div className="dashboard-workspace">
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
              <div className="workspace-panel-header">
                <h3>{t.stats.quickStats}</h3>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon"><HiBookOpen /></div>
                  <div className="stat-info">
                    <h3>{t.stats.enrolledCourses}</h3>
                    <p className="stat-number">{enrolledCourses.filter(e => e.status === 'ACTIVE' || e.status === 'APPROVED').length}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><HiClock /></div>
                  <div className="stat-info">
                    <h3>{t.stats.pendingRequests}</h3>
                    <p className="stat-number">{enrolledCourses.filter(e => e.status === 'PENDING').length}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><HiPlusCircle /></div>
                  <div className="stat-info">
                    <h3>{t.stats.available}</h3>
                    <p className="stat-number">{availableCourses.length}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><HiStar /></div>
                  <div className="stat-info">
                    <h3>{t.stats.pointsEarned}</h3>
                    <p className="stat-number">{userPoints}</p>
                  </div>
                </div>
              </div>

              {collaborations.incoming.length > 0 && (
                <div className="collabs-section" style={{ marginTop: '2rem' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>{t.collaboration.pendingRequests}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {collaborations.incoming.map(req => (
                      <div key={req._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--accent-primary)' }}>
                        <div>
                          {translate('dashboard.student.collaboration.requestMessage', {
                            name: req.requester.name,
                            task: req.task_id.task_name,
                            course: req.course_id.course_name
                          })}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                            onClick={() => handleRespondCollab(req._id, 'ACCEPTED')}
                          >
                            <HiCheck style={{ marginRight: '4px' }}/> {t.collaboration.accept}
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                            onClick={() => handleRespondCollab(req._id, 'REJECTED')}
                          >
                            <HiXMark style={{ marginRight: '4px' }}/> {t.collaboration.decline}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'myCourses' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
              <div className="workspace-panel-header">
                <h3>{t.courses.title}</h3>
              </div>
              {loading ? <p>{t.courses.loading}</p> : enrolledCourses.length === 0 ? (
                <p className="empty-state">{t.courses.empty}</p>
              ) : (
                <div className="gc-course-grid">
                  {enrolledCourses.map((enrollment) => {
                    const course = enrollment.course_id;
                    const instructorName = course.instructor ? course.instructor.name : common.unknownInstructor;
                    const initial = instructorName.charAt(0).toUpperCase();

                    return (
                      <div 
                        key={enrollment._id} 
                        className="gc-course-card"
                        onClick={() => {
                          if (enrollment.status === 'ACTIVE' || enrollment.status === 'APPROVED') {
                            handleViewCourse(course);
                          }
                        }}
                      >
                        <div className="gc-card-header" style={{ background: getCourseGradient(course._id) }}>
                          <h3 title={course.course_name}>{course.course_name}</h3>
                          <p className="gc-course-teacher">{instructorName} • {course.course_code}</p>
                        </div>
                        <div className="gc-card-avatar">{initial}</div>
                        
                        <div className="gc-card-body">
                           <p className="gc-course-desc">{course.description || common.noDescription}</p>
                           <span className={`status-badge ${enrollment.status.toLowerCase()}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                             {getEnrollmentStatusLabel(enrollment.status)}
                           </span>
                        </div>

                        <div className="gc-card-footer">
                          {(enrollment.status === 'ACTIVE' || enrollment.status === 'APPROVED') && course.handout_path && (
                            <button
                              className="btn-icon"
                              title={t.courses.downloadHandout}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHandoutDownload(course.handout_path, course.handout_filename);
                              }}
                            >
                              <HiArrowDownTray size={20} />
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            title={t.courses.openCourse}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (enrollment.status === 'ACTIVE' || enrollment.status === 'APPROVED') handleViewCourse(course);
                            }}
                          >
                            <HiBookOpen size={22} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'availableCourses' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
              <div className="workspace-panel-header">
                <h3>{t.availableCourses.title}</h3>
              </div>
              {loading ? <p>{t.availableCourses.loading}</p> : availableCourses.length === 0 ? (
                <p className="empty-state">{t.availableCourses.empty}</p>
              ) : (
                <div className="gc-course-grid">
                  {availableCourses.map((course) => {
                    const instructorName = course.instructor ? course.instructor.name : common.unknownInstructor;
                    const initial = instructorName.charAt(0).toUpperCase();

                    return (
                      <div key={course._id} className="gc-course-card" style={{ filter: 'grayscale(0.15)' }}>
                        <div className="gc-card-header" style={{ background: getCourseGradient(course._id) }}>
                          <h3 title={course.course_name}>{course.course_name}</h3>
                          <p className="gc-course-teacher">{instructorName} • {course.course_code}</p>
                        </div>
                        <div className="gc-card-avatar">{initial}</div>
                        
                        <div className="gc-card-body">
                           <p className="gc-course-desc">{course.description || common.noDescription}</p>
                           <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                             {translate('dashboard.student.availableCourses.subject', { subject: course.subject })}
                           </span>
                        </div>

                        <div className="gc-card-footer" style={{ borderTop: 'none', paddingBottom: '1.25rem' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ width: '100%' }}
                            onClick={() => handleEnroll(course._id)}
                            disabled={enrollLoading === course._id}
                          >
                            <HiPlusCircle style={{ marginRight: '0.4rem', marginBottom: '-2px' }}/> 
                            {enrollLoading === course._id ? t.availableCourses.requesting : t.availableCourses.requestEnrollment}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'pointShop' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel point-shop-panel">
              <div className="workspace-panel-header">
                <h3>{t.pointShop.title}</h3>
                <button className="btn btn-earn-points" onClick={() => handleAddPoints(50)}>
                  <HiBolt /> {t.pointShop.earnTestPoints}
                </button>
              </div>
              <div className="rewards-grid">
                {loadingRewards ? (
                  <p style={{ color: 'var(--text-secondary)' }}>{t.pointShop.loading}</p>
                ) : rewards.length === 0 ? (
                  <p className="empty-state">{t.pointShop.empty}</p>
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
                          {translate('dashboard.student.pointShop.course', { course: reward.course_id.course_name })}
                        </span>
                      )}
                      <p className="reward-card-desc">{reward.description}</p>
                    </div>
                    <div className="reward-card-footer">
                      <span className="reward-cost"><HiStar /> {translate('dashboard.student.pointShop.cost', { points: reward.cost })}</span>
                      <button
                        className="btn btn-claim"
                        disabled={userPoints < reward.cost || claimingReward === reward._id}
                        onClick={() => handleClaimReward(reward)}
                      >
                        {claimingReward === reward._id ? t.pointShop.claiming : userPoints < reward.cost ? t.pointShop.locked : t.pointShop.claim}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'rankings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
              <div className="workspace-panel-header">
                <h3>{t.leaderboard.title}</h3>
              </div>
              
              <div className="leaderboard-controls" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <select 
                  className="language-selector" 
                  value={leaderboardType}
                  onChange={(e) => setLeaderboardType(e.target.value)}
                  style={{ width: 'auto', padding: '0.5rem 1rem' }}
                >
                  <option value="global">{t.leaderboard.options.global}</option>
                  <option value="weekly">{t.leaderboard.options.weekly}</option>
                  <option value="class">{t.leaderboard.options.class}</option>
                  <option value="peers">{t.leaderboard.options.peers}</option>
                </select>

                {leaderboardType === 'class' && (
                  <select 
                    className="language-selector"
                    value={selectedCourseForRanking}
                    onChange={(e) => setSelectedCourseForRanking(e.target.value)}
                    style={{ width: 'auto', padding: '0.5rem 1rem' }}
                  >
                    <option value="">{t.leaderboard.selectClass}</option>
                    {enrolledCourses.filter(e => e.status === 'ACTIVE' || e.status === 'APPROVED').map(enc => (
                      <option key={enc.course_id._id} value={enc.course_id._id}>
                        {enc.course_id.course_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="ranking-list">
                {loadingLeaderboard ? (
                  <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{t.leaderboard.loading}</p>
                ) : leaderboardType === 'class' && !selectedCourseForRanking ? (
                  <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{t.leaderboard.selectClassPrompt}</p>
                ) : leaderboardData.length === 0 ? (
                  <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{t.leaderboard.empty}</p>
                ) : (
                  leaderboardData.map((student, index) => {
                    const isCurrentUser = student._id === user?._id || student.isCurrentUser;
                    // If it's a peer leaderboard, the exact rank number might be tricky without full data, 
                    // so we just show listing rank, OR pass the absolute rank from backend.
                    const displayRank = index + 1;
                    return (
                      <div
                        key={student._id || index}
                        className={`ranking-item ${isCurrentUser ? 'current-user' : ''} ${displayRank <= 3 && leaderboardType !== 'peers' ? 'top-3' : ''}`}
                      >
                        <div className="rank-badge">{displayRank}</div>
                        <div className="rank-avatar">{(student.name || 'S').charAt(0).toUpperCase()}</div>
                        <div className="rank-info">
                          <span className="rank-name">
                            {isCurrentUser ? `${student.name} (${t.leaderboard.yourRank})` : student.name}
                          </span>
                        </div>
                        <div className="rank-score">
                          {student.points || 0} <span style={{ fontSize: '0.8em', opacity: 0.8 }}>{t.leaderboard.points}</span>
                        </div>
                      </div>
                    );
                  })
                )}
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
              <div className="course-modal-intro">
                <div>
                  <h2>{selectedCourse.course_name}</h2>
                  <p className="course-code-subtitle">
                    {selectedCourse.course_code} | <span>{translate('dashboard.student.courseModal.coursePoints', { points: selectedCourse.points || 0 })}</span>
                  </p>
                </div>
                <div className="course-modal-summary">
                  {selectedCourse.subject && (
                    <span className="course-modal-chip">{selectedCourse.subject}</span>
                  )}
                  <span className="course-modal-chip">{translate('dashboard.student.courseModal.moduleCount', { count: courseModules.length })}</span>
                  {selectedCourse.handout_path && (
                    <button
                      type="button"
                      className="course-modal-chip course-modal-chip-action"
                      onClick={() => handleHandoutDownload(selectedCourse.handout_path, selectedCourse.handout_filename)}
                    >
                      <HiArrowDownTray /> {t.courseModal.handout}
                    </button>
                  )}
                </div>
                {selectedCourse.description && (
                  <p className="course-modal-description">{selectedCourse.description}</p>
                )}
              </div>
              <button type="button" className="btn-neumorphic-close" onClick={() => setSelectedCourse(null)}>{t.courseModal.close}</button>
            </div>

            <div className="neumorphic-modal-body">
              {modalLoading ? (
                <p className="loading-text">{t.courseModal.syllabusLoading}</p>
              ) : courseModules.length === 0 ? (
                <p className="empty-state">{t.courseModal.empty}</p>
              ) : (
                <div className="neumorphic-modules">
                  {courseModules.map((module, index) => (
                    <div key={module._id} className={`neumorphic-module-card ${expandedModule === module._id ? 'expanded' : ''}`}>
                      <div
                        className="neumorphic-module-header"
                        onClick={() => toggleModule(module._id)}
                      >
                        <div className="neumorphic-module-copy">
                          <h4>{index + 1}. {module.module_name}</h4>
                          <p>{module.description}</p>
                        </div>
                        <div className="neumorphic-module-meta">
                          <span className="module-order-chip">{translate('dashboard.student.courseModal.moduleLabel', { order: index + 1 })}</span>
                          <div className="module-points-badge">
                            {translate('dashboard.student.pointShop.cost', { points: module.points || 0 })}
                          </div>
                        </div>
                      </div>

                      {expandedModule === module._id && (
                        <div className="neumorphic-module-tasks">
                          {module.files?.length > 0 && (
                            <div className="module-resource-list module-resource-list--student">
                              <div className="module-resource-list__heading">
                                <h5>{translate('dashboard.student.courseModal.resourcesTitle', { count: module.files.length })}</h5>
                              </div>
                              {module.files.map((file, index) => (
                                <div key={`${file.path}-${index}`} className="module-resource-item">
                                  <div className="module-resource-item__copy">
                                    <span className="module-resource-item__icon">
                                      <HiPaperClip />
                                    </span>
                                    <div>
                                      <strong>{file.name}</strong>
                                      <span>{formatFileSize(file.size) || file.mimetype || t.courseModal.handout}</span>
                                    </div>
                                  </div>
                                  <div className="module-resource-item__actions">
                                    <a
                                      className="btn btn-outline"
                                      href={getUploadFileUrl(file.path)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <HiArrowDownTray /> {t.courseModal.openResource}
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <h5>{translate('dashboard.student.courseModal.taskCount', { count: courseTasks[module._id]?.length || 0 })}</h5>
                          
                          {!courseTasks[module._id] ? (
                            <p className="loading-tasks">{t.courseModal.loadingTasks}</p>
                          ) : courseTasks[module._id].length === 0 ? (
                            <p className="loading-tasks">{t.courseModal.noTasks}</p>
                          ) : (
                            <div className="neumorphic-task-list">
                              {courseTasks[module._id].map(task => (
                                <div key={task._id} className="neumorphic-task-item">
                                  <div className="task-info">
                                    <span className="task-name">{task.task_name}</span>
                                    <span className="task-meta">
                                      <span className={`diff-${task.difficulty.toLowerCase()}`}>{getDifficultyLabel(task.difficulty)}</span> | {task.language} | <HiClock/> {task.time_limit}m
                                      {task.allow_collaboration && <span style={{ marginLeft: '10px', color: '#3b82f6', fontWeight: 600 }}>• {t.courseModal.teamworkAllowed}</span>}
                                    </span>
                                  </div>
                                  <div className="task-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div className="task-points">
                                      <HiStar /> {translate('dashboard.student.pointShop.cost', { points: task.points })}
                                    </div>
                                    {task.allow_collaboration && (
                                      <button 
                                        type="button"
                                        className="btn btn-outline"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderColor: '#3b82f6', color: '#3b82f6' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          setCollabModalTask(task);
                                        }}
                                      >
                                        <HiUserGroup /> {t.courseModal.askForCollaboration}
                                      </button>
                                    )}
                                    <button 
                                      type="button"
                                      className="btn btn-primary task-complete-btn"
                                      onClick={() => setCompletingTask(task)}
                                    >
                                      <HiCheckCircle /> {t.courseModal.complete}
                                    </button>
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

      {completingTask && selectedCourse && (
        <CompleteTaskModal
          task={completingTask}
          courseId={selectedCourse._id}
          onClose={() => setCompletingTask(null)}
          onComplete={handleTaskCompleteSuccess}
        />
      )}

      {collabModalTask && selectedCourse && (
        <AskCollaborationModal 
          task={collabModalTask}
          courseId={selectedCourse._id}
          onClose={() => setCollabModalTask(null)}
        />
      )}

      {/* RAG Chatbot Widget */}
      <ChatBot />
    </div>
  )
}

export default StudentDashboard

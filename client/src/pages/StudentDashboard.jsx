
import React, { useState, useEffect, useRef } from 'react'
import API_BASE_URL from '../config'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import { useNavigate } from 'react-router-dom'
import CompleteTaskModal from '../components/CompleteTaskModal'
import AskCollaborationModal from '../components/AskCollaborationModal'
import ChatBot from '../components/ChatBot'
import StudentDashboardWorkspace from '../components/dashboard/student/StudentDashboardWorkspace'
import StudentCourseModal from '../components/dashboard/student/StudentCourseModal'
import {
  CourseGridSkeleton,
  LeaderboardSkeleton,
  RewardGridSkeleton,
  StudentHistorySkeleton,
  useDelayedLoading
} from '../components/ui/Skeleton'
import { HiDocumentText, HiCheckCircle, HiClock, HiStar, HiTrophy, HiBookOpen, HiPlusCircle, HiArrowDownTray, HiPaperClip, HiShoppingCart, HiGift, HiBolt, HiSparkles, HiCheckBadge, HiLightBulb, HiSwatch, HiIdentification, HiUserGroup, HiCheck, HiXMark, HiBellAlert, HiArrowTopRightOnSquare, HiArrowTrendingUp, HiArrowTrendingDown, HiExclamationTriangle, HiFire, HiChartBar, HiCalendarDays } from 'react-icons/hi2'
import { FiSun, FiMoon } from 'react-icons/fi'
import { applyAnnouncementEvent, normalizeAnnouncementList, subscribeToAnnouncementStream } from '../utils/announcementRealtime'
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

const STUDENT_DASHBOARD_STATE_KEY = 'student_dashboard_state';
const STUDENT_ANNOUNCEMENT_POPUP_MS = 8000;
const STUDENT_ANALYTICS_STREAK_DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_ENROLLMENT_STATUSES = ['ACTIVE', 'APPROVED'];

const getTaskDeadlinePassed = (task) => Boolean(
  (task?.has_deadline ?? Boolean(task?.deadline_at)) &&
  task?.deadline_at &&
  new Date(task.deadline_at).getTime() < Date.now()
)

const getCalendarDayTimestamp = (value) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  parsed.setHours(0, 0, 0, 0)
  return parsed.getTime()
}

const getCurrentStreak = (entries = []) => {
  const uniqueDayTimestamps = [...new Set(
    entries
      .map((entry) => getCalendarDayTimestamp(entry?.completed_at))
      .filter((dayTimestamp) => dayTimestamp !== null)
  )].sort((left, right) => right - left)

  if (uniqueDayTimestamps.length === 0) return 0

  const todayTimestamp = getCalendarDayTimestamp(new Date())
  const yesterdayTimestamp = todayTimestamp - STUDENT_ANALYTICS_STREAK_DAY_MS
  let expectedTimestamp = null

  if (uniqueDayTimestamps[0] === todayTimestamp) {
    expectedTimestamp = todayTimestamp
  } else if (uniqueDayTimestamps[0] === yesterdayTimestamp) {
    expectedTimestamp = yesterdayTimestamp
  } else {
    return 0
  }

  let streak = 0
  for (const dayTimestamp of uniqueDayTimestamps) {
    if (dayTimestamp !== expectedTimestamp) break
    streak += 1
    expectedTimestamp -= STUDENT_ANALYTICS_STREAK_DAY_MS
  }

  return streak
}

const getDaysUntilDeadline = (deadlineAt) => {
  const deadlineTime = new Date(deadlineAt).getTime()
  if (Number.isNaN(deadlineTime)) return null
  return Math.ceil((deadlineTime - Date.now()) / STUDENT_ANALYTICS_STREAK_DAY_MS)
}

const buildStudentAnalyticsSnapshot = ({ activeEnrollments = [], courseSnapshots = [], taskHistory = [] }) => {
  const activeCourseIds = new Set(activeEnrollments.map((enrollment) => enrollment?.course_id?._id).filter(Boolean))
  const scopedHistory = activeCourseIds.size
    ? taskHistory.filter((entry) => activeCourseIds.has(entry?.course_id?._id || entry?.course_id))
    : taskHistory

  const historyByCourseId = new Map()
  const languageStats = new Map()
  const completedDifficultyStats = new Map()
  const pendingDifficultyStats = new Map()
  const upcomingDeadlines = []

  scopedHistory.forEach((entry) => {
    const courseId = entry?.course_id?._id || entry?.course_id
    const language = entry?.task_id?.language || entry?.task_language || 'Unknown'
    const difficulty = entry?.task_id?.difficulty || entry?.task_difficulty || 'MEDIUM'
    const pointsAwarded = Number(entry?.points_awarded) || 0

    if (courseId) {
      const courseBucket = historyByCourseId.get(courseId) || {
        completedTasks: 0,
        pointsEarned: 0,
      }
      courseBucket.completedTasks += 1
      courseBucket.pointsEarned += pointsAwarded
      historyByCourseId.set(courseId, courseBucket)
    }

    const languageBucket = languageStats.get(language) || {
      name: language,
      completedTasks: 0,
      pointsEarned: 0,
    }
    languageBucket.completedTasks += 1
    languageBucket.pointsEarned += pointsAwarded
    languageStats.set(language, languageBucket)

    const completedDifficultyBucket = completedDifficultyStats.get(difficulty) || {
      name: difficulty,
      completedTasks: 0,
      pointsEarned: 0,
    }
    completedDifficultyBucket.completedTasks += 1
    completedDifficultyBucket.pointsEarned += pointsAwarded
    completedDifficultyStats.set(difficulty, completedDifficultyBucket)
  })

  const courseProgress = courseSnapshots.map(({ course, modules = [] }) => {
    let pendingTasks = 0
    let overdueTasks = 0
    let dueSoonTasks = 0

    modules.forEach((module) => {
      ;(module.tasks || []).forEach((task) => {
        pendingTasks += 1

        const pendingDifficultyBucket = pendingDifficultyStats.get(task?.difficulty || 'MEDIUM') || {
          name: task?.difficulty || 'MEDIUM',
          pendingTasks: 0,
          overdueTasks: 0,
        }
        pendingDifficultyBucket.pendingTasks += 1

        const isOverdue = getTaskDeadlinePassed(task)
        if (isOverdue) {
          overdueTasks += 1
          pendingDifficultyBucket.overdueTasks += 1
        }

        const daysUntilDeadline = task?.deadline_at ? getDaysUntilDeadline(task.deadline_at) : null
        if (!isOverdue && daysUntilDeadline !== null && daysUntilDeadline <= 3) {
          dueSoonTasks += 1
        }

        pendingDifficultyStats.set(task?.difficulty || 'MEDIUM', pendingDifficultyBucket)

        if (task?.deadline_at) {
          const deadlineTime = new Date(task.deadline_at).getTime()
          if (!Number.isNaN(deadlineTime)) {
            upcomingDeadlines.push({
              taskId: task._id,
              taskName: task.task_name,
              courseName: course.course_name,
              moduleName: module.module_name,
              difficulty: task.difficulty,
              points: task.points,
              deadlineAt: task.deadline_at,
              deadlineTime,
              daysUntilDeadline,
              isOverdue,
            })
          }
        }
      })
    })

    const completionHistory = historyByCourseId.get(course._id) || { completedTasks: 0, pointsEarned: 0 }
    const totalTasks = completionHistory.completedTasks + pendingTasks
    const progressPercent = totalTasks ? Math.round((completionHistory.completedTasks / totalTasks) * 100) : 0

    return {
      courseId: course._id,
      courseName: course.course_name,
      courseCode: course.course_code,
      completedTasks: completionHistory.completedTasks,
      pendingTasks,
      totalTasks,
      progressPercent,
      overdueTasks,
      dueSoonTasks,
      pointsEarned: completionHistory.pointsEarned,
    }
  }).sort((left, right) => {
    if (right.progressPercent !== left.progressPercent) return right.progressPercent - left.progressPercent
    if (right.completedTasks !== left.completedTasks) return right.completedTasks - left.completedTasks
    return left.courseName.localeCompare(right.courseName)
  })

  const strongestCourse = [...courseProgress]
    .filter((course) => course.totalTasks > 0 && course.completedTasks > 0)
    .sort((left, right) => {
      if (right.progressPercent !== left.progressPercent) return right.progressPercent - left.progressPercent
      if (right.completedTasks !== left.completedTasks) return right.completedTasks - left.completedTasks
      return left.courseName.localeCompare(right.courseName)
    })[0]

  const strongestLanguage = [...languageStats.values()]
    .filter((language) => language.completedTasks > 0)
    .sort((left, right) => {
      if (right.completedTasks !== left.completedTasks) return right.completedTasks - left.completedTasks
      if (right.pointsEarned !== left.pointsEarned) return right.pointsEarned - left.pointsEarned
      return left.name.localeCompare(right.name)
    })[0]

  const strongestDifficulty = [...completedDifficultyStats.values()]
    .filter((difficulty) => difficulty.completedTasks > 0)
    .sort((left, right) => {
      if (right.completedTasks !== left.completedTasks) return right.completedTasks - left.completedTasks
      if (right.pointsEarned !== left.pointsEarned) return right.pointsEarned - left.pointsEarned
      return left.name.localeCompare(right.name)
    })[0]

  const weakCourse = [...courseProgress]
    .filter((course) => course.pendingTasks > 0)
    .sort((left, right) => {
      if (right.overdueTasks !== left.overdueTasks) return right.overdueTasks - left.overdueTasks
      if (right.pendingTasks !== left.pendingTasks) return right.pendingTasks - left.pendingTasks
      return left.progressPercent - right.progressPercent
    })[0]

  const weakDifficulty = [...pendingDifficultyStats.values()]
    .filter((difficulty) => difficulty.pendingTasks > 0)
    .sort((left, right) => {
      if (right.overdueTasks !== left.overdueTasks) return right.overdueTasks - left.overdueTasks
      if (right.pendingTasks !== left.pendingTasks) return right.pendingTasks - left.pendingTasks
      return left.name.localeCompare(right.name)
    })[0]

  const completedTasks = courseProgress.length
    ? courseProgress.reduce((sum, course) => sum + course.completedTasks, 0)
    : scopedHistory.length
  const pendingTasks = courseProgress.reduce((sum, course) => sum + course.pendingTasks, 0)
  const overdueTasks = courseProgress.reduce((sum, course) => sum + course.overdueTasks, 0)
  const dueSoonTasks = courseProgress.reduce((sum, course) => sum + course.dueSoonTasks, 0)
  const totalTrackedTasks = courseProgress.reduce((sum, course) => sum + course.totalTasks, 0)
  const pointsCollected = scopedHistory.reduce((sum, entry) => sum + (Number(entry?.points_awarded) || 0), 0)
  const overallProgress = totalTrackedTasks
    ? Math.round((completedTasks / totalTrackedTasks) * 100)
    : completedTasks > 0
      ? 100
      : 0

  return {
    overallProgress,
    completedTasks,
    pendingTasks,
    overdueTasks,
    dueSoonTasks,
    activeCourseCount: activeEnrollments.length,
    pointsCollected,
    averagePointsPerTask: completedTasks ? Math.round(pointsCollected / completedTasks) : 0,
    streakDays: getCurrentStreak(scopedHistory),
    courseProgress,
    strongAreas: [
      strongestCourse ? { type: 'course', ...strongestCourse } : null,
      strongestLanguage ? { type: 'language', ...strongestLanguage } : null,
      strongestDifficulty ? { type: 'difficulty', ...strongestDifficulty } : null,
    ].filter(Boolean),
    weakAreas: [
      weakCourse ? { type: 'course', ...weakCourse } : null,
      weakDifficulty ? { type: 'difficulty', ...weakDifficulty } : null,
      overdueTasks > 0 || dueSoonTasks > 0
        ? { type: 'deadlines', overdueTasks, dueSoonTasks }
        : null,
    ].filter(Boolean),
    upcomingDeadlines: upcomingDeadlines
      .sort((left, right) => {
        if (left.isOverdue !== right.isOverdue) return left.isOverdue ? -1 : 1
        return left.deadlineTime - right.deadlineTime
      })
      .slice(0, 5),
  }
}

function StudentDashboard() {
  const { theme } = useTheme()
  const { translations, language, changeLanguage, t: translate } = useI18n()
  const { toggleTheme, isDark } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const deadlineFormatter = new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
  const announcementDateFormatter = new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
  const historyDateFormatter = new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-US', {
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

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollLoading, setEnrollLoading] = useState(null); // Course ID being enrolled
  const [userPoints, setUserPoints] = useState(0);
  const [claimingReward, setClaimingReward] = useState(null);
  const [showPointShop, setShowPointShop] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STUDENT_DASHBOARD_STATE_KEY);
      if (!saved) return 'dashboard';
      const parsed = JSON.parse(saved);
      return parsed.activeTab || 'dashboard';
    } catch (_error) {
      return 'dashboard';
    }
  });

  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STUDENT_DASHBOARD_STATE_KEY);
      if (!saved) return 'global';
      const parsed = JSON.parse(saved);
      return parsed.leaderboardType || 'global';
    } catch (_error) {
      return 'global';
    }
  }); // global, weekly, class, peers
  const [selectedCourseForRanking, setSelectedCourseForRanking] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STUDENT_DASHBOARD_STATE_KEY);
      if (!saved) return '';
      const parsed = JSON.parse(saved);
      return parsed.selectedCourseForRanking || '';
    } catch (_error) {
      return '';
    }
  });

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
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [showAnnouncementsPopup, setShowAnnouncementsPopup] = useState(false);
  const [taskHistory, setTaskHistory] = useState([]);
  const [loadingTaskHistory, setLoadingTaskHistory] = useState(false);
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
  const [loadingDashboardAnalytics, setLoadingDashboardAnalytics] = useState(true);
  const showCourseSkeletons = useDelayedLoading(loading);
  const showHistorySkeletons = useDelayedLoading(loadingTaskHistory);
  const showRewardsSkeletons = useDelayedLoading(loadingRewards);
  const showLeaderboardSkeletons = useDelayedLoading(loadingLeaderboard);
  const restoredStudentStateRef = useRef(false);
  const announcementPopupTimerRef = useRef(null);
  const announcementDropdownRef = useRef(null);
  const announcementButtonRef = useRef(null);
  const announcementScopeKey = enrolledCourses
    .map((enrollment) => enrollment?.course_id?._id)
    .filter(Boolean)
    .sort()
    .join(',');

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

  const closeAnnouncementsPopup = () => {
    if (announcementPopupTimerRef.current) {
      window.clearTimeout(announcementPopupTimerRef.current)
      announcementPopupTimerRef.current = null
    }

    setShowAnnouncementsPopup(false)
  }

  const openAnnouncementsPopup = ({ autoClose = false } = {}) => {
    setShowAnnouncementsPopup(true)

    if (announcementPopupTimerRef.current) {
      window.clearTimeout(announcementPopupTimerRef.current)
      announcementPopupTimerRef.current = null
    }

    if (autoClose) {
      announcementPopupTimerRef.current = window.setTimeout(() => {
        setShowAnnouncementsPopup(false)
        announcementPopupTimerRef.current = null
      }, STUDENT_ANNOUNCEMENT_POPUP_MS)
    }
  }

  const getAnnouncementAuthorName = (announcement) => (
    announcement?.created_by?.name || translations.auth.roles.teacher
  )

  const getAnnouncementAvatarLabel = (announcement) => {
    const authorName = getAnnouncementAuthorName(announcement)
    return authorName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'A'
  }

  const isAnnouncementFresh = (announcement) => {
    const createdAt = new Date(announcement?.createdAt || 0).getTime()
    if (!createdAt) return false
    return Date.now() - createdAt <= 24 * 60 * 60 * 1000
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

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/announcements/student`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(normalizeAnnouncementList(data));
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const fetchTaskHistory = async () => {
    try {
      setLoadingTaskHistory(true)
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/tasks/history?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setTaskHistory(Array.isArray(data) ? data : []);
      } else {
        setTaskHistory([]);
      }
    } catch (error) {
      console.error('Error fetching task history:', error);
      setTaskHistory([]);
    } finally {
      setLoadingTaskHistory(false)
    }
  }

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
    setCourseTasks((prev) => Object.fromEntries(
      Object.entries(prev).map(([moduleId, tasks]) => [
        moduleId,
        Array.isArray(tasks) ? tasks.filter((task) => task._id !== taskId) : tasks
      ])
    ))
    fetchTaskHistory()
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

  useEffect(() => {
    sessionStorage.setItem(STUDENT_DASHBOARD_STATE_KEY, JSON.stringify({
      activeTab,
      leaderboardType,
      selectedCourseForRanking,
      selectedCourseId: selectedCourse?._id || null,
      expandedModule,
    }));
  }, [activeTab, leaderboardType, selectedCourseForRanking, selectedCourse?._id, expandedModule]);

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
    fetchAnnouncements();
    fetchTaskHistory();
  }, []);

  useEffect(() => {
    if (loading || loadingTaskHistory) return undefined

    const activeEnrollments = enrolledCourses.filter((enrollment) => ACTIVE_ENROLLMENT_STATUSES.includes(enrollment?.status))
    let ignore = false

    const fetchDashboardAnalytics = async () => {
      if (activeEnrollments.length === 0) {
        setDashboardAnalytics(buildStudentAnalyticsSnapshot({ activeEnrollments: [], courseSnapshots: [], taskHistory }))
        setLoadingDashboardAnalytics(false)
        return
      }

      setLoadingDashboardAnalytics(true)

      try {
        const userStr = localStorage.getItem('user')
        const token = userStr ? JSON.parse(userStr).token : null
        if (!token) {
          setDashboardAnalytics(buildStudentAnalyticsSnapshot({ activeEnrollments, courseSnapshots: [], taskHistory }))
          setLoadingDashboardAnalytics(false)
          return
        }

        const courseSnapshots = await Promise.all(activeEnrollments.map(async (enrollment) => {
          const course = enrollment.course_id
          const modulesResponse = await fetch(`${API_BASE_URL}/api/modules/course/${course._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })

          const modules = modulesResponse.ok
            ? sortModulesByOrder(await modulesResponse.json())
            : []

          const moduleSnapshots = await Promise.all(modules.map(async (module) => {
            const tasksResponse = await fetch(`${API_BASE_URL}/api/tasks?module_id=${module._id}&limit=100`, {
              headers: { Authorization: `Bearer ${token}` }
            })

            const tasks = tasksResponse.ok ? await tasksResponse.json() : []
            return {
              ...module,
              tasks: Array.isArray(tasks) ? tasks : [],
            }
          }))

          return {
            course,
            modules: moduleSnapshots,
          }
        }))

        if (ignore) return

        setDashboardAnalytics(buildStudentAnalyticsSnapshot({
          activeEnrollments,
          courseSnapshots,
          taskHistory,
        }))
      } catch (error) {
        console.error('Error building student analytics:', error)
        if (ignore) return

        setDashboardAnalytics(buildStudentAnalyticsSnapshot({
          activeEnrollments,
          courseSnapshots: [],
          taskHistory,
        }))
      } finally {
        if (!ignore) {
          setLoadingDashboardAnalytics(false)
        }
      }
    }

    fetchDashboardAnalytics()

    return () => {
      ignore = true
    }
  }, [loading, loadingTaskHistory, enrolledCourses, taskHistory])

  useEffect(() => () => {
    if (announcementPopupTimerRef.current) {
      window.clearTimeout(announcementPopupTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const expiryPruneInterval = window.setInterval(() => {
      setAnnouncements((prev) => normalizeAnnouncementList(prev))
    }, 30000)

    return () => {
      window.clearInterval(expiryPruneInterval)
    }
  }, [])

  useEffect(() => {
    if (!showAnnouncementsPopup || announcements.length > 0) return

    closeAnnouncementsPopup()
  }, [announcements.length, showAnnouncementsPopup])

  useEffect(() => {
    if (loadingAnnouncements || announcements.length === 0 || !user?._id) {
      return
    }

    const popupSeenKey = `student_announcement_popup_seen:${user?._id || 'unknown'}`
    if (sessionStorage.getItem(popupSeenKey) === user?.token) {
      return
    }

    sessionStorage.setItem(popupSeenKey, user?.token || '')
    openAnnouncementsPopup({ autoClose: true })
  }, [announcements.length, loadingAnnouncements, user?._id, user?.token])

  useEffect(() => {
    if (!user?.token) {
      return undefined
    }

    return subscribeToAnnouncementStream({
      token: user.token,
      onEvent: async ({ event, data }) => {
        if (event !== 'announcement' || !data?.type) {
          return
        }

        setAnnouncements((prev) => applyAnnouncementEvent(prev, data))

        if (data.type === 'created') {
          openAnnouncementsPopup({ autoClose: true })
        }
      },
      onError: (error) => {
        console.error('Announcement stream error:', error)
      },
    })
  }, [announcementScopeKey, user?.token])

  useEffect(() => {
    if (!showAnnouncementsPopup) {
      return undefined
    }

    const handlePointerDown = (event) => {
      const target = event.target
      if (announcementDropdownRef.current?.contains(target) || announcementButtonRef.current?.contains(target)) {
        return
      }

      closeAnnouncementsPopup()
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [showAnnouncementsPopup])

  useEffect(() => {
    if (restoredStudentStateRef.current || enrolledCourses.length === 0) return;

    try {
      const saved = sessionStorage.getItem(STUDENT_DASHBOARD_STATE_KEY);
      if (!saved) {
        restoredStudentStateRef.current = true;
        return;
      }

      const parsed = JSON.parse(saved);
      const savedCourseId = parsed.selectedCourseId;

      if (savedCourseId && parsed.activeTab === 'myCourses') {
        const savedEnrollment = enrolledCourses.find((enrollment) => enrollment.course_id?._id === savedCourseId);
        if (savedEnrollment?.course_id) {
          handleViewCourse(savedEnrollment.course_id);
        }
      }
    } catch (_error) {
      // Ignore invalid persisted state.
    } finally {
      restoredStudentStateRef.current = true;
    }
  }, [enrolledCourses]);

  useEffect(() => {
    if (!selectedCourse || courseModules.length === 0 || expandedModule) return;

    try {
      const saved = sessionStorage.getItem(STUDENT_DASHBOARD_STATE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      const savedExpandedModule = parsed.expandedModule;
      if (!savedExpandedModule) return;

      const moduleExists = courseModules.some((module) => module._id === savedExpandedModule);
      if (moduleExists) {
        toggleModule(savedExpandedModule);
      }
    } catch (_error) {
      // Ignore invalid persisted state.
    }
  }, [selectedCourse?._id, courseModules, expandedModule]);

  const downloadUploadedFile = async (filePath, filename, fallbackName) => {
    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;
      const url = `${API_BASE_URL}/api/files?path=${encodeURIComponent(filePath)}&download=1`;
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(translations.dashboard.student.courseModal.downloadFailed);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || fallbackName || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error', error);
      alert(translations.dashboard.student.courseModal.downloadFailed);
    }
  };

  const openUploadedFile = async (filePath) => {
    try {
      const userStr = localStorage.getItem('user');
      const token = userStr ? JSON.parse(userStr).token : null;
      const response = await fetch(`${API_BASE_URL}/api/files?path=${encodeURIComponent(filePath)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(translations.dashboard.student.courseModal.downloadFailed);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60 * 1000);
    } catch (error) {
      console.error('Open file error', error);
      alert(translations.dashboard.student.courseModal.downloadFailed);
    }
  }

  const handleHandoutDownload = async (handoutPath, filename) => {
    await downloadUploadedFile(handoutPath, filename, 'handout.pdf')
  }

  const handleResourceDownload = async (filePath, filename) => {
    await downloadUploadedFile(filePath, filename, 'resource-file')
  }

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
        await fetchAnnouncements();
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
    history: t.tabs.history,
    availableCourses: t.tabs.availableCourses,
    pointShop: t.tabs.pointShop,
    rankings: t.tabs.rankings
  }
  const activeCourseCount = enrolledCourses.filter((enrollment) => ACTIVE_ENROLLMENT_STATUSES.includes(enrollment.status)).length
  const getEnrollmentStatusLabel = (status) => {
    if (status === 'PENDING') return t.courses.requestPending
    if (status === 'REJECTED') return t.courses.notEnrolled
    return t.courses.active
  }
  const getDifficultyLabel = (difficulty) => translations.forms.task.difficulties[difficulty] || difficulty
  const historyCourseCount = new Set(taskHistory.map((entry) => entry.course_id?._id || entry.course_id || entry.course_name).filter(Boolean)).size
  const historyPointsTotal = taskHistory.reduce((sum, entry) => sum + (entry.points_awarded || 0), 0)
  const latestHistoryEntry = taskHistory[0] || null
  const analytics = dashboardAnalytics || {
    overallProgress: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    dueSoonTasks: 0,
    activeCourseCount,
    pointsCollected: 0,
    averagePointsPerTask: 0,
    streakDays: 0,
    courseProgress: [],
    strongAreas: [],
    weakAreas: [],
    upcomingDeadlines: [],
  }
  const analyticsProgressWidth = `${Math.min(100, Math.max(0, analytics.overallProgress || 0))}%`
  const studentWorkspaceProps = {
    activeTab,
    t,
    common,
    translate,
    activeCourseCount,
    enrolledCourses,
    availableCourses,
    userPoints,
    loadingDashboardAnalytics,
    analytics,
    analyticsProgressWidth,
    getDifficultyLabel,
    collaborations,
    handleRespondCollab,
    loading,
    showCourseSkeletons,
    getCourseGradient,
    getEnrollmentStatusLabel,
    handleViewCourse,
    handleHandoutDownload,
    loadingTaskHistory,
    showHistorySkeletons,
    taskHistory,
    historyPointsTotal,
    historyCourseCount,
    latestHistoryEntry,
    historyDateFormatter,
    loadingRewards,
    showRewardsSkeletons,
    rewards,
    rewardIcons: MAP_ICONS,
    handleClaimReward,
    claimingReward,
    loadingLeaderboard,
    showLeaderboardSkeletons,
    leaderboardType,
    setLeaderboardType,
    selectedCourseForRanking,
    setSelectedCourseForRanking,
    leaderboardData,
    user,
    enrollLoading,
    handleEnroll,
  }
  const studentCourseModalProps = {
    selectedCourse,
    setSelectedCourse,
    translate,
    t,
    courseModules,
    modalLoading,
    expandedModule,
    toggleModule,
    courseTasks,
    formatFileSize,
    openUploadedFile,
    handleResourceDownload,
    getDifficultyLabel,
    isTaskDeadlinePassed,
    formatTaskDeadline,
    handleHandoutDownload,
    setCollabModalTask,
    setCompletingTask,
  }

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
          <button className={`sidebar-link ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <HiDocumentText className="sidebar-icon" /> {t.tabs.history}
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
            <div className="announcement-dropdown-anchor">
              <button
                ref={announcementButtonRef}
                type="button"
                className="topbar-notification-button"
                aria-label={t.topbar.openAnnouncements}
                title={t.topbar.openAnnouncements}
                onClick={() => {
                  if (showAnnouncementsPopup) {
                    closeAnnouncementsPopup()
                    return
                  }

                  openAnnouncementsPopup()
                  fetchAnnouncements()
                }}
              >
                <HiBellAlert />
                {announcements.length ? (
                  <span className="topbar-notification-badge">{announcements.length}</span>
                ) : null}
              </button>

              {showAnnouncementsPopup ? (
                <motion.div
                  ref={announcementDropdownRef}
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="announcement-dropdown"
                >
                  <div className="announcement-dropdown__caret" />
                  <div className="announcement-dropdown__header">
                    <div>
                      <h2>{t.announcements.title}</h2>
                      <p>{t.announcements.popupSubtitle}</p>
                    </div>
                    <button
                      type="button"
                      className="announcement-dropdown__close"
                      onClick={closeAnnouncementsPopup}
                    >
                      {common.close}
                    </button>
                  </div>

                  <div className="announcement-dropdown__body">
                    {loadingAnnouncements ? (
                      <p className="empty-state">{common.loading}</p>
                    ) : announcements.length === 0 ? (
                      <p className="empty-state">{t.announcements.empty}</p>
                    ) : (
                      <div className="student-announcements-list student-announcements-list--dropdown">
                        {announcements.map((announcement) => (
                          <article key={announcement._id} className="student-announcement-card student-announcement-card--dropdown">
                            <div className="student-announcement-card__avatar">
                              {getAnnouncementAvatarLabel(announcement)}
                            </div>

                            <div className="student-announcement-card__content">
                              <div className="student-announcement-card__row">
                                <p className="student-announcement-card__summary">
                                  <strong>{getAnnouncementAuthorName(announcement)}</strong>
                                  {' '}
                                  {announcement.title}
                                </p>
                                {isAnnouncementFresh(announcement) ? (
                                  <span className="student-announcement-card__badge student-announcement-card__badge--new">
                                    {t.announcements.newBadge}
                                  </span>
                                ) : null}
                              </div>

                              <p className="student-announcement-card__body student-announcement-card__body--dropdown">
                                {announcement.message}
                              </p>

                              <div className="student-announcement-card__footer">
                                <span>
                                  {announcement.course_id?.course_name || t.announcements.generalAudience}
                                </span>
                                <span>{announcementDateFormatter.format(new Date(announcement.createdAt))}</span>
                                {announcement.expires_at ? (
                                  <span>
                                    {t.announcements.expiresOn.replace('{date}', announcementDateFormatter.format(new Date(announcement.expires_at)))}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </div>
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

        <StudentDashboardWorkspace {...studentWorkspaceProps} />
      </main>
      <StudentCourseModal {...studentCourseModalProps} />

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

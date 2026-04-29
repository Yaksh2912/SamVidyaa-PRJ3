import React from 'react'
import { motion } from 'framer-motion'
import {
  CourseGridSkeleton,
  LeaderboardSkeleton,
  RewardGridSkeleton,
  StudentHistorySkeleton,
} from '../../ui/Skeleton'
import {
  HiArrowDownTray,
  HiArrowTrendingDown,
  HiArrowTrendingUp,
  HiBookOpen,
  HiCalendarDays,
  HiChartBar,
  HiCheck,
  HiCheckCircle,
  HiClock,
  HiExclamationTriangle,
  HiFire,
  HiGift,
  HiPlusCircle,
  HiStar,
  HiTrophy,
  HiUserGroup,
  HiXMark,
} from 'react-icons/hi2'

function StudentDashboardWorkspace({
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
  rewardIcons,
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
}) {
  const leaderboardRows = Array.isArray(leaderboardData) ? leaderboardData : []
  const isClassRankingAwaitingCourse = leaderboardType === 'class' && !selectedCourseForRanking
  const selectedLeaderboardLabel = t.leaderboard.options?.[leaderboardType] || t.leaderboard.title
  const podiumRows = leaderboardType !== 'peers' ? leaderboardRows.slice(0, 3) : []
  const currentUserIndex = leaderboardRows.findIndex((student) => student._id === user?._id || student.isCurrentUser)
  const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : null
  const leaderPoints = Number(leaderboardRows[0]?.points) || 0
  const leaderboardLabels = {
    topThree: t.leaderboard.topThree || 'Top 3',
    leaderScore: t.leaderboard.leaderScore || 'Leader score',
    participants: t.leaderboard.participants || 'Participants',
  }

  return (
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
                <p className="stat-number">{activeCourseCount}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><HiClock /></div>
              <div className="stat-info">
                <h3>{t.stats.pendingRequests}</h3>
                <p className="stat-number">{enrolledCourses.filter((entry) => entry.status === 'PENDING').length}</p>
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

          <section className="student-analytics-panel">
            <div className="workspace-panel-header student-analytics-panel__header">
              <div>
                <h3>{t.analytics.title}</h3>
                <p className="student-analytics-panel__subtitle">{t.analytics.subtitle}</p>
              </div>
            </div>

            {loadingDashboardAnalytics ? (
              <p className="empty-state">{t.analytics.loading}</p>
            ) : analytics.courseProgress.length === 0 && analytics.completedTasks === 0 ? (
              <p className="empty-state">{t.analytics.empty}</p>
            ) : (
              <>
                <div className="student-analytics-overview">
                  <div className="student-analytics-hero">
                    <div className="student-analytics-hero__icon">
                      <HiChartBar />
                    </div>
                    <div className="student-analytics-hero__copy">
                      <span>{t.analytics.overview.progressLabel}</span>
                      <strong>{translate('dashboard.student.analytics.overview.progressValue', { percent: analytics.overallProgress })}</strong>
                      <p>
                        {translate('dashboard.student.analytics.overview.progressText', {
                          completed: analytics.completedTasks,
                          total: analytics.completedTasks + analytics.pendingTasks,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="student-analytics-progress-track" aria-hidden="true">
                    <span style={{ width: analyticsProgressWidth }} />
                  </div>

                  <div className="student-analytics-metric-grid">
                    <div className="student-analytics-metric-card">
                      <div className="student-analytics-metric-card__icon">
                        <HiCheckCircle />
                      </div>
                      <div>
                        <span>{t.analytics.metrics.completedTasks}</span>
                        <strong>{analytics.completedTasks}</strong>
                      </div>
                    </div>

                    <div className="student-analytics-metric-card">
                      <div className="student-analytics-metric-card__icon">
                        <HiClock />
                      </div>
                      <div>
                        <span>{t.analytics.metrics.pendingTasks}</span>
                        <strong>{analytics.pendingTasks}</strong>
                      </div>
                    </div>

                    <div className="student-analytics-metric-card">
                      <div className="student-analytics-metric-card__icon student-analytics-metric-card__icon--warning">
                        <HiExclamationTriangle />
                      </div>
                      <div>
                        <span>{t.analytics.metrics.overdueTasks}</span>
                        <strong>{analytics.overdueTasks}</strong>
                      </div>
                    </div>

                    <div className="student-analytics-metric-card">
                      <div className="student-analytics-metric-card__icon student-analytics-metric-card__icon--accent">
                        <HiFire />
                      </div>
                      <div>
                        <span>{t.analytics.metrics.streakDays}</span>
                        <strong>{translate('dashboard.student.analytics.metrics.streakValue', { count: analytics.streakDays })}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="student-analytics-grid">
                  <article className="student-analytics-card">
                    <div className="student-analytics-card__header">
                      <h4>{t.analytics.cards.strongAreas}</h4>
                      <span className="student-analytics-card__badge">
                        <HiArrowTrendingUp /> {t.analytics.labels.momentum}
                      </span>
                    </div>

                    {analytics.strongAreas.length === 0 ? (
                      <p className="student-analytics-card__empty">{t.analytics.emptyStates.strongAreas}</p>
                    ) : (
                      <div className="student-analytics-insight-list">
                        {analytics.strongAreas.map((area) => (
                          <div key={`${area.type}-${area.courseId || area.name}`} className="student-analytics-insight">
                            <div>
                              <span className="student-analytics-insight__eyebrow">
                                {area.type === 'course'
                                  ? t.analytics.strongAreaLabels.course
                                  : area.type === 'language'
                                    ? t.analytics.strongAreaLabels.language
                                    : t.analytics.strongAreaLabels.difficulty}
                              </span>
                              <strong>
                                {area.type === 'difficulty'
                                  ? getDifficultyLabel(area.name)
                                  : area.courseName || area.name}
                              </strong>
                              <p>
                                {area.type === 'course'
                                  ? translate('dashboard.student.analytics.strongAreaMeta.course', {
                                    completed: area.completedTasks,
                                    total: area.totalTasks,
                                  })
                                  : area.type === 'language'
                                    ? translate('dashboard.student.analytics.strongAreaMeta.language', {
                                      completed: area.completedTasks,
                                      points: area.pointsEarned,
                                    })
                                    : translate('dashboard.student.analytics.strongAreaMeta.difficulty', {
                                      completed: area.completedTasks,
                                    })}
                              </p>
                            </div>
                            <span className="student-analytics-score">
                              {area.type === 'course'
                                ? translate('dashboard.student.analytics.labels.percentComplete', { percent: area.progressPercent })
                                : translate('dashboard.student.analytics.labels.pointShort', { points: area.pointsEarned || area.completedTasks })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>

                  <article className="student-analytics-card">
                    <div className="student-analytics-card__header">
                      <h4>{t.analytics.cards.weakAreas}</h4>
                      <span className="student-analytics-card__badge student-analytics-card__badge--warning">
                        <HiArrowTrendingDown /> {t.analytics.labels.focus}
                      </span>
                    </div>

                    {analytics.weakAreas.length === 0 ? (
                      <p className="student-analytics-card__empty">{t.analytics.emptyStates.weakAreas}</p>
                    ) : (
                      <div className="student-analytics-insight-list">
                        {analytics.weakAreas.map((area) => (
                          <div key={`${area.type}-${area.courseId || area.name || 'deadlines'}`} className="student-analytics-insight">
                            <div>
                              <span className="student-analytics-insight__eyebrow">
                                {area.type === 'course'
                                  ? t.analytics.weakAreaLabels.course
                                  : area.type === 'difficulty'
                                    ? t.analytics.weakAreaLabels.difficulty
                                    : t.analytics.weakAreaLabels.deadlines}
                              </span>
                              <strong>
                                {area.type === 'course'
                                  ? area.courseName
                                  : area.type === 'difficulty'
                                    ? getDifficultyLabel(area.name)
                                    : t.analytics.weakAreaLabels.deadlinesTitle}
                              </strong>
                              <p>
                                {area.type === 'course'
                                  ? translate('dashboard.student.analytics.weakAreaMeta.course', {
                                    pending: area.pendingTasks,
                                    overdue: area.overdueTasks,
                                  })
                                  : area.type === 'difficulty'
                                    ? translate('dashboard.student.analytics.weakAreaMeta.difficulty', {
                                      pending: area.pendingTasks,
                                    })
                                    : translate('dashboard.student.analytics.weakAreaMeta.deadlines', {
                                      overdue: area.overdueTasks,
                                      dueSoon: area.dueSoonTasks,
                                    })}
                              </p>
                            </div>
                            <span className="student-analytics-score student-analytics-score--warning">
                              {area.type === 'course'
                                ? translate('dashboard.student.analytics.labels.pendingShort', { count: area.pendingTasks })
                                : area.type === 'difficulty'
                                  ? translate('dashboard.student.analytics.labels.pendingShort', { count: area.pendingTasks })
                                  : translate('dashboard.student.analytics.labels.overdueShort', { count: area.overdueTasks })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                </div>

                <div className="student-analytics-grid student-analytics-grid--secondary">
                  <article className="student-analytics-card">
                    <div className="student-analytics-card__header">
                      <h4>{t.analytics.cards.courseProgress}</h4>
                      <span className="student-analytics-card__badge">
                        <HiBookOpen /> {translate('dashboard.student.analytics.labels.courseCount', { count: analytics.activeCourseCount })}
                      </span>
                    </div>

                    {analytics.courseProgress.length === 0 ? (
                      <p className="student-analytics-card__empty">{t.analytics.emptyStates.courseProgress}</p>
                    ) : (
                      <div className="student-analytics-course-list">
                        {analytics.courseProgress.map((course) => (
                          <div key={course.courseId} className="student-analytics-course-item">
                            <div className="student-analytics-course-item__top">
                              <div>
                                <strong>{course.courseName}</strong>
                                <p>{course.courseCode}</p>
                              </div>
                              <span>{translate('dashboard.student.analytics.labels.percentComplete', { percent: course.progressPercent })}</span>
                            </div>

                            <div className="student-analytics-course-item__bar" aria-hidden="true">
                              <span style={{ width: `${Math.min(100, Math.max(0, course.progressPercent))}%` }} />
                            </div>

                            <div className="student-analytics-course-item__meta">
                              <span>{translate('dashboard.student.analytics.courseMeta.completed', { completed: course.completedTasks, total: course.totalTasks })}</span>
                              <span>{translate('dashboard.student.analytics.courseMeta.pending', { count: course.pendingTasks })}</span>
                              <span>{translate('dashboard.student.analytics.courseMeta.overdue', { count: course.overdueTasks })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>

                  <article className="student-analytics-card">
                    <div className="student-analytics-card__header">
                      <h4>{t.analytics.cards.upcomingDeadlines}</h4>
                      <span className="student-analytics-card__badge student-analytics-card__badge--warning">
                        <HiCalendarDays /> {translate('dashboard.student.analytics.labels.dueSoonShort', { count: analytics.dueSoonTasks })}
                      </span>
                    </div>

                    {analytics.upcomingDeadlines.length === 0 ? (
                      <p className="student-analytics-card__empty">{t.analytics.emptyStates.upcomingDeadlines}</p>
                    ) : (
                      <div className="student-analytics-deadline-list">
                        {analytics.upcomingDeadlines.map((task) => (
                          <div key={task.taskId} className={`student-analytics-deadline-item ${task.isOverdue ? 'is-overdue' : ''}`}>
                            <div>
                              <strong>{task.taskName}</strong>
                              <p>{task.courseName} · {task.moduleName}</p>
                            </div>
                            <div className="student-analytics-deadline-item__meta">
                              <span className="student-analytics-deadline-item__badge">
                                {getDifficultyLabel(task.difficulty)}
                              </span>
                              <span className="student-analytics-deadline-item__time">
                                {task.isOverdue
                                  ? translate('dashboard.student.analytics.deadlines.overdueByDays', {
                                    days: Math.abs(task.daysUntilDeadline || 0),
                                  })
                                  : task.daysUntilDeadline <= 0
                                    ? t.analytics.deadlines.dueToday
                                    : task.daysUntilDeadline === 1
                                      ? t.analytics.deadlines.dueTomorrow
                                      : translate('dashboard.student.analytics.deadlines.dueInDays', {
                                        days: task.daysUntilDeadline,
                                      })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                </div>
              </>
            )}
          </section>

          {collaborations.incoming.length > 0 && (
            <div className="collabs-section" style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>{t.collaboration.pendingRequests}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {collaborations.incoming.map((req) => (
                  <div key={req._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--accent-primary)' }}>
                    <div>
                      {translate('dashboard.student.collaboration.requestMessage', {
                        name: req.requester.name,
                        task: req.task_id.task_name,
                        course: req.course_id.course_name,
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleRespondCollab(req._id, 'ACCEPTED')}>
                        <HiCheck style={{ marginRight: '4px' }} /> {t.collaboration.accept}
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleRespondCollab(req._id, 'REJECTED')}>
                        <HiXMark style={{ marginRight: '4px' }} /> {t.collaboration.decline}
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
          {loading ? <CourseGridSkeleton count={3} visible={showCourseSkeletons} /> : enrolledCourses.length === 0 ? (
            <p className="empty-state">{t.courses.empty}</p>
          ) : (
            <div className="gc-course-grid">
              {enrolledCourses.map((enrollment) => {
                const course = enrollment.course_id
                const instructorName = course.instructor ? course.instructor.name : common.unknownInstructor
                const initial = instructorName.charAt(0).toUpperCase()

                return (
                  <div
                    key={enrollment._id}
                    className="gc-course-card"
                    onClick={() => {
                      if (enrollment.status === 'ACTIVE' || enrollment.status === 'APPROVED') {
                        handleViewCourse(course)
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
                          onClick={(event) => {
                            event.stopPropagation()
                            handleHandoutDownload(course.handout_path, course.handout_filename)
                          }}
                        >
                          <HiArrowDownTray size={20} />
                        </button>
                      )}
                      <button
                        className="btn-icon"
                        title={t.courses.openCourse}
                        onClick={(event) => {
                          event.stopPropagation()
                          if (enrollment.status === 'ACTIVE' || enrollment.status === 'APPROVED') handleViewCourse(course)
                        }}
                      >
                        <HiBookOpen size={22} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel student-history-panel">
          <div className="workspace-panel-header student-history-panel__header">
            <div>
              <h3>{t.history.title}</h3>
              <p className="student-history-panel__subtitle">{t.history.subtitle}</p>
            </div>
          </div>

          <div className="student-history-summary-grid">
            <div className="student-history-summary-card">
              <span>{t.history.summary.completedTasks}</span>
              <strong>{taskHistory.length}</strong>
            </div>
            <div className="student-history-summary-card">
              <span>{t.history.summary.pointsEarned}</span>
              <strong>{historyPointsTotal}</strong>
            </div>
            <div className="student-history-summary-card">
              <span>{t.history.summary.coursesTouched}</span>
              <strong>{historyCourseCount}</strong>
            </div>
            <div className="student-history-summary-card">
              <span>{t.history.summary.lastCompleted}</span>
              <strong>
                {latestHistoryEntry?.completed_at
                  ? historyDateFormatter.format(new Date(latestHistoryEntry.completed_at))
                  : t.history.summary.noCompletions}
              </strong>
            </div>
          </div>

          {loadingTaskHistory ? (
            <StudentHistorySkeleton count={3} visible={showHistorySkeletons} />
          ) : taskHistory.length === 0 ? (
            <p className="empty-state">{t.history.empty}</p>
          ) : (
            <div className="student-history-list">
              {taskHistory.map((entry) => {
                const courseName = entry.course_id?.course_name || entry.course_name || common.notAvailable
                const courseCode = entry.course_id?.course_code || ''
                const moduleName = entry.module_id?.module_name || entry.module_name || common.notAvailable
                const completedAt = entry.completed_at ? historyDateFormatter.format(new Date(entry.completed_at)) : common.notAvailable
                const collaborators = Array.isArray(entry.collaborator_ids) ? entry.collaborator_ids : []

                return (
                  <article key={entry._id} className="student-history-item">
                    <div className="student-history-item__top">
                      <div>
                        <h4 className="student-history-item__title">
                          {entry.task_id?.task_name || entry.task_name}
                        </h4>
                        <p className="student-history-item__meta">
                          {courseName}{courseCode ? ` • ${courseCode}` : ''} · {moduleName}
                        </p>
                      </div>
                      <div className="student-history-item__points">
                        <HiStar />
                        <span>{translate('dashboard.student.pointShop.cost', { points: entry.points_awarded || 0 })}</span>
                      </div>
                    </div>

                    <div className="student-history-chip-row">
                      <span className="student-history-chip student-history-chip--success">{t.history.completedBadge}</span>
                      <span className="student-history-chip">{getDifficultyLabel(entry.task_id?.difficulty || entry.task_difficulty || 'MEDIUM')}</span>
                      <span className="student-history-chip">{entry.task_id?.language || entry.task_language || common.notAvailable}</span>
                      <span className="student-history-chip">
                        <HiClock /> {translate('dashboard.student.history.timeLimit', { minutes: entry.task_id?.time_limit || entry.task_time_limit || 0 })}
                      </span>
                      {collaborators.length > 0 && (
                        <span className="student-history-chip">
                          <HiUserGroup /> {translate('dashboard.student.history.collaborators', { count: collaborators.length })}
                        </span>
                      )}
                    </div>

                    <div className="student-history-item__footer">
                      <span>{translate('dashboard.student.history.completedOn', { date: completedAt })}</span>
                      {collaborators.length > 0 && (
                        <span>
                          {translate('dashboard.student.history.completedWith', {
                            names: collaborators.map((peer) => peer.name).join(', '),
                          })}
                        </span>
                      )}
                    </div>
                  </article>
                )
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
          {loading ? <CourseGridSkeleton count={3} visible={showCourseSkeletons} /> : availableCourses.length === 0 ? (
            <p className="empty-state">{t.availableCourses.empty}</p>
          ) : (
            <div className="gc-course-grid">
              {availableCourses.map((course) => {
                const instructorName = course.instructor ? course.instructor.name : common.unknownInstructor
                const initial = instructorName.charAt(0).toUpperCase()

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
                        <HiPlusCircle style={{ marginRight: '0.4rem', marginBottom: '-2px' }} />
                        {enrollLoading === course._id ? t.availableCourses.requesting : t.availableCourses.requestEnrollment}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'pointShop' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel point-shop-panel">
          <div className="workspace-panel-header">
            <h3>{t.pointShop.title}</h3>
          </div>
          {loadingRewards ? (
            <RewardGridSkeleton count={3} visible={showRewardsSkeletons} />
          ) : (
            <div className="rewards-grid">
              {rewards.length === 0 ? (
                <p className="empty-state">{t.pointShop.empty}</p>
              ) : rewards.map((reward) => (
                <motion.div
                  key={reward._id}
                  className={`reward-card ${userPoints < reward.cost ? 'locked' : 'unlocked'}`}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="reward-card-icon">{rewardIcons[reward.icon_name] || <HiGift />}</div>
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
          )}
        </motion.div>
      )}

      {activeTab === 'rankings' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel student-rankings-panel">
          <div className="student-rankings-hero">
            <div className="student-rankings-hero__copy">
              <span className="student-rankings-hero__eyebrow">
                <HiTrophy /> {selectedLeaderboardLabel}
              </span>
              <h3>{t.leaderboard.title}</h3>
            </div>

            <div className="student-rankings-summary">
              <div className="student-rankings-summary__item">
                <span>{leaderboardLabels.leaderScore}</span>
                <strong>{leaderPoints}</strong>
              </div>
              <div className="student-rankings-summary__item">
                <span>{t.leaderboard.yourRank}</span>
                <strong>{currentUserRank ? `#${currentUserRank}` : '-'}</strong>
              </div>
              <div className="student-rankings-summary__item">
                <span>{leaderboardLabels.participants}</span>
                <strong>{leaderboardRows.length}</strong>
              </div>
            </div>
          </div>

          <div className="leaderboard-controls">
            <select
              className="language-selector"
              value={leaderboardType}
              onChange={(event) => setLeaderboardType(event.target.value)}
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
                onChange={(event) => setSelectedCourseForRanking(event.target.value)}
              >
                <option value="">{t.leaderboard.selectClass}</option>
                {enrolledCourses.filter((entry) => entry.status === 'ACTIVE' || entry.status === 'APPROVED').map((entry) => (
                  <option key={entry.course_id._id} value={entry.course_id._id}>
                    {entry.course_id.course_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {loadingLeaderboard ? (
            <LeaderboardSkeleton count={5} visible={showLeaderboardSkeletons} />
          ) : (
            <>
              {podiumRows.length > 0 && (
                <div className="student-rankings-podium">
                  {podiumRows.map((student, index) => {
                    const displayRank = index + 1
                    const isCurrentUser = student._id === user?._id || student.isCurrentUser

                    return (
                      <article
                        key={`podium-${student._id || index}`}
                        className={`student-rankings-podium__card student-rankings-podium__card--rank-${displayRank} ${isCurrentUser ? 'is-current-user' : ''}`}
                      >
                        <span className="student-rankings-podium__rank">#{displayRank}</span>
                        <div className="student-rankings-podium__avatar">
                          {(student.name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <strong>{isCurrentUser ? t.leaderboard.yourRank : student.name}</strong>
                        <span className="student-rankings-podium__score">
                          <HiStar /> {student.points || 0} {t.leaderboard.points}
                        </span>
                      </article>
                    )
                  })}
                </div>
              )}

              <div className="ranking-list">
                {isClassRankingAwaitingCourse ? (
                  <p className="ranking-empty-state">{t.leaderboard.selectClassPrompt}</p>
                ) : leaderboardRows.length === 0 ? (
                  <p className="ranking-empty-state">{t.leaderboard.empty}</p>
              ) : (
                leaderboardRows.map((student, index) => {
                  const isCurrentUser = student._id === user?._id || student.isCurrentUser
                  const displayRank = index + 1

                  return (
                    <div
                      key={student._id || index}
                      className={`ranking-item ranking-item--rank-${Math.min(displayRank, 4)} ${isCurrentUser ? 'current-user' : ''} ${displayRank <= 3 && leaderboardType !== 'peers' ? 'top-3' : ''}`}
                    >
                      <div className="rank-badge">{displayRank}</div>
                      <div className="rank-avatar">{(student.name || 'S').charAt(0).toUpperCase()}</div>
                      <div className="rank-info">
                        <span className="rank-name">
                          {isCurrentUser ? `${student.name} (${t.leaderboard.yourRank})` : student.name}
                        </span>
                        <span className="rank-details">
                          {displayRank <= 3 && leaderboardType !== 'peers' ? leaderboardLabels.topThree : selectedLeaderboardLabel}
                        </span>
                      </div>
                      <div className="rank-score">
                        {student.points || 0} <span>{t.leaderboard.points}</span>
                      </div>
                    </div>
                  )
                })
              )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default StudentDashboardWorkspace

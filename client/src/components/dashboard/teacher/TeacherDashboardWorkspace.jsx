import React from 'react'
import { motion } from 'framer-motion'
import {
  HiArrowDownTray,
  HiBookOpen,
  HiChartBar,
  HiDocumentText,
  HiFolderPlus,
  HiGift,
  HiListBullet,
  HiPaperClip,
  HiPencilSquare,
  HiPlus,
  HiStar,
  HiTrash,
  HiUserGroup,
  HiUsers,
} from 'react-icons/hi2'
import { AnalyticsColumnChart, AnalyticsDonutChart, AnalyticsHeatGrid } from '../../AnalyticsGraphs'
import {
  TeacherModuleGridSkeleton,
  TeacherTaskGridSkeleton,
} from '../../ui/Skeleton'
import {
  ANNOUNCEMENT_TIMER_PRESETS,
  ANNOUNCEMENT_TIMER_UNITS,
} from '../../../utils/announcementTimerOptions'

function TeacherDashboardWorkspace({
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
  performanceBandOrder,
  courses,
  getCourseGradient,
  courseGradients,
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
}) {
  return (
    <div className="dashboard-workspace">
      {activeTab === 'dashboard' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
          <div className="workspace-panel-header">
            <h3>{t.stats.quickStats}</h3>
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

          <section className="dashboard-performance-section">
            <div className="workspace-panel-header dashboard-performance-section__header">
              <div>
                <h3>{performanceSection.title}</h3>
                <p>{performanceSection.subtitle}</p>
              </div>
            </div>

            {performanceAnalytics.dataMode === 'enrollment_only' && performanceAnalytics.studentCount > 0 && (
              <div className="course-analytics-note dashboard-performance-note">
                {performanceSection.limitedData}
              </div>
            )}

            {!performanceAnalytics.studentCount ? (
              <p className="empty-state">{performanceSection.empty}</p>
            ) : (
              <>
                <div className="course-analytics-highlights analytics-highlights--dashboard">
                  <div className="course-analytics-highlight course-analytics-highlight--hero">
                    <span className="course-analytics-highlight__label">{analyticsLabels.highlights.topPerformer}</span>
                    {overallTopPerformer ? (
                      <>
                        <strong>{overallTopPerformer.name}</strong>
                        <p>
                          {analyticsLabels.fields.engagement}: {formatPercent(overallTopPerformer.engagementScore)} • {analyticsLabels.fields.score}: {formatPercent(overallTopPerformer.averageScore)}
                        </p>
                      </>
                    ) : (
                      <p>{analyticsLabels.emptyStudents}</p>
                    )}
                  </div>

                  <div className="course-analytics-highlight course-analytics-highlight--hero">
                    <span className="course-analytics-highlight__label">{analyticsLabels.highlights.hardestTask}</span>
                    {overallHardestTask ? (
                      <>
                        <strong>{overallHardestTask.taskName}</strong>
                        <p>
                          {analyticsLabels.fields.passRate}: {formatPercent(overallHardestTask.passRate)} • {analyticsLabels.fields.challenge}: {formatPercent(overallHardestTask.challengeScore)}
                        </p>
                      </>
                    ) : (
                      <p>{analyticsLabels.emptyTasks}</p>
                    )}
                  </div>

                  <div className="course-analytics-highlight course-analytics-highlight--hero course-analytics-highlight--warning">
                    <span className="course-analytics-highlight__label">{analyticsLabels.overview.supportNeeded}</span>
                    <strong>{performanceAnalytics.studentsNeedingSupport || 0}</strong>
                    <p>
                      {analyticsLabels.fields.completion}: {formatPercent(performanceAnalytics.avgCompletionRate)} • {analyticsLabels.overview.activeLearners}: {performanceAnalytics.activeLearners || 0}
                    </p>
                  </div>
                </div>

                <div className="course-analytics-overview">
                  <div className="course-analytics-stat">
                    <div className="course-analytics-stat__icon">
                      <HiUsers />
                    </div>
                    <div>
                      <span>{analyticsLabels.overview.activeLearners}</span>
                      <strong>{performanceAnalytics.activeLearners || 0}</strong>
                    </div>
                  </div>

                  <div className="course-analytics-stat">
                    <div className="course-analytics-stat__icon">
                      <HiChartBar />
                    </div>
                    <div>
                      <span>{analyticsLabels.overview.avgCompletion}</span>
                      <strong>{formatPercent(performanceAnalytics.avgCompletionRate)}</strong>
                    </div>
                  </div>

                  <div className="course-analytics-stat">
                    <div className="course-analytics-stat__icon">
                      <HiStar />
                    </div>
                    <div>
                      <span>{analyticsLabels.overview.avgScore}</span>
                      <strong>{formatPercent(performanceAnalytics.avgScore)}</strong>
                    </div>
                  </div>

                  <div className="course-analytics-stat">
                    <div className="course-analytics-stat__icon">
                      <HiBookOpen />
                    </div>
                    <div>
                      <span>{analyticsLabels.overview.supportNeeded}</span>
                      <strong>{performanceAnalytics.studentsNeedingSupport || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="course-analytics-highlights analytics-highlights--dashboard">
                  <div className="course-analytics-highlight">
                    <span className="course-analytics-highlight__label">{performanceSection.highlights.strongestCourse}</span>
                    {courseHighlights.strongestCourse ? (
                      <>
                        <strong>{courseHighlights.strongestCourse.courseName}</strong>
                        <p>
                          {analyticsLabels.fields.completion}: {formatPercent(courseHighlights.strongestCourse.avgCompletionRate)} • {analyticsLabels.fields.score}: {formatPercent(courseHighlights.strongestCourse.avgScore)}
                        </p>
                      </>
                    ) : (
                      <p>{performanceSection.empty}</p>
                    )}
                  </div>

                  <div className="course-analytics-highlight course-analytics-highlight--warning">
                    <span className="course-analytics-highlight__label">{performanceSection.highlights.needsAttentionCourse}</span>
                    {courseHighlights.needsAttentionCourse ? (
                      <>
                        <strong>{courseHighlights.needsAttentionCourse.courseName}</strong>
                        <p>
                          {performanceSection.fields.supportShare}: {formatPercent(courseHighlights.needsAttentionCourse.supportShare)} • {analyticsLabels.fields.completion}: {formatPercent(courseHighlights.needsAttentionCourse.avgCompletionRate)}
                        </p>
                      </>
                    ) : (
                      <p>{performanceSection.empty}</p>
                    )}
                  </div>

                  <div className="course-analytics-highlight">
                    <span className="course-analytics-highlight__label">{performanceSection.highlights.toughestCourse}</span>
                    {courseHighlights.toughestCourse ? (
                      <>
                        <strong>{courseHighlights.toughestCourse.courseName}</strong>
                        <p>
                          {performanceSection.fields.hotspot}: {courseHighlights.toughestCourse.topHotspot?.taskName || performanceSection.noHotspot} • {analyticsLabels.fields.challenge}: {formatPercent(courseHighlights.toughestCourse.topHotspot?.challengeScore)}
                        </p>
                      </>
                    ) : (
                      <p>{performanceSection.noHotspot}</p>
                    )}
                  </div>
                </div>

                <div className="analytics-visual-grid">
                  <AnalyticsDonutChart
                    title={performanceSection.charts.performanceMix}
                    totalLabel={analyticsLabels.overview.activeLearners}
                    totalValue={performanceAnalytics.activeLearners || 0}
                    items={dashboardDonutItems}
                    emptyLabel={analyticsLabels.emptyStudents}
                  />
                  <AnalyticsColumnChart
                    title={performanceSection.charts.scoreCurve}
                    items={scoreCurveItems}
                    emptyLabel={analyticsLabels.emptyStudents}
                    valueFormatter={(value) => `${value}`}
                  />
                </div>

                <div className="analytics-visual-grid analytics-visual-grid--dashboard-secondary">
                  <AnalyticsColumnChart
                    title={performanceSection.charts.engagementGraph}
                    items={dashboardColumnItems}
                    emptyLabel={analyticsLabels.emptyStudents}
                  />
                  <AnalyticsHeatGrid
                    title={performanceSection.charts.difficultyHeatmap}
                    items={taskHotspotItems}
                    emptyLabel={analyticsLabels.emptyTasks}
                  />
                </div>

                <div className="course-analytics-grid">
                  <AnalyticsColumnChart
                    title={performanceSection.charts.courseComparison}
                    items={courseComparisonItems}
                    emptyLabel={performanceSection.empty}
                  />

                  <section className="course-analytics-panel">
                    <div className="course-analytics-panel__header">
                      <h3>{performanceSection.charts.leaderboardSnapshot}</h3>
                      <span>{(leaderboardSnapshot.topPerformers?.length || 0) + (leaderboardSnapshot.atRiskStudents?.length || 0)}</span>
                    </div>

                    {!leaderboardSnapshot.topPerformers?.length && !leaderboardSnapshot.atRiskStudents?.length ? (
                      <p className="empty-state">{analyticsLabels.emptyStudents}</p>
                    ) : (
                      <div className="analytics-lane-grid">
                        <div className="analytics-lane">
                          <div className="analytics-lane__header">
                            <strong>{analyticsLabels.charts.topLane}</strong>
                            <span>{leaderboardSnapshot.topAverageEngagement || 0}%</span>
                          </div>
                          <div className="analytics-lane__list">
                            {(leaderboardSnapshot.topPerformers || []).map((student) => (
                              <article key={student.studentId} className="analytics-lane__item">
                                <div>
                                  <strong>{student.name}</strong>
                                  <p>{analyticsLabels.fields.score}: {formatPercent(student.averageScore)}</p>
                                </div>
                                <span>{formatPercent(student.engagementScore)}</span>
                              </article>
                            ))}
                          </div>
                        </div>

                        <div className="analytics-lane analytics-lane--risk">
                          <div className="analytics-lane__header">
                            <strong>{analyticsLabels.charts.riskLane}</strong>
                            <span>{leaderboardSnapshot.atRiskAverageEngagement || 0}%</span>
                          </div>
                          <div className="analytics-lane__list">
                            {(leaderboardSnapshot.atRiskStudents || []).map((student) => (
                              <article key={student.studentId} className="analytics-lane__item">
                                <div>
                                  <strong>{student.name}</strong>
                                  <p>{analyticsLabels.fields.completion}: {formatPercent(student.completionRate)}</p>
                                </div>
                                <span>{formatPercent(student.engagementScore)}</span>
                              </article>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="course-analytics-panel">
                    <div className="course-analytics-panel__header">
                      <h3>{performanceSection.charts.courseHealth}</h3>
                      <span>{performanceAnalytics.courseBreakdown?.length || 0}</span>
                    </div>

                    {!performanceAnalytics.courseBreakdown?.length ? (
                      <p className="empty-state">{performanceSection.empty}</p>
                    ) : (
                      <div className="course-analytics-bars">
                        {performanceAnalytics.courseBreakdown.map((course) => (
                          <div key={course.courseId} className="analytics-module-row">
                            <div className="analytics-bar-row__meta">
                              <strong>{course.courseName}</strong>
                              <span>{course.courseCode}</span>
                            </div>
                            <div className="analytics-module-bars">
                              <div className="analytics-bar-track analytics-bar-track--secondary">
                                <div className="analytics-bar-fill analytics-bar-fill--soft" style={{ width: `${course.avgScore || 0}%` }} />
                              </div>
                              <div className="analytics-bar-track">
                                <div className="analytics-bar-fill analytics-bar-fill--strong" style={{ width: `${course.avgCompletionRate || 0}%` }} />
                              </div>
                            </div>
                            <p>
                              {performanceSection.fields.activeLearners}: {course.activeLearners || 0} • {performanceSection.fields.avgEngagement}: {formatPercent(course.averageEngagement)} • {performanceSection.fields.supportShare}: {formatPercent(course.supportShare)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="course-analytics-panel">
                    <div className="course-analytics-panel__header">
                      <h3>{performanceSection.charts.progressBreakdown}</h3>
                      <span>{performanceAnalytics.studentCount || 0}</span>
                    </div>

                    <div className="course-analytics-bars">
                      {performanceBandOrder.map((band) => {
                        const count = performanceAnalytics.progressBandBreakdown?.[band] || 0
                        const share = performanceAnalytics.studentCount
                          ? Math.round((count / performanceAnalytics.studentCount) * 100)
                          : 0

                        return (
                          <div key={band} className="analytics-bar-row">
                            <div className="analytics-bar-row__meta">
                              <strong>{analyticsLabels.progressBands[band] || band}</strong>
                              <span>{count}</span>
                            </div>
                            <div className="analytics-bar-track">
                              <div className="analytics-bar-fill analytics-bar-fill--strong" style={{ width: `${share}%` }} />
                            </div>
                            <p>{translate('dashboard.teacher.dashboardAnalytics.shareOfLearners', { percent: formatPercent(share) })}</p>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                </div>

                <div className="course-analytics-grid course-analytics-grid--bottom course-analytics-grid--single">
                  <section className="course-analytics-panel">
                    <div className="course-analytics-panel__header">
                      <h3>{analyticsLabels.charts.attentionNeeded}</h3>
                      <span>{performanceAnalytics.attentionNeeded?.length || 0}</span>
                    </div>

                    {!performanceAnalytics.attentionNeeded?.length ? (
                      <p className="empty-state">{analyticsLabels.emptyAttention}</p>
                    ) : (
                      <div className="analytics-student-grid">
                        {performanceAnalytics.attentionNeeded.map((student) => (
                          <article key={student.studentId} className="analytics-student-card analytics-student-card--attention">
                            <div className="analytics-student-card__top">
                              <div className="analytics-student-card__identity">
                                <div className="analytics-student-avatar">{getInitials(student.name)}</div>
                                <div>
                                  <strong>{student.name}</strong>
                                  <p>{student.email}</p>
                                </div>
                              </div>
                              <span className={`analytics-band analytics-band--${student.progressBand.replace('_', '-')}`}>
                                {analyticsLabels.progressBands[student.progressBand] || student.progressBand}
                              </span>
                            </div>
                            <div className="analytics-student-card__metrics">
                              <span>{analyticsLabels.fields.completion}: {formatPercent(student.completionRate)}</span>
                              <span>{analyticsLabels.fields.score}: {formatPercent(student.averageScore)}</span>
                              <span>{analyticsLabels.fields.lastActivity}: {student.lastActivityAt ? announcementDateFormatter.format(new Date(student.lastActivityAt)) : analyticsLabels.noRecentActivity}</span>
                              <span>{common.points}: {student.globalPoints || 0}</span>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </>
            )}
          </section>
        </motion.div>
      )}

      {activeTab === 'myCourses' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
          {!selectedCourse ? (
            <div className="courses-section">
              {(() => {
                let previousCourseGradient = null

                return (
                  <div className="gc-course-grid teacher-course-grid">
                    {courses.length === 0 ? <p className="no-data">{t.courses.empty}</p> : courses.map((course) => {
                      const baseGradient = getCourseGradient(course._id)
                      const baseGradientIndex = courseGradients.indexOf(baseGradient)
                      const safeGradientIndex = baseGradient === previousCourseGradient
                        ? (baseGradientIndex + 1) % courseGradients.length
                        : baseGradientIndex
                      const cardGradient = courseGradients[safeGradientIndex]

                      previousCourseGradient = cardGradient

                      return (
                        <motion.div
                          key={course._id}
                          className="gc-course-card teacher-course-card"
                          whileHover={{ y: -5 }}
                          onClick={() => handleCourseSelect(course)}
                        >
                          <div className="gc-card-header" style={{ background: cardGradient }}>
                            <h3 title={course.course_name}>{course.course_name}</h3>
                            <p className="gc-course-teacher">{t.courses.instructorWorkspace} • {course.course_code}</p>
                          </div>

                          <div className="gc-card-avatar teacher-course-avatar">
                            {(course.course_name || 'C').charAt(0).toUpperCase()}
                          </div>

                          <div className="gc-card-body teacher-course-body">
                            <p className="gc-course-desc">{course.description || common.noDescription}</p>
                            <div className="teacher-course-meta">
                              <span className="teacher-course-chip">{course.subject || common.general}</span>
                              <span className="teacher-course-chip">{translate('dashboard.teacher.courses.modulesCount', { count: course.modules_count || 0 })}</span>
                              <span className="teacher-course-chip">{translate('dashboard.student.pointShop.cost', { points: course.points || 0 })}</span>
                            </div>
                          </div>

                          <div className="gc-card-footer teacher-course-footer">
                            <button
                              className="btn-icon"
                              title={t.courses.analytics}
                              onClick={(event) => {
                                event.stopPropagation()
                                openCourseAnalytics(course)
                              }}
                            >
                              <HiChartBar size={20} />
                            </button>
                            <button
                              className="btn-icon"
                              title={t.courses.editCourse}
                              onClick={(event) => {
                                event.stopPropagation()
                                openCourseForm(course)
                              }}
                            >
                              <HiPencilSquare size={20} />
                            </button>
                            <button
                              className="btn-icon"
                              title={t.courses.exportCourse}
                              onClick={(event) => {
                                event.stopPropagation()
                                handleCourseExport(course._id, course.course_code)
                              }}
                            >
                              <HiArrowDownTray size={20} />
                            </button>
                            <button
                              className="btn-icon"
                              title={t.courses.deleteCourse}
                              onClick={(event) => handleDeleteCourse(event, course._id)}
                            >
                              <HiTrash size={20} />
                            </button>
                            <button
                              className="btn-icon"
                              title={t.courses.openCourse}
                              onClick={(event) => {
                                event.stopPropagation()
                                handleCourseSelect(course)
                              }}
                            >
                              <HiBookOpen size={22} />
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          ) : !selectedModule ? (
            <div className="teacher-course-shell">
              <div className="view-header teacher-course-workspace-header">
                <div className="teacher-course-hero">
                  <div className="view-title-info teacher-course-title-block">
                    <h2>{selectedCourse.course_name} <span className="course-code-large">({selectedCourse.course_code})</span></h2>
                    <p className="view-description">{selectedCourse.description}</p>
                    <div className="teacher-course-inline-meta">
                      <span className="teacher-workspace-chip">{selectedCourse.subject || common.general}</span>
                      <span className="teacher-workspace-chip">{translate('dashboard.teacher.courses.modulesCount', { count: modules.length })}</span>
                      <span className="teacher-workspace-chip">{translate('dashboard.teacher.courses.tasksCount', { count: selectedCourseTaskCount })}</span>
                    </div>
                  </div>

                  <div className="teacher-course-header-actions">
                    <button className="btn btn-outline" onClick={() => handleCourseExport(selectedCourse._id, selectedCourse.course_code)} title={t.courses.exportCourse}>
                      <HiArrowDownTray /> {t.courses.exportCourse}
                    </button>
                    <button className="btn btn-outline" onClick={() => openCourseForm(selectedCourse)}>
                      <HiPencilSquare /> {t.courses.editCourse}
                    </button>
                  </div>

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
                    <span className="teacher-summary-label">{t.courses.summaries.modules}</span>
                    <strong>{modules.length}</strong>
                    <p>{t.courses.summaries.modulesDesc}</p>
                  </div>
                  <div className="teacher-summary-card">
                    <span className="teacher-summary-label">{t.courses.summaries.tasks}</span>
                    <strong>{selectedCourseTaskCount}</strong>
                    <p>{t.courses.summaries.tasksDesc}</p>
                  </div>
                  <div className="teacher-summary-card">
                    <span className="teacher-summary-label">{t.courses.summaries.resources}</span>
                    <strong>{selectedCourseFileCount}</strong>
                    <p>{t.courses.summaries.resourcesDesc}</p>
                  </div>
                  <div className="teacher-summary-card">
                    <span className="teacher-summary-label">{t.courses.summaries.coursePoints}</span>
                    <strong>{selectedCourse.points || 0}</strong>
                    <p>{t.courses.summaries.coursePointsDesc}</p>
                  </div>
                </div>

                <div className="course-actions teacher-course-action-bar">
                  <button className="btn btn-secondary" onClick={handleViewStudents}>
                    <HiUserGroup /> {t.courses.students}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowRewardsModal(true)}>
                    <HiGift /> {t.courses.rewards}
                  </button>
                  <button className="btn btn-primary" onClick={() => openModuleForm()}>
                    <HiFolderPlus /> {t.courses.addModule}
                  </button>
                </div>

                <section className={`course-handout-panel ${selectedCourse.handout_path ? 'is-attached' : ''}`}>
                  <div className="course-handout-panel__header">
                    <div className="course-handout-panel__title">
                      <span className="course-handout-panel__eyebrow">{common.handout}</span>
                      <strong>
                        {selectedCourse.handout_path ? selectedCourse.handout_filename : t.handout.none}
                      </strong>
                    </div>
                    <div className="course-handout-actions">
                      {selectedCourse.handout_path ? (
                        <>
                          <button
                            className="btn btn-outline"
                            onClick={() => handoutInputRef.current?.click()}
                            disabled={handoutUploading}
                          >
                            {handoutUploading ? common.uploading : `↑ ${t.handout.replace}`}
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={handleHandoutDelete}
                          >
                            <HiTrash /> {t.handout.remove}
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-outline"
                          onClick={() => handoutInputRef.current?.click()}
                          disabled={handoutUploading}
                        >
                          <HiPaperClip /> {handoutUploading ? common.uploading : t.handout.upload}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="course-handout-panel__body">
                    <span className="course-handout-icon">
                      <HiPaperClip />
                    </span>
                    {selectedCourse.handout_path ? (
                      <div className="course-handout-content">
                        <button
                          type="button"
                          className="course-handout-link"
                          onClick={() => openProtectedFile(selectedCourse.handout_path)}
                        >
                          {selectedCourse.handout_filename}
                        </button>
                        <p className="course-handout-caption">{t.handout.upload}</p>
                      </div>
                    ) : (
                      <div className="course-handout-content">
                        <span className="course-handout-empty">{t.handout.none}</span>
                        <p className="course-handout-caption">{t.modules.description}</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="modules-section">
                <div className="teacher-section-heading">
                  <div>
                    <h3>{t.modules.title}</h3>
                    <p>{t.modules.description}</p>
                  </div>
                </div>
                {loadingModules ? <TeacherModuleGridSkeleton count={3} visible={showModuleSkeletons} /> : (
                  <div className="teacher-module-grid">
                    {orderedModules.length === 0 ? <p className="no-modules">{t.modules.empty}</p> : orderedModules.map((module, index) => (
                      <div key={module._id} className="teacher-module-card">
                        <div className="teacher-module-card-body">
                          <div className="teacher-module-top">
                            <div className="teacher-module-heading">
                              <span className="teacher-module-order">{translate('dashboard.teacher.modules.moduleLabel', { order: index + 1 })}</span>
                              <h4>{module.module_name}</h4>
                            </div>
                            <div className="teacher-module-header-actions">
                              <button className="btn-icon" onClick={() => handleModuleExport(module._id, module.module_name)} title={t.modules.exportModule}>
                                <HiArrowDownTray size={20} />
                              </button>
                              <button className="btn-icon" onClick={() => openModuleForm(module)} title={t.modules.editModule}>
                                <HiPencilSquare size={20} />
                              </button>
                              <button className="btn-icon delete-btn" onClick={() => handleDeleteModule(module._id)} title={t.modules.deleteModule}>
                                <HiTrash size={20} />
                              </button>
                            </div>
                          </div>

                          <p className="teacher-module-description">{module.description || t.modules.noDescription}</p>

                          <div className="teacher-module-stat-grid">
                            <div className="teacher-module-stat-card">
                              <span className="teacher-module-stat-icon">
                                <HiListBullet />
                              </span>
                              <div className="teacher-module-stat-copy">
                                <strong>{getModuleTaskCount(module)}</strong>
                                <span>{t.modules.stats.tasks}</span>
                              </div>
                            </div>

                            <div className="teacher-module-stat-card">
                              <span className="teacher-module-stat-icon">
                                <HiPaperClip />
                              </span>
                              <div className="teacher-module-stat-copy">
                                <strong>{module.files?.length || 0}</strong>
                                <span>{t.modules.stats.files}</span>
                              </div>
                            </div>

                            <div className="teacher-module-stat-card">
                              <span className="teacher-module-stat-icon">
                                <HiStar />
                              </span>
                              <div className="teacher-module-stat-copy">
                                <strong>{module.points || 0}</strong>
                                <span>{t.modules.stats.points}</span>
                              </div>
                            </div>
                          </div>

                          <div className="teacher-module-actions">
                            <div className="teacher-module-primary-actions">
                              <button className="btn btn-primary" onClick={() => handleModuleSelect(module)} title={t.modules.viewTasks}>
                                <HiListBullet /> {t.modules.viewTasks}
                              </button>
                              <button className="btn btn-outline" onClick={() => openTaskForm(module._id)} title={t.modules.addTask}>
                                <HiPlus /> {t.modules.addTask}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="teacher-course-shell">
              <div className="view-header teacher-course-workspace-header">
                <div className="teacher-course-hero">
                  <div className="view-title-info teacher-course-title-block">
                    <h2>{selectedModule.module_name} <span className="module-order">{translate('dashboard.teacher.taskView.moduleLabel', { order: selectedModuleDisplayOrder })}</span></h2>
                    <p className="view-description">{selectedModule.description}</p>
                    <div className="teacher-course-inline-meta">
                      <span className="teacher-workspace-chip">{translate('dashboard.teacher.courses.tasksCount', { count: tasks.length })}</span>
                      <span className="teacher-workspace-chip">{translate('dashboard.teacher.taskView.totalPoints', { count: selectedModuleTotalPoints })}</span>
                      <span className="teacher-workspace-chip">{translate('dashboard.teacher.taskView.avgTime', { count: selectedModuleAverageTime })}</span>
                    </div>
                  </div>
                  <div className="teacher-task-actions">
                    <button className="btn btn-outline" onClick={() => openModuleForm(selectedModule)}>
                      <HiPencilSquare /> {t.modules.editModule}
                    </button>
                    <button className="btn btn-primary" onClick={() => openTaskForm(selectedModule._id, null)}>
                      <HiPlus /> {t.taskView.createTask}
                    </button>
                  </div>
                </div>

                <div className="teacher-course-summary-grid">
                  <div className="teacher-summary-card">
                    <span className="teacher-summary-label">{t.taskView.summaries.tasks}</span>
                    <strong>{tasks.length}</strong>
                    <p>{t.taskView.summaries.tasksDesc}</p>
                  </div>
                  <div className="teacher-summary-card">
                    <span className="teacher-summary-label">{t.taskView.summaries.points}</span>
                    <strong>{selectedModuleTotalPoints}</strong>
                    <p>{t.taskView.summaries.pointsDesc}</p>
                  </div>
                  <div className="teacher-summary-card">
                    <span className="teacher-summary-label">{t.taskView.summaries.languages}</span>
                    <strong>{selectedModuleLanguageCount}</strong>
                    <p>{t.taskView.summaries.languagesDesc}</p>
                  </div>
                  <div className="teacher-summary-card">
                    <span className="teacher-summary-label">{t.taskView.summaries.timeProfile}</span>
                    <strong>{selectedModuleAverageTime}m</strong>
                    <p>{t.taskView.summaries.timeProfileDesc}</p>
                  </div>
                </div>

                <section className="module-resources-panel">
                  <div className="module-resources-panel__header">
                    <div>
                      <h3>{t.modules.resources.title}</h3>
                      <p>{translate('dashboard.teacher.modules.filesCount', { count: selectedModule.files?.length || 0 })}</p>
                    </div>
                  </div>

                  {selectedModule.files?.length ? (
                    <div className="module-resource-list">
                      {selectedModule.files.map((file, index) => (
                        <div key={`${file.path}-${index}`} className="module-resource-item">
                          <div className="module-resource-item__copy">
                            <span className="module-resource-item__icon">
                              <HiPaperClip />
                            </span>
                            <div>
                              <strong>{file.name}</strong>
                              <span>{formatFileSize(file.size) || file.mimetype || t.modules.stats.files}</span>
                            </div>
                          </div>
                          <div className="module-resource-item__actions">
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => openProtectedFile(file.path)}
                            >
                              <HiArrowDownTray /> {t.modules.resources.open}
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => downloadProtectedFile(file.path, file.name)}
                            >
                              <HiArrowDownTray /> {common.download}
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => handleDeleteModuleFile(file.path)}
                            >
                              <HiTrash /> {t.modules.resources.remove}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="module-resource-empty">
                      <HiPaperClip />
                      <span>{t.modules.resources.empty}</span>
                    </div>
                  )}
                </section>
              </div>

              <div className="modules-section">
                <div className="teacher-section-heading">
                  <div>
                    <h3>{t.taskView.title}</h3>
                    <p>{t.taskView.description}</p>
                  </div>
                </div>
                {loadingTasks ? <TeacherTaskGridSkeleton count={3} visible={showTaskSkeletons} /> : (
                  <div className="teacher-task-grid">
                    {tasks.length === 0 ? <p className="no-modules">{t.taskView.empty}</p> : tasks.map((task) => (
                      <div key={task._id} className="teacher-task-card">
                        <div className="teacher-task-top">
                          <div>
                            <h4>{task.task_name}</h4>
                            <p className="teacher-task-problem">{task.problem_statement}</p>
                          </div>
                          <span className={`teacher-task-difficulty ${task.difficulty?.toLowerCase()}`}>
                            {getDifficultyLabel(task.difficulty)}
                          </span>
                        </div>

                        <div className="teacher-task-meta">
                          <span className="teacher-workspace-chip">{translate('dashboard.teacher.taskView.language', { language: task.language })}</span>
                          <span className="teacher-workspace-chip">{translate('dashboard.teacher.taskView.time', { time: task.time_limit })}</span>
                          {(task.has_deadline || task.deadline_at) && (
                            <span className="teacher-workspace-chip">
                              {translate('dashboard.teacher.taskView.deadline', { date: formatTaskDeadline(task.deadline_at) })}
                            </span>
                          )}
                          {isTaskDeadlinePassed(task) && (
                            <span className="teacher-workspace-chip" style={{ color: 'var(--accent-red)', borderColor: 'rgba(239, 68, 68, 0.24)' }}>
                              {t.taskView.deadlinePassed}
                            </span>
                          )}
                          <span className="teacher-workspace-chip">{translate('dashboard.teacher.taskView.tests', { count: task.test_cases_count })}</span>
                          <span className="teacher-workspace-chip">{translate('dashboard.student.pointShop.cost', { points: task.points || 0 })}</span>
                        </div>

                        {task.constraints && (
                          <p className="teacher-task-constraints">
                            <strong>{t.taskView.constraints}</strong> {task.constraints}
                          </p>
                        )}

                        <div className="teacher-task-actions">
                          <button
                            className="btn btn-outline"
                            onClick={() => openTaskForm(task.module_id, task)}
                            title={t.taskView.editTask}
                            style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
                          >
                            {t.taskView.editTask}
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteTask(task._id, task.module_id)}
                            title={t.taskView.deleteTask}
                          >
                            <HiTrash /> {t.taskView.deleteTask}
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

      {activeTab === 'announcements' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
          <div className="workspace-panel-header">
            <h3>{t.announcements.title}</h3>
          </div>

          <div className="dashboard-announcements-layout">
            <div className="dashboard-announcement-form-card">
              <p className="dashboard-announcement-form-card__intro">{t.announcements.description}</p>

              <label className="admin-installer-panel__label">
                {t.announcements.audienceLabel}
                <select
                  className="admin-installer-panel__input"
                  value={announcementForm.audienceType}
                  onChange={(event) => handleAnnouncementFieldChange('audienceType', event.target.value)}
                >
                  <option value="GLOBAL">{t.announcements.audienceGlobal}</option>
                  <option value="COURSE">{t.announcements.audienceCourse}</option>
                </select>
              </label>

              {announcementForm.audienceType === 'COURSE' ? (
                <label className="admin-installer-panel__label">
                  {t.announcements.courseLabel}
                  <select
                    className="admin-installer-panel__input"
                    value={announcementForm.courseId}
                    onChange={(event) => handleAnnouncementFieldChange('courseId', event.target.value)}
                  >
                    <option value="">{t.announcements.selectCourse}</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.course_name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="admin-installer-panel__label">
                {t.announcements.titleLabel}
                <input
                  type="text"
                  className="admin-installer-panel__input"
                  value={announcementForm.title}
                  placeholder={t.announcements.titlePlaceholder}
                  onChange={(event) => handleAnnouncementFieldChange('title', event.target.value)}
                />
              </label>

              <label className="admin-installer-panel__label">
                {t.announcements.messageLabel}
                <textarea
                  className="dashboard-announcement-form-card__textarea"
                  value={announcementForm.message}
                  placeholder={t.announcements.messagePlaceholder}
                  onChange={(event) => handleAnnouncementFieldChange('message', event.target.value)}
                />
              </label>

              <label className="admin-installer-panel__label">
                {t.announcements.timerLabel}
                <select
                  className="admin-installer-panel__input"
                  value={announcementForm.timerPreset}
                  onChange={(event) => handleAnnouncementFieldChange('timerPreset', event.target.value)}
                >
                  {ANNOUNCEMENT_TIMER_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {t.announcements[preset.labelKey]}
                    </option>
                  ))}
                </select>
                <span className="dashboard-announcement-item__detail">{t.announcements.timerHint}</span>
              </label>

              {isCustomAnnouncementTimer ? (
                <>
                  <div className="dashboard-announcement-timer-row">
                    <label className="admin-installer-panel__label">
                      {t.announcements.timerCustomValueLabel}
                      <input
                        type="number"
                        min="1"
                        className="admin-installer-panel__input"
                        value={announcementForm.customTimerValue}
                        placeholder={t.announcements.timerCustomPlaceholder}
                        onChange={(event) => handleAnnouncementFieldChange('customTimerValue', event.target.value)}
                      />
                    </label>

                    <label className="admin-installer-panel__label">
                      {t.announcements.timerCustomUnitLabel}
                      <select
                        className="admin-installer-panel__input"
                        value={announcementForm.customTimerUnit}
                        onChange={(event) => handleAnnouncementFieldChange('customTimerUnit', event.target.value)}
                      >
                        {ANNOUNCEMENT_TIMER_UNITS.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {t.announcements[unit.labelKey]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <span className="dashboard-announcement-item__detail">
                    {isAnnouncementTimerReady ? t.announcements.timerCustomHint : t.announcements.timerCustomInvalid}
                  </span>
                </>
              ) : null}

              <div className="admin-installer-panel__actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={savingAnnouncement || !announcementForm.title.trim() || !announcementForm.message.trim() || (announcementForm.audienceType === 'COURSE' && !announcementForm.courseId) || !isAnnouncementTimerReady}
                  onClick={handleCreateAnnouncement}
                >
                  {savingAnnouncement ? t.announcements.creating : t.announcements.create}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetAnnouncementForm}>
                  {t.announcements.clear}
                </button>
              </div>

              {!courses.length && announcementForm.audienceType === 'COURSE' ? (
                <p className="admin-installer-panel__status">{t.announcements.noCourses}</p>
              ) : null}
              {announcementMessage ? (
                <p className="admin-installer-panel__status admin-installer-panel__status--message">{announcementMessage}</p>
              ) : null}
            </div>

            <div className="dashboard-announcements-feed">
              {loadingAnnouncements ? (
                <p className="empty-state">{common.loading}</p>
              ) : announcements.length ? announcements.map((announcement) => (
                <article key={announcement._id} className="dashboard-announcement-item">
                  <div className="dashboard-announcement-item__meta">
                    <div>
                      <h4>{announcement.title}</h4>
                      <p>
                        {announcement.course_id?.course_name || t.announcements.generalAudience}
                        {' • '}
                        {announcementDateFormatter.format(new Date(announcement.createdAt))}
                      </p>
                      {announcement.expires_at ? (
                        <p className="dashboard-announcement-item__detail">
                          {t.announcements.expiresOn.replace('{date}', announcementDateFormatter.format(new Date(announcement.expires_at)))}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary admin-installer-panel__remove"
                      disabled={deletingAnnouncementId === announcement._id}
                      onClick={() => handleDeleteAnnouncement(announcement._id)}
                    >
                      {deletingAnnouncementId === announcement._id ? common.deleting : t.announcements.delete}
                    </button>
                  </div>
                  <p className="dashboard-announcement-item__body">{announcement.message}</p>
                </article>
              )) : (
                <p className="empty-state">{t.announcements.empty}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default TeacherDashboardWorkspace

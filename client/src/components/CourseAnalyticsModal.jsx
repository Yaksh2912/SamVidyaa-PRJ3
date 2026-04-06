import React from 'react'
import { HiBookOpen, HiBolt, HiChartBar, HiStar, HiUsers, HiXMark } from 'react-icons/hi2'
import { AnalyticsColumnChart, AnalyticsDonutChart, AnalyticsHeatGrid } from './AnalyticsGraphs'

const formatPercent = (value) => `${Math.round(value || 0)}%`

const getInitials = (name = '') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase() || '')
  .join('') || 'ST'

const formatRuntimeCompact = (runtimeMs) => {
  const value = Number(runtimeMs)

  if (!value || value <= 0) return 'N/A'
  if (value < 1000) return `${Math.round(value)} ms`
  if (value < 60000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} s`

  return `${(value / 60000).toFixed(1)} min`
}

const PROGRESS_BAND_COLORS = {
  completed: '#10b981',
  on_track: '#0d9488',
  steady: '#3b82f6',
  needs_support: '#ef4444',
  not_started: '#8b5cf6'
}

function CourseAnalyticsModal({ course, analytics, loading, onClose, labels, common }) {
  if (!course) return null

  const modalLabels = labels.analyticsModal
  const overview = analytics?.overview
  const topPerformer = overview?.topPerformer
  const bottleneckModule = overview?.bottleneckModule
  const hardestTask = overview?.hardestTask
  const progressBands = modalLabels.progressBands
  const progressDonutItems = Object.entries(analytics?.distributions?.progressBand || {}).map(([key, value]) => ({
    key,
    label: progressBands[key] || key,
    value,
    color: PROGRESS_BAND_COLORS[key] || '#0d9488'
  }))
  const moduleGraphItems = (analytics?.moduleAnalytics || []).slice(0, 6).map((module) => ({
    key: module.moduleId,
    label: module.moduleName,
    shortLabel: module.moduleName?.split(' ').slice(0, 2).join(' ') || module.moduleName,
    value: module.completedRate || 0,
    meta: formatPercent(module.averageScore),
    color: 'var(--accent-gradient)'
  }))
  const scoreCurveItems = (analytics?.distributions?.scoreBand || []).map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    shortLabel: bucket.label,
    value: bucket.value || 0,
    meta: `${bucket.share || 0}%`,
    color: 'linear-gradient(180deg, #0f766e 0%, #22c55e 100%)'
  }))
  const taskHotspotItems = (analytics?.taskDifficultyHotspots || []).slice(0, 8).map((task) => ({
    key: task.taskId,
    title: task.taskName,
    subtitle: [task.courseName, task.moduleName].filter(Boolean).join(' • '),
    intensity: task.challengeScore || 0,
    level: task.heatLevel || 'stable',
    valueLabel: `${modalLabels.fields.challenge}: ${formatPercent(task.challengeScore)}`,
    metrics: [
      { label: modalLabels.fields.passRate, value: formatPercent(task.passRate) },
      { label: modalLabels.fields.completion, value: formatPercent(task.completionRate) },
      { label: modalLabels.fields.attempts, value: task.attempts || 0 },
      { label: modalLabels.fields.runtime, value: formatRuntimeCompact(task.averageRuntimeMs) }
    ],
    footer: [task.difficulty, task.language].filter(Boolean).join(' • ')
  }))
  const leaderboardSnapshot = analytics?.leaderboardSnapshot || {
    topPerformers: [],
    atRiskStudents: [],
    topAverageEngagement: 0,
    atRiskAverageEngagement: 0
  }

  return (
    <div className="neumorphic-modal-overlay" onClick={onClose}>
      <div className="neumorphic-modal-content course-analytics-modal" onClick={(e) => e.stopPropagation()}>
        <div className="neumorphic-modal-header course-analytics-header">
          <div className="course-modal-intro">
            <div className="course-analytics-kicker">
              <HiChartBar />
              <span>{modalLabels.title}</span>
            </div>
            <h2>{course.course_name}</h2>
            <p className="course-code-subtitle">
              <span>{course.course_code}</span> {modalLabels.subtitle}
            </p>
            {analytics?.overview?.dataMode === 'enrollment_only' && (
              <div className="course-analytics-note">
                {modalLabels.limitedData}
              </div>
            )}
          </div>

          <button className="btn-neumorphic-close course-analytics-close" onClick={onClose}>
            <HiXMark /> {modalLabels.close}
          </button>
        </div>

        <div className="neumorphic-modal-body course-analytics-body">
          {loading ? (
            <p className="empty-state">{modalLabels.loading}</p>
          ) : !analytics ? (
            <p className="empty-state">{modalLabels.unavailable}</p>
          ) : (
            <>
              <div className="course-analytics-overview">
                <div className="course-analytics-stat">
                  <div className="course-analytics-stat__icon">
                    <HiUsers />
                  </div>
                  <div>
                    <span>{modalLabels.overview.activeLearners}</span>
                    <strong>{overview?.activeStudents || 0}</strong>
                  </div>
                </div>
                <div className="course-analytics-stat">
                  <div className="course-analytics-stat__icon">
                    <HiBolt />
                  </div>
                  <div>
                    <span>{modalLabels.overview.avgCompletion}</span>
                    <strong>{formatPercent(overview?.avgCompletionRate)}</strong>
                  </div>
                </div>
                <div className="course-analytics-stat">
                  <div className="course-analytics-stat__icon">
                    <HiStar />
                  </div>
                  <div>
                    <span>{modalLabels.overview.avgScore}</span>
                    <strong>{formatPercent(overview?.avgScore)}</strong>
                  </div>
                </div>
                <div className="course-analytics-stat">
                  <div className="course-analytics-stat__icon">
                    <HiBookOpen />
                  </div>
                  <div>
                    <span>{modalLabels.overview.supportNeeded}</span>
                    <strong>{overview?.studentsNeedingSupport || 0}</strong>
                  </div>
                </div>
              </div>

              <div className="course-analytics-highlights">
                <div className="course-analytics-highlight">
                  <span className="course-analytics-highlight__label">{modalLabels.highlights.topPerformer}</span>
                  {topPerformer ? (
                    <>
                      <strong>{topPerformer.name}</strong>
                      <p>
                        {modalLabels.fields.completion}: {formatPercent(topPerformer.completionRate)} • {modalLabels.fields.score}: {formatPercent(topPerformer.averageScore)}
                      </p>
                    </>
                  ) : (
                    <p>{modalLabels.emptyStudents}</p>
                  )}
                </div>

                <div className="course-analytics-highlight">
                  <span className="course-analytics-highlight__label">{modalLabels.highlights.hardestTask}</span>
                  {hardestTask ? (
                    <>
                      <strong>{hardestTask.taskName}</strong>
                      <p>
                        {modalLabels.fields.passRate}: {formatPercent(hardestTask.passRate)} • {modalLabels.fields.challenge}: {formatPercent(hardestTask.challengeScore)}
                      </p>
                    </>
                  ) : (
                    <p>{modalLabels.emptyTasks}</p>
                  )}
                </div>

                <div className="course-analytics-highlight">
                  <span className="course-analytics-highlight__label">{modalLabels.highlights.bottleneck}</span>
                  {bottleneckModule ? (
                    <>
                      <strong>{bottleneckModule.moduleName}</strong>
                      <p>
                        {modalLabels.fields.completed}: {formatPercent(bottleneckModule.completedRate)} • {modalLabels.fields.started}: {formatPercent(bottleneckModule.startedRate)}
                      </p>
                    </>
                  ) : (
                    <p>{modalLabels.emptyModules}</p>
                  )}
                </div>
              </div>

              <div className="analytics-visual-grid">
                <AnalyticsDonutChart
                  title={modalLabels.charts.progressMix}
                  totalLabel={modalLabels.overview.activeLearners}
                  totalValue={overview?.activeStudents || 0}
                  items={progressDonutItems}
                  emptyLabel={modalLabels.emptyStudents}
                />
                <AnalyticsColumnChart
                  title={modalLabels.charts.scoreCurve}
                  items={scoreCurveItems}
                  emptyLabel={modalLabels.emptyStudents}
                  valueFormatter={(value) => `${value}`}
                />
              </div>

              <div className="analytics-visual-grid analytics-visual-grid--dashboard-secondary">
                <AnalyticsColumnChart
                  title={modalLabels.charts.completionGraph}
                  items={moduleGraphItems}
                  emptyLabel={modalLabels.emptyModules}
                />
                <AnalyticsHeatGrid
                  title={modalLabels.charts.difficultyHeatmap}
                  items={taskHotspotItems}
                  emptyLabel={modalLabels.emptyTasks}
                />
              </div>

              <div className="course-analytics-grid">
                <section className="course-analytics-panel">
                  <div className="course-analytics-panel__header">
                    <h3>{modalLabels.charts.leaderboardSnapshot}</h3>
                    <span>{(leaderboardSnapshot.topPerformers?.length || 0) + (leaderboardSnapshot.atRiskStudents?.length || 0)}</span>
                  </div>

                  {!leaderboardSnapshot.topPerformers?.length && !leaderboardSnapshot.atRiskStudents?.length ? (
                    <p className="empty-state">{modalLabels.emptyStudents}</p>
                  ) : (
                    <div className="analytics-lane-grid">
                      <div className="analytics-lane">
                        <div className="analytics-lane__header">
                          <strong>{modalLabels.charts.topLane}</strong>
                          <span>{leaderboardSnapshot.topAverageEngagement || 0}%</span>
                        </div>
                        <div className="analytics-lane__list">
                          {(leaderboardSnapshot.topPerformers || []).map((student) => (
                            <article key={student.studentId} className="analytics-lane__item">
                              <div>
                                <strong>{student.name}</strong>
                                <p>{modalLabels.fields.score}: {formatPercent(student.averageScore)}</p>
                              </div>
                              <span>{formatPercent(student.engagementScore)}</span>
                            </article>
                          ))}
                        </div>
                      </div>

                      <div className="analytics-lane analytics-lane--risk">
                        <div className="analytics-lane__header">
                          <strong>{modalLabels.charts.riskLane}</strong>
                          <span>{leaderboardSnapshot.atRiskAverageEngagement || 0}%</span>
                        </div>
                        <div className="analytics-lane__list">
                          {(leaderboardSnapshot.atRiskStudents || []).map((student) => (
                            <article key={student.studentId} className="analytics-lane__item">
                              <div>
                                <strong>{student.name}</strong>
                                <p>{modalLabels.fields.completion}: {formatPercent(student.completionRate)}</p>
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
                    <h3>{modalLabels.charts.moduleProgress}</h3>
                    <span>{analytics.moduleAnalytics?.length || 0}</span>
                  </div>

                  {!analytics.moduleAnalytics?.length ? (
                    <p className="empty-state">{modalLabels.emptyModules}</p>
                  ) : (
                    <div className="course-analytics-bars">
                      {analytics.moduleAnalytics.map((module) => (
                        <div key={module.moduleId} className="analytics-module-row">
                          <div className="analytics-bar-row__meta">
                            <strong>{module.moduleName}</strong>
                            <span>{modalLabels.fields.completed}: {formatPercent(module.completedRate)}</span>
                          </div>
                          <div className="analytics-module-bars">
                            <div className="analytics-bar-track analytics-bar-track--secondary">
                              <div className="analytics-bar-fill analytics-bar-fill--soft" style={{ width: `${module.startedRate}%` }} />
                            </div>
                            <div className="analytics-bar-track">
                              <div className="analytics-bar-fill analytics-bar-fill--strong" style={{ width: `${module.completedRate}%` }} />
                            </div>
                          </div>
                          <p>
                            {modalLabels.fields.started}: {formatPercent(module.startedRate)} • {modalLabels.fields.score}: {formatPercent(module.averageScore)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="course-analytics-grid course-analytics-grid--bottom course-analytics-grid--single">
                <section className="course-analytics-panel">
                  <div className="course-analytics-panel__header">
                    <h3>{modalLabels.charts.attentionNeeded}</h3>
                    <span>{analytics.attentionNeeded?.length || 0}</span>
                  </div>

                  {!analytics.attentionNeeded?.length ? (
                    <p className="empty-state">{modalLabels.emptyAttention}</p>
                  ) : (
                    <div className="analytics-student-grid">
                      {analytics.attentionNeeded.map((student) => (
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
                              {progressBands[student.progressBand] || student.progressBand}
                            </span>
                          </div>
                          <div className="analytics-student-card__metrics">
                            <span>{modalLabels.fields.completion}: {formatPercent(student.completionRate)}</span>
                            <span>{modalLabels.fields.score}: {formatPercent(student.averageScore)}</span>
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
        </div>
      </div>
    </div>
  )
}

export default CourseAnalyticsModal

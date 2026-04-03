import React from 'react'
import { HiBookOpen, HiBolt, HiChartBar, HiStar, HiUsers, HiXMark } from 'react-icons/hi2'
import { AnalyticsColumnChart, AnalyticsDonutChart } from './AnalyticsGraphs'

const formatPercent = (value) => `${Math.round(value || 0)}%`

const getInitials = (name = '') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase() || '')
  .join('') || 'ST'

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
                  title={modalLabels.charts.completionGraph}
                  items={moduleGraphItems}
                  emptyLabel={modalLabels.emptyModules}
                />
              </div>

              <div className="course-analytics-grid">
                <section className="course-analytics-panel">
                  <div className="course-analytics-panel__header">
                    <h3>{modalLabels.charts.topPerformers}</h3>
                    <span>{analytics.topPerformers?.length || 0}</span>
                  </div>

                  {!analytics.topPerformers?.length ? (
                    <p className="empty-state">{modalLabels.emptyStudents}</p>
                  ) : (
                    <div className="course-analytics-bars">
                      {analytics.topPerformers.map((student) => (
                        <div key={student.studentId} className="analytics-bar-row">
                          <div className="analytics-bar-row__meta">
                            <strong>{student.name}</strong>
                            <span>{formatPercent(student.engagementScore)}</span>
                          </div>
                          <div className="analytics-bar-track">
                            <div className="analytics-bar-fill" style={{ width: `${student.engagementScore}%` }} />
                          </div>
                          <p>
                            {modalLabels.fields.completion}: {formatPercent(student.completionRate)} • {modalLabels.fields.score}: {formatPercent(student.averageScore)}
                          </p>
                        </div>
                      ))}
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

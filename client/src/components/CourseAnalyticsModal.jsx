import React from 'react'
import { HiBookOpen, HiBolt, HiChartBar, HiStar, HiUsers, HiXMark } from 'react-icons/hi2'

const formatPercent = (value) => `${Math.round(value || 0)}%`

const formatDate = (value, fallback) => {
  if (!value) return fallback
  return new Date(value).toLocaleDateString()
}

function CourseAnalyticsModal({ course, analytics, loading, onClose, labels, common }) {
  if (!course) return null

  const modalLabels = labels.analyticsModal
  const overview = analytics?.overview
  const topPerformer = overview?.topPerformer
  const bottleneckModule = overview?.bottleneckModule
  const progressBands = modalLabels.progressBands

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

              <div className="course-analytics-grid course-analytics-grid--bottom">
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
                            <div>
                              <strong>{student.name}</strong>
                              <p>{student.email}</p>
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

                <section className="course-analytics-panel">
                  <div className="course-analytics-panel__header">
                    <h3>{modalLabels.charts.studentSnapshot}</h3>
                    <span>{analytics.studentAnalytics?.length || 0}</span>
                  </div>

                  {!analytics.studentAnalytics?.length ? (
                    <p className="empty-state">{modalLabels.emptyStudents}</p>
                  ) : (
                    <div className="analytics-student-grid">
                      {analytics.studentAnalytics.slice(0, 6).map((student) => (
                        <article key={student.studentId} className="analytics-student-card">
                          <div className="analytics-student-card__top">
                            <div>
                              <strong>{student.name}</strong>
                              <p>{student.enrollmentNumber || student.email}</p>
                            </div>
                            <span className={`analytics-band analytics-band--${student.progressBand.replace('_', '-')}`}>
                              {progressBands[student.progressBand] || student.progressBand}
                            </span>
                          </div>
                          <div className="analytics-student-card__metrics">
                            <span>{modalLabels.fields.completion}: {formatPercent(student.completionRate)}</span>
                            <span>{modalLabels.fields.score}: {formatPercent(student.averageScore)}</span>
                            <span>{modalLabels.fields.engagement}: {formatPercent(student.engagementScore)}</span>
                          </div>
                          <div className="analytics-student-card__footer">
                            <span>{common.points}: {student.globalPoints || 0}</span>
                            <span>{modalLabels.fields.lastActivity}: {formatDate(student.lastActivityAt, modalLabels.noRecentActivity)}</span>
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

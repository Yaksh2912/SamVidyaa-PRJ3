import React from 'react'
import { motion } from 'framer-motion'
import {
  HiBellAlert,
  HiBookOpen,
  HiSparkles,
  HiStar,
  HiUsers,
} from 'react-icons/hi2'
import { FiDownload, FiTrash2, FiUpload } from 'react-icons/fi'
import API_BASE_URL from '../../../config'
import {
  PanelStatusSkeleton,
} from '../../ui/Skeleton'
import {
  ANNOUNCEMENT_TIMER_PRESETS,
  ANNOUNCEMENT_TIMER_UNITS,
} from '../../../utils/announcementTimerOptions'

function AdminDashboardWorkspace({
  activeTab,
  setActiveTab,
  t,
  common,
  translations,
  translate,
  pendingActions,
  desktopApp,
  announcements,
  testimonials,
  platformStatsLoading,
  platformStats,
  statsCards,
  globalAnnouncementCount,
  courseAnnouncementCount,
  latestAnnouncement,
  latestTestimonial,
  courses,
  recentAnnouncements,
  announcementDateFormatter,
  showDesktopAppSkeleton,
  formatFileSize,
  formatDate,
  getUploadUrl,
  recentTestimonials,
  activityItems,
  announcementsLoading,
  showTestimonialStatus,
  privilegedUserForm,
  handlePrivilegedUserFieldChange,
  handleCreatePrivilegedUser,
  savingPrivilegedUser,
  resetPrivilegedUserForm,
  privilegedUserMessage,
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
  testimonialForm,
  handleTestimonialFieldChange,
  testimonialImageInputRef,
  handleTestimonialImageSelection,
  handleSaveTestimonial,
  resetTestimonialForm,
  testimonialMessage,
  testimonialsLoading,
  handleEditTestimonial,
  deletingTestimonialId,
  handleDeleteTestimonial,
  desktopAppLoading,
  desktopVersion,
  setDesktopVersion,
  installerInputRef,
  handleInstallerSelection,
  handleDesktopAppUpload,
  selectedInstaller,
  uploadingDesktopApp,
  desktopAppMessage,
  handleDesktopAppRemove,
  removingDesktopApp,
}) {
  return (
    <div className="dashboard-workspace">
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
          <div className="workspace-panel-header workspace-panel-header--stacked admin-overview-header">
            <div className="workspace-panel-header__copy">
              <span className="workspace-panel-header__eyebrow">{t.overview.eyebrow}</span>
              <h3>{t.header}</h3>
              <p className="workspace-panel-subtitle">{t.subtitle}</p>
            </div>

            <div className="dashboard-inline-metrics">
              <article className="dashboard-inline-metric">
                <span>{translate('dashboard.admin.topbar.pendingActions', { count: pendingActions })}</span>
                <strong>{pendingActions}</strong>
              </article>
              <article className="dashboard-inline-metric">
                <span>{t.desktopApp.versionLabel}</span>
                <strong>{desktopApp?.version || common.notAvailable}</strong>
              </article>
              <article className="dashboard-inline-metric">
                <span>{common.active}</span>
                <strong>{announcements.length + testimonials.length}</strong>
              </article>
            </div>
          </div>

          <div className="admin-overview-actions">
            <button type="button" className="btn btn-primary" onClick={() => setActiveTab('announcements')}>
              <HiBellAlert /> {t.overview.primaryAction}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('desktop')}>
              <FiUpload /> {t.overview.secondaryAction}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('users')}>
              <HiUsers /> {t.userManagement.primaryAction}
            </button>
          </div>

          <div className="stats-grid">
            {statsCards.map((card) => (
              <motion.div key={card.id} className="stat-card" whileHover={{ y: -4 }}>
                <div className="stat-icon">{card.icon}</div>
                <div className="stat-info">
                  <h3>{card.label}</h3>
                  <p className="stat-number">{card.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <section className="dashboard-performance-section">
            <div className="workspace-panel-header dashboard-performance-section__header">
              <div>
                <h3>{t.overview.operationsTitle}</h3>
                <p>{t.overview.quickLinksDescription}</p>
              </div>
            </div>

            <div className="course-analytics-highlights analytics-highlights--dashboard">
              <div className="course-analytics-highlight course-analytics-highlight--hero">
                <span className="course-analytics-highlight__label">{t.desktopApp.title}</span>
                <strong>{desktopApp ? t.overview.releaseReady : t.overview.releaseMissing}</strong>
                <p>
                  {desktopApp
                    ? translate('dashboard.admin.desktopApp.currentFile', { name: desktopApp.filename })
                    : t.desktopApp.noFile}
                </p>
              </div>

              <div className="course-analytics-highlight course-analytics-highlight--hero">
                <span className="course-analytics-highlight__label">{t.announcements.title}</span>
                <strong>
                  {announcements.length
                    ? translate('dashboard.admin.overview.updatesReady', { count: announcements.length })
                    : t.overview.updatesMissing}
                </strong>
                <p>{`${t.announcements.generalAudience}: ${globalAnnouncementCount} • ${t.announcements.courseAudience}: ${courseAnnouncementCount}`}</p>
              </div>

              <div className="course-analytics-highlight course-analytics-highlight--hero course-analytics-highlight--warning">
                <span className="course-analytics-highlight__label">{t.testimonials.title}</span>
                <strong>
                  {testimonials.length
                    ? translate('dashboard.admin.overview.proofReady', { count: testimonials.length })
                    : t.overview.proofMissing}
                </strong>
                <p>{latestTestimonial?.role || t.testimonials.noTestimonials}</p>
              </div>
            </div>

            <div className="course-analytics-overview">
              <div className="course-analytics-stat">
                <div className="course-analytics-stat__icon">
                  <HiUsers />
                </div>
                <div>
                  <span>{t.stats.totalUsers}</span>
                  <strong>{platformStatsLoading ? '...' : platformStats.totalUsers}</strong>
                </div>
              </div>

              <div className="course-analytics-stat">
                <div className="course-analytics-stat__icon">
                  <HiBookOpen />
                </div>
                <div>
                  <span>{t.stats.liveCourses}</span>
                  <strong>{platformStatsLoading ? '...' : platformStats.totalCourses}</strong>
                </div>
              </div>

              <div className="course-analytics-stat">
                <div className="course-analytics-stat__icon">
                  <HiBellAlert />
                </div>
                <div>
                  <span>{t.announcements.generalAudience}</span>
                  <strong>{globalAnnouncementCount}</strong>
                </div>
              </div>

              <div className="course-analytics-stat">
                <div className="course-analytics-stat__icon">
                  <HiStar />
                </div>
                <div>
                  <span>{translate('landingDownload.downloadsLabel')}</span>
                  <strong>{desktopApp?.download_count || 0}</strong>
                </div>
              </div>
            </div>
          </section>

          <div className="admin-overview-grid">
            <section className="admin-overview-card">
              <div className="workspace-panel-header admin-card-header">
                <div>
                  <span className="admin-copy-badge">{t.desktopApp.title}</span>
                  <h3>{t.overview.releaseTitle}</h3>
                  <p>{t.overview.releaseDescription}</p>
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('desktop')}>
                  {t.tabs.desktop}
                </button>
              </div>

              {desktopAppLoading ? (
                <PanelStatusSkeleton visible={showDesktopAppSkeleton} />
              ) : desktopApp ? (
                <div className="admin-kpi-grid">
                  <article className="admin-kpi-card">
                    <span>{t.desktopApp.versionLabel}</span>
                    <strong>{desktopApp.version || common.notAvailable}</strong>
                  </article>
                  <article className="admin-kpi-card">
                    <span>{translate('landingDownload.downloadsLabel')}</span>
                    <strong>{desktopApp.download_count || 0}</strong>
                  </article>
                  <article className="admin-kpi-card">
                    <span>{common.files}</span>
                    <strong>{formatFileSize(desktopApp.file_size)}</strong>
                  </article>
                  <article className="admin-kpi-card">
                    <span>{translate('dashboard.admin.desktopApp.uploadedOn', { date: formatDate(desktopApp.updated_at) })}</span>
                    <strong>{desktopApp.filename}</strong>
                  </article>
                </div>
              ) : (
                <p className="empty-state">{t.desktopApp.noFile}</p>
              )}
            </section>

            <section className="admin-overview-card">
              <div className="workspace-panel-header admin-card-header">
                <div>
                  <span className="admin-copy-badge">{t.announcements.title}</span>
                  <h3>{t.overview.commsTitle}</h3>
                  <p>{t.overview.commsDescription}</p>
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('announcements')}>
                  {t.tabs.announcements}
                </button>
              </div>

              <div className="admin-kpi-grid">
                <article className="admin-kpi-card">
                  <span>{t.announcements.generalAudience}</span>
                  <strong>{globalAnnouncementCount}</strong>
                </article>
                <article className="admin-kpi-card">
                  <span>{t.announcements.courseAudience}</span>
                  <strong>{courseAnnouncementCount}</strong>
                </article>
                <article className="admin-kpi-card">
                  <span>{t.stats.liveCourses}</span>
                  <strong>{courses.length}</strong>
                </article>
                <article className="admin-kpi-card">
                  <span>{t.announcements.titleLabel}</span>
                  <strong>{latestAnnouncement?.title || common.notAvailable}</strong>
                </article>
              </div>
            </section>

            <section className="admin-overview-card">
              <div className="workspace-panel-header admin-card-header">
                <div>
                  <span className="admin-copy-badge">{t.overview.quickLinksTitle}</span>
                  <h3>{t.overview.quickLinksTitle}</h3>
                  <p>{t.overview.quickLinksDescription}</p>
                </div>
              </div>

              <div className="admin-quick-links">
                <button type="button" className="admin-quick-link" onClick={() => setActiveTab('announcements')}>
                  <HiBellAlert />
                  <div>
                    <strong>{t.tabs.announcements}</strong>
                    <span>{t.announcements.description}</span>
                  </div>
                </button>
                <button type="button" className="admin-quick-link" onClick={() => setActiveTab('users')}>
                  <HiUsers />
                  <div>
                    <strong>{t.tabs.users}</strong>
                    <span>{t.userManagement.description}</span>
                  </div>
                </button>
                <button type="button" className="admin-quick-link" onClick={() => setActiveTab('testimonials')}>
                  <HiSparkles />
                  <div>
                    <strong>{t.tabs.testimonials}</strong>
                    <span>{t.testimonials.description}</span>
                  </div>
                </button>
                <button type="button" className="admin-quick-link" onClick={() => setActiveTab('desktop')}>
                  <FiUpload />
                  <div>
                    <strong>{t.tabs.desktop}</strong>
                    <span>{t.desktopApp.description}</span>
                  </div>
                </button>
              </div>
            </section>
          </div>

          <div className="admin-overview-grid admin-overview-grid--secondary">
            <section className="admin-overview-card">
              <div className="workspace-panel-header admin-card-header">
                <div>
                  <span className="admin-copy-badge">{t.announcements.title}</span>
                  <h3>{t.overview.latestAnnouncements}</h3>
                </div>
              </div>

              {announcementsLoading ? (
                <p className="empty-state">{common.loading}</p>
              ) : recentAnnouncements.length ? (
                <div className="dashboard-announcements-feed admin-overview-feed">
                  {recentAnnouncements.map((announcement) => (
                    <article key={announcement._id} className="dashboard-announcement-item">
                      <div className="dashboard-announcement-item__meta">
                        <div>
                          <h4>{announcement.title}</h4>
                          <p>
                            {announcement.audience_type === 'GLOBAL'
                              ? t.announcements.generalAudience
                              : announcement.course_id?.course_name || t.announcements.courseAudience}
                            {' • '}
                            {formatDate(announcement.createdAt, announcementDateFormatter)}
                          </p>
                        </div>
                      </div>
                      <p className="dashboard-announcement-item__body">{announcement.message}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">{t.overview.noAnnouncements}</p>
              )}
            </section>

            <section className="admin-overview-card">
              <div className="workspace-panel-header admin-card-header">
                <div>
                  <span className="admin-copy-badge">{t.testimonials.title}</span>
                  <h3>{t.overview.latestTestimonials}</h3>
                </div>
              </div>

              {testimonialsLoading ? (
                <PanelStatusSkeleton visible={showTestimonialStatus} />
              ) : recentTestimonials.length ? (
                <div className="admin-testimonials-list admin-testimonials-list--compact">
                  {recentTestimonials.map((testimonial) => (
                    <article key={testimonial._id} className="admin-testimonial-item">
                      <div className="admin-testimonial-item__header">
                        {testimonial.image_path ? (
                          <img
                            className="admin-testimonial-item__avatar"
                            src={getUploadUrl(testimonial.image_path)}
                            alt={testimonial.name}
                          />
                        ) : (
                          <div className="admin-testimonial-item__avatar admin-testimonial-item__avatar--placeholder">
                            {testimonial.name?.charAt(0)?.toUpperCase() || 'I'}
                          </div>
                        )}
                        <div className="admin-testimonial-item__meta">
                          <strong>{testimonial.name}</strong>
                          <span>{testimonial.role}</span>
                        </div>
                      </div>
                      <p className="admin-testimonial-item__quote">{testimonial.quote}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">{t.overview.noTestimonials}</p>
              )}
            </section>
          </div>

          <section className="recent-activity">
            <h3>{t.activity.title}</h3>
            <div className="activity-list">
              {activityItems.map((item) => (
                <div key={`${item.time}-${item.text}`} className="activity-item">
                  <span className="activity-time">{item.time}</span>
                  <span className="activity-text">{item.text}</span>
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      )}

      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
          <div className="workspace-panel-header workspace-panel-header--stacked">
            <div className="workspace-panel-header__copy">
              <span className="workspace-panel-header__eyebrow">{t.tabs.users}</span>
              <h3>{t.userManagement.title}</h3>
              <p className="workspace-panel-subtitle">{t.userManagement.description}</p>
            </div>

            <div className="dashboard-inline-metrics">
              <article className="dashboard-inline-metric">
                <span>{t.userManagement.publicSignupLabel}</span>
                <strong>{translations.auth.roles.student}</strong>
              </article>
              <article className="dashboard-inline-metric">
                <span>{t.userManagement.allowedRolesLabel}</span>
                <strong>{t.userManagement.allowedRolesValue}</strong>
              </article>
            </div>
          </div>

          <div className="admin-management-layout">
            <section className="admin-form-card">
              <p className="admin-form-card__intro">{t.userManagement.description}</p>
              <label className="admin-installer-panel__label">
                {t.userManagement.nameLabel}
                <input
                  type="text"
                  className="admin-installer-panel__input"
                  placeholder={t.userManagement.namePlaceholder}
                  value={privilegedUserForm.name}
                  onChange={(event) => handlePrivilegedUserFieldChange('name', event.target.value)}
                />
              </label>

              <label className="admin-installer-panel__label">
                {t.userManagement.emailLabel}
                <input
                  type="email"
                  className="admin-installer-panel__input"
                  placeholder={t.userManagement.emailPlaceholder}
                  value={privilegedUserForm.email}
                  onChange={(event) => handlePrivilegedUserFieldChange('email', event.target.value)}
                />
              </label>

              <label className="admin-installer-panel__label">
                {t.userManagement.passwordLabel}
                <input
                  type="password"
                  className="admin-installer-panel__input"
                  placeholder={t.userManagement.passwordPlaceholder}
                  value={privilegedUserForm.password}
                  onChange={(event) => handlePrivilegedUserFieldChange('password', event.target.value)}
                />
              </label>

              <label className="admin-installer-panel__label">
                {t.userManagement.roleLabel}
                <select
                  className="admin-installer-panel__input"
                  value={privilegedUserForm.role}
                  onChange={(event) => handlePrivilegedUserFieldChange('role', event.target.value)}
                >
                  <option value="INSTRUCTOR">{translations.auth.roles.teacher}</option>
                  <option value="ADMIN">{translations.auth.roles.admin}</option>
                </select>
              </label>

              <label className="admin-installer-panel__label">
                {t.userManagement.institutionLabel}
                <input
                  type="text"
                  className="admin-installer-panel__input"
                  placeholder={t.userManagement.institutionPlaceholder}
                  value={privilegedUserForm.institution}
                  onChange={(event) => handlePrivilegedUserFieldChange('institution', event.target.value)}
                />
              </label>

              <div className="admin-installer-panel__actions">
                <button type="button" className="btn btn-primary" onClick={handleCreatePrivilegedUser}>
                  {savingPrivilegedUser ? t.userManagement.creating : t.userManagement.createAction}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetPrivilegedUserForm}>
                  {t.userManagement.clear}
                </button>
              </div>

              {privilegedUserMessage ? (
                <p className="admin-installer-panel__status admin-installer-panel__status--message">{privilegedUserMessage}</p>
              ) : null}
            </section>

            <section className="admin-overview-card">
              <div className="workspace-panel-header admin-card-header">
                <div>
                  <span className="admin-copy-badge">{t.userManagement.securityBadge}</span>
                  <h3>{t.userManagement.securityTitle}</h3>
                  <p>{t.userManagement.securityDescription}</p>
                </div>
              </div>

              <div className="course-analytics-highlights">
                <div className="course-analytics-highlight">
                  <span className="course-analytics-highlight__label">{t.userManagement.publicSignupLabel}</span>
                  <strong>{translations.auth.roles.student}</strong>
                  <p>{t.userManagement.publicSignupDescription}</p>
                </div>
                <div className="course-analytics-highlight">
                  <span className="course-analytics-highlight__label">{t.userManagement.allowedRolesLabel}</span>
                  <strong>{t.userManagement.allowedRolesValue}</strong>
                  <p>{t.userManagement.allowedRolesDescription}</p>
                </div>
              </div>

              <div className="admin-quick-links">
                <div className="admin-quick-link admin-quick-link--static">
                  <HiUsers />
                  <div>
                    <strong>{t.userManagement.publicSignupLabel}</strong>
                    <span>{t.userManagement.publicSignupDescription}</span>
                  </div>
                </div>
                <div className="admin-quick-link admin-quick-link--static">
                  <HiUsers />
                  <div>
                    <strong>{t.userManagement.allowedRolesLabel}</strong>
                    <span>{t.userManagement.allowedRolesDescription}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      )}

      {activeTab === 'announcements' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
          <div className="workspace-panel-header workspace-panel-header--stacked">
            <div className="workspace-panel-header__copy">
              <span className="workspace-panel-header__eyebrow">{t.tabs.announcements}</span>
              <h3>{t.announcements.title}</h3>
              <p className="workspace-panel-subtitle">{t.announcements.description}</p>
            </div>

            <div className="dashboard-inline-metrics">
              <article className="dashboard-inline-metric">
                <span>{common.active}</span>
                <strong>{announcements.length}</strong>
              </article>
              <article className="dashboard-inline-metric">
                <span>{t.announcements.generalAudience}</span>
                <strong>{globalAnnouncementCount}</strong>
              </article>
              <article className="dashboard-inline-metric">
                <span>{t.announcements.courseAudience}</span>
                <strong>{courseAnnouncementCount}</strong>
              </article>
            </div>
          </div>

          <div className="dashboard-announcements-layout">
            <section className="dashboard-announcement-form-card">
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
                  placeholder={t.announcements.titlePlaceholder}
                  value={announcementForm.title}
                  onChange={(event) => handleAnnouncementFieldChange('title', event.target.value)}
                />
              </label>

              <label className="admin-installer-panel__label">
                {t.announcements.messageLabel}
                <textarea
                  className="admin-testimonial-form__textarea"
                  placeholder={t.announcements.messagePlaceholder}
                  value={announcementForm.message}
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
                        placeholder={t.announcements.timerCustomPlaceholder}
                        value={announcementForm.customTimerValue}
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
                  onClick={handleCreateAnnouncement}
                  disabled={savingAnnouncement || !announcementForm.title.trim() || !announcementForm.message.trim() || (announcementForm.audienceType === 'COURSE' && !announcementForm.courseId) || !isAnnouncementTimerReady}
                >
                  {savingAnnouncement ? t.announcements.creating : t.announcements.create}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetAnnouncementForm}>
                  {t.announcements.clear}
                </button>
              </div>

              {announcementMessage ? (
                <p className="admin-installer-panel__status admin-installer-panel__status--message">{announcementMessage}</p>
              ) : null}
            </section>

            <div className="dashboard-announcements-feed">
              {announcementsLoading ? (
                <p className="empty-state">{common.loading}</p>
              ) : announcements.length ? announcements.map((announcement) => (
                <article key={announcement._id} className="dashboard-announcement-item">
                  <div className="dashboard-announcement-item__meta">
                    <div>
                      <h4>{announcement.title}</h4>
                      <p>
                        {announcement.audience_type === 'GLOBAL'
                          ? t.announcements.generalAudience
                          : announcement.course_id?.course_name || t.announcements.courseAudience}
                        {' • '}
                        {announcement.created_by?.name || translations.auth.roles.admin}
                        {' • '}
                        {formatDate(announcement.createdAt, announcementDateFormatter)}
                      </p>
                      {announcement.expires_at ? (
                        <p className="dashboard-announcement-item__detail">
                          {t.announcements.expiresOn.replace('{date}', formatDate(announcement.expires_at, announcementDateFormatter))}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary admin-installer-panel__remove"
                      disabled={deletingAnnouncementId === announcement._id}
                      onClick={() => handleDeleteAnnouncement(announcement._id)}
                    >
                      {deletingAnnouncementId === announcement._id ? t.announcements.deleting : t.announcements.delete}
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

      {activeTab === 'testimonials' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
          <div className="workspace-panel-header workspace-panel-header--stacked">
            <div className="workspace-panel-header__copy">
              <span className="workspace-panel-header__eyebrow">{t.tabs.testimonials}</span>
              <h3>{t.testimonials.title}</h3>
              <p className="workspace-panel-subtitle">{t.testimonials.description}</p>
            </div>

            <div className="dashboard-inline-metrics">
              <article className="dashboard-inline-metric">
                <span>{common.active}</span>
                <strong>{testimonials.length}</strong>
              </article>
              <article className="dashboard-inline-metric">
                <span>{testimonialForm.id ? common.update : common.create}</span>
                <strong>{testimonialForm.id ? t.testimonials.edit : t.testimonials.add}</strong>
              </article>
            </div>
          </div>

          <div className="admin-management-layout">
            <section className="admin-form-card">
              <p className="admin-form-card__intro">{t.testimonials.description}</p>
              <label className="admin-installer-panel__label">
                {t.testimonials.nameLabel}
                <input
                  type="text"
                  className="admin-installer-panel__input"
                  placeholder={t.testimonials.namePlaceholder}
                  value={testimonialForm.name}
                  onChange={(event) => handleTestimonialFieldChange('name', event.target.value)}
                />
              </label>

              <label className="admin-installer-panel__label">
                {t.testimonials.roleLabel}
                <input
                  type="text"
                  className="admin-installer-panel__input"
                  placeholder={t.testimonials.rolePlaceholder}
                  value={testimonialForm.role}
                  onChange={(event) => handleTestimonialFieldChange('role', event.target.value)}
                />
              </label>

              <label className="admin-installer-panel__label">
                {t.testimonials.quoteLabel}
                <textarea
                  className="admin-testimonial-form__textarea"
                  placeholder={t.testimonials.quotePlaceholder}
                  value={testimonialForm.quote}
                  onChange={(event) => handleTestimonialFieldChange('quote', event.target.value)}
                />
              </label>

              <input
                ref={testimonialImageInputRef}
                type="file"
                accept="image/*"
                className="admin-installer-panel__file-input"
                onChange={handleTestimonialImageSelection}
              />

              <div className="admin-installer-panel__actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => testimonialImageInputRef.current?.click()}
                >
                  <FiUpload /> {testimonialForm.imagePath ? t.testimonials.replaceImage : t.testimonials.chooseImage}
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveTestimonial}>
                  {testimonialForm.id ? t.testimonials.update : t.testimonials.add}
                </button>
                {testimonialForm.id ? (
                  <button type="button" className="btn btn-secondary" onClick={resetTestimonialForm}>
                    {t.testimonials.cancelEdit}
                  </button>
                ) : null}
              </div>

              <p className="admin-installer-panel__hint">{t.testimonials.imageHint}</p>
              {testimonialForm.imageFile ? (
                <p className="admin-installer-panel__status">
                  {translate('dashboard.admin.testimonials.selectedImage', { name: testimonialForm.imageFile.name })}
                </p>
              ) : null}
              {testimonialMessage ? (
                <p className="admin-installer-panel__status admin-installer-panel__status--message">{testimonialMessage}</p>
              ) : null}
            </section>

            <div className="admin-list-card admin-testimonials-list">
              {testimonialsLoading ? (
                <PanelStatusSkeleton visible={showTestimonialStatus} />
              ) : testimonials.length ? testimonials.map((testimonial) => (
                <article key={testimonial._id} className="admin-testimonial-item">
                  <div className="admin-testimonial-item__header">
                    {testimonial.image_path ? (
                      <img
                        className="admin-testimonial-item__avatar"
                        src={getUploadUrl(testimonial.image_path)}
                        alt={testimonial.name}
                      />
                    ) : (
                      <div className="admin-testimonial-item__avatar admin-testimonial-item__avatar--placeholder">
                        {testimonial.name?.charAt(0)?.toUpperCase() || 'I'}
                      </div>
                    )}
                    <div className="admin-testimonial-item__meta">
                      <strong>{testimonial.name}</strong>
                      <span>{testimonial.role}</span>
                    </div>
                  </div>
                  <p className="admin-testimonial-item__quote">{testimonial.quote}</p>
                  <div className="admin-testimonial-item__actions">
                    <button type="button" className="btn btn-secondary" onClick={() => handleEditTestimonial(testimonial)}>
                      {t.testimonials.edit}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary admin-installer-panel__remove"
                      disabled={deletingTestimonialId === testimonial._id}
                      onClick={() => handleDeleteTestimonial(testimonial._id)}
                    >
                      {deletingTestimonialId === testimonial._id ? common.deleting : t.testimonials.delete}
                    </button>
                  </div>
                </article>
              )) : (
                <p className="empty-state">{t.testimonials.noTestimonials}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'desktop' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="workspace-panel">
          <div className="workspace-panel-header workspace-panel-header--stacked">
            <div className="workspace-panel-header__copy">
              <span className="workspace-panel-header__eyebrow">{t.tabs.desktop}</span>
              <h3>{t.desktopApp.title}</h3>
              <p className="workspace-panel-subtitle">{t.desktopApp.description}</p>
            </div>

            <div className="dashboard-inline-metrics">
              <article className="dashboard-inline-metric">
                <span>{t.desktopApp.versionLabel}</span>
                <strong>{desktopApp?.version || common.notAvailable}</strong>
              </article>
              <article className="dashboard-inline-metric">
                <span>{translate('landingDownload.downloadsLabel')}</span>
                <strong>{desktopApp?.download_count || 0}</strong>
              </article>
              <article className="dashboard-inline-metric">
                <span>{common.files}</span>
                <strong>{desktopApp ? formatFileSize(desktopApp.file_size) : common.notAvailable}</strong>
              </article>
            </div>
          </div>

          <div className="admin-management-layout admin-management-layout--desktop">
            <section className="admin-overview-card">
              <div className="workspace-panel-header admin-card-header">
                <div>
                  <span className="admin-copy-badge">{t.overview.releaseTitle}</span>
                  <h3>{t.desktopApp.title}</h3>
                  <p>{t.overview.releaseDescription}</p>
                </div>
              </div>

              {desktopAppLoading ? (
                <PanelStatusSkeleton visible={showDesktopAppSkeleton} />
              ) : desktopApp ? (
                <div className="admin-desktop-metrics">
                  <article className="admin-desktop-metric">
                    <span>{t.desktopApp.versionLabel}</span>
                    <strong>{desktopApp.version || common.notAvailable}</strong>
                  </article>
                  <article className="admin-desktop-metric">
                    <span>{common.files}</span>
                    <strong>{desktopApp.filename}</strong>
                  </article>
                  <article className="admin-desktop-metric">
                    <span>{translate('landingDownload.downloadsLabel')}</span>
                    <strong>{desktopApp.download_count || 0}</strong>
                  </article>
                  <article className="admin-desktop-metric">
                    <span>{translate('dashboard.admin.desktopApp.uploadedOn', { date: formatDate(desktopApp.updated_at) })}</span>
                    <strong>{formatFileSize(desktopApp.file_size)}</strong>
                  </article>
                </div>
              ) : (
                <p className="empty-state">{t.desktopApp.noFile}</p>
              )}

              {desktopApp ? (
                <div className="admin-installer-panel__actions">
                  <a href={`${API_BASE_URL}/api/desktop-app/download`} className="btn btn-secondary">
                    <FiDownload /> {t.desktopApp.download}
                  </a>
                  <button
                    type="button"
                    className="btn btn-secondary admin-installer-panel__remove"
                    onClick={handleDesktopAppRemove}
                    disabled={removingDesktopApp}
                  >
                    <FiTrash2 /> {removingDesktopApp ? t.desktopApp.removing : t.desktopApp.remove}
                  </button>
                </div>
              ) : null}
            </section>

            <section className="admin-form-card admin-installer-panel admin-installer-panel--wide">
              <p className="admin-form-card__intro">{t.overview.releaseDescription}</p>
              <div className="admin-installer-panel__fields">
                <label className="admin-installer-panel__label">
                  {t.desktopApp.versionLabel}
                  <input
                    type="text"
                    className="admin-installer-panel__input"
                    placeholder={t.desktopApp.versionPlaceholder}
                    value={desktopVersion}
                    onChange={(event) => setDesktopVersion(event.target.value)}
                  />
                </label>

                <input
                  ref={installerInputRef}
                  type="file"
                  accept=".exe,.msi"
                  className="admin-installer-panel__file-input"
                  onChange={handleInstallerSelection}
                />

                <div className="admin-installer-panel__actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => installerInputRef.current?.click()}
                  >
                    <FiUpload /> {desktopApp ? t.desktopApp.replace : t.desktopApp.chooseFile}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleDesktopAppUpload}
                    disabled={!selectedInstaller || uploadingDesktopApp}
                  >
                    <FiUpload /> {uploadingDesktopApp ? t.desktopApp.uploading : t.desktopApp.upload}
                  </button>
                </div>

                <p className="admin-installer-panel__hint">{t.desktopApp.onlyFormats}</p>
                {selectedInstaller ? (
                  <p className="admin-installer-panel__status">
                    {translate('dashboard.admin.desktopApp.selectedFile', { name: selectedInstaller.name })}
                  </p>
                ) : null}
                {desktopAppMessage ? (
                  <p className="admin-installer-panel__status admin-installer-panel__status--message">{desktopAppMessage}</p>
                ) : null}
              </div>
            </section>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default AdminDashboardWorkspace

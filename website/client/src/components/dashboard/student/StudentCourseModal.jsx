import React from 'react'
import { motion } from 'framer-motion'
import {
  HiArrowDownTray,
  HiArrowTopRightOnSquare,
  HiCheckCircle,
  HiClock,
  HiPaperClip,
  HiStar,
  HiUserGroup,
} from 'react-icons/hi2'

function StudentCourseModal({
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
}) {
  if (!selectedCourse) return null

  return (
    <div className="neumorphic-modal-overlay" onClick={() => setSelectedCourse(null)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="neumorphic-modal-content"
        onClick={(event) => event.stopPropagation()}
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
              {selectedCourse.subject && <span className="course-modal-chip">{selectedCourse.subject}</span>}
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
                  <div className="neumorphic-module-header" onClick={() => toggleModule(module._id)}>
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
                          {module.files.map((file, fileIndex) => (
                            <div key={`${file.path}-${fileIndex}`} className="module-resource-item">
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
                                <button
                                  type="button"
                                  className="module-resource-action module-resource-action--secondary"
                                  onClick={() => openUploadedFile(file.path)}
                                >
                                  <HiArrowTopRightOnSquare /> {t.courseModal.openResource}
                                </button>
                                <button
                                  type="button"
                                  className="module-resource-action module-resource-action--primary"
                                  onClick={() => handleResourceDownload(file.path, file.name)}
                                >
                                  <HiArrowDownTray /> {t.courseModal.downloadResource}
                                </button>
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
                          {courseTasks[module._id].map((task) => {
                            const deadlinePassed = isTaskDeadlinePassed(task)

                            return (
                              <div key={task._id} className="neumorphic-task-item">
                                <div className="task-info">
                                  <span className="task-name">{task.task_name}</span>
                                  <span className="task-meta">
                                    <span className={`diff-${task.difficulty.toLowerCase()}`}>{getDifficultyLabel(task.difficulty)}</span> | {task.language} | <HiClock /> {task.time_limit}m
                                    {task.allow_collaboration && <span style={{ marginLeft: '10px', color: '#3b82f6', fontWeight: 600 }}>• {t.courseModal.teamworkAllowed}</span>}
                                    {(task.has_deadline || task.deadline_at) && (
                                      <span className={`task-deadline-badge ${deadlinePassed ? 'is-passed' : ''}`}>
                                        {t.courseModal.deadline}: {formatTaskDeadline(task.deadline_at)}
                                      </span>
                                    )}
                                    {deadlinePassed && (
                                      <span className="task-deadline-badge is-passed">{t.courseModal.deadlinePassed}</span>
                                    )}
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
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        event.preventDefault()
                                        setCollabModalTask(task)
                                      }}
                                    >
                                      <HiUserGroup /> {t.courseModal.askForCollaboration}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-primary task-complete-btn"
                                    disabled={deadlinePassed}
                                    onClick={() => setCompletingTask(task)}
                                  >
                                    <HiCheckCircle /> {deadlinePassed ? t.courseModal.deadlinePassed : t.courseModal.complete}
                                  </button>
                                </div>
                              </div>
                            )
                          })}
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
  )
}

export default StudentCourseModal

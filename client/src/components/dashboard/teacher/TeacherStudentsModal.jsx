import React from 'react'
import { HiPlus } from 'react-icons/hi2'
import { StudentListSkeleton } from '../../ui/Skeleton'

function TeacherStudentsModal({
  viewingStudents,
  selectedCourse,
  setViewingStudents,
  setStudents,
  translate,
  students,
  setShowAddStudentsModal,
  t,
  loadingStudents,
  showStudentSkeletons,
  common,
  getStatusLabel,
  handleEnrollmentStatus,
}) {
  if (!viewingStudents || !selectedCourse) return null

  return (
    <div className="modal-overlay" onClick={() => { setViewingStudents(false); setStudents([]) }}>
      <div className="modal-content course-students-modal" onClick={(event) => event.stopPropagation()}>
        <div className="students-modal-header">
          <div className="students-modal-title">
            <h2>{selectedCourse.course_name}</h2>
            <p>{translate('dashboard.teacher.studentsModal.enrolledStudents', { count: students.length })}</p>
          </div>
          <div className="students-modal-actions">
            <button className="btn btn-primary" onClick={() => setShowAddStudentsModal(true)}>
              <HiPlus /> {t.studentsModal.addStudents}
            </button>
            <button className="btn btn-secondary" onClick={() => { setViewingStudents(false); setStudents([]) }}>
              {t.studentsModal.close}
            </button>
          </div>
        </div>

        <div className="students-modal-body">
          {loadingStudents ? <StudentListSkeleton count={5} visible={showStudentSkeletons} /> : (
            students.length === 0 ? (
              <p className="no-modules">{t.studentsModal.empty}</p>
            ) : (
              <div className="students-list">
                {students.map((student) => (
                  <div key={student._id} className="student-row" data-status={student.status?.toLowerCase()}>
                    <div className="student-main">
                      <span className="student-name">{student.name}</span>
                      <span className="student-email">{student.email}</span>
                      <span className="student-enrollment">{student.enrollment_number || common.notAvailable}</span>
                    </div>
                    <div className="student-actions">
                      <span className={`student-status-chip ${student.status?.toLowerCase()}`}>
                        {getStatusLabel(student.status)}
                      </span>
                      {student.status === 'PENDING' && (
                        <>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleEnrollmentStatus(student.enrollment_id, 'ACTIVE')}
                          >
                            {t.studentsModal.approve}
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleEnrollmentStatus(student.enrollment_id, 'REJECTED')}
                          >
                            {t.studentsModal.reject}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default TeacherStudentsModal

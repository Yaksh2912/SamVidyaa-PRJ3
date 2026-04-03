import React, { useState } from 'react'
import API_BASE_URL from '../config'
import { useI18n } from '../context/I18nContext'
import '../components/ModalForm.css'

function AddStudentsModal({ onClose, courseId, onStudentsAdded }) {
    const { translations, t: translate } = useI18n()
    const t = translations.forms.addStudents
    const [activeTab, setActiveTab] = useState('email') // 'email' | 'excel'
    const [studentEmails, setStudentEmails] = useState('')
    const [excelFile, setExcelFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')

    const handleEmailSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setResult(null)

        if (!studentEmails.trim()) {
            setError(t.emailRequired)
            return
        }

        setLoading(true)

        try {
            const userStr = localStorage.getItem('user')
            const token = userStr ? JSON.parse(userStr).token : null
            const parsedEmails = studentEmails
                .split(/[\n,;]+/)
                .map((email) => email.trim())
                .filter(Boolean)

            const response = await fetch(`${API_BASE_URL}/api/enrollments/bulk-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    course_id: courseId,
                    student_emails: parsedEmails
                })
            })

            const data = await response.json()

            if (response.ok) {
                setResult(data)
                if (onStudentsAdded) onStudentsAdded()
            } else {
                setError(data.message || t.emailFailed)
            }
        } catch (err) {
            console.error('Email enroll error:', err)
            setError(translations.common.errors.somethingWentWrong)
        } finally {
            setLoading(false)
        }
    }

    const handleExcelSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setResult(null)

        if (!excelFile) {
            setError(t.excelRequired)
            return
        }

        setLoading(true)

        try {
            const userStr = localStorage.getItem('user')
            const token = userStr ? JSON.parse(userStr).token : null

            const formData = new FormData()
            formData.append('excel', excelFile)
            formData.append('course_id', courseId)

            const response = await fetch(`${API_BASE_URL}/api/enrollments/excel-upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })

            const data = await response.json()

            if (response.ok) {
                setResult(data)
                if (onStudentsAdded) onStudentsAdded()
            } else {
                setError(data.message || t.excelFailed)
            }
        } catch (err) {
            console.error('Excel upload error:', err)
            setError(translations.common.errors.somethingWentWrong)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content add-students-modal" onClick={(e) => e.stopPropagation()}>
                <h2>{t.title}</h2>

                <div className="modal-tabs add-students-tabs">
                    <button
                        type="button"
                        className={`add-students-tab ${activeTab === 'email' ? 'is-active' : ''}`}
                        onClick={() => { setActiveTab('email'); setError(''); setResult(null); }}
                    >
                        {t.byEmail}
                    </button>
                    <button
                        type="button"
                        className={`add-students-tab ${activeTab === 'excel' ? 'is-active' : ''}`}
                        onClick={() => { setActiveTab('excel'); setError(''); setResult(null); }}
                    >
                        {t.uploadExcel}
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                {result && (
                    <div className="add-students-result">
                        <strong className="add-students-result__title">✓ {result.message}</strong>
                        <div className="add-students-result__grid">
                            <span>{translate('forms.addStudents.enrolled', { count: result.enrolled })}</span>
                            <span>{translate('forms.addStudents.skipped', { count: result.skipped })}</span>
                            {result.not_found !== undefined && <span>{translate('forms.addStudents.notFound', { count: result.not_found })}</span>}
                            {result.invalid !== undefined && <span>{translate('forms.addStudents.invalidEmails', { count: result.invalid })}</span>}
                            {result.total_processed !== undefined && <span>{translate('forms.addStudents.processed', { count: result.total_processed })}</span>}
                        </div>
                    </div>
                )}

                {activeTab === 'email' ? (
                    <form onSubmit={handleEmailSubmit} className="add-students-form">
                        <p className="add-students-help">
                            {t.emailHelp}
                        </p>
                        <div className="form-group">
                            <label>{t.studentEmails}</label>
                            <textarea
                                className="add-students-textarea"
                                value={studentEmails}
                                onChange={(e) => setStudentEmails(e.target.value)}
                                placeholder={t.studentEmailsPlaceholder}
                                rows={10}
                                required
                            />
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                {t.cancel}
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? t.enrolling : t.enrollStudents}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleExcelSubmit} className="add-students-form">
                        <p className="add-students-help">
                            {t.excelHelp}
                        </p>
                        <div className="form-group">
                            <label>{t.selectExcel}</label>
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={(e) => setExcelFile(e.target.files[0])}
                                required
                            />
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                {t.cancel}
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading || !excelFile}>
                                {loading ? t.uploading : t.uploadAndEnroll}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default AddStudentsModal

import React, { useState } from 'react'
import API_BASE_URL from '../config'
import '../components/ModalForm.css'

function AddStudentsModal({ onClose, courseId, onStudentsAdded }) {
    const [activeTab, setActiveTab] = useState('range') // 'range' | 'excel'
    const [startEnrollment, setStartEnrollment] = useState('')
    const [endEnrollment, setEndEnrollment] = useState('')
    const [excelFile, setExcelFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')

    const handleRangeSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setResult(null)

        if (!startEnrollment || !endEnrollment) {
            setError('Both enrollment numbers are required')
            return
        }

        setLoading(true)

        try {
            const userStr = localStorage.getItem('user')
            const token = userStr ? JSON.parse(userStr).token : null

            const response = await fetch(`${API_BASE_URL}/api/enrollments/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    course_id: courseId,
                    start_enrollment: startEnrollment.trim(),
                    end_enrollment: endEnrollment.trim()
                })
            })

            const data = await response.json()

            if (response.ok) {
                setResult(data)
                if (onStudentsAdded) onStudentsAdded()
            } else {
                setError(data.message || 'Bulk enrollment failed')
            }
        } catch (err) {
            console.error('Bulk enroll error:', err)
            setError('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const handleExcelSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setResult(null)

        if (!excelFile) {
            setError('Please select an Excel file')
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
                setError(data.message || 'Excel upload failed')
            }
        } catch (err) {
            console.error('Excel upload error:', err)
            setError('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Add Students</h2>

                <div className="modal-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <button type="button" onClick={() => { setActiveTab('range'); setError(''); setResult(null); }} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: activeTab === 'range' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'range' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: activeTab === 'range' ? '600' : 'normal' }}>By Enrollment Range</button>
                    <button type="button" onClick={() => { setActiveTab('excel'); setError(''); setResult(null); }} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: activeTab === 'excel' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'excel' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: activeTab === 'excel' ? '600' : 'normal' }}>Upload Excel</button>
                </div>

                {error && <div className="error-message">{error}</div>}

                {result && (
                    <div style={{
                        background: 'var(--status-success-bg)',
                        border: '1px solid var(--status-success-border)',
                        borderRadius: 'var(--border-radius-sm)',
                        padding: '1rem',
                        marginBottom: '1rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem'
                    }}>
                        <strong style={{ color: 'var(--status-success-text)' }}>✓ {result.message}</strong>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <span><strong>{result.enrolled}</strong> enrolled</span>
                            <span><strong>{result.skipped}</strong> skipped</span>
                            {result.not_found !== undefined && <span><strong>{result.not_found}</strong> not found</span>}
                            {result.total_in_range !== undefined && <span><strong>{result.total_in_range}</strong> found in range</span>}
                        </div>
                    </div>
                )}

                {activeTab === 'range' ? (
                    <form onSubmit={handleRangeSubmit}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                            Enter a range of enrollment numbers to enroll all matching students into this course.
                        </p>
                        <div className="form-group-row" style={{ display: 'flex', gap: '1rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>From Enrollment Number</label>
                                <input
                                    type="text"
                                    value={startEnrollment}
                                    onChange={(e) => setStartEnrollment(e.target.value)}
                                    placeholder="e.g. 220101"
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>To Enrollment Number</label>
                                <input
                                    type="text"
                                    value={endEnrollment}
                                    onChange={(e) => setEndEnrollment(e.target.value)}
                                    placeholder="e.g. 220150"
                                    required
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Enrolling...' : 'Enroll Students'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleExcelSubmit}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                            Upload an Excel file containing list of students. File must include <strong>email</strong> and <strong>enrollment number</strong> columns.
                        </p>
                        <div className="form-group">
                            <label>Select Excel File (.xlsx, .xls, .csv)</label>
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={(e) => setExcelFile(e.target.files[0])}
                                required
                            />
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading || !excelFile}>
                                {loading ? 'Uploading...' : 'Upload & Enroll'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default AddStudentsModal


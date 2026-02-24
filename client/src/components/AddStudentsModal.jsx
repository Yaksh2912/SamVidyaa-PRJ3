import React, { useState } from 'react'
import '../components/ModalForm.css'

function AddStudentsModal({ onClose, courseId, onStudentsAdded }) {
    const [startEnrollment, setStartEnrollment] = useState('')
    const [endEnrollment, setEndEnrollment] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Add Students by Enrollment Range</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    Enter a range of enrollment numbers to enroll all matching students into this course.
                </p>

                {error && <div className="error-message">{error}</div>}

                {result && (
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: 'var(--border-radius-sm)',
                        padding: '1rem',
                        marginBottom: '1rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem'
                    }}>
                        <strong style={{ color: '#10b981' }}>✓ {result.message}</strong>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1.5rem' }}>
                            <span><strong>{result.enrolled}</strong> enrolled</span>
                            <span><strong>{result.skipped}</strong> skipped</span>
                            <span><strong>{result.total_in_range}</strong> found in range</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
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
            </div>
        </div>
    )
}

export default AddStudentsModal

import React, { useState } from 'react';
import { motion } from 'framer-motion';

function CreateCourseForm({ onClose, onCourseCreated }) {
    const [formData, setFormData] = useState({
        course_name: '',
        course_code: '',
        subject: '',
        description: '',
        course_test_questions: 5
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;

            const response = await fetch('http://localhost:5001/api/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create course');
            }

            const newCourse = await response.json();
            onCourseCreated(newCourse);
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <motion.div
                className="modal-content"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <h2>Create New Course</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Course Name</label>
                        <input
                            type="text"
                            name="course_name"
                            value={formData.course_name}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Intro to Python"
                        />
                    </div>
                    <div className="form-group-row">
                        <div className="form-group">
                            <label>Course Code</label>
                            <input
                                type="text"
                                name="course_code"
                                value={formData.course_code}
                                onChange={handleChange}
                                required
                                placeholder="e.g., CS101"
                            />
                        </div>
                        <div className="form-group">
                            <label>Subject</label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Computer Science"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Course details..."
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Course'}
                        </button>
                    </div>
                </form>
            </motion.div>
            <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: var(--bg-primary);
          padding: 2rem;
          border-radius: var(--border-radius-lg);
          width: 90%;
          max-width: 500px;
          box-shadow: var(--shadow-lg);
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group-row {
            display: flex;
            gap: 1rem;
        }
        .form-group-row .form-group {
            flex: 1;
        }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-secondary);
            font-weight: 500;
        }
        .form-group input, .form-group textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-light);
            border-radius: var(--border-radius-sm);
            background: var(--bg-secondary);
            color: var(--text-primary);
        }
        .error-message {
            color: var(--accent-error, #ff3b30);
            background: rgba(255, 59, 48, 0.1);
            padding: 0.75rem;
            border-radius: var(--border-radius-sm);
            margin-bottom: 1rem;
            font-size: 0.9rem;
        }
        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          justify-content: flex-end;
        }
      `}</style>
        </div>
    );
}

export default CreateCourseForm;

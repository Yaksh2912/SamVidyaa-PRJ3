import React, { useState } from 'react';
import { motion } from 'framer-motion';
import API_BASE_URL from '../config';
import { useI18n } from '../context/I18nContext';

function CreateCourseForm({ onClose, onCourseCreated }) {
    const { translations } = useI18n();
    const t = translations.forms.course;
    const [formData, setFormData] = useState({
        course_name: '',
        course_code: '',
        subject: '',
        description: '',
        course_test_questions: 5,
        points: 1000
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

            const response = await fetch(`${API_BASE_URL}/api/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || t.createFailed);
            }

            const newCourse = await response.json();
            onCourseCreated(newCourse);
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || translations.common.errors.somethingWentWrong);
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
                <h2>{t.title}</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>{t.courseName}</label>
                        <input
                            type="text"
                            name="course_name"
                            value={formData.course_name}
                            onChange={handleChange}
                            required
                            placeholder={t.courseNamePlaceholder}
                        />
                    </div>
                    <div className="form-group-row">
                        <div className="form-group">
                            <label>{t.courseCode}</label>
                            <input
                                type="text"
                                name="course_code"
                                value={formData.course_code}
                                onChange={handleChange}
                                required
                                placeholder={t.courseCodePlaceholder}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t.subject}</label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                placeholder={t.subjectPlaceholder}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t.coursePoints}</label>
                            <input
                                type="number"
                                name="points"
                                value={formData.points}
                                onChange={handleChange}
                                required
                                min="1"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>{t.description}</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            placeholder={t.descriptionPlaceholder}
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>{t.cancel}</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? t.creating : t.create}
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

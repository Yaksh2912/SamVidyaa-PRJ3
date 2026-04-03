import React, { useState } from 'react';
import { motion } from 'framer-motion';
import API_BASE_URL from '../config';
import { useI18n } from '../context/I18nContext';
import './ModalForm.css';

function CreateModuleForm({ onClose, onModuleSaved, courseId, initialData = null }) {
    const { translations } = useI18n();
    const t = translations.forms.module;
    const isEditing = Boolean(initialData);
    const [formData, setFormData] = useState({
        module_name: '',
        description: '',
        tasks_per_module: 10,
        module_test_questions: 3,
        is_active: true,
        points: 100
    });
    const [files, setFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    React.useEffect(() => {
        if (!initialData) return;

        setFormData({
            module_name: initialData.module_name || '',
            description: initialData.description || '',
            tasks_per_module: initialData.tasks_per_module || 10,
            module_test_questions: initialData.module_test_questions || 3,
            is_active: typeof initialData.is_active === 'boolean' ? initialData.is_active : true,
            points: initialData.points || 100
        });
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFiles(e.target.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        if (!formData.module_name) {
            setError(t.required);
            setIsSubmitting(false);
            return;
        }

        const submitData = new FormData();
        // courseId is passed as prop
        submitData.append('course_id', courseId);
        submitData.append('module_name', formData.module_name);
        submitData.append('description', formData.description);
        submitData.append('tasks_per_module', formData.tasks_per_module);
        submitData.append('module_test_questions', formData.module_test_questions);
        submitData.append('points', formData.points);
        submitData.append('is_active', formData.is_active);

        for (let i = 0; i < files.length; i++) {
            submitData.append('files', files[i]);
        }

        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;

            const response = await fetch(isEditing ? `${API_BASE_URL}/api/modules/${initialData._id}` : `${API_BASE_URL}/api/modules`, {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: submitData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || (isEditing ? t.updateFailed : t.createFailed));
            }

            const savedModule = await response.json();
            onModuleSaved(savedModule, isEditing);
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
                <h2>{isEditing ? t.editTitle : t.title}</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>{t.moduleName}</label>
                        <input
                            type="text"
                            name="module_name"
                            value={formData.module_name}
                            onChange={handleChange}
                            required
                            placeholder={t.moduleNamePlaceholder}
                        />
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

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>{t.tasksCount}</label>
                            <input
                                type="number"
                                name="tasks_per_module"
                                value={formData.tasks_per_module}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>{t.testQuestions}</label>
                            <input
                                type="number"
                                name="module_test_questions"
                                value={formData.module_test_questions}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>{t.modulePoints}</label>
                            <input
                                type="number"
                                name="points"
                                value={formData.points}
                                onChange={handleChange}
                                min="1"
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <label style={{ marginBottom: '0.5rem', display: 'block' }}>{t.status}</label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    className="checkbox-input"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                />
                                {t.active}
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t.resources}</label>
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>{t.cancel}</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? (isEditing ? t.updating : t.creating) : (isEditing ? t.update : t.create)}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default CreateModuleForm;

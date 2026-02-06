import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './ModalForm.css';

function CreateModuleForm({ onClose, onModuleCreated, courseId }) {
    const [formData, setFormData] = useState({
        module_name: '',
        description: '',
        module_order: 1,
        tasks_per_module: 10,
        module_test_questions: 3,
        is_active: true
    });
    const [files, setFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

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

        if (!formData.module_name || !formData.module_order) {
            setError('Module name and order are required.');
            setIsSubmitting(false);
            return;
        }

        const submitData = new FormData();
        // courseId is passed as prop
        submitData.append('course_id', courseId);
        submitData.append('module_name', formData.module_name);
        submitData.append('description', formData.description);
        submitData.append('module_order', formData.module_order);
        submitData.append('tasks_per_module', formData.tasks_per_module);
        submitData.append('module_test_questions', formData.module_test_questions);
        submitData.append('is_active', formData.is_active);

        for (let i = 0; i < files.length; i++) {
            submitData.append('files', files[i]);
        }

        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;

            const response = await fetch('http://localhost:5001/api/modules', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: submitData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create module');
            }

            const newModule = await response.json();
            onModuleCreated(newModule);
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
                <h2>Create New Module</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Module Order</label>
                            <input
                                type="number"
                                name="module_order"
                                value={formData.module_order}
                                onChange={handleChange}
                                required
                                min="1"
                            />
                        </div>
                        <div className="form-group" style={{ flex: 3 }}>
                            <label>Module Name</label>
                            <input
                                type="text"
                                name="module_name"
                                value={formData.module_name}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Variables"
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
                            placeholder="Module details..."
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Tasks Count</label>
                            <input
                                type="number"
                                name="tasks_per_module"
                                value={formData.tasks_per_module}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Test Questions</label>
                            <input
                                type="number"
                                name="module_test_questions"
                                value={formData.module_test_questions}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <label style={{ marginBottom: '0.5rem', display: 'block' }}>Status</label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    className="checkbox-input"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                />
                                Active
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Resources (Files)</label>
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Module'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default CreateModuleForm;

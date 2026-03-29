import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API_BASE_URL from '../config';
import { useI18n } from '../context/I18nContext';
import './ModalForm.css';

function CreateTaskForm({ onClose, onTaskCreated, moduleId, initialData }) {
    const { translations } = useI18n();
    const t = translations.forms.task;
    const [formData, setFormData] = useState({
        task_name: '',
        problem_statement: '',
        expected_output: '',
        sample_input: '',
        sample_output: '',
        difficulty: 'MEDIUM',
        points: 10,
        allow_collaboration: false,
        collab_percentage: 50,
        time_limit: 30,
        language: 'Python',
        constraints: ''
    });

    const [testCases, setTestCases] = useState([]);
    const [newTestCase, setNewTestCase] = useState({ input: '', expected_output: '', is_sample: false });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                task_name: initialData.task_name || '',
                problem_statement: initialData.problem_statement || '',
                expected_output: initialData.expected_output || '',
                sample_input: initialData.sample_input || '',
                sample_output: initialData.sample_output || '',
                difficulty: initialData.difficulty || 'MEDIUM',
                points: initialData.points || 10,
                allow_collaboration: initialData.allow_collaboration || false,
                collab_percentage: initialData.collab_percentage || 50,
                time_limit: initialData.time_limit || 30,
                language: initialData.language || 'Python',
                constraints: initialData.constraints || ''
            });
            if (initialData.test_cases) {
                setTestCases(initialData.test_cases);
            }
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleAddTestCase = () => {
        if (!newTestCase.input || !newTestCase.expected_output) {
            alert(t.testCaseRequired);
            return;
        }
        setTestCases([...testCases, { ...newTestCase, order_index: testCases.length + 1 }]);
        setNewTestCase({ input: '', expected_output: '', is_sample: false });
    };

    const removeTestCase = (index) => {
        setTestCases(testCases.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        if (!formData.task_name || !formData.problem_statement) {
            setError(t.required);
            setIsSubmitting(false);
            return;
        }

        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;

            const payload = {
                module_id: moduleId,
                ...formData,
                test_cases: testCases,
                test_cases_count: testCases.length
            };

            const isEditing = !!initialData;
            const url = isEditing 
                ? `${API_BASE_URL}/api/tasks/${initialData._id}` 
                : `${API_BASE_URL}/api/tasks`;
            
            const response = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || (isEditing ? t.updateFailed : t.createFailed));
            }

            const savedTask = await response.json();
            onTaskCreated(savedTask, isEditing);
            alert(isEditing ? t.updatedSuccess : t.createdSuccess);
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
                <h2>{initialData ? t.editTitle : t.createTitle}</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit} className="task-form">
                    <div className="form-group">
                        <label>{t.taskName}</label>
                        <input
                            type="text"
                            name="task_name"
                            value={formData.task_name}
                            onChange={handleChange}
                            required
                            placeholder={t.taskNamePlaceholder}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>{t.difficulty}</label>
                            <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                                <option value="EASY">{t.difficulties.EASY}</option>
                                <option value="MEDIUM">{t.difficulties.MEDIUM}</option>
                                <option value="HARD">{t.difficulties.HARD}</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{t.basePoints}</label>
                            <input type="number" name="points" value={formData.points} onChange={handleChange} min="1" />
                        </div>
                        <div className="form-group">
                            <label>{t.timeLimit}</label>
                            <input type="number" name="time_limit" value={formData.time_limit} onChange={handleChange} min="1" />
                        </div>
                        <div className="form-group">
                            <label>{t.language}</label>
                            <select name="language" value={formData.language} onChange={handleChange}>
                                <option value="Python">Python</option>
                                <option value="JavaScript">JavaScript</option>
                                <option value="Java">Java</option>
                                <option value="C++">C++</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row" style={{ alignItems: 'flex-start', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                            <label className="checkbox-label" style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    name="allow_collaboration"
                                    checked={formData.allow_collaboration} 
                                    onChange={handleChange}
                                    style={{ transform: 'scale(1.2)' }}
                                />
                                {t.allowCollaboration}
                            </label>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginLeft: '1.75rem' }}>{t.collaborationHelp}</p>
                        </div>
                        
                        {formData.allow_collaboration && (
                            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                                <label style={{ color: 'var(--accent-blue)' }}>{t.peerShare}</label>
                                <input 
                                    type="number" 
                                    name="collab_percentage" 
                                    value={formData.collab_percentage} 
                                    onChange={handleChange} 
                                    min="1" 
                                    max="100" 
                                    style={{ borderColor: 'var(--accent-blue)' }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>{t.problemStatement}</label>
                        <textarea
                            name="problem_statement"
                            value={formData.problem_statement}
                            onChange={handleChange}
                            rows="4"
                            required
                            placeholder={t.problemStatementPlaceholder}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t.expectedOutput}</label>
                        <textarea
                            name="expected_output"
                            value={formData.expected_output}
                            onChange={handleChange}
                            rows="2"
                            placeholder={t.expectedOutputPlaceholder}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>{t.sampleInput}</label>
                            <textarea name="sample_input" value={formData.sample_input} onChange={handleChange} rows="3" placeholder={t.sampleInputPlaceholder} />
                        </div>
                        <div className="form-group">
                            <label>{t.sampleOutput}</label>
                            <textarea name="sample_output" value={formData.sample_output} onChange={handleChange} rows="3" placeholder={t.sampleOutputPlaceholder} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t.constraints}</label>
                        <textarea
                            name="constraints"
                            value={formData.constraints}
                            onChange={handleChange}
                            rows="2"
                            placeholder={t.constraintsPlaceholder}
                        />
                    </div>

                    <div className="test-cases-section">
                        <h3>{t.testCases}</h3>
                        <div className="test-case-inputs">
                            <input
                                type="text"
                                placeholder={t.testCaseInput}
                                value={newTestCase.input}
                                onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder={t.testCaseExpectedOutput}
                                value={newTestCase.expected_output}
                                onChange={(e) => setNewTestCase({ ...newTestCase, expected_output: e.target.value })}
                            />
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    className="checkbox-input"
                                    checked={newTestCase.is_sample}
                                    onChange={(e) => setNewTestCase({ ...newTestCase, is_sample: e.target.checked })}
                                /> {t.sample}
                            </label>
                            <button type="button" onClick={handleAddTestCase} className="btn-small">{t.add}</button>
                        </div>
                        <ul className="test-cases-list">
                            {testCases.map((tc, index) => (
                                <li key={index}>
                                    <span>{t.testCaseInput}: {tc.input} | {t.testCaseExpectedOutput}: {tc.expected_output} ({tc.is_sample ? t.sample : t.hidden})</span>
                                    <button type="button" onClick={() => removeTestCase(index)} className="btn-text-danger">{t.remove}</button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>{t.cancel}</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? t.saving : (initialData ? t.update : t.create)}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default CreateTaskForm;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API_BASE_URL from '../config';
import { useI18n } from '../context/I18nContext';
import './ModalForm.css';

function CreateTaskForm({ onClose, onTaskCreated, moduleId, initialData }) {
    const { translations } = useI18n();
    const t = translations.forms.task;
    const isEditing = !!initialData;
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
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState('');
    const [importError, setImportError] = useState('');
    const [importFile, setImportFile] = useState(null);

    const getAuthToken = () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr).token : null;
    };

    const saveTask = async (payload, taskId = null) => {
        const token = getAuthToken();
        const editingTask = Boolean(taskId);
        const url = editingTask
            ? `${API_BASE_URL}/api/tasks/${taskId}`
            : `${API_BASE_URL}/api/tasks`;

        const response = await fetch(url, {
            method: editingTask ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || (editingTask ? t.updateFailed : t.createFailed));
        }

        return response.json();
    };

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
            setTestCases(initialData.test_cases || []);
        } else {
            setImportFile(null);
            setImportError('');
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddTestCase = () => {
        if (!newTestCase.input || !newTestCase.expected_output) {
            alert(t.testCaseRequired);
            return;
        }
        setTestCases((prev) => [...prev, { ...newTestCase, order_index: prev.length + 1 }]);
        setNewTestCase({ input: '', expected_output: '', is_sample: false });
    };

    const removeTestCase = (index) => {
        setTestCases((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    };

    const handleImportDocument = async () => {
        if (!importFile) {
            setImportError(t.importFileRequired);
            return;
        }

        setIsImporting(true);
        setImportError('');
        setError('');

        try {
            const token = getAuthToken();
            const payload = new FormData();
            payload.append('module_id', moduleId);
            payload.append('document', importFile);

            const response = await fetch(`${API_BASE_URL}/api/tasks/import`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: payload
            });

            const data = await response.json();

            if (!response.ok) {
                if (Array.isArray(data.missingFields) && data.missingFields.length) {
                    const details = data.missingFields
                        .map((item) => `Task ${item.taskIndex}: ${item.fields.join(', ')}`)
                        .join('\n');
                    const popupMessage = `${data.message || t.importFailed}\n\n${details}`;
                    setImportError(popupMessage);
                    alert(popupMessage);
                    return;
                }

                throw new Error(data.message || t.importFailed);
            }

            const createdTasks = Array.isArray(data.tasks) ? data.tasks : [];
            createdTasks.forEach((task) => onTaskCreated(task, false));
            alert(data.message || (createdTasks.length === 1
                ? t.createdSuccess
                : t.importCreatedMany.replace('{count}', createdTasks.length)));
            onClose();
        } catch (err) {
            console.error(err);
            setImportError(err.message || t.importFailed);
            alert(err.message || t.importFailed);
        } finally {
            setIsImporting(false);
        }
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
            const payload = {
                module_id: moduleId,
                ...formData,
                test_cases: testCases,
                test_cases_count: testCases.length
            };

            const savedTask = await saveTask(payload, initialData?._id);
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
                <h2>{isEditing ? t.editTitle : t.createTitle}</h2>
                {error && <div className="error-message">{error}</div>}

                {!isEditing && (
                    <div className="task-import-panel">
                        <div className="task-import-panel__header">
                            <div>
                                <h3>{t.importTitle}</h3>
                                <p>{t.importHelp}</p>
                                <div className="task-import-panel__links">
                                    <a className="task-import-panel__link" href="/templates/task-import-template.csv" download>
                                        {t.downloadCsvTemplate}
                                    </a>
                                    <a className="task-import-panel__link" href="/templates/task-import-template.doc" download>
                                        {t.downloadDocTemplate}
                                    </a>
                                    <a className="task-import-panel__link" href="/templates/task-import-template.pdf" download>
                                        {t.downloadPdfTemplate}
                                    </a>
                                </div>
                            </div>
                            <span className="task-import-panel__badge">{t.importFormats}</span>
                        </div>

                        {importError && <div className="error-message" style={{ marginBottom: '1rem' }}>{importError}</div>}

                        <div className="task-import-panel__controls">
                            <div className="form-group task-import-field">
                                <label>{t.importLabel}</label>
                                <label className="task-file-picker">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.rtf,.txt,.md,.csv,.xlsx,.xls"
                                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    />
                                    <span className="task-file-picker__button">{t.chooseFile}</span>
                                    <span className={`task-file-picker__name ${importFile ? 'has-file' : ''}`}>
                                        {importFile?.name || t.noFileChosen}
                                    </span>
                                </label>
                            </div>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleImportDocument}
                                disabled={isImporting || isSubmitting}
                            >
                                {isImporting ? t.importing : t.importAction}
                            </button>
                        </div>
                    </div>
                )}

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

                    <div className="task-collaboration-panel">
                        <div className="task-collaboration-panel__copy">
                            <label className="task-collaboration-toggle">
                                <input
                                    type="checkbox"
                                    name="allow_collaboration"
                                    checked={formData.allow_collaboration}
                                    onChange={handleChange}
                                />
                                <span>{t.allowCollaboration}</span>
                            </label>
                            <p>{t.collaborationHelp}</p>
                        </div>

                        {formData.allow_collaboration && (
                            <div className="form-group task-collaboration-panel__share">
                                <label>{t.peerShare}</label>
                                <input
                                    type="number"
                                    name="collab_percentage"
                                    value={formData.collab_percentage}
                                    onChange={handleChange}
                                    min="1"
                                    max="100"
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
                            {isSubmitting ? t.saving : (isEditing ? t.update : t.create)}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default CreateTaskForm;

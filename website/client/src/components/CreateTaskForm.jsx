import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiSparkles, HiPencilSquare, HiDocumentArrowUp, HiChevronDown, HiChevronRight, HiTrash, HiArrowUpOnSquare, HiPlus } from 'react-icons/hi2';
import API_BASE_URL from '../config';
import { useI18n } from '../context/I18nContext';
import './ModalForm.css';

const toDateTimeLocalValue = (value) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const pad = (part) => String(part).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const splitDeadlineValue = (value) => {
    const localValue = toDateTimeLocalValue(value);

    if (!localValue) {
        return { deadline_date: '', deadline_time: '' };
    }

    const [deadline_date = '', deadline_time = ''] = localValue.split('T');
    return { deadline_date, deadline_time };
};

// Whether a task/draft uses any of the fields tucked under "Advanced options",
// so we can expand that section automatically instead of hiding populated data.
const hasAdvancedData = (data) => !!data && (
    Boolean(data.has_deadline) || Boolean(data.deadline_at) ||
    Boolean(data.allow_collaboration) ||
    Boolean(String(data.expected_output || '').trim()) ||
    Boolean(String(data.sample_input || '').trim()) ||
    Boolean(String(data.sample_output || '').trim()) ||
    Boolean(String(data.constraints || '').trim()) ||
    (Number(data.time_limit) && Number(data.time_limit) !== 30)
);

const createDraftId = () => (
    globalThis.crypto?.randomUUID?.() || `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`
);

function CreateTaskForm({ onClose, onTaskCreated, moduleId, initialData }) {
    const { translations } = useI18n();
    const t = translations.forms.task;
    const ai = t.ai;
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
        has_deadline: false,
        deadline_date: '',
        deadline_time: '',
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

    // How the teacher is creating the task: 'ai' | 'manual' | 'import'.
    const [createMode, setCreateMode] = useState(isEditing ? 'manual' : 'ai');
    const [showAdvanced, setShowAdvanced] = useState(hasAdvancedData(initialData));

    const [aiForm, setAiForm] = useState({ prompt: '', count: 3, difficulty: '', language: '' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState('');
    const [aiNotice, setAiNotice] = useState('');
    const [generatedDrafts, setGeneratedDrafts] = useState([]);
    const [expandedDrafts, setExpandedDrafts] = useState({});

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
            const deadlineParts = splitDeadlineValue(initialData.deadline_at);
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
                has_deadline: initialData.has_deadline ?? Boolean(initialData.deadline_at),
                deadline_date: deadlineParts.deadline_date,
                deadline_time: deadlineParts.deadline_time,
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
            [name]: type === 'checkbox' ? checked : value,
            ...(name === 'has_deadline' && !checked ? { deadline_date: '', deadline_time: '' } : {})
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

    const draftToFormData = (draft) => ({
        task_name: draft.task_name || '',
        problem_statement: draft.problem_statement || '',
        expected_output: draft.expected_output || '',
        sample_input: draft.sample_input || '',
        sample_output: draft.sample_output || '',
        difficulty: draft.difficulty || 'MEDIUM',
        points: draft.points || 10,
        allow_collaboration: false,
        collab_percentage: draft.collab_percentage || 50,
        time_limit: draft.time_limit || 30,
        has_deadline: false,
        deadline_date: '',
        deadline_time: '',
        language: draft.language || 'Python',
        constraints: draft.constraints || ''
    });

    const applyDraftToForm = (draft) => {
        setFormData(draftToFormData(draft));
        setTestCases(Array.isArray(draft.test_cases) ? draft.test_cases : []);
        setCreateMode('manual');
        setAiNotice(ai.filledForm);
        if (hasAdvancedData(draft)) {
            setShowAdvanced(true);
        }
    };

    const requestGeneratedTasks = async (count) => {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/tasks/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                module_id: moduleId,
                prompt: aiForm.prompt.trim(),
                count,
                ...(aiForm.difficulty ? { difficulty: aiForm.difficulty } : {}),
                ...(aiForm.language ? { language: aiForm.language } : {})
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || ai.failed);
        }

        return Array.isArray(data.tasks) ? data.tasks : [];
    };

    const handleGenerate = async () => {
        if (!aiForm.prompt.trim()) {
            setAiError(ai.promptRequired);
            return;
        }

        setIsGenerating(true);
        setAiError('');
        setAiNotice('');
        setError('');

        try {
            const count = Math.max(1, Math.min(10, Number(aiForm.count) || 1));
            const tasks = await requestGeneratedTasks(count);

            if (!tasks.length) {
                setAiError(ai.empty);
                return;
            }

            // A single task drops straight into the manual form for full editing;
            // multiple tasks go to the review list.
            if (tasks.length === 1) {
                applyDraftToForm(tasks[0]);
                setGeneratedDrafts([]);
                setExpandedDrafts({});
            } else {
                const withIds = tasks.map((task) => ({ ...task, _uid: createDraftId() }));
                setGeneratedDrafts(withIds);
                // Expand the first task so the structure is obvious at a glance.
                setExpandedDrafts(withIds.length ? { [withIds[0]._uid]: true } : {});
            }
        } catch (err) {
            console.error(err);
            setAiError(err.message || ai.failed);
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleDraft = (uid) => {
        setExpandedDrafts((prev) => ({ ...prev, [uid]: !prev[uid] }));
    };

    const updateDraft = (uid, field, value) => {
        setGeneratedDrafts((prev) => prev.map((draft) => (
            draft._uid === uid ? { ...draft, [field]: value } : draft
        )));
    };

    const updateDraftTestCase = (uid, tcIndex, field, value) => {
        setGeneratedDrafts((prev) => prev.map((draft) => {
            if (draft._uid !== uid) return draft;
            const testCases = (draft.test_cases || []).map((tc, currentIndex) => (
                currentIndex === tcIndex ? { ...tc, [field]: value } : tc
            ));
            return { ...draft, test_cases: testCases };
        }));
    };

    const removeDraftTestCase = (uid, tcIndex) => {
        setGeneratedDrafts((prev) => prev.map((draft) => {
            if (draft._uid !== uid) return draft;
            const testCases = (draft.test_cases || [])
                .filter((_, currentIndex) => currentIndex !== tcIndex)
                .map((tc, currentIndex) => ({ ...tc, order_index: currentIndex + 1 }));
            return { ...draft, test_cases: testCases };
        }));
    };

    const addDraftTestCase = (uid) => {
        setGeneratedDrafts((prev) => prev.map((draft) => {
            if (draft._uid !== uid) return draft;
            const testCases = draft.test_cases || [];
            return {
                ...draft,
                test_cases: [
                    ...testCases,
                    { input: '', expected_output: '', is_sample: false, order_index: testCases.length + 1 }
                ]
            };
        }));
    };

    const removeDraft = (uid) => {
        setGeneratedDrafts((prev) => prev.filter((draft) => draft._uid !== uid));
        setExpandedDrafts((prev) => {
            const next = { ...prev };
            delete next[uid];
            return next;
        });
    };

    const loadDraftIntoForm = (uid) => {
        const draft = generatedDrafts.find((item) => item._uid === uid);
        if (draft) {
            applyDraftToForm(draft);
            removeDraft(uid);
        }
    };

    const handleSaveAllDrafts = async () => {
        const invalidDraft = generatedDrafts.find((draft) => !draft.task_name?.trim() || !draft.problem_statement?.trim());
        if (invalidDraft) {
            setError(t.required);
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const createdTasks = [];
            for (const draft of generatedDrafts) {
                // Drop any incomplete test-case rows so they don't trip validation.
                const cleanedTestCases = (Array.isArray(draft.test_cases) ? draft.test_cases : [])
                    .filter((tc) => String(tc.input ?? '').trim() && String(tc.expected_output ?? '').trim())
                    .map((tc, tcIndex) => ({
                        input: String(tc.input).trim(),
                        expected_output: String(tc.expected_output).trim(),
                        is_sample: !!tc.is_sample,
                        order_index: tcIndex + 1
                    }));

                const payload = {
                    module_id: moduleId,
                    task_name: draft.task_name.trim(),
                    problem_statement: draft.problem_statement.trim(),
                    expected_output: draft.expected_output || '',
                    sample_input: draft.sample_input || '',
                    sample_output: draft.sample_output || '',
                    constraints: draft.constraints || '',
                    difficulty: draft.difficulty || 'MEDIUM',
                    points: Number(draft.points) || 10,
                    time_limit: Number(draft.time_limit) || 30,
                    language: draft.language || 'Python',
                    allow_collaboration: false,
                    collab_percentage: draft.collab_percentage || 50,
                    has_deadline: false,
                    deadline_at: null,
                    test_cases: cleanedTestCases,
                    test_cases_count: cleanedTestCases.length
                };

                const savedTask = await saveTask(payload);
                onTaskCreated(savedTask, false);
                createdTasks.push(savedTask);
            }

            alert(ai.createdMany.replace('{count}', createdTasks.length));
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || ai.failed);
        } finally {
            setIsSubmitting(false);
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

        if (formData.has_deadline && (!formData.deadline_date || !formData.deadline_time)) {
            setError(t.deadlineRequired);
            setIsSubmitting(false);
            return;
        }

        try {
            const deadlineAt = formData.has_deadline && formData.deadline_date && formData.deadline_time
                ? new Date(`${formData.deadline_date}T${formData.deadline_time}`).toISOString()
                : null;

            const payload = {
                module_id: moduleId,
                ...formData,
                deadline_at: deadlineAt,
                test_cases: testCases,
                test_cases_count: testCases.length
            };

            delete payload.deadline_date;
            delete payload.deadline_time;

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

    const modeOptions = [
        { id: 'ai', Icon: HiSparkles, label: t.modeAi, desc: t.modeAiDesc },
        { id: 'manual', Icon: HiPencilSquare, label: t.modeManual, desc: t.modeManualDesc },
        { id: 'import', Icon: HiDocumentArrowUp, label: t.modeImport, desc: t.modeImportDesc }
    ];

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
                    <div className="task-mode-tabs" role="tablist">
                        {modeOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                role="tab"
                                aria-selected={createMode === option.id}
                                className={`task-mode-tab ${createMode === option.id ? 'is-active' : ''}`}
                                onClick={() => setCreateMode(option.id)}
                            >
                                <option.Icon className="task-mode-tab__icon" aria-hidden="true" />
                                <span className="task-mode-tab__label">{option.label}</span>
                                <span className="task-mode-tab__desc">{option.desc}</span>
                            </button>
                        ))}
                    </div>
                )}

                {!isEditing && createMode === 'import' && (
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
                                        accept=".pdf,.doc,.docx,.rtf,.txt,.md,.csv,.xlsx"
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
                                className="btn btn-primary"
                                onClick={handleImportDocument}
                                disabled={isImporting || isSubmitting}
                            >
                                {isImporting ? t.importing : t.importAction}
                            </button>
                        </div>
                    </div>
                )}

                {!isEditing && createMode === 'ai' && (
                    <div className="task-import-panel task-ai-panel">
                        <div className="task-import-panel__header">
                            <div>
                                <h3>{ai.title}</h3>
                                <p>{ai.help}</p>
                            </div>
                            <span className="task-import-panel__badge">{ai.badge}</span>
                        </div>

                        {aiError && <div className="error-message" style={{ marginBottom: '1rem' }}>{aiError}</div>}

                        <div className="form-group">
                            <label>{ai.promptLabel}</label>
                            <textarea
                                rows="2"
                                value={aiForm.prompt}
                                onChange={(e) => setAiForm((prev) => ({ ...prev, prompt: e.target.value }))}
                                placeholder={ai.promptPlaceholder}
                            />
                        </div>

                        <div className="form-row task-ai-options">
                            <div className="form-group">
                                <label>{ai.countLabel}</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={aiForm.count}
                                    onChange={(e) => setAiForm((prev) => ({ ...prev, count: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>{ai.difficultyLabel}</label>
                                <select
                                    value={aiForm.difficulty}
                                    onChange={(e) => setAiForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                                >
                                    <option value="">{ai.anyOption}</option>
                                    <option value="EASY">{t.difficulties.EASY}</option>
                                    <option value="MEDIUM">{t.difficulties.MEDIUM}</option>
                                    <option value="HARD">{t.difficulties.HARD}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{ai.languageLabel}</label>
                                <select
                                    value={aiForm.language}
                                    onChange={(e) => setAiForm((prev) => ({ ...prev, language: e.target.value }))}
                                >
                                    <option value="">{ai.anyOption}</option>
                                    <option value="Python">Python</option>
                                    <option value="JavaScript">JavaScript</option>
                                    <option value="Java">Java</option>
                                    <option value="C++">C++</option>
                                </select>
                            </div>
                        </div>

                        <div className="task-ai-actions">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleGenerate}
                                disabled={isGenerating || isSubmitting}
                            >
                                {isGenerating ? ai.generating : ai.generate}
                            </button>
                        </div>
                    </div>
                )}

                {!isEditing && createMode === 'ai' && generatedDrafts.length > 0 && (
                    <section className="task-ai-review" aria-label={ai.reviewTitle.replace('{count}', generatedDrafts.length)}>
                        <div className="task-ai-review__header">
                            <div>
                                <h3>{ai.reviewTitle.replace('{count}', generatedDrafts.length)}</h3>
                                <p>{ai.reviewHelp}</p>
                            </div>
                            <button type="button" className="btn-text-danger" onClick={() => { setGeneratedDrafts([]); setExpandedDrafts({}); }}>
                                {ai.discard}
                            </button>
                        </div>

                        <p className="sr-only" role="status" aria-live="polite">
                            {ai.reviewAnnounce.replace('{count}', generatedDrafts.length)}
                        </p>

                        <ul className="task-ai-draft-list">
                            {generatedDrafts.map((draft, index) => {
                                const isOpen = !!expandedDrafts[draft._uid];
                                const panelId = `draft-panel-${draft._uid}`;
                                const titleId = `draft-title-${draft._uid}`;
                                const testCases = Array.isArray(draft.test_cases) ? draft.test_cases : [];
                                const difficultyKey = (draft.difficulty || 'MEDIUM').toUpperCase();

                                return (
                                    <li className={`task-ai-draft ${isOpen ? 'is-open' : ''}`} key={draft._uid}>
                                        <button
                                            type="button"
                                            className="task-ai-draft__summary"
                                            aria-expanded={isOpen}
                                            aria-controls={panelId}
                                            onClick={() => toggleDraft(draft._uid)}
                                        >
                                            {isOpen
                                                ? <HiChevronDown className="task-ai-draft__chevron" aria-hidden="true" />
                                                : <HiChevronRight className="task-ai-draft__chevron" aria-hidden="true" />}
                                            <span className="task-ai-draft__index" aria-hidden="true">{index + 1}</span>
                                            <span className="task-ai-draft__title" id={titleId}>
                                                {draft.task_name?.trim() || ai.untitled}
                                            </span>
                                            <span className="task-ai-draft__pills">
                                                <span className={`task-pill task-pill--${difficultyKey.toLowerCase()}`}>
                                                    {t.difficulties[difficultyKey] || difficultyKey}
                                                </span>
                                                <span className="task-pill">{ai.pointsPill.replace('{count}', draft.points || 0)}</span>
                                                <span className="task-pill">{ai.testCasesCount.replace('{count}', testCases.length)}</span>
                                            </span>
                                        </button>

                                        {isOpen && (
                                            <div className="task-ai-draft__body" id={panelId} role="region" aria-labelledby={titleId}>
                                                <div className="form-group">
                                                    <label htmlFor={`${draft._uid}-name`}>{t.taskName}</label>
                                                    <input
                                                        id={`${draft._uid}-name`}
                                                        type="text"
                                                        value={draft.task_name}
                                                        onChange={(e) => updateDraft(draft._uid, 'task_name', e.target.value)}
                                                    />
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label htmlFor={`${draft._uid}-difficulty`}>{t.difficulty}</label>
                                                        <select
                                                            id={`${draft._uid}-difficulty`}
                                                            value={draft.difficulty}
                                                            onChange={(e) => updateDraft(draft._uid, 'difficulty', e.target.value)}
                                                        >
                                                            <option value="EASY">{t.difficulties.EASY}</option>
                                                            <option value="MEDIUM">{t.difficulties.MEDIUM}</option>
                                                            <option value="HARD">{t.difficulties.HARD}</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label htmlFor={`${draft._uid}-points`}>{t.basePoints}</label>
                                                        <input
                                                            id={`${draft._uid}-points`}
                                                            type="number"
                                                            min="1"
                                                            value={draft.points}
                                                            onChange={(e) => updateDraft(draft._uid, 'points', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label htmlFor={`${draft._uid}-language`}>{t.language}</label>
                                                        <select
                                                            id={`${draft._uid}-language`}
                                                            value={draft.language}
                                                            onChange={(e) => updateDraft(draft._uid, 'language', e.target.value)}
                                                        >
                                                            <option value="Python">Python</option>
                                                            <option value="JavaScript">JavaScript</option>
                                                            <option value="Java">Java</option>
                                                            <option value="C++">C++</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label htmlFor={`${draft._uid}-time`}>{t.timeLimit}</label>
                                                        <input
                                                            id={`${draft._uid}-time`}
                                                            type="number"
                                                            min="1"
                                                            value={draft.time_limit}
                                                            onChange={(e) => updateDraft(draft._uid, 'time_limit', e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label htmlFor={`${draft._uid}-problem`}>{t.problemStatement}</label>
                                                    <textarea
                                                        id={`${draft._uid}-problem`}
                                                        rows="4"
                                                        value={draft.problem_statement}
                                                        onChange={(e) => updateDraft(draft._uid, 'problem_statement', e.target.value)}
                                                    />
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label htmlFor={`${draft._uid}-sample-in`}>{t.sampleInput}</label>
                                                        <textarea
                                                            id={`${draft._uid}-sample-in`}
                                                            rows="3"
                                                            value={draft.sample_input}
                                                            onChange={(e) => updateDraft(draft._uid, 'sample_input', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label htmlFor={`${draft._uid}-sample-out`}>{t.sampleOutput}</label>
                                                        <textarea
                                                            id={`${draft._uid}-sample-out`}
                                                            rows="3"
                                                            value={draft.sample_output}
                                                            onChange={(e) => updateDraft(draft._uid, 'sample_output', e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label htmlFor={`${draft._uid}-constraints`}>{t.constraints}</label>
                                                    <textarea
                                                        id={`${draft._uid}-constraints`}
                                                        rows="2"
                                                        value={draft.constraints}
                                                        onChange={(e) => updateDraft(draft._uid, 'constraints', e.target.value)}
                                                    />
                                                </div>

                                                <fieldset className="task-ai-draft__testcases">
                                                    <legend>{t.testCases}</legend>
                                                    {testCases.length === 0 && (
                                                        <p className="task-ai-draft__empty">{ai.noTestCases}</p>
                                                    )}
                                                    {testCases.map((tc, tcIndex) => (
                                                        <div className="task-ai-testcase" key={tcIndex}>
                                                            <div className="form-group">
                                                                <label htmlFor={`${draft._uid}-tc-${tcIndex}-in`}>{t.testCaseInput}</label>
                                                                <input
                                                                    id={`${draft._uid}-tc-${tcIndex}-in`}
                                                                    type="text"
                                                                    value={tc.input}
                                                                    onChange={(e) => updateDraftTestCase(draft._uid, tcIndex, 'input', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="form-group">
                                                                <label htmlFor={`${draft._uid}-tc-${tcIndex}-out`}>{t.testCaseExpectedOutput}</label>
                                                                <input
                                                                    id={`${draft._uid}-tc-${tcIndex}-out`}
                                                                    type="text"
                                                                    value={tc.expected_output}
                                                                    onChange={(e) => updateDraftTestCase(draft._uid, tcIndex, 'expected_output', e.target.value)}
                                                                />
                                                            </div>
                                                            <label className="checkbox-label">
                                                                <input
                                                                    type="checkbox"
                                                                    className="checkbox-input"
                                                                    checked={!!tc.is_sample}
                                                                    onChange={(e) => updateDraftTestCase(draft._uid, tcIndex, 'is_sample', e.target.checked)}
                                                                /> {t.sample}
                                                            </label>
                                                            <button
                                                                type="button"
                                                                className="icon-btn icon-btn--danger"
                                                                onClick={() => removeDraftTestCase(draft._uid, tcIndex)}
                                                                aria-label={`${t.remove} ${t.testCases} ${tcIndex + 1}`}
                                                            >
                                                                <HiTrash aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button type="button" className="btn-small task-ai-testcase__add" onClick={() => addDraftTestCase(draft._uid)}>
                                                        <HiPlus aria-hidden="true" /> {t.add}
                                                    </button>
                                                </fieldset>

                                                <div className="task-ai-draft__footer">
                                                    <button type="button" className="btn-small" onClick={() => loadDraftIntoForm(draft._uid)}>
                                                        <HiArrowUpOnSquare aria-hidden="true" /> {t.loadIntoForm}
                                                    </button>
                                                    <button type="button" className="btn-text-danger" onClick={() => removeDraft(draft._uid)}>
                                                        <HiTrash aria-hidden="true" /> {ai.removeTask}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSaveAllDrafts}
                                disabled={isSubmitting || isGenerating}
                            >
                                {isSubmitting ? ai.savingAll : ai.saveAll.replace('{count}', generatedDrafts.length)}
                            </button>
                        </div>
                    </section>
                )}

                {(isEditing || createMode === 'manual') && (
                    <form onSubmit={handleSubmit} className="task-form">
                        {aiNotice && <div className="form-notice">{aiNotice}</div>}

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
                                <label>{t.language}</label>
                                <select name="language" value={formData.language} onChange={handleChange}>
                                    <option value="Python">Python</option>
                                    <option value="JavaScript">JavaScript</option>
                                    <option value="Java">Java</option>
                                    <option value="C++">C++</option>
                                </select>
                            </div>
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

                        <button
                            type="button"
                            className={`task-advanced-toggle ${showAdvanced ? 'is-open' : ''}`}
                            onClick={() => setShowAdvanced((prev) => !prev)}
                            aria-expanded={showAdvanced}
                        >
                            {showAdvanced
                                ? <HiChevronDown className="task-advanced-toggle__chevron" aria-hidden="true" />
                                : <HiChevronRight className="task-advanced-toggle__chevron" aria-hidden="true" />}
                            <span className="task-advanced-toggle__label">{t.advancedOptions}</span>
                            <span className="task-advanced-toggle__hint">{t.advancedHelp}</span>
                        </button>

                        {showAdvanced && (
                            <div className="task-advanced-section">
                                <div className="form-group">
                                    <label>{t.timeLimit}</label>
                                    <input type="number" name="time_limit" value={formData.time_limit} onChange={handleChange} min="1" />
                                </div>

                                <div className="task-deadline-panel">
                                    <div className="task-deadline-panel__copy">
                                        <label className="task-deadline-toggle">
                                            <input
                                                type="checkbox"
                                                name="has_deadline"
                                                checked={formData.has_deadline}
                                                onChange={handleChange}
                                            />
                                            <span>{t.setDeadline}</span>
                                        </label>
                                        <p>{t.deadlineHelp}</p>
                                    </div>

                                    {formData.has_deadline && (
                                        <div className="task-deadline-panel__field">
                                            <label>{t.deadlineDateTime}</label>
                                            <div className="task-deadline-panel__inputs">
                                                <div className="form-group task-deadline-panel__subfield">
                                                    <label>{t.deadlineDate}</label>
                                                    <input
                                                        type="date"
                                                        name="deadline_date"
                                                        value={formData.deadline_date}
                                                        onChange={handleChange}
                                                        required={formData.has_deadline}
                                                    />
                                                </div>
                                                <div className="form-group task-deadline-panel__subfield">
                                                    <label>{t.deadlineTime}</label>
                                                    <input
                                                        type="time"
                                                        name="deadline_time"
                                                        value={formData.deadline_time}
                                                        onChange={handleChange}
                                                        required={formData.has_deadline}
                                                    />
                                                </div>
                                            </div>
                                            {formData.deadline_date && formData.deadline_time && (
                                                <div className="task-deadline-panel__preview">
                                                    <span>{t.deadlinePreview}</span>
                                                    <strong>{formData.deadline_date} • {formData.deadline_time}</strong>
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                            </div>
                        )}

                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>{t.cancel}</button>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? t.saving : (isEditing ? t.update : t.create)}
                            </button>
                        </div>
                    </form>
                )}

                {!isEditing && createMode !== 'manual' && (
                    <div className="modal-actions modal-actions--standalone">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>{t.cancel}</button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export default CreateTaskForm;

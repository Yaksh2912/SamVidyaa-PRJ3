import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './ModalForm.css';

function CreateTaskForm({ onClose, onTaskCreated, moduleId }) {
    const [formData, setFormData] = useState({
        task_name: '',
        problem_statement: '',
        expected_output: '',
        sample_input: '',
        sample_output: '',
        difficulty: 'MEDIUM',
        points: 10,
        time_limit: 30,
        language: 'Python',
        constraints: ''
    });

    // Test cases logic
    const [testCases, setTestCases] = useState([]);
    const [newTestCase, setNewTestCase] = useState({ input: '', expected_output: '', is_sample: false });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddTestCase = () => {
        if (!newTestCase.input || !newTestCase.expected_output) {
            alert("Input and Expected Output are required for a test case.");
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
            setError('Task name and problem statement are required.');
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

            const response = await fetch('http://localhost:5001/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create task');
            }

            const newTask = await response.json();
            onTaskCreated(newTask);
            alert("Task created successfully!");
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
                <h2>Create New Task</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit} className="task-form">
                    <div className="form-group">
                        <label>Task Name</label>
                        <input
                            type="text"
                            name="task_name"
                            value={formData.task_name}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Calculate Sum"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Difficulty</label>
                            <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Points</label>
                            <input type="number" name="points" value={formData.points} onChange={handleChange} min="1" />
                        </div>
                        <div className="form-group">
                            <label>Time Limit (mins)</label>
                            <input type="number" name="time_limit" value={formData.time_limit} onChange={handleChange} min="1" />
                        </div>
                        <div className="form-group">
                            <label>Language</label>
                            <select name="language" value={formData.language} onChange={handleChange}>
                                <option value="Python">Python</option>
                                <option value="JavaScript">JavaScript</option>
                                <option value="Java">Java</option>
                                <option value="C++">C++</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Problem Statement</label>
                        <textarea
                            name="problem_statement"
                            value={formData.problem_statement}
                            onChange={handleChange}
                            rows="4"
                            required
                            placeholder="Describe the task..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Expected Output Description (Optional)</label>
                        <textarea
                            name="expected_output"
                            value={formData.expected_output}
                            onChange={handleChange}
                            rows="2"
                            placeholder="Description of expected output..."
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Sample Input (Text)</label>
                            <textarea name="sample_input" value={formData.sample_input} onChange={handleChange} rows="3" placeholder="Input example..." />
                        </div>
                        <div className="form-group">
                            <label>Sample Output (Text)</label>
                            <textarea name="sample_output" value={formData.sample_output} onChange={handleChange} rows="3" placeholder="Output example..." />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Constraints</label>
                        <textarea
                            name="constraints"
                            value={formData.constraints}
                            onChange={handleChange}
                            rows="2"
                            placeholder="e.g., Use O(n) time complexity"
                        />
                    </div>

                    <div className="test-cases-section">
                        <h3>Test Cases</h3>
                        <div className="test-case-inputs">
                            <input
                                type="text"
                                placeholder="Input"
                                value={newTestCase.input}
                                onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Expected Output"
                                value={newTestCase.expected_output}
                                onChange={(e) => setNewTestCase({ ...newTestCase, expected_output: e.target.value })}
                            />
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    className="checkbox-input"
                                    checked={newTestCase.is_sample}
                                    onChange={(e) => setNewTestCase({ ...newTestCase, is_sample: e.target.checked })}
                                /> Sample
                            </label>
                            <button type="button" onClick={handleAddTestCase} className="btn-small">Add</button>
                        </div>
                        <ul className="test-cases-list">
                            {testCases.map((tc, index) => (
                                <li key={index}>
                                    <span>In: {tc.input} | Out: {tc.expected_output} ({tc.is_sample ? 'Sample' : 'Hidden'})</span>
                                    <button type="button" onClick={() => removeTestCase(index)} className="btn-text-danger">Remove</button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default CreateTaskForm;

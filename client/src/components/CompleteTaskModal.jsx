import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API_BASE_URL from '../config';
import { HiCheckCircle, HiUsers } from 'react-icons/hi2';
import { useI18n } from '../context/I18nContext';
import './ModalForm.css';

function CompleteTaskModal({ task, courseId, onClose, onComplete }) {
    const { translations, t: translate } = useI18n();
    const t = translations.forms.completeTask;
    const [classmates, setClassmates] = useState([]);
    const [selectedPeers, setSelectedPeers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setCurrentUser(JSON.parse(userStr));
        fetchClassmates();
    }, []);

    const fetchClassmates = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;
            const res = await fetch(`${API_BASE_URL}/api/enrollments/course/${courseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter out the current user and only show ACTIVE students
                const myUserStr = localStorage.getItem('user');
                const myUserId = myUserStr ? JSON.parse(myUserStr)._id : null;
                const peers = data.filter(s => s.status === 'ACTIVE' && s._id !== myUserId);
                setClassmates(peers);
            }
        } catch (error) {
            console.error('Error fetching classmates:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePeer = (peerId) => {
        setSelectedPeers(prev => 
            prev.includes(peerId) 
                ? prev.filter(id => id !== peerId) 
                : [...prev, peerId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;
            const res = await fetch(`${API_BASE_URL}/api/tasks/${task._id}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ collaboratorIds: selectedPeers })
            });
            const data = await res.json();
            if (res.ok) {
                alert(t.completeSuccess);
                onComplete(task._id, data.points); // Pass new total points back
                onClose();
            } else {
                alert(data.message || t.completeFailed);
            }
        } catch (error) {
            console.error('Complete task error:', error);
            alert(translations.common.errors.somethingWentWrong);
        } finally {
            setSubmitting(false);
        }
    };

    const studentShare = task.allow_collaboration && selectedPeers.length > 0
        ? task.points - Math.round((task.points * task.collab_percentage) / 100)
        : task.points;

    const peerTotalPool = task.allow_collaboration && selectedPeers.length > 0
        ? Math.round((task.points * task.collab_percentage) / 100)
        : 0;
    const peerShareEach = selectedPeers.length > 0 ? Math.round(peerTotalPool / selectedPeers.length) : 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div 
                className="modal-content" 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2>{translate('forms.completeTask.title', { task: task.task_name })}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    {translate('forms.completeTask.totalPoints', { points: task.points })}
                </p>

                {task.allow_collaboration && (
                    <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-blue)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
                            <HiUsers /> {t.collaborationMode}
                        </h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {translate('forms.completeTask.collaborationInfo', { percentage: task.collab_percentage })}
                        </p>
                        {selectedPeers.length > 0 && (
                            <p style={{ fontSize: '0.9rem', color: 'var(--accent-blue)', marginTop: '0.5rem', fontWeight: 600 }}>
                                {translate('forms.completeTask.collaborationSummary', {
                                    count: selectedPeers.length,
                                    studentShare,
                                    peerShare: peerShareEach
                                })}
                            </p>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {task.allow_collaboration && (
                        <div className="form-group">
                            <label>{t.selectCollaborators}</label>
                            {loading ? (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>{t.loadingClassmates}</p>
                            ) : classmates.length === 0 ? (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>{t.noClassmates}</p>
                            ) : (
                                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem' }}>
                                    {classmates.map(peer => (
                                        <label key={peer._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer', borderRadius: '4px', background: selectedPeers.includes(peer._id) ? 'var(--bg-tertiary)' : 'transparent' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedPeers.includes(peer._id)}
                                                onChange={() => togglePeer(peer._id)}
                                            />
                                            {peer.name} ({peer.email})
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="modal-actions" style={{ marginTop: '2rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>{t.cancel}</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            <HiCheckCircle style={{ marginRight: '0.5rem' }}/> 
                            {submitting ? t.submitting : t.markComplete}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default CompleteTaskModal;

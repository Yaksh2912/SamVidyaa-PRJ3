import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API_BASE_URL from '../config';
import { HiCheckCircle, HiUsers } from 'react-icons/hi2';
import './ModalForm.css';

function CompleteTaskModal({ task, courseId, onClose, onComplete }) {
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
                alert(data.message);
                onComplete(task._id, data.points); // Pass new total points back
                onClose();
            } else {
                alert(data.message || 'Failed to complete task');
            }
        } catch (error) {
            console.error('Complete task error:', error);
            alert('Something went wrong');
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
                <h2>Submit Task: {task.task_name}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    This task is worth a total of <strong>{task.points} points</strong>.
                </p>

                {task.allow_collaboration && (
                    <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-blue)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
                            <HiUsers /> Collaboration Mode
                        </h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Your teacher has enabled collaboration for this task with a <strong>{task.collab_percentage}% sharing split</strong>. 
                        </p>
                        {selectedPeers.length > 0 && (
                            <p style={{ fontSize: '0.9rem', color: 'var(--accent-blue)', marginTop: '0.5rem', fontWeight: 600 }}>
                                Because you selected {selectedPeers.length} peer(s), you will earn {studentShare} points, and each peer will receive {peerShareEach} points!
                            </p>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {task.allow_collaboration && (
                        <div className="form-group">
                            <label>Select Collaborators (Optional)</label>
                            {loading ? (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Loading classmates...</p>
                            ) : classmates.length === 0 ? (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>No other students found in this class.</p>
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
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            <HiCheckCircle style={{ marginRight: '0.5rem' }}/> 
                            {submitting ? 'Submitting...' : 'Mark as Complete'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default CompleteTaskModal;

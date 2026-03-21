import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import { HiUserGroup, HiOutlinePaperAirplane } from 'react-icons/hi2';
import { motion } from 'framer-motion';

function AskCollaborationModal({ onClose, task, courseId }) {
    const [peers, setPeers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(null);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const fetchPeers = async () => {
            try {
                const userStr = localStorage.getItem('user');
                const token = userStr ? JSON.parse(userStr).token : null;
                const currentUser = userStr ? JSON.parse(userStr) : null;

                const response = await fetch(`${API_BASE_URL}/api/enrollments/course/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    const filteredPeers = data.filter(p => p.student_id && p.student_id._id !== currentUser._id && ['ACTIVE', 'APPROVED'].includes(p.status));
                    setPeers(filteredPeers);
                }
            } catch (err) {
                console.error("Failed to fetch peers", err);
                setError("Failed to load peers.");
            } finally {
                setLoading(false);
            }
        };

        fetchPeers();
    }, [courseId]);

    const handleInvite = async (peerId) => {
        setInviting(peerId);
        setError('');
        setSuccessMsg('');
        
        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;

            const response = await fetch(`${API_BASE_URL}/api/collaborations/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    task_id: task._id,
                    course_id: courseId,
                    requested_peer: peerId
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                setSuccessMsg('Invitation sent successfully!');
            } else {
                setError(data.message || 'Failed to send invitation.');
            }
        } catch (err) {
            console.error("Invite error", err);
            setError('Something went wrong.');
        } finally {
            setInviting(null);
        }
    };

    return (
        <div 
            onClick={onClose} 
            style={{ 
                position: 'fixed', 
                top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: 'rgba(0,0,0,0.7)', 
                backdropFilter: 'blur(8px)',
                zIndex: 2147483647, // Max z-index to guarantee it's on top
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="neumorphic-modal-content" 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '450px', position: 'relative', zIndex: 2147483647 }}
            >
                <div className="neumorphic-modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div className="course-modal-intro">
                        <h2><HiUserGroup /> Find a Partner</h2>
                        <p className="course-code-subtitle">Task: {task.task_name}</p>
                    </div>
                </div>

                <div className="neumorphic-modal-body">
                    {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
                    {successMsg && <div className="success-message" style={{ marginBottom: '1rem', color: 'var(--status-success-text)', background: 'var(--status-success-bg)', padding: '0.75rem', borderRadius: '8px' }}>{successMsg}</div>}

                    {loading ? (
                        <p className="loading-text">Finding classmates...</p>
                    ) : peers.length === 0 ? (
                        <p className="empty-state">No other active students found in this course.</p>
                    ) : (
                        <div className="peers-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {peers.map(peer => (
                                <div key={peer._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {(peer.student_id?.name || 'S').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{peer.student_id?.name || 'Unknown Student'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{peer.student_id?.enrollment_number || peer.student_id?.email || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                        onClick={() => handleInvite(peer.student_id?._id)}
                                        disabled={inviting === peer.student_id?._id}
                                    >
                                        {inviting === peer.student_id?._id ? 'Sending...' : <><HiOutlinePaperAirplane style={{ marginRight:'4px' }}/> Invite</>}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </motion.div>
        </div>
    );
}

export default AskCollaborationModal;

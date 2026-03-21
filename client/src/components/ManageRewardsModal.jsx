import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API_BASE_URL from '../config';
import { HiStar, HiTrash, HiCheckBadge, HiClock, HiLightBulb, HiSwatch, HiBolt, HiIdentification, HiGift, HiPlus } from 'react-icons/hi2';
import './ModalForm.css'; // Utilizing existing modal styles

// Mapping of icon names to actual React Icons
const MAP_ICONS = {
    'HiCheckBadge': <HiCheckBadge />,
    'HiClock': <HiClock />,
    'HiLightBulb': <HiLightBulb />,
    'HiSwatch': <HiSwatch />,
    'HiBolt': <HiBolt />,
    'HiIdentification': <HiIdentification />,
    'HiGift': <HiGift />
};

function ManageRewardsModal({ course, onClose }) {
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // New reward form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        cost: 50,
        icon_name: 'HiGift'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRewards();
    }, [course._id]);

    const fetchRewards = async () => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;
            const res = await fetch(`${API_BASE_URL}/api/rewards/course/${course._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRewards(data);
            } else {
                console.error("Failed to fetch rewards");
            }
        } catch (err) {
            console.error("Error fetching rewards:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddReward = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        if (!formData.name || !formData.description || !formData.cost) {
            setError('Please fill out all fields.');
            setIsSubmitting(false);
            return;
        }

        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;

            const payload = {
                course_id: course._id,
                ...formData
            };

            const response = await fetch(`${API_BASE_URL}/api/rewards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create reward');
            }

            const newReward = await response.json();
            setRewards([...rewards, newReward]);
            
            // Reset form
            setFormData({
                name: '',
                description: '',
                cost: 50,
                icon_name: 'HiGift'
            });
        } catch (err) {
            console.error(err);
            setError(err.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReward = async (rewardId) => {
        if (!window.confirm("Are you sure you want to delete this reward?")) return;

        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;
            const response = await fetch(`${API_BASE_URL}/api/rewards/${rewardId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setRewards(rewards.filter(r => r._id !== rewardId));
            } else {
                alert("Failed to delete reward");
            }
        } catch (error) {
            console.error("Delete error", error);
            alert("Error deleting reward");
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className="modal-content" 
                style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto', display: 'flex', flexDirection: 'column' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                    <div>
                        <h2 style={{ marginBottom: '0.25rem' }}>Manage Course Rewards</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{course.course_name}</p>
                    </div>
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>

                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    
                    {/* LEFT COLUMN: ADD REWARD FORM */}
                    <div style={{ flex: '1 1 300px', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--border-radius-md)' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Add New Reward</h3>
                        {error && <div className="error-message">{error}</div>}
                        
                        <form onSubmit={handleAddReward} className="task-form">
                            <div className="form-group">
                                <label>Reward Title</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Pizza Party"
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Brief description of the reward"
                                    required
                                />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Cost (Points)</label>
                                    <input
                                        type="number"
                                        name="cost"
                                        value={formData.cost}
                                        onChange={handleChange}
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Icon</label>
                                    <select name="icon_name" value={formData.icon_name} onChange={handleChange}>
                                        <option value="HiGift">Gift Box</option>
                                        <option value="HiCheckBadge">Badge</option>
                                        <option value="HiClock">Clock</option>
                                        <option value="HiLightBulb">Light Bulb</option>
                                        <option value="HiSwatch">Paint Swatch</option>
                                        <option value="HiBolt">Lightning Bolt</option>
                                        <option value="HiIdentification">Certificate</option>
                                    </select>
                                </div>
                            </div>
                            
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={isSubmitting}>
                                <HiPlus /> {isSubmitting ? 'Adding...' : 'Add Reward'}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: EXISTING REWARDS LIST */}
                    <div style={{ flex: '1 1 350px' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Available Rewards ({rewards.length})</h3>
                        {loading ? (
                            <p style={{ color: 'var(--text-secondary)' }}>Loading rewards...</p>
                        ) : rewards.length === 0 ? (
                            <p className="empty-state" style={{ padding: '2rem' }}>No rewards added to this course yet. Add one to give your students something to strive for!</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {rewards.map(reward => (
                                    <div key={reward._id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-light)',
                                        borderRadius: 'var(--border-radius-sm)',
                                        padding: '0.8rem 1rem',
                                        gap: '1rem'
                                    }}>
                                        <div style={{ 
                                            background: 'var(--accent-gradient-subtle)', 
                                            color: 'var(--accent-primary)',
                                            width: '45px',
                                            height: '45px',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.5rem',
                                            flexShrink: 0
                                        }}>
                                            {MAP_ICONS[reward.icon_name] || <HiGift />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {reward.name}
                                            </h4>
                                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {reward.description}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                                            <span style={{ color: 'var(--points-highlight)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                <HiStar /> {reward.cost}
                                            </span>
                                            <button 
                                                className="btn btn-danger" 
                                                style={{ padding: '0.4rem' }}
                                                onClick={() => handleDeleteReward(reward._id)}
                                                title="Delete Reward"
                                            >
                                                <HiTrash />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManageRewardsModal;

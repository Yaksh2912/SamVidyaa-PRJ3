const Announcement = require('../models/Announcement');
const { publishAnnouncementEvent } = require('./announcementEventService');

const expiryTimers = new Map();

const clearAnnouncementExpiry = (announcementId) => {
    const normalizedId = String(announcementId || '');
    const activeTimer = expiryTimers.get(normalizedId);

    if (activeTimer) {
        clearTimeout(activeTimer);
        expiryTimers.delete(normalizedId);
    }
};

const expireAnnouncement = async (announcementId) => {
    clearAnnouncementExpiry(announcementId);

    try {
        const deletedAnnouncement = await Announcement.findOneAndDelete({
            _id: announcementId,
            expires_at: { $lte: new Date() },
        }).lean();

        if (deletedAnnouncement) {
            publishAnnouncementEvent({
                type: 'expired',
                announcement: deletedAnnouncement,
            });
        }
    } catch (error) {
        console.error('Announcement expiry failed', error);
    }
};

const scheduleAnnouncementExpiry = (announcement) => {
    const announcementId = String(announcement?._id || '');
    const expiresAt = announcement?.expires_at ? new Date(announcement.expires_at) : null;

    clearAnnouncementExpiry(announcementId);

    if (!announcementId || !expiresAt || Number.isNaN(expiresAt.getTime())) {
        return;
    }

    const delay = expiresAt.getTime() - Date.now();

    if (delay <= 0) {
        setTimeout(() => {
            expireAnnouncement(announcementId);
        }, 0);
        return;
    }

    const timer = setTimeout(() => {
        expireAnnouncement(announcementId);
    }, delay);

    expiryTimers.set(announcementId, timer);
};

const scheduleExistingAnnouncementExpiries = async () => {
    try {
        const activeAnnouncements = await Announcement.find({
            expires_at: { $gt: new Date() },
        })
            .select('_id expires_at')
            .lean();

        activeAnnouncements.forEach((announcement) => {
            scheduleAnnouncementExpiry(announcement);
        });
    } catch (error) {
        console.error('Failed to schedule existing announcement expiries', error);
    }
};

module.exports = {
    scheduleAnnouncementExpiry,
    clearAnnouncementExpiry,
    scheduleExistingAnnouncementExpiries,
};

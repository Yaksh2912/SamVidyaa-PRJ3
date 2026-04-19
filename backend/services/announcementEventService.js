const { EventEmitter } = require('events');

const announcementEvents = new EventEmitter();
announcementEvents.setMaxListeners(0);

const publishAnnouncementEvent = (event) => {
    announcementEvents.emit('announcement.changed', {
        ...event,
        occurred_at: new Date().toISOString(),
    });
};

const subscribeAnnouncementEvents = (listener) => {
    announcementEvents.on('announcement.changed', listener);

    return () => {
        announcementEvents.off('announcement.changed', listener);
    };
};

module.exports = {
    publishAnnouncementEvent,
    subscribeAnnouncementEvents,
};

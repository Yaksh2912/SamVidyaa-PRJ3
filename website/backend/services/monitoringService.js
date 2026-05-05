const { EventEmitter } = require('events');

const monitoringEmitter = new EventEmitter();

const emitMonitoringEvent = (type, payload = {}) => {
    const event = {
        type,
        timestamp: new Date().toISOString(),
        ...payload,
    };

    monitoringEmitter.emit('event', event);
    return event;
};

const captureError = (error, payload = {}) => emitMonitoringEvent('error', {
    ...payload,
    error: error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
        }
        : error,
});

const onMonitoringEvent = (handler) => {
    monitoringEmitter.on('event', handler);
    return () => monitoringEmitter.off('event', handler);
};

module.exports = {
    captureError,
    emitMonitoringEvent,
    onMonitoringEvent,
};

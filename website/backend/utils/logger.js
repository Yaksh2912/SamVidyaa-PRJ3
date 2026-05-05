const util = require('util');
const { getRequestContext } = require('./requestContext');

const SERVICE_NAME = 'samvidyaa-backend';
let consoleBridgeInstalled = false;

const serializeError = (error) => {
    if (!(error instanceof Error)) {
        return error;
    }

    return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
    };
};

const mergeMeta = (target, source) => {
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
        return target;
    }

    Object.assign(target, source);
    return target;
};

const normalizeArgs = (args) => {
    const messageParts = [];
    const meta = {};

    for (const arg of args) {
        if (arg instanceof Error) {
            if (!messageParts.length && arg.message) {
                messageParts.push(arg.message);
            }

            if (!meta.error) {
                meta.error = serializeError(arg);
            }
            continue;
        }

        if (typeof arg === 'string') {
            messageParts.push(arg);
            continue;
        }

        if (arg && typeof arg === 'object') {
            mergeMeta(meta, arg);
            continue;
        }

        messageParts.push(util.format('%o', arg));
    }

    return {
        message: messageParts.join(' ').trim() || 'log',
        meta,
    };
};

const writeLog = (level, args) => {
    const { message, meta } = normalizeArgs(args);
    const context = getRequestContext();

    const payload = {
        timestamp: new Date().toISOString(),
        level,
        service: SERVICE_NAME,
        env: process.env.NODE_ENV || 'development',
        message,
        ...meta,
    };

    if (context.requestId && payload.requestId === undefined) {
        payload.requestId = context.requestId;
    }

    const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
    stream.write(`${JSON.stringify(payload)}\n`);
};

const logger = {
    info(...args) {
        writeLog('info', args);
    },
    warn(...args) {
        writeLog('warn', args);
    },
    error(...args) {
        writeLog('error', args);
    },
    debug(...args) {
        writeLog('debug', args);
    },
};

const installConsoleBridge = () => {
    if (consoleBridgeInstalled) {
        return;
    }

    consoleBridgeInstalled = true;

    console.log = (...args) => logger.info(...args);
    console.info = (...args) => logger.info(...args);
    console.warn = (...args) => logger.warn(...args);
    console.error = (...args) => logger.error(...args);
    console.debug = (...args) => logger.debug(...args);
};

module.exports = {
    installConsoleBridge,
    logger,
    serializeError,
};

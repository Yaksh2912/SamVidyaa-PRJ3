const http = require('http');
const { Readable, PassThrough } = require('stream');

function createMockResponse() {
    return {
        statusCode: 200,
        body: undefined,
        headers: {},
        status(code) {
            this.statusCode = code;
            return this;
        },
        setHeader(name, value) {
            this.headers[String(name).toLowerCase()] = value;
            return this;
        },
        getHeader(name) {
            return this.headers[String(name).toLowerCase()];
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };
}

function stubMethod(t, object, methodName, implementation) {
    const original = object[methodName];
    object[methodName] = implementation;
    t.after(() => {
        object[methodName] = original;
    });
}

function createLeanQuery(result) {
    return {
        lean: async () => result,
    };
}

function createSelectLeanQuery(result) {
    return {
        select() {
            return this;
        },
        lean: async () => result,
    };
}

function createPopulateLeanQuery(result) {
    return {
        populate() {
            return this;
        },
        lean: async () => result,
    };
}

function createQueryChain(result, methods = []) {
    const query = {};
    const chainMethods = new Set(['sort', 'select', 'populate', 'limit', 'skip', 'session', ...methods]);

    for (const methodName of chainMethods) {
        query[methodName] = function chainMethod() {
            return this;
        };
    }

    query.lean = async () => result;
    return query;
}

function createAwaitableQuery(result, methods = []) {
    const query = {};
    const chainMethods = new Set(['sort', 'select', 'populate', 'limit', 'skip', 'session', ...methods]);

    for (const methodName of chainMethods) {
        query[methodName] = function chainMethod() {
            return this;
        };
    }

    query.then = function then(resolve, reject) {
        return Promise.resolve(result).then(resolve, reject);
    };

    query.catch = function catchMethod(reject) {
        return Promise.resolve(result).catch(reject);
    };

    query.lean = async () => result;

    return query;
}

async function startTestServer(app) {
    const invokeApp = (pathname, options = {}) => {
        const method = options.method || 'GET';
        const headers = Object.entries(options.headers || {}).reduce((acc, [key, value]) => {
            acc[String(key).toLowerCase()] = String(value);
            return acc;
        }, {});
        let bodyBuffer = options.body ? Buffer.from(options.body) : null;

        if (bodyBuffer && !headers['content-length']) {
            headers['content-length'] = String(bodyBuffer.length);
        }

        const req = new Readable({
            read() {
                if (bodyBuffer) {
                    this.push(bodyBuffer);
                    bodyBuffer = null;
                }
                this.push(null);
            },
        });

        req.url = pathname;
        req.method = method;
        req.headers = headers;
        req.socket = new PassThrough();
        req.socket.remoteAddress = '127.0.0.1';
        req.connection = req.socket;
        req.destroy = req.socket.destroy.bind(req.socket);
        req.httpVersion = '1.1';
        req.httpVersionMajor = 1;
        req.httpVersionMinor = 1;

        const res = new http.ServerResponse(req);
        const socket = new PassThrough();
        const chunks = [];

        socket.on('data', (chunk) => {
            chunks.push(Buffer.from(chunk));
        });

        res.assignSocket(socket);

        return new Promise((resolve, reject) => {
            res.on('finish', () => {
                const rawResponse = Buffer.concat(chunks).toString('utf8');
                const separatorIndex = rawResponse.indexOf('\r\n\r\n');
                const bodyText = separatorIndex >= 0 ? rawResponse.slice(separatorIndex + 4) : '';

                resolve({
                    status: res.statusCode,
                    headers: res.getHeaders(),
                    async text() {
                        return bodyText;
                    },
                    async json() {
                        return bodyText ? JSON.parse(bodyText) : null;
                    },
                });
            });

            res.on('error', reject);
            app.handle(req, res, reject);
        });
    };

    return {
        async request(pathname, options = {}) {
            return invokeApp(pathname, options);
        },
        async close() {
            return undefined;
        },
    };
}

module.exports = {
    createMockResponse,
    stubMethod,
    createLeanQuery,
    createSelectLeanQuery,
    createPopulateLeanQuery,
    createQueryChain,
    createAwaitableQuery,
    startTestServer,
};

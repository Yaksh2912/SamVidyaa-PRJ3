function createMockResponse() {
    return {
        statusCode: 200,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
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

    for (const methodName of methods) {
        query[methodName] = function chainMethod() {
            return this;
        };
    }

    query.lean = async () => result;
    return query;
}

module.exports = {
    createMockResponse,
    stubMethod,
    createLeanQuery,
    createSelectLeanQuery,
    createPopulateLeanQuery,
    createQueryChain,
};

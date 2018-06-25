const { mergeParams } = require('./utils');

class Request {
    constructor(options) {
        this.options = options || {};
    }

    getDeriver() {
        throw new Error('abstrct function!');
    }

    request(params, callback) {
        const constructor = this.constructor;

        params = Object.assign(
            {},
            constructor.defaultOptions,
            this.options.options,
            params,
        );
        params.headers = Object.assign(
            {},
            constructor.defaultHeaders,
            this.options.headers,
            params.headers,
        );

        this.handleParams(params);

        const type = this.getType(
            params.type || this.options.type,
            params.headers['Content-Type'],
        );

        if (type) {
            const contentType = constructor.contentTypes[type];
            params.headers['Content-Type'] = contentType;
            params.type = null;
        }

        const driver = this.getDeriver(params);

        if (!driver) {
            onError('not supported driver', null, null);
            return;
        }

        const serializer = this.getSerializer(type);

        const method = params.method.toUpperCase();

        if (serializer) {
            Object.assign(
                params,
                serializer(
                    params.url,
                    params.method,
                    method === 'GET'
                        ? params.data || params.query
                        : params.data,
                    params,
                ),
            );
        }
        if (method === 'POST' && params.query) {
            Object.assign(
                params,
                this.getSerializer('form')(
                    params.url,
                    'GET',
                    params.query,
                    params,
                ),
            );
            params.query = null;
        }

        params.data = null;

        let request;

        request = driver(params, (err, response, data) => {
            if (!callback) {
                return;
            }
            if (err) {
                callback(err, null, response, request);
                return;
            }

            const responseType = this.getType(
                params.dataType || this.options.dataType,
                this.getResponseContentType(response).split(';')[0],
            );
            const parser = this.getParser(responseType);
            try {
                const body = parser ? parser(response, data, params) : data;
                callback(null, body, response, request);
            } catch (e) {
                callback(e, null, response, request);
            }
        });
    }

    getType(presetType, contentType) {
        const constructor = this.constructor;

        const contentTypes = constructor.contentTypes;
        for (let type in contentTypes) {
            if (
                contentTypes[type] === contentType ||
                contentTypes[type] === presetType ||
                type === presetType
            ) {
                return type;
            }
        }

        return null;
    }

    getSerializer(type) {
        return this.constructor.serializers[type];
    }

    getParser(type) {
        return this.constructor.parsers[type];
    }

    getResponseContentType() {
        throw new Error('abstract function!!');
    }

    handleParams(params) {}
}

Request.contentTypes = {
    form: 'application/x-www-form-urlencoded',
    json: 'application/json',
    text: 'text/plain',
};

Request.defaultOptions = {
    method: 'GET',
};

Request.defaultHeaders = {
    'Content-Type': Request.contentTypes.form,
};

Request.serializers = {};

Request.parsers = {};

Request.mergeParams = mergeParams;

module.exports = Request;

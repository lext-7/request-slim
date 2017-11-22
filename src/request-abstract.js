class Request {
    getDeriver() {
        throw new Error('abstrct function!');
    };

    request(params, callback) {
        const constructor = this.constructor;

        params = Object.assign({}, constructor.defaultOptions, params);
        params.headers = Object.assign({}, constructor.defaultHeaders, params.headers);

        if (params.type) {
            const contentType = constructor.types[params.type];
            params.headers['Content-Type'] = contentType;
            params.type = null;
        }

        const encoding = params.encoding || 'utf8';
        if (params.encoding) {
            params.encoding = null;
        }

        const driver = this.getDeriver(params);

        if (!driver) {
            onError('not supported driver', null, null);
            return;
        }

        const type = this.getType(params.type, params.headers['Content-Type']);

        const serializer = this.getSerializer(type);

        if (serializer) {
            Object.assign(params, serializer(params.url, params.method, params.data, params));
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

            const responseType = this.getType(null, this.getResponseContentType(response).split(';')[0]);
            const parser = this.getParser(responseType);
            const body = parser ? parser(response, data, params) : data;

            callback(null, body, response, request);
        });
    }

    getType(type, contentType) {
        const constructor = this.constructor;
        if (type) {
            return type;
        }

        const contentTypes = constructor.contentTypes;
        for(let type in contentTypes) {
            if (contentTypes[type] === contentType) {
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
}

Request.contentTypes = {
    form: 'application/x-www-form-urlencoded',
    json: 'appliction/json',
    text: 'text/plain',
};

Request.defaultOptions = {
    method: 'GET'
};

Request.defaultHeaders = {
    'Content-Type': Request.contentTypes.text,
};

Request.serializers = {
    json: (url, method, data) => JSON.stringify(data),
};

Request.parsers = {
};

module.exports = Request;

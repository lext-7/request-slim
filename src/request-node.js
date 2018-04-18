const http = require('http');
const https = require('https');
const urlHelper = require('url');
const qs = require('querystring');
const { createTunnel } = require('./node/tunnel');
const { toBase64 } = require('./node/helpers');

const Request = require('./request-abstract');

class NodeRequest extends Request {

    getDeriver({ protocol }) {
        const constructor = this.constructor;
        const driver = constructor.protocolDerivers[protocol.slice(0, -1)];

        return (params, callback) => {
            const req = driver.request(params);
            req.once('response', (res) => {
                const data = [];

                res.on('data', (chunk) => {
                    data.push(chunk);
                });

                res.on('end', () => {
                    const buffer = Buffer.concat(data);
                    callback(null, res, {
                        buffer,
                        encoding: params.encoding,
                    });
                });
            });

            req.on('error', (err) => {
                callback(err);
            });

            if (params.body) {
                req.write(params.body);
            }

            req.end();

            return req;
        };
    }

    request(params) {
        return new Promise((resolve, reject) => {
            super.request(params, (err, body, response, request) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        body,
                        response,
                        request,
                    });
                }
            });
        });
    }

    handleParams(params) {
        let {
            url
        } = params;

        url = urlHelper.parse(url);
        if (/^https?\+unix:/.test(url.protocol) === true) {
            // get the protocol
            url.protocol = `${url.protocol.split('+')[0]}:`;
            // get the socket, path
            const unixParts = url.path.match(/^([^/]+)(.+)$/);
            params.socketPath = unixParts[1].replace(/%2F/g, '/');
            url.pathname = unixParts[2];
        }

        if (params.autoSetHost) {
            params.headers = params.headers || {};
            params.headers.Host = url.host;
        }

        if (params.proxy) {
            let proxy;
            if (typeof params.proxy === 'function') {
                params.proxy = params.proxy(params);
            }
            if (typeof params.proxy === 'string') {
                proxy = urlHelper.parse(params.proxy)
            } else {
                proxy = params.proxy;
            }
            params.proxy = proxy;
            if (params.tunnel === false) {
                url.path = `${url.protocol}//${url.host}${url.path}`
                url.protocol = proxy.protocol;
                url.hostname = proxy.hostname;
                url.host = proxy.host;
                url.port = proxy.port
                if (!params.headers) {
                    params.headers = {};
                }
                if (proxy.auth && !params.headers['proxy-authorization']) {
                    const proxyAuthPieces = proxy.auth.split(':').map(item => qs.unescape(item));
                    const authHeader = 'Basic ' + toBase64(proxyAuthPieces.join(':'));
                }
            }
        }

        params.url = null;
        Object.assign(params, url);

        if (params.proxy && params.tunnel !== false) {
            params.agent = createTunnel(params);
        }
    }

    requestBody(...args) {
        return this.request(...args).then(({ body }) => body);
    }

    getResponseContentType(response) {
        return response.headers['content-type'] || this.constructor.contentTypes.text;
    }
}

NodeRequest.protocolDerivers = {
    http,
    https,
};

NodeRequest.serializers.form = (url, method, data, params) => {
    const queryString = qs.stringify(data);
    if (['GET', 'DELETE'].indexOf(method) !== -1) {
        return {
            path: `${params.path}${params.path.indexOf('?') === -1 ? '?' : ''}${queryString}`,
        };
    }
    return {
        body: queryString,
    };
};

NodeRequest.serializers.json = (url, method, data, params) => {
    if (['GET', 'DELETE'].indexOf(method) !== -1) {
        const queryString = qs.stringify(data);
        return {
            path: `${params.path}${params.path.indexOf('?') === -1 ? '?' : ''}${queryString}`,
        };
    }
    return {
        body: JSON.stringify(data),
    };
};

NodeRequest.parsers.text = (response, { buffer, encoding }) => buffer.toString(encoding);
NodeRequest.parsers.json = (response, { buffer, encoding }) => JSON.parse(buffer.toString(encoding));
NodeRequest.parsers.form = (response, { buffer, encoding }) => querystring.parse(buffer.toString(encoding));

NodeRequest.request = (params) => {
    return new NodeRequest().request(params);
};

module.exports = NodeRequest;

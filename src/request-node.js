const http = require('http');
const https = require('https');
const urlHelper = require('url');
const qs= require('querystring');

const Request = require('./request-abstract');

class NodeRequest extends Request {

    getDeriver({ protocol }) {
        const constructor = this.constructor;
        const driver = constructor.protocalDerivers[protocol.slice(0, -1)];

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
                req.write(writer(params.body));
            }

            req.end();

            return req;
        };
    }

    request(params) {
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

        params.url = null;

        Object.assign(params, url);

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

    getResponseContentType(response) {
        return response.headers['content-type'] || this.constructor.contentTypes.text;
    }
}

NodeRequest.protocalDerivers = {
    http,
    https,
};

NodeRequest.form = (url, method, data, params) => {
    const queryString = qs.stringify(data);
    if (['GET', 'DELETE'].indexOf(method) !== -1) {
        return {
            path: `${params.path.indexOf('?') === -1 ? '?' : ''}${queryString}`,
        };
    }
    return {
        body: queryString,
    };
};

NodeRequest.json = (url, method, data) => {
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

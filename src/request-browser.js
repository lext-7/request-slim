const Request = require('./request-abstract');
const queryString = require('./querystring');

class BrowserRequest extends Request {

    getDeriver() {
        if (window.fetch) {
            return this.getFetchDeriver();
        }
        return this.getXHRDeriver();
    }

    getFetchDeriver() {
        return (params, callbacks) => {
            fetch(encodeURIComponent(params.url), params)
                .then(res => callbacks.success(res, res.text()))
                .catch(err => callbacks.error(err));
        };
    }

    getXHRDeriver() {
        return (params, callbacks) => {
            const xhr = new XMLHttpRequest();
            xhr.open(params.method, encodeURIComponent(params.url), params.async);
            xhr.withCredentials = params.withCredentials;
            Object.keys(params.headers).forEach(key => {
                xhr.setRequestHeader(key, params.headers[key]);
            });

            xhr.onreadystatechange = () => {
                if (xhr.readyState !== xhr.DONE) {
                    return;
                }

                if (xhr.status >= 200 && xhr.status < 300) {
                    callbacks.success(xhr.response, xhr.responseText);
                } else {
                    callbacks.error(xhr.responseText);
                }
            };

            xhr.onerror = (err) => {
                callbacks.error(err);
            };  

            xhr.send(params.body);
        };
    }
}

BrowserRequest.queryString = queryString;

Object.assign(BrowserRequest.defaultOptions, {
    mode: 'cors',
    redirect: 'follow',
    async: true,
    withCredentials: true,
});

BrowserRequest.form = (url, method, data, params) => {
    const queryString = BrowserRequest.queryString.stringify(data);
    if (['GET', 'DELETE'].indexOf(method) !== -1) {
        return {
            path: `${params.path.indexOf('?') === -1 ? '?' : ''}${queryString}`,
        };
    } 
    return {
        body: queryString,
    };
};

BrowserRequest.json = (url, method, data) => {
    return {
        body: JSON.stringify(data),
    };
};

BrowserRequest.serializers.json = (response, text) => JSON.parse(text);
BrowserRequest.serializers.form = (response, text) => BrowserRequest.queryString.parse(buffer.toString(encoding));

module.exports = BrowserRequest;

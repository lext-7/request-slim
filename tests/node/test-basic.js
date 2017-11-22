const test = require('ava');
const { request } = require('../../src/request-node');
const server = require('../server');

const methods = [
    'get', 'post', 'put', 'delete',
];

methods.forEach((method) => {
    test(`basic/${method}`, async (t) => {
        const url = server.getUrl();
        const { response, body } = await request({
            method: method.toUpperCase(),
            url: `${url}basic/${method}`,
        });
        t.is(response.statusCode, 200);
        t.is(body, `${method} response`);
    });
});
